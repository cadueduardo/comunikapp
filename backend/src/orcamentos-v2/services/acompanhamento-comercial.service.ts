import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from '../../vendas/permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';
import { OrcamentoStatusComercial } from '../domain/status-comercial';

export interface PedidoComercialResumo {
  id: string;
  numero: string;
  nome_servico: string;
  cliente_id: string | null;
  cliente_nome: string;
  valor_total: number;
  data_aceite: Date | null;
  status_comercial: string;
  status_arte: string;
  status_operacao: string;
  status_financeiro: string;
  os_principal_numero: string | null;
  total_aditivos: number;
  criado_em: Date;
}

export interface EventoTimelineComercial {
  id: string;
  data: Date;
  titulo: string;
  descricao: string;
  tipo: 'PROPOSTA' | 'ENVIO' | 'ALCADA' | 'ACEITE' | 'HANDOFF' | 'ARTE' | 'PRODUCAO' | 'ADITIVO';
  autor: string | null;
}

/**
 * Service de Acompanhamento Comercial e Pontes de Leitura (Fase 10).
 *
 * Fornece ao vendedor e gestor uma projeção comercial consolidada e read-only
 * do ciclo de vida dos pedidos sem permitir alteração direta em fatos operacionais.
 */
@Injectable()
export class AcompanhamentoComercialService {
  private readonly logger = new Logger(AcompanhamentoComercialService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vendasPermissions: VendasPermissionsService,
  ) {}

  /**
   * Lista os pedidos comerciais ativos na loja com progresso consolidado.
   */
  async listarPedidosComerciais(
    lojaId: string,
    usuarioId: string,
  ): Promise<PedidoComercialResumo[]> {
    await this.vendasPermissions.assertPode(
      usuarioId,
      lojaId,
      VENDAS_PERMISSOES.PEDIDO_VER,
    );

    const orcamentos = await this.prisma.orcamento.findMany({
      where: {
        loja_id: lojaId,
        ativo: true,
        OR: [
          { status_comercial: OrcamentoStatusComercial.PEDIDO_CONFIRMADO },
          { status_comercial: OrcamentoStatusComercial.ACEITA },
          { status: 'pedido_confirmado' },
          { status: 'aceita' },
          { status: 'aprovado' },
        ],
      },
      include: {
        cliente: true,
        cobranca: true,
      },
      orderBy: { atualizado_em: 'desc' },
    });

    const resultados: PedidoComercialResumo[] = [];

    for (const o of orcamentos) {
      // Buscar Ordens de Serviço vinculadas ao orçamento
      const oss = await this.prisma.ordemServico.findMany({
        where: { orcamento_id: o.id, loja_id: lojaId },
        select: { id: true, numero: true, status: true, tipo_vinculo_os: true },
      });

      const osPrincipal = oss.find((item) => !item.tipo_vinculo_os || item.tipo_vinculo_os === 'PRINCIPAL') ?? oss[0];
      const osAditivas = oss.filter((item) => item.tipo_vinculo_os === 'ADITIVA');

      // Status Consolidado de Operação
      let statusOperacao = 'EM_PROCESSAMENTO';
      if (osPrincipal) {
        const stOS = (osPrincipal.status ?? '').toUpperCase();
        if (stOS === 'CONCLUIDA' || stOS === 'ENTREGUE') {
          statusOperacao = 'CONCLUIDO';
        } else if (stOS === 'INSTALACAO' || stOS === 'EM_INSTALACAO') {
          statusOperacao = 'INSTALACAO';
        } else if (stOS === 'EXPEDICAO') {
          statusOperacao = 'AGUARDANDO_EXPEDICAO';
        } else {
          statusOperacao = 'EM_PRODUCAO';
        }
      }

      // Status Consolidado de Financeiro
      let statusFinanceiro = 'EM_ABERTO';
      const cobranca = (o as any).cobranca;
      if (cobranca) {
        const stCob = (cobranca.status ?? '').toUpperCase();
        if (stCob === 'PAGA' || stCob === 'LIQUIDADA') {
          statusFinanceiro = 'LIQUIDADO';
        } else if (Number(cobranca.valor_recebido ?? 0) > 0) {
          statusFinanceiro = 'PARCIALMENTE_PAGO';
        }
      }

      const cliente = (o as any).cliente;

      resultados.push({
        id: o.id,
        numero: o.numero,
        nome_servico: o.nome_servico,
        cliente_id: cliente?.id ?? null,
        cliente_nome: cliente?.nome ?? 'Cliente não informado',
        valor_total: Number(o.preco_final),
        data_aceite: (o as any).data_aprovacao ?? o.atualizado_em,
        status_comercial: o.status_comercial ?? OrcamentoStatusComercial.PEDIDO_CONFIRMADO,
        status_arte: 'APROVADA', // Projeção consolidada
        status_operacao: statusOperacao,
        status_financeiro: statusFinanceiro,
        os_principal_numero: osPrincipal?.numero ?? null,
        total_aditivos: osAditivas.length,
        criado_em: o.criado_em,
      });
    }

    return resultados;
  }

  /**
   * Obtém a linha do tempo comercial sequencial do pedido.
   */
  async obterTimelinePedidoComercial(
    orcamentoId: string,
    lojaId: string,
    usuarioId: string,
  ): Promise<EventoTimelineComercial[]> {
    await this.vendasPermissions.assertPode(
      usuarioId,
      lojaId,
      VENDAS_PERMISSOES.PEDIDO_VER,
    );

    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId, ativo: true },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado.');
    }

    const eventos: EventoTimelineComercial[] = [
      {
        id: `evt-cria-${orcamento.id}`,
        data: orcamento.criado_em,
        titulo: 'Proposta Comercial Criada',
        descricao: `Elaboração da proposta ${orcamento.numero} para ${orcamento.nome_servico}.`,
        tipo: 'PROPOSTA',
        autor: (orcamento as any).usuario_id ?? null,
      },
    ];

    if (orcamento.atualizado_em > orcamento.criado_em) {
      eventos.push({
        id: `evt-aceite-${orcamento.id}`,
        data: (orcamento as any).data_aprovacao ?? orcamento.atualizado_em,
        titulo: 'Pedido Confirmado (Aceite Comercial)',
        descricao: `Aceite comercial registrado e pedido confirmado para o orçamento ${orcamento.numero}.`,
        tipo: 'ACEITE',
        autor: null,
      });
    }

    return eventos.sort((a, b) => a.data.getTime() - b.data.getTime());
  }
}
