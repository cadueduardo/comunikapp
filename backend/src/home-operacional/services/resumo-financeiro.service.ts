import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { HomeCacheService } from './home-cache.service';
import { CobrancaStatus } from '../../financeiro/enums/cobranca-status.enum';
import { ResumoFinanceiroResponse } from '../interfaces/resumo-financeiro.interface';

/**
 * Calcula o "Resumo Financeiro Simples" da Home operacional (Bloco 4, Fase 6.C).
 *
 * Estrategia:
 * - Agregacoes feitas no banco com `SUM`/`COUNT`/`WHERE` (sem trazer
 *   colecoes para memoria, conforme regra de performance da Fase 4).
 * - Cache curto (60s) reutilizando o `HomeCacheService`, invalidado por
 *   `OrcamentosV2Service` quando aprova um orcamento e por
 *   `CobrancasService` (futuro hook) quando recebe pagamentos.
 * - Valores nulos sinalizam "sem dado": o front esconde o indicador
 *   correspondente, em vez de exibir R$ 0,00 (decisao do produto).
 */
@Injectable()
export class ResumoFinanceiroService {
  private readonly logger = new Logger(ResumoFinanceiroService.name);
  private readonly CACHE_KEY = 'resumo-financeiro';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: HomeCacheService,
  ) {}

  async obterResumo(
    lojaId: string,
    forcar = false,
  ): Promise<ResumoFinanceiroResponse> {
    const chaveCache = `${lojaId}:${this.CACHE_KEY}`;
    if (!forcar) {
      const cached = this.cache.obter<ResumoFinanceiroResponse>(chaveCache);
      if (cached) {
        return {
          ...cached,
          meta: { ...cached.meta, cached: true },
        };
      }
    }

    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioProxMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);

    // Executa todas as agregacoes em paralelo para reduzir latencia.
    const [
      totalOrcadoMes,
      totalAprovadoMes,
      valorEmProducao,
      valorProntoReceber,
      valorRecebidoMes,
      cobrancasVencidas,
    ] = await Promise.all([
      this.somaOrcamentosCriadosNoMes(lojaId, inicioMes, inicioProxMes),
      this.somaOrcamentosAprovadosNoMes(lojaId, inicioMes, inicioProxMes),
      this.somaCobrancasComOSEmProducao(lojaId),
      this.somaSaldoComOSFinalizadaNaoLiquidada(lojaId),
      this.somaRecebimentosDoMes(lojaId, inicioMes, inicioProxMes),
      this.contarECalcularVencidas(lojaId),
    ]);

    const response: ResumoFinanceiroResponse = {
      data: {
        loja_id: lojaId,
        periodo: `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`,
        total_orcado_mes: totalOrcadoMes,
        total_aprovado_mes: totalAprovadoMes,
        valor_em_producao: valorEmProducao,
        valor_pronto_a_receber: valorProntoReceber,
        valor_recebido_mes: valorRecebidoMes,
        cobrancas_vencidas: cobrancasVencidas.quantidade,
        valor_vencido: cobrancasVencidas.valor,
      },
      meta: {
        calculado_em: new Date().toISOString(),
        cached: false,
      },
    };

    this.cache.gravar(chaveCache, response);
    return response;
  }

  // --------------------------------------------------------------------------
  // QUERIES INDIVIDUAIS
  // --------------------------------------------------------------------------

  private async somaOrcamentosCriadosNoMes(
    lojaId: string,
    inicio: Date,
    fim: Date,
  ): Promise<number | null> {
    const result = await this.prisma.orcamento.aggregate({
      where: {
        loja_id: lojaId,
        ativo: true,
        criado_em: { gte: inicio, lt: fim },
      },
      _sum: { preco_final: true },
    });
    return this.toNumber(result._sum.preco_final);
  }

  private async somaOrcamentosAprovadosNoMes(
    lojaId: string,
    inicio: Date,
    fim: Date,
  ): Promise<number | null> {
    const result = await this.prisma.orcamento.aggregate({
      where: {
        loja_id: lojaId,
        ativo: true,
        status: { in: ['aprovado', 'em_execucao', 'concluido'] },
        data_aprovacao: { gte: inicio, lt: fim },
      },
      _sum: { preco_final: true },
    });
    return this.toNumber(result._sum.preco_final);
  }

  private async somaCobrancasComOSEmProducao(lojaId: string): Promise<number | null> {
    // Cobrancas cujo orcamento tem OS em PRODUCAO ou ACABAMENTO.
    // Como nao temos relacao direta entre cobranca e OS, vamos via orcamento.
    const cobrancas = await this.prisma.cobranca.findMany({
      where: {
        loja_id: lojaId,
        status: {
          in: [
            CobrancaStatus.PREVISTA,
            CobrancaStatus.PARCIAL_PAGO,
            CobrancaStatus.VENCIDO,
          ],
        },
        orcamento: {
          ordens_servico: {
            some: {
              status: { in: ['PRODUCAO', 'ACABAMENTO', 'PAUSADA'] },
            },
          },
        },
      },
      select: { valor_saldo: true },
    });
    if (cobrancas.length === 0) return null;
    return cobrancas.reduce((acc, c) => acc + Number(c.valor_saldo), 0);
  }

  private async somaSaldoComOSFinalizadaNaoLiquidada(
    lojaId: string,
  ): Promise<number | null> {
    const cobrancas = await this.prisma.cobranca.findMany({
      where: {
        loja_id: lojaId,
        status: {
          in: [
            CobrancaStatus.PREVISTA,
            CobrancaStatus.PARCIAL_PAGO,
            CobrancaStatus.VENCIDO,
          ],
        },
        orcamento: {
          ordens_servico: {
            some: {
              status: 'FINALIZADA',
            },
          },
        },
      },
      select: { valor_saldo: true },
    });
    if (cobrancas.length === 0) return null;
    return cobrancas.reduce((acc, c) => acc + Number(c.valor_saldo), 0);
  }

  private async somaRecebimentosDoMes(
    lojaId: string,
    inicio: Date,
    fim: Date,
  ): Promise<number | null> {
    const result = await this.prisma.cobrancaRecebimento.aggregate({
      where: {
        cobranca: { loja_id: lojaId },
        data_recebimento: { gte: inicio, lt: fim },
      },
      _sum: { valor: true },
    });
    return this.toNumber(result._sum.valor);
  }

  private async contarECalcularVencidas(
    lojaId: string,
  ): Promise<{ quantidade: number; valor: number }> {
    const result = await this.prisma.cobranca.aggregate({
      where: {
        loja_id: lojaId,
        status: CobrancaStatus.VENCIDO,
      },
      _count: { _all: true },
      _sum: { valor_saldo: true },
    });
    return {
      quantidade: result._count._all,
      valor: this.toNumber(result._sum.valor_saldo) ?? 0,
    };
  }

  private toNumber(valor: Prisma.Decimal | null | undefined): number | null {
    if (valor == null) return null;
    const n = Number(valor);
    if (!Number.isFinite(n)) return null;
    if (n === 0) return null; // "Sem dado" - front esconde o indicador.
    return Math.round(n * 100) / 100;
  }
}
