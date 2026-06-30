import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../../auth/auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LOG_TIPO_EXPEDICAO_CONCLUSAO_SEM_ASSINATURA,
  LOG_TIPO_EXPEDICAO_OVERRIDE_FINANCEIRO,
} from '../constants/expedicao-log.constants';
import {
  STATUS_EXPEDICAO_IMUTAVEIS,
  STATUS_EXPEDICAO_KANBAN_PATCH,
} from '../constants/expedicao-status.constants';
import {
  ArquivarExpedicaoDto,
  AtualizarExpedicaoDto,
  ConcluirEntregaDto,
} from '../dto/expedicao.dto';
import { StatusExpedicao } from '../enums/status-expedicao.enum';
import {
  AtualizarStatusExpedicaoResult,
  ConcluirEntregaResult,
  ExpedicaoDetalhe,
} from '../interfaces/expedicao.interface';
import { ExpedicaoKanbanMapper } from '../mappers/expedicao-kanban.mapper';
import { ExpedicaoFinanceiroService } from './expedicao-financeiro.service';
import { ExpedicaoNotificacaoService } from './expedicao-notificacao.service';

const INCLUDE_EXPEDICAO_DETALHE = {
  ordem_servico: {
    select: {
      id: true,
      numero: true,
      nome_servico: true,
      status: true,
      data_prazo: true,
      data_entrega_cliente: true,
      orcamento_id: true,
      retrabalho: true,
      cliente: {
        select: {
          id: true,
          nome: true,
          telefone: true,
          whatsapp: true,
          email: true,
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

type ExpedicaoComDetalhe = Prisma.ExpedicaoLogisticaGetPayload<{
  include: typeof INCLUDE_EXPEDICAO_DETALHE;
}>;

@Injectable()
export class ExpedicaoService {
  private readonly logger = new Logger(ExpedicaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeiroService: ExpedicaoFinanceiroService,
    private readonly notificacaoService: ExpedicaoNotificacaoService,
  ) {}

  async obterDetalhe(
    expedicaoId: string,
    lojaId: string,
  ): Promise<ExpedicaoDetalhe> {
    const expedicao = await this.buscarExpedicaoDetalhe(expedicaoId, lojaId);
    return this.montarDetalhe(expedicao);
  }

  async obterDetalhePorOs(
    osId: string,
    lojaId: string,
  ): Promise<ExpedicaoDetalhe> {
    const expedicao = await this.prisma.expedicaoLogistica.findFirst({
      where: {
        os_id: osId,
        loja_id: lojaId,
        status: { not: StatusExpedicao.DEVOLVIDA },
      },
      include: INCLUDE_EXPEDICAO_DETALHE,
      orderBy: { criado_em: 'desc' },
    });

    if (!expedicao) {
      throw new NotFoundException(
        'Expedição ativa não encontrada para esta ordem de serviço',
      );
    }

    return this.montarDetalhe(expedicao);
  }

  async atualizarExpedicao(
    expedicaoId: string,
    lojaId: string,
    dto: AtualizarExpedicaoDto,
  ): Promise<ExpedicaoDetalhe> {
    const expedicao = await this.buscarExpedicaoDetalhe(expedicaoId, lojaId);
    this.assertExpedicaoEditavel(expedicao.status);

    const dadosAtualizacao = this.montarDadosAtualizacao(dto);
    if (Object.keys(dadosAtualizacao).length === 0) {
      return this.montarDetalhe(expedicao);
    }

    const atualizada = await this.prisma.expedicaoLogistica.update({
      where: { id: expedicao.id },
      data: dadosAtualizacao,
      include: INCLUDE_EXPEDICAO_DETALHE,
    });

    this.logger.log(`Expedição ${expedicaoId} atualizada (dados logísticos)`);

    return this.montarDetalhe(atualizada);
  }

  async atualizarStatus(
    expedicaoId: string,
    lojaId: string,
    statusNovo: StatusExpedicao,
  ): Promise<AtualizarStatusExpedicaoResult> {
    if (!STATUS_EXPEDICAO_KANBAN_PATCH.has(statusNovo)) {
      throw new BadRequestException(
        `Status ${statusNovo} não pode ser definido via kanban. Use os endpoints específicos de conclusão, arquivamento ou devolução.`,
      );
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
      const expedicao = await tx.expedicaoLogistica.findFirst({
        where: { id: expedicaoId, loja_id: lojaId },
        select: {
          id: true,
          os_id: true,
          status: true,
          data_expedida: true,
        },
      });

      if (!expedicao) {
        throw new NotFoundException('Expedição não encontrada');
      }

      this.assertExpedicaoEditavel(expedicao.status);

      if (expedicao.status === statusNovo) {
        return {
          expedicao_id: expedicao.id,
          os_id: expedicao.os_id,
          status_anterior: expedicao.status,
          status_novo: statusNovo,
        };
      }

      await this.financeiroService.assertMovimentoKanbanLiberado(
        expedicao.os_id,
        lojaId,
      );

      const dataUpdate: Prisma.ExpedicaoLogisticaUpdateInput = {
        status: statusNovo,
        atualizado_em: new Date(),
      };

      if (
        expedicao.status === StatusExpedicao.AGUARDANDO_SEPARACAO &&
        statusNovo !== StatusExpedicao.AGUARDANDO_SEPARACAO &&
        !expedicao.data_expedida
      ) {
        dataUpdate.data_expedida = new Date();
      }

      await tx.expedicaoLogistica.update({
        where: { id: expedicao.id },
        data: dataUpdate,
      });

      return {
        expedicao_id: expedicao.id,
        os_id: expedicao.os_id,
        status_anterior: expedicao.status,
        status_novo: statusNovo,
      };
    });

    if (resultado.status_anterior !== resultado.status_novo) {
      this.notificacaoService.emitirAtualizada(lojaId, {
        expedicao_id: resultado.expedicao_id,
        os_id: resultado.os_id,
        status_anterior: resultado.status_anterior,
        status_novo: resultado.status_novo,
      });
    }

    return resultado;
  }

  async concluirEntrega(
    expedicaoId: string,
    lojaId: string,
    dto: ConcluirEntregaDto,
    usuario?: AuthenticatedUser,
  ): Promise<ConcluirEntregaResult> {
    const urlAssinatura = dto.url_assinatura?.trim() || null;
    const isAdmin =
      String(usuario?.funcao ?? '').toUpperCase() === 'ADMINISTRADOR';

    if (!urlAssinatura && !isAdmin) {
      throw new BadRequestException(
        'Assinatura é obrigatória para concluir a entrega neste perfil.',
      );
    }

    const expedicaoPre = await this.prisma.expedicaoLogistica.findFirst({
      where: { id: expedicaoId, loja_id: lojaId },
      select: { id: true, os_id: true, status: true },
    });

    if (!expedicaoPre) {
      throw new NotFoundException('Expedição não encontrada');
    }

    this.assertExpedicaoEditavel(expedicaoPre.status);

    await this.validarFinanceiroParaEntrega(
      expedicaoPre.os_id,
      lojaId,
      dto,
      usuario,
    );

    const agora = new Date();
    const statusAnterior = expedicaoPre.status;

    const resultado = await this.prisma.$transaction(async (tx) => {
      const expedicao = await tx.expedicaoLogistica.findFirst({
        where: {
          id: expedicaoId,
          loja_id: lojaId,
          status: {
            notIn: [
              StatusExpedicao.ENTREGUE_FINALIZADO,
              StatusExpedicao.ARQUIVADO,
              StatusExpedicao.DEVOLVIDA,
            ],
          },
        },
        select: { id: true, os_id: true, status: true, data_expedida: true },
      });

      if (!expedicao) {
        const existe = await tx.expedicaoLogistica.findFirst({
          where: { id: expedicaoId, loja_id: lojaId },
          select: { status: true },
        });

        if (!existe) {
          throw new NotFoundException('Expedição não encontrada');
        }

        throw new BadRequestException(
          `Não é possível concluir entrega com status ${existe.status}`,
        );
      }

      await this.validarFinanceiroParaEntrega(
        expedicao.os_id,
        lojaId,
        dto,
        usuario,
      );

      const dataExpedicao: Prisma.ExpedicaoLogisticaUpdateInput = {
        status: StatusExpedicao.ENTREGUE_FINALIZADO,
        recebedor_nome: dto.recebedor_nome,
        recebedor_doc: dto.recebedor_doc?.trim() || null,
        url_assinatura: urlAssinatura,
        data_conclusao: agora,
        atualizado_em: agora,
      };

      if (dto.observacoes?.trim()) {
        dataExpedicao.observacoes = dto.observacoes.trim();
      }

      if (!expedicao.data_expedida) {
        dataExpedicao.data_expedida = agora;
      }

      await tx.expedicaoLogistica.update({
        where: { id: expedicao.id },
        data: dataExpedicao,
      });

      await tx.ordemServico.update({
        where: { id: expedicao.os_id },
        data: { data_entrega_cliente: agora },
      });

      if (!urlAssinatura && usuario?.id) {
        const nomeOperador =
          usuario.nome_completo?.trim() || usuario.email || usuario.id;

        await tx.ordemServicoLog.create({
          data: {
            os_id: expedicao.os_id,
            tipo_acao: LOG_TIPO_EXPEDICAO_CONCLUSAO_SEM_ASSINATURA,
            descricao: `Entrega concluída sem assinatura por ${nomeOperador} (perfil administrador).`,
            usuario_id: usuario.id,
            dados_extras: JSON.stringify({
              expedicao_id: expedicao.id,
              recebedor_nome: dto.recebedor_nome,
              recebedor_doc: dto.recebedor_doc?.trim() || null,
              sem_assinatura: true,
            }),
          },
        });
      }

      if (dto.override_financeiro && usuario?.id) {
        const nomeOperador =
          usuario.nome_completo?.trim() || usuario.email || usuario.id;
        const motivo = dto.motivo_override_financeiro?.trim() ?? '';

        await tx.ordemServicoLog.create({
          data: {
            os_id: expedicao.os_id,
            tipo_acao: LOG_TIPO_EXPEDICAO_OVERRIDE_FINANCEIRO,
            descricao: `Entrega liberada com override financeiro por ${nomeOperador}. Motivo: ${motivo}`,
            usuario_id: usuario.id,
            dados_extras: JSON.stringify({
              expedicao_id: expedicao.id,
              motivo_override_financeiro: motivo,
              recebedor_nome: dto.recebedor_nome,
            }),
          },
        });
      }

      return {
        expedicao_id: expedicao.id,
        os_id: expedicao.os_id,
        status: StatusExpedicao.ENTREGUE_FINALIZADO,
        data_conclusao: agora.toISOString(),
        status_anterior: expedicao.status,
      };
    });

    this.notificacaoService.emitirAtualizada(lojaId, {
      expedicao_id: resultado.expedicao_id,
      os_id: resultado.os_id,
      status_anterior: resultado.status_anterior ?? statusAnterior,
      status_novo: StatusExpedicao.ENTREGUE_FINALIZADO,
    });

    this.logger.log(`Entrega concluída — expedição ${expedicaoId}`);

    return {
      expedicao_id: resultado.expedicao_id,
      os_id: resultado.os_id,
      status: resultado.status,
      data_conclusao: resultado.data_conclusao,
    };
  }

  async arquivar(
    expedicaoId: string,
    lojaId: string,
    dto: ArquivarExpedicaoDto,
  ): Promise<AtualizarStatusExpedicaoResult> {
    const resultado = await this.prisma.$transaction(async (tx) => {
      const expedicao = await tx.expedicaoLogistica.findFirst({
        where: { id: expedicaoId, loja_id: lojaId },
        select: { id: true, os_id: true, status: true },
      });

      if (!expedicao) {
        throw new NotFoundException('Expedição não encontrada');
      }

      if (expedicao.status !== StatusExpedicao.ENTREGUE_FINALIZADO) {
        throw new BadRequestException(
          'Somente expedições entregues podem ser arquivadas',
        );
      }

      const dataUpdate: Prisma.ExpedicaoLogisticaUpdateInput = {
        status: StatusExpedicao.ARQUIVADO,
        atualizado_em: new Date(),
      };

      if (dto.observacoes?.trim()) {
        dataUpdate.observacoes = dto.observacoes.trim();
      }

      await tx.expedicaoLogistica.update({
        where: { id: expedicao.id },
        data: dataUpdate,
      });

      return {
        expedicao_id: expedicao.id,
        os_id: expedicao.os_id,
        status_anterior: expedicao.status,
        status_novo: StatusExpedicao.ARQUIVADO,
      };
    });

    this.notificacaoService.emitirAtualizada(lojaId, resultado);

    return resultado;
  }

  private async buscarExpedicaoDetalhe(
    expedicaoId: string,
    lojaId: string,
  ): Promise<ExpedicaoComDetalhe> {
    const expedicao = await this.prisma.expedicaoLogistica.findFirst({
      where: { id: expedicaoId, loja_id: lojaId },
      include: INCLUDE_EXPEDICAO_DETALHE,
    });

    if (!expedicao) {
      throw new NotFoundException('Expedição não encontrada');
    }

    return expedicao;
  }

  private async montarDetalhe(
    expedicao: ExpedicaoComDetalhe,
  ): Promise<ExpedicaoDetalhe> {
    const os = expedicao.ordem_servico;
    const cliente = os.cliente;
    const card = ExpedicaoKanbanMapper.mapearParaCard(expedicao);

    const bloqueio_financeiro =
      await this.financeiroService.verificarBloqueioEntrega(
        os.id,
        expedicao.loja_id,
      );

    return {
      id: expedicao.id,
      os_id: expedicao.os_id,
      status: expedicao.status,
      modalidade: expedicao.modalidade,
      codigo_rastreio: expedicao.codigo_rastreio,
      data_expedida: expedicao.data_expedida
        ? expedicao.data_expedida.toISOString()
        : null,
      data_conclusao: expedicao.data_conclusao
        ? expedicao.data_conclusao.toISOString()
        : null,
      recebedor_nome: expedicao.recebedor_nome,
      recebedor_doc: expedicao.recebedor_doc,
      url_assinatura: expedicao.url_assinatura,
      observacoes: expedicao.observacoes,
      criado_em: expedicao.criado_em.toISOString(),
      atualizado_em: expedicao.atualizado_em.toISOString(),
      ordem_servico: {
        id: os.id,
        numero: os.numero,
        nome_servico: os.nome_servico,
        status: os.status,
        data_prazo: os.data_prazo ? os.data_prazo.toISOString() : null,
        data_entrega_cliente: os.data_entrega_cliente
          ? os.data_entrega_cliente.toISOString()
          : null,
        orcamento_id: os.orcamento_id,
        retrabalho: os.retrabalho,
        endereco_entrega: card.endereco_entrega,
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          telefone: cliente.telefone,
          whatsapp: cliente.whatsapp,
          email: cliente.email,
        },
      },
      bloqueio_financeiro,
    };
  }

  private async validarFinanceiroParaEntrega(
    osId: string,
    lojaId: string,
    dto: ConcluirEntregaDto,
    usuario?: AuthenticatedUser,
  ): Promise<void> {
    if (dto.override_financeiro) {
      const isAdmin =
        String(usuario?.funcao ?? '').toUpperCase() === 'ADMINISTRADOR';
      if (!isAdmin) {
        throw new ForbiddenException(
          'Apenas administradores podem liberar entrega com override financeiro.',
        );
      }

      const motivo = dto.motivo_override_financeiro?.trim() ?? '';
      if (motivo.length < 10) {
        throw new BadRequestException(
          'Informe o motivo do override financeiro (mínimo 10 caracteres).',
        );
      }

      return;
    }

    await this.financeiroService.assertEntregaLiberada(osId, lojaId);
  }

  private assertExpedicaoEditavel(status: string): void {
    if (STATUS_EXPEDICAO_IMUTAVEIS.has(status)) {
      throw new BadRequestException(
        `Expedição com status ${status} não pode ser alterada`,
      );
    }
  }

  private montarDadosAtualizacao(
    dto: AtualizarExpedicaoDto,
  ): Prisma.ExpedicaoLogisticaUpdateInput {
    const data: Prisma.ExpedicaoLogisticaUpdateInput = {};

    if (dto.modalidade !== undefined) {
      data.modalidade = dto.modalidade;
    }

    if (dto.codigo_rastreio !== undefined) {
      const codigo = dto.codigo_rastreio.trim();
      if (codigo) {
        data.codigo_rastreio = codigo;
      }
    }

    if (dto.observacoes !== undefined) {
      const observacoes = dto.observacoes.trim();
      if (observacoes) {
        data.observacoes = observacoes;
      }
    }

    if (Object.keys(data).length > 0) {
      data.atualizado_em = new Date();
    }

    return data;
  }
}
