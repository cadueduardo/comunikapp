import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusOrdemTerceirizacao } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AtualizarStatusTerceirizacaoDto } from '../dto/atualizar-status-terceirizacao.dto';

const PROXIMOS_STATUS: Record<
  StatusOrdemTerceirizacao,
  StatusOrdemTerceirizacao[]
> = {
  A_COTAR: [StatusOrdemTerceirizacao.COTADO, StatusOrdemTerceirizacao.CANCELADO],
  COTADO: [
    StatusOrdemTerceirizacao.PEDIDO_ENVIADO,
    StatusOrdemTerceirizacao.CANCELADO,
  ],
  PEDIDO_ENVIADO: [
    StatusOrdemTerceirizacao.EM_PRODUCAO,
    StatusOrdemTerceirizacao.CANCELADO,
  ],
  EM_PRODUCAO: [
    StatusOrdemTerceirizacao.PRONTO,
    StatusOrdemTerceirizacao.CANCELADO,
  ],
  PRONTO: [
    StatusOrdemTerceirizacao.EM_TRANSITO,
    StatusOrdemTerceirizacao.RECEBIDO,
    StatusOrdemTerceirizacao.ENTREGUE,
    StatusOrdemTerceirizacao.CANCELADO,
  ],
  EM_TRANSITO: [
    StatusOrdemTerceirizacao.RECEBIDO,
    StatusOrdemTerceirizacao.ENTREGUE,
    StatusOrdemTerceirizacao.CANCELADO,
  ],
  RECEBIDO: [StatusOrdemTerceirizacao.ENTREGUE],
  ENTREGUE: [],
  CANCELADO: [],
};

@Injectable()
export class TerceirizacaoService {
  constructor(private readonly prisma: PrismaService) {}

  listar(lojaId: string, status?: StatusOrdemTerceirizacao) {
    return this.prisma.ordemTerceirizacao.findMany({
      where: { loja_id: lojaId, ...(status ? { status } : {}) },
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
            contato_nome: true,
            whatsapp: true,
            telefone: true,
          },
        },
        item_os: {
          select: {
            id: true,
            produto_servico: true,
            quantidade: true,
            modo_fulfillment: true,
            os: {
              select: { id: true, numero: true, data_prazo: true },
            },
          },
        },
      },
      orderBy: [{ data_prevista: 'asc' }, { criado_em: 'asc' }],
    });
  }

  async atualizarStatus(
    lojaId: string,
    id: string,
    dto: AtualizarStatusTerceirizacaoDto,
  ) {
    const ordem = await this.prisma.ordemTerceirizacao.findFirst({
      where: { id, loja_id: lojaId },
    });
    if (!ordem) {
      throw new NotFoundException('Ordem de terceirização não encontrada.');
    }

    if (dto.status !== ordem.status) {
      const permitidos = PROXIMOS_STATUS[ordem.status];
      if (!permitidos.includes(dto.status)) {
        throw new BadRequestException(
          `Transição de ${ordem.status} para ${dto.status} não permitida.`,
        );
      }
    }

    const agora = new Date();
    return this.prisma.ordemTerceirizacao.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.observacoes !== undefined
          ? { observacoes: dto.observacoes }
          : {}),
        ...(dto.status === StatusOrdemTerceirizacao.PEDIDO_ENVIADO
          ? { pedido_enviado_em: agora }
          : {}),
        ...(dto.status === StatusOrdemTerceirizacao.EM_PRODUCAO
          ? { iniciado_em: agora }
          : {}),
        ...(dto.status === StatusOrdemTerceirizacao.PRONTO
          ? { concluido_em: agora }
          : {}),
        ...(dto.status === StatusOrdemTerceirizacao.RECEBIDO
          ? { recebido_em: agora }
          : {}),
        ...(dto.status === StatusOrdemTerceirizacao.ENTREGUE
          ? { entregue_em: agora }
          : {}),
      },
      include: { fornecedor: true, item_os: true },
    });
  }
}
