import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificacoesService {
  constructor(private prisma: PrismaService) {}

  async criarNotificacao(data: {
    loja_id: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    orcamento_id?: string;
  }) {
    return this.prisma.notificacao.create({
      data: {
        loja_id: data.loja_id,
        tipo: data.tipo,
        titulo: data.titulo,
        mensagem: data.mensagem,
        orcamento_id: data.orcamento_id,
      },
    });
  }

  async buscarNotificacoes(loja_id: string) {
    return this.prisma.notificacao.findMany({
      where: {
        loja_id,
      },
      orderBy: {
        criado_em: 'desc',
      },
      include: {
        orcamento: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
    });
  }

  async marcarComoLida(id: string, loja_id: string) {
    return this.prisma.notificacao.update({
      where: {
        id,
        loja_id,
      },
      data: {
        lida: true,
      },
    });
  }

  async marcarTodasComoLidas(loja_id: string) {
    return this.prisma.notificacao.updateMany({
      where: {
        loja_id,
        lida: false,
      },
      data: {
        lida: true,
      },
    });
  }

  async contarNaoLidas(loja_id: string) {
    return this.prisma.notificacao.count({
      where: {
        loja_id,
        lida: false,
      },
    });
  }
} 