import { Injectable, Logger } from '@nestjs/common';
import {
  ParcelaStatus,
  ParcelaTipo,
} from '../../financeiro/enums/cobranca-status.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { HomeCacheService } from '../../home-operacional/services/home-cache.service';
import {
  StatusLiberacaoPcp,
  StatusLiberacaoPcpValor,
} from '../constants/pcp-liberacao.constants';
import { ConfiguracaoInstalacaoService } from './configuracao-instalacao.service';

/** Log de auditoria / badge: OS liberada do financeiro para aprovação técnica. */
export const TIPO_LOG_LIBERACAO_FINANCEIRA = 'LIBERACAO_FINANCEIRA';

export interface ResultadoDesbloqueioSinal {
  itens_desbloqueados: number;
  os_promovidas: number;
  orcamento_id: string | null;
}

/**
 * Trava/destrava itens do PCP conforme compensação do sinal (50%)
 * e promove OS retidas no financeiro quando a entrada é liquidada.
 *
 * A promoção da OS NÃO depende de itens bloqueados no PCP: são checkpoints
 * independentes (financeiro → técnica → só então PCP).
 */
@Injectable()
export class PcpBloqueioSinalService {
  private readonly logger = new Logger(PcpBloqueioSinalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configuracaoInstalacaoService: ConfiguracaoInstalacaoService,
    private readonly homeCacheService: HomeCacheService,
  ) {}

  async resolverStatusInicialItem(
    lojaId: string,
    orcamentoId?: string | null,
  ): Promise<StatusLiberacaoPcpValor> {
    const exigir =
      await this.configuracaoInstalacaoService.deveExigirSinalProducao(lojaId);

    if (!exigir) {
      return StatusLiberacaoPcp.PENDENTE;
    }

    if (orcamentoId && (await this.entradaJaLiquidada(lojaId, orcamentoId))) {
      return StatusLiberacaoPcp.PENDENTE;
    }

    return StatusLiberacaoPcp.BLOQUEADO_AGUARDANDO_SINAL;
  }

  async entradaJaLiquidada(
    lojaId: string,
    orcamentoId: string,
  ): Promise<boolean> {
    const cobranca = await this.prisma.cobranca.findFirst({
      where: { loja_id: lojaId, orcamento_id: orcamentoId },
      include: {
        parcelas: {
          where: { tipo: ParcelaTipo.ENTRADA },
          take: 1,
        },
      },
    });

    if (!cobranca?.parcelas.length) {
      return false;
    }

    return cobranca.parcelas[0].status === ParcelaStatus.LIQUIDADO;
  }

  /**
   * Hook financeiro: parcela ENTRADA liquidada.
   * 1) Promove OS retidas no financeiro → aprovação técnica (sempre).
   * 2) Desbloqueia itens PCP aguardando sinal (se houver).
   */
  async processarEntradaLiquidadaCobranca(
    lojaId: string,
    cobrancaId: string,
  ): Promise<ResultadoDesbloqueioSinal> {
    const cobranca = await this.prisma.cobranca.findFirst({
      where: { id: cobrancaId, loja_id: lojaId },
      select: { orcamento_id: true },
    });

    if (!cobranca?.orcamento_id) {
      return { itens_desbloqueados: 0, os_promovidas: 0, orcamento_id: null };
    }

    const osPromovidas = await this.promoverOsAguardandoFinanceiroPorOrcamento(
      lojaId,
      cobranca.orcamento_id,
    );

    const itensDesbloqueados = await this.desbloquearItensPorOrcamento(
      lojaId,
      cobranca.orcamento_id,
    );

    return {
      itens_desbloqueados: itensDesbloqueados,
      os_promovidas: osPromovidas,
      orcamento_id: cobranca.orcamento_id,
    };
  }

  /**
   * Promove OS em AGUARDANDO_APROVACAO_FINANCEIRA para AGUARDANDO_APROVACAO_TECNICA.
   * Independente de itens PCP / exigir_sinal_producao.
   */
  async promoverOsAguardandoFinanceiroPorOrcamento(
    lojaId: string,
    orcamentoId: string,
  ): Promise<number> {
    const ordens = await this.prisma.ordemServico.findMany({
      where: {
        loja_id: lojaId,
        orcamento_id: orcamentoId,
        ativo: true,
        status: 'AGUARDANDO_APROVACAO_FINANCEIRA',
      },
      select: { id: true },
    });

    if (ordens.length === 0) {
      return 0;
    }

    for (const os of ordens) {
      await this.promoverOsParaAprovacaoTecnica(
        os.id,
        'Entrada (sinal) liquidada no financeiro — OS liberada para aprovação técnica.',
      );
    }

    this.homeCacheService.invalidarPorPrefixo(`${lojaId}:`);
    this.logger.log(
      `${ordens.length} OS promovida(s) para aprovação técnica após liquidação da entrada — orçamento ${orcamentoId}`,
    );

    return ordens.length;
  }

  /**
   * Promoção pontual (liberação manual pelo financeiro).
   * Passe `lojaIdParaCache` para invalidar badges do menu após a promoção.
   */
  async promoverOsParaAprovacaoTecnica(
    osId: string,
    descricao: string,
    usuarioId?: string | null,
    lojaIdParaCache?: string | null,
  ): Promise<void> {
    await this.prisma.ordemServico.update({
      where: { id: osId },
      data: {
        status: 'AGUARDANDO_APROVACAO_TECNICA',
        atualizado_em: new Date(),
      },
    });

    await this.prisma.ordemServicoLog.create({
      data: {
        os_id: osId,
        tipo_acao: TIPO_LOG_LIBERACAO_FINANCEIRA,
        descricao,
        usuario_id: usuarioId ?? null,
      },
    });

    if (lojaIdParaCache) {
      this.homeCacheService.invalidarPorPrefixo(`${lojaIdParaCache}:`);
    }
  }

  /**
   * Desbloqueia itens com BLOQUEADO_AGUARDANDO_SINAL → PENDENTE.
   * Não altera o status operacional da OS.
   */
  async desbloquearItensPorOrcamento(
    lojaId: string,
    orcamentoId: string,
  ): Promise<number> {
    const resultado = await this.prisma.itemOS.updateMany({
      where: {
        status_liberacao_pcp: StatusLiberacaoPcp.BLOQUEADO_AGUARDANDO_SINAL,
        os: {
          loja_id: lojaId,
          orcamento_id: orcamentoId,
        },
      },
      data: {
        status_liberacao_pcp: StatusLiberacaoPcp.PENDENTE,
      },
    });

    if (resultado.count > 0) {
      this.logger.log(
        `${resultado.count} item(ns) desbloqueado(s) para produção após liquidação do sinal — orçamento ${orcamentoId}`,
      );

      const ordens = await this.prisma.ordemServico.findMany({
        where: { loja_id: lojaId, orcamento_id: orcamentoId, ativo: true },
        select: { id: true },
      });

      for (const os of ordens) {
        await this.prisma.ordemServicoLog.create({
          data: {
            os_id: os.id,
            tipo_acao: 'PCP_DESBLOQUEIO_SINAL',
            descricao:
              'Itens liberados para planejamento de produção após compensação do sinal (50%).',
            usuario_id: null,
          },
        });
      }
    }

    return resultado.count;
  }
}
