import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  COLUNAS_KANBAN_EXPEDICAO_ATIVO,
  STATUS_EXPEDICAO_ARQUIVO,
} from '../constants/expedicao-kanban.constants';
import { ListarExpedicaoQueryDto } from '../dto/expedicao.dto';
import { StatusExpedicao } from '../enums/status-expedicao.enum';
import { ExpedicaoKanbanResponse } from '../interfaces/expedicao.interface';
import { ExpedicaoKanbanMapper } from '../mappers/expedicao-kanban.mapper';
import { ExpedicaoFinanceiroService } from './expedicao-financeiro.service';

const INCLUDE_EXPEDICAO_KANBAN = {
  ordem_servico: {
    select: {
      id: true,
      numero: true,
      nome_servico: true,
      data_prazo: true,
      orcamento_id: true,
      retrabalho: true,
      cliente: {
        select: {
          nome: true,
          telefone: true,
          whatsapp: true,
          endereco: true,
          numero: true,
          complemento: true,
          bairro: true,
          cidade: true,
          estado: true,
          cep: true,
        },
      },
      orcamento: {
        select: {
          entrega_usar_endereco_cliente: true,
          entrega_logradouro: true,
          entrega_numero: true,
          entrega_complemento: true,
          entrega_bairro: true,
          entrega_cidade: true,
          entrega_estado: true,
          entrega_cep: true,
        },
      },
    },
  },
} satisfies Prisma.ExpedicaoLogisticaInclude;

@Injectable()
export class ExpedicaoKanbanService {
  private readonly logger = new Logger(ExpedicaoKanbanService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeiroService: ExpedicaoFinanceiroService,
  ) {}

  async listarKanbanAtivo(
    lojaId: string,
    filtros?: ListarExpedicaoQueryDto,
  ): Promise<ExpedicaoKanbanResponse> {
    const statusPermitidos = this.resolverStatusKanbanAtivo(filtros);

    const expedicoes = await this.prisma.expedicaoLogistica.findMany({
      where: this.montarWhere(lojaId, statusPermitidos, filtros),
      include: INCLUDE_EXPEDICAO_KANBAN,
      orderBy: [{ atualizado_em: 'desc' }, { criado_em: 'desc' }],
    });

    return this.montarResposta(expedicoes, COLUNAS_KANBAN_EXPEDICAO_ATIVO, lojaId);
  }

  async listarArquivo(
    lojaId: string,
    filtros?: ListarExpedicaoQueryDto,
  ): Promise<ExpedicaoKanbanResponse> {
    const statusPermitidos = filtros?.status
      ? [filtros.status].filter((s) => STATUS_EXPEDICAO_ARQUIVO.includes(s))
      : [...STATUS_EXPEDICAO_ARQUIVO];

    if (statusPermitidos.length === 0) {
      return this.montarResposta([], STATUS_EXPEDICAO_ARQUIVO, lojaId);
    }

    const expedicoes = await this.prisma.expedicaoLogistica.findMany({
      where: this.montarWhere(lojaId, statusPermitidos, filtros),
      include: INCLUDE_EXPEDICAO_KANBAN,
      orderBy: [{ atualizado_em: 'desc' }, { criado_em: 'desc' }],
    });

    return this.montarResposta(expedicoes, STATUS_EXPEDICAO_ARQUIVO, lojaId);
  }

  private resolverStatusKanbanAtivo(
    filtros?: ListarExpedicaoQueryDto,
  ): StatusExpedicao[] {
    if (filtros?.status) {
      return COLUNAS_KANBAN_EXPEDICAO_ATIVO.includes(filtros.status)
        ? [filtros.status]
        : [];
    }

    const status = [...COLUNAS_KANBAN_EXPEDICAO_ATIVO];

    if (filtros?.incluir_arquivados) {
      status.push(StatusExpedicao.ARQUIVADO);
    }

    return status;
  }

  private montarWhere(
    lojaId: string,
    statusPermitidos: StatusExpedicao[],
    filtros?: ListarExpedicaoQueryDto,
  ): Prisma.ExpedicaoLogisticaWhereInput {
    const where: Prisma.ExpedicaoLogisticaWhereInput = {
      loja_id: lojaId,
      status: { in: statusPermitidos },
      ordem_servico: { ativo: true },
    };

    if (filtros?.modalidade) {
      where.modalidade = filtros.modalidade;
    }

    const busca = filtros?.busca?.trim();
    if (busca) {
      where.OR = [
        { codigo_rastreio: { contains: busca } },
        { ordem_servico: { numero: { contains: busca } } },
        { ordem_servico: { nome_servico: { contains: busca } } },
        { ordem_servico: { cliente: { nome: { contains: busca } } } },
      ];
    }

    return where;
  }

  private async montarResposta(
    expedicoes: Prisma.ExpedicaoLogisticaGetPayload<{
      include: typeof INCLUDE_EXPEDICAO_KANBAN;
    }>[],
    ordemColunas: StatusExpedicao[],
    lojaId: string,
  ): Promise<ExpedicaoKanbanResponse> {
    const cards = await Promise.all(
      expedicoes.map(async (expedicao) => {
        const card = ExpedicaoKanbanMapper.mapearParaCard(expedicao);
        const bloqueio = await this.financeiroService.verificarBloqueioEntrega(
          expedicao.os_id,
          lojaId,
        );

        return {
          ...card,
          retrabalho: Boolean(expedicao.ordem_servico.retrabalho),
          bloqueado_financeiro: bloqueio.bloqueado,
          link_financeiro: bloqueio.link_financeiro ?? null,
        };
      }),
    );

    this.logger.log(
      `${cards.length} card(s) de expedição mapeados para kanban`,
    );

    return {
      cards,
      colunas: ExpedicaoKanbanMapper.agruparPorStatus(
        cards,
        ordemColunas as string[],
      ),
      stats: ExpedicaoKanbanMapper.calcularEstatisticas(cards),
    };
  }
}
