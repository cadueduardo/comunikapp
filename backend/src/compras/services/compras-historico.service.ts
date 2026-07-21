import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type CompraEntidadeTipo =
  | 'SOLICITACAO_COMPRA'
  | 'PEDIDO_COMPRA'
  | 'RECEBIMENTO_COMPRA'
  | 'ACEITE_SERVICO';

export interface RegistrarHistoricoParams {
  lojaId: string;
  entidadeTipo: CompraEntidadeTipo;
  entidadeId: string;
  acao: string;
  statusAnterior?: string | null;
  statusNovo?: string | null;
  dados?: Prisma.InputJsonValue | null;
  usuarioId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class ComprasHistoricoService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(params: RegistrarHistoricoParams) {
    return this.prisma.compraHistorico.create({
      data: {
        loja_id: params.lojaId,
        entidade_tipo: params.entidadeTipo,
        entidade_id: params.entidadeId,
        acao: params.acao,
        status_anterior: params.statusAnterior ?? null,
        status_novo: params.statusNovo ?? null,
        dados: params.dados ?? undefined,
        usuario_id: params.usuarioId ?? null,
        ip: params.ip ?? null,
        user_agent: params.userAgent ?? null,
      },
    });
  }

  async listarPorEntidade(
    lojaId: string,
    entidadeTipo: CompraEntidadeTipo,
    entidadeId: string,
  ) {
    return this.prisma.compraHistorico.findMany({
      where: {
        loja_id: lojaId,
        entidade_tipo: entidadeTipo,
        entidade_id: entidadeId,
      },
      orderBy: { criado_em: 'desc' },
      include: {
        usuario: {
          select: {
            id: true,
            nome_completo: true,
            email: true,
          },
        },
      },
    });
  }
}
