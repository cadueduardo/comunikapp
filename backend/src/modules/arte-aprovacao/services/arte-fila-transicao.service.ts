import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StatusArte } from '../constants/arte.enums';
import { ARTE_MSG } from '../constants/arte-mensagens';
import {
  STATUS_PERMITIDOS_ASSUMIR,
  transicaoStatusArtePermitida,
} from '../constants/arte-transicoes';
import { AtualizarStatusArteDto } from '../dto/atualizar-status-arte.dto';
import { ArteWebSocketGateway } from '../gateways/arte-websocket.gateway';

@Injectable()
export class ArteFilaTransicaoService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ArteWebSocketGateway))
    private readonly websocketGateway: ArteWebSocketGateway,
  ) {}

  async assumir(itemOsId: string, lojaId: string, usuarioId: string) {
    const item = await this.prisma.$transaction(async (tx) => {
      const row = await tx.itemOS.findFirst({
        where: {
          id: itemOsId,
          os: { loja_id: lojaId, ativo: true },
        },
        select: {
          id: true,
          os_id: true,
          status_arte: true,
          designer_atribuido_id: true,
        },
      });

      if (!row) {
        throw new NotFoundException(ARTE_MSG.ITEM_NAO_ENCONTRADO);
      }

      if (
        row.designer_atribuido_id &&
        row.designer_atribuido_id !== usuarioId
      ) {
        throw new ConflictException(ARTE_MSG.JA_ASSUMIDO);
      }

      const statusAtual = row.status_arte as StatusArte;
      if (!STATUS_PERMITIDOS_ASSUMIR.includes(statusAtual)) {
        throw new ConflictException(ARTE_MSG.STATUS_NAO_PERMITE_ASSUMIR);
      }

      const proximoStatus =
        statusAtual === StatusArte.AGUARDANDO_INICIO
          ? StatusArte.EM_CRIACAO
          : statusAtual;

      return tx.itemOS.update({
        where: { id: itemOsId },
        data: {
          designer_atribuido_id: usuarioId,
          arte_assumido_em: new Date(),
          status_arte: proximoStatus,
        },
        include: {
          os: {
            select: { id: true, numero: true, nome_servico: true },
          },
          designer_atribuido: {
            select: { id: true, nome_completo: true },
          },
        },
      });
    });

    if (item.status_arte) {
      void this.emitirStatusArteAtualizado(
        lojaId,
        itemOsId,
        item.os_id,
        item.status_arte as StatusArte,
      );
    }

    return item;
  }

  async atualizarStatus(
    itemOsId: string,
    lojaId: string,
    dto: AtualizarStatusArteDto,
  ) {
    const item = await this.prisma.$transaction(async (tx) => {
      const row = await tx.itemOS.findFirst({
        where: {
          id: itemOsId,
          os: { loja_id: lojaId, ativo: true },
        },
        select: { id: true, os_id: true, status_arte: true },
      });

      if (!row) {
        throw new NotFoundException(ARTE_MSG.ITEM_NAO_ENCONTRADO);
      }

      const atual = row.status_arte as StatusArte;
      const proximo = dto.status_arte;

      if (
        atual !== proximo &&
        !transicaoStatusArtePermitida(atual, proximo)
      ) {
        throw new ConflictException(ARTE_MSG.TRANSICAO_INVALIDA);
      }

      return tx.itemOS.update({
        where: { id: itemOsId },
        data: { status_arte: proximo },
        select: { id: true, os_id: true, status_arte: true },
      });
    });

    void this.emitirStatusArteAtualizado(
      lojaId,
      itemOsId,
      item.os_id,
      item.status_arte as StatusArte,
    );

    return item;
  }

  async resolverItemOsId(
    produtoId: string,
    osId: string,
    lojaId: string,
    versaoId?: string,
  ): Promise<string | null> {
    const byProduto = await this.prisma.itemOS.findFirst({
      where: {
        id: produtoId,
        os_id: osId,
        os: { loja_id: lojaId, ativo: true },
      },
      select: { id: true },
    });
    if (byProduto) return byProduto.id;

    if (versaoId) {
      const versao = await this.prisma.arteVersao.findFirst({
        where: { id: versaoId, os_id: osId, loja_id: lojaId, deletado: false },
        select: { servico_id: true },
      });
      if (versao?.servico_id) {
        const byServico = await this.prisma.itemOS.findFirst({
          where: {
            id: versao.servico_id,
            os_id: osId,
            os: { loja_id: lojaId, ativo: true },
          },
          select: { id: true },
        });
        if (byServico) return byServico.id;
      }
    }

    return null;
  }

  async resolverItemOsIdPorVersao(
    versaoId: string,
    lojaId: string,
  ): Promise<string | null> {
    const versao = await this.prisma.arteVersao.findFirst({
      where: { id: versaoId, loja_id: lojaId, deletado: false },
      select: { servico_id: true, os_id: true },
    });
    if (!versao) return null;
    if (!versao.servico_id) return null;
    return this.resolverItemOsId(versao.servico_id, versao.os_id, lojaId, versaoId);
  }

  /** Cliente interagiu no chat → card vai para Revisão. */
  async sincronizarRevisaoPorMensagemCliente(params: {
    produtoId: string;
    osId: string;
    lojaId: string;
    versaoId?: string;
  }) {
    const itemOsId = await this.resolverItemOsId(
      params.produtoId,
      params.osId,
      params.lojaId,
      params.versaoId,
    );
    if (!itemOsId) return;

    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemOsId,
        os: { loja_id: params.lojaId, ativo: true },
      },
      select: { id: true, os_id: true, status_arte: true },
    });
    if (!item) return;

    const atual = item.status_arte as StatusArte;
    if (atual !== StatusArte.AGUARDANDO_CLIENTE) return;

    await this.prisma.itemOS.update({
      where: { id: itemOsId },
      data: { status_arte: StatusArte.REVISAO_SOLICITADA },
    });

    void this.emitirStatusArteAtualizado(
      params.lojaId,
      itemOsId,
      item.os_id,
      StatusArte.REVISAO_SOLICITADA,
    );
  }

  async obterVersaoAprovadaParaLiberacao(
    itemOsId: string,
    lojaId: string,
  ): Promise<string> {
    const versao = await this.prisma.arteVersao.findFirst({
      where: {
        servico_id: itemOsId,
        loja_id: lojaId,
        deletado: false,
        status: 'APROVADA',
        aprovado_por_cliente: true,
        liberado_para_pcp: false,
      },
      orderBy: { data_criacao: 'desc' },
      select: { id: true },
    });

    if (!versao) {
      throw new NotFoundException(
        'Nenhuma arte aprovada pendente de liberação para PCP',
      );
    }

    return versao.id;
  }

  async sincronizarStatusAposVersao(
    itemOsId: string | null | undefined,
    lojaId: string,
    statusVersao: string,
  ) {
    if (!itemOsId) {
      return;
    }

    const itemAntes = await this.prisma.itemOS.findFirst({
      where: {
        id: itemOsId,
        os: { loja_id: lojaId, ativo: true },
      },
      select: { id: true, os_id: true, status_arte: true },
    });

    if (!itemAntes) {
      return;
    }

    let novoStatus: StatusArte | null = null;
    if (statusVersao === 'RASCUNHO') {
      novoStatus = StatusArte.EM_CRIACAO;
    } else if (statusVersao === 'ENVIADA_CLIENTE') {
      novoStatus = StatusArte.AGUARDANDO_CLIENTE;
    } else if (statusVersao === 'REVISAO_SOLICITADA') {
      novoStatus = StatusArte.REVISAO_SOLICITADA;
    } else if (statusVersao === 'APROVADA') {
      novoStatus = StatusArte.APROVADA;
    } else if (statusVersao === StatusArte.LIBERADA_PCP) {
      novoStatus = StatusArte.LIBERADA_PCP;
    }

    if (!novoStatus || itemAntes.status_arte === novoStatus) {
      return;
    }

    await this.prisma.itemOS.update({
      where: { id: itemOsId },
      data: { status_arte: novoStatus },
    });

    void this.emitirStatusArteAtualizado(
      lojaId,
      itemOsId,
      itemAntes.os_id,
      novoStatus,
    );
  }

  private emitirStatusArteAtualizado(
    lojaId: string,
    itemId: string,
    osId: string,
    statusArte: StatusArte,
  ) {
    void this.websocketGateway
      ?.emitirStatusArteAtualizado(lojaId, {
        item_id: itemId,
        os_id: osId,
        status_arte: statusArte,
      })
      .catch(() => undefined);
  }
}
