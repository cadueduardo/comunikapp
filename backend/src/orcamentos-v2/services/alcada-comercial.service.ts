import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from '../../vendas/permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';
import { TransicaoComercialService } from './transicao-comercial.service';
import { OrcamentoStatusComercial } from '../domain/status-comercial';
import { EVENTOS_COMERCIAIS } from '../domain/eventos-comerciais';

export interface ResultadoAvaliacaoAlcada {
  requerAlcada: boolean;
  promovidoParaAlcada: boolean;
  descontoPercentual: number;
  limitePermitido: number;
}

export interface SolicitacaoAlcadaItem {
  id: string;
  numero: string;
  nome_servico: string;
  cliente_nome: string;
  preco_base: number;
  preco_final: number;
  desconto_percentual: number;
  criado_em: Date;
  status_comercial: string;
}

/**
 * Serviço de Governança de Alçadas Comerciais (Fase 7 / DV-04 / DV-05).
 *
 * Desambiguado do serviço operacional de alçada de OS (`alcadas-orcamento.service.ts`).
 * Trata exclusivamente de desconto máximo, margem e autoridade comercial.
 */
@Injectable()
export class AlcadaComercialService {
  private readonly logger = new Logger(AlcadaComercialService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vendasPermissions: VendasPermissionsService,
    private readonly transicaoComercialService: TransicaoComercialService,
  ) {}

  /**
   * Avalia a proposta e, se o desconto exceder o limite permitido do perfil,
   * promove o status comercial de `rascunho` para `aguardando_alcada`.
   */
  async validarEDefinirAlcada(
    orcamentoId: string,
    usuarioId: string,
    lojaId: string,
    limitePercentualLoja: number = 10,
  ): Promise<ResultadoAvaliacaoAlcada> {
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId, ativo: true },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado ou inativo.');
    }

    const precoBase = Number((orcamento as any).preco_base ?? (orcamento as any).valor_total ?? orcamento.preco_final);
    const precoFinal = Number(orcamento.preco_final);

    let descontoPercentual = 0;
    if (precoBase > 0 && precoFinal < precoBase) {
      descontoPercentual = ((precoBase - precoFinal) / precoBase) * 100;
    }

    const podeAprovarDireto = await this.vendasPermissions.pode(
      usuarioId,
      lojaId,
      VENDAS_PERMISSOES.ALCADA_APROVAR,
    );

    const excedeLimite = descontoPercentual > limitePercentualLoja;

    if (excedeLimite && !podeAprovarDireto) {
      this.logger.warn(
        `Desconto de ${descontoPercentual.toFixed(1)}% no orçamento ${orcamentoId} excede alçada (${limitePercentualLoja}%).`
      );

      let promovidoParaAlcada = false;
      const statusAtual = (orcamento.status_comercial ?? orcamento.status ?? '').toLowerCase();

      if (
        statusAtual === OrcamentoStatusComercial.RASCUNHO ||
        statusAtual === 'rascunho'
      ) {
        await this.transicaoComercialService.executar({
          orcamentoId,
          lojaId,
          origemStatus: OrcamentoStatusComercial.RASCUNHO,
          destinoStatus: OrcamentoStatusComercial.AGUARDANDO_ALCADA,
          origemAcao: 'INTERNO',
          autor: usuarioId,
          tipoAuditoria: 'solicitacao_alcada_comercial',
          descricao: `Desconto de ${descontoPercentual.toFixed(1)}% excede o limite da alçada (${limitePercentualLoja}%). Aguardando aprovação do gestor.`,
          evento: EVENTOS_COMERCIAIS.ALCADA_SOLICITADA,
        });

        promovidoParaAlcada = true;
      }

      return {
        requerAlcada: true,
        promovidoParaAlcada,
        descontoPercentual,
        limitePermitido: limitePercentualLoja,
      };
    }

    return {
      requerAlcada: false,
      promovidoParaAlcada: false,
      descontoPercentual,
      limitePermitido: limitePercentualLoja,
    };
  }

  /**
   * Lista as solicitações de alçada comercial pendentes na loja.
   */
  async listarSolicitacoesAlcada(
    lojaId: string,
    usuarioId: string,
  ): Promise<SolicitacaoAlcadaItem[]> {
    await this.vendasPermissions.assertPode(
      usuarioId,
      lojaId,
      VENDAS_PERMISSOES.ALCADA_APROVAR,
    );

    const orcamentos = await this.prisma.orcamento.findMany({
      where: {
        loja_id: lojaId,
        ativo: true,
        OR: [
          { status_comercial: OrcamentoStatusComercial.AGUARDANDO_ALCADA },
          { status: 'aguardando_alcada' },
        ],
      },
      include: {
        cliente: { select: { nome: true } },
      },
      orderBy: { atualizado_em: 'desc' },
    });

    return orcamentos.map((o) => {
      const precoBase = Number((o as any).preco_base ?? (o as any).valor_total ?? o.preco_final);
      const precoFinal = Number(o.preco_final);
      const descontoPercentual = precoBase > 0 && precoFinal < precoBase
        ? ((precoBase - precoFinal) / precoBase) * 100
        : 0;

      return {
        id: o.id,
        numero: o.numero,
        nome_servico: o.nome_servico,
        cliente_nome: o.cliente?.nome ?? 'Cliente não informado',
        preco_base: precoBase,
        preco_final: precoFinal,
        desconto_percentual: Number(descontoPercentual.toFixed(2)),
        criado_em: o.criado_em,
        status_comercial: o.status_comercial ?? OrcamentoStatusComercial.AGUARDANDO_ALCADA,
      };
    });
  }

  /**
   * Processa a decisão do gestor sobre uma alçada comercial pendente.
   */
  async decidirAlcada(
    orcamentoId: string,
    usuarioId: string,
    lojaId: string,
    aprovar: boolean,
    justificativa: string,
  ): Promise<void> {
    if (!justificativa || justificativa.trim().length < 3) {
      throw new BadRequestException('Justificativa é obrigatória para decisão de alçada comercial.');
    }

    await this.vendasPermissions.assertPode(
      usuarioId,
      lojaId,
      VENDAS_PERMISSOES.ALCADA_APROVAR,
    );

    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId, ativo: true },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado.');
    }

    const statusAtual = (orcamento.status_comercial ?? orcamento.status ?? '').toLowerCase();
    if (
      statusAtual !== OrcamentoStatusComercial.AGUARDANDO_ALCADA &&
      statusAtual !== 'aguardando_alcada'
    ) {
      throw new BadRequestException(
        `Orçamento não está no status aguardando_alcada (status atual: ${statusAtual}).`
      );
    }

    if (aprovar) {
      await this.transicaoComercialService.executar({
        orcamentoId,
        lojaId,
        origemStatus: OrcamentoStatusComercial.AGUARDANDO_ALCADA,
        destinoStatus: OrcamentoStatusComercial.ENVIADA,
        origemAcao: 'INTERNO',
        autor: usuarioId,
        tipoAuditoria: 'aprovacao_alcada_comercial',
        descricao: `Alçada comercial APROVADA pelo gestor. Justificativa: ${justificativa.slice(0, 250)}`,
        evento: EVENTOS_COMERCIAIS.ALCADA_DECIDIDA,
      });

      this.logger.log(`Alçada comercial APROVADA no orçamento ${orcamentoId} pelo usuário ${usuarioId}`);
    } else {
      await this.transicaoComercialService.executar({
        orcamentoId,
        lojaId,
        origemStatus: OrcamentoStatusComercial.AGUARDANDO_ALCADA,
        destinoStatus: OrcamentoStatusComercial.PERDIDA,
        origemAcao: 'INTERNO',
        autor: usuarioId,
        motivoPerda: justificativa,
        tipoAuditoria: 'rejeicao_alcada_comercial',
        descricao: `Alçada comercial REJEITADA pelo gestor. Justificativa: ${justificativa.slice(0, 250)}`,
        evento: EVENTOS_COMERCIAIS.ALCADA_DECIDIDA,
      });

      this.logger.log(`Alçada comercial REJEITADA no orçamento ${orcamentoId} pelo usuário ${usuarioId}`);
    }
  }
  }
}
