import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ComentarioTipo } from '@prisma/client';
import { ArteNotificacaoService } from './arte-notificacao.service';

export interface CreateComentarioDto {
  versao_id: string;
  comentario: string;
  tipo?: ComentarioTipo;
  loja_id: string;
  usuario_id: string;
}

export interface ComentarioResponse {
  id: string;
  comentario: string;
  tipo: ComentarioTipo;
  data_comentario: Date;
  usuario: {
    nome: string;
    email: string;
  };
}

export interface ComentarioPublicoDto {
  versao_id: string;
  comentario: string;
  token_publico: string;
}

@Injectable()
export class ArteComentarioService {
  constructor(
    private prisma: PrismaService,
    private notificacaoService: ArteNotificacaoService
  ) {}

  /**
   * Cria um novo comentário em uma versão
   */
  async createComentario(dto: CreateComentarioDto): Promise<ComentarioResponse> {
    const { versao_id, comentario, tipo = ComentarioTipo.INTERNO, loja_id, usuario_id } = dto;

    // Verificar se a versão existe e pertence à loja
    const versao = await this.prisma.arteVersao.findFirst({
      where: {
        id: versao_id,
        loja_id,
        deletado: false,
      },
    });

    if (!versao) {
      throw new Error('Versão não encontrada ou não pertence à loja');
    }

    // Verificar se o usuário existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuario_id },
      select: { nome: true, email: true },
    });

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // Criar comentário
    const novoComentario = await this.prisma.arteComentario.create({
      data: {
        versao_id,
        comentario,
        tipo,
        loja_id,
        usuario_id,
      },
      include: {
        usuario: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

    // Enviar notificação por email se for comentário interno
    if (tipo === ComentarioTipo.INTERNO) {
      try {
        await this.notificacaoService.notificarComentarioAdicionado({
          tipo: 'COMENTARIO_ADICIONADO',
          os_id: versao.os_id,
          versao_id,
          destinatarios: [versao.os.cliente.email],
          dados: {
            comentario: comentario,
            comentario_autor: usuario.nome,
          },
        });
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de comentário:', error);
        // Não falhar a operação principal por causa da notificação
      }
    }

    return {
      id: novoComentario.id,
      comentario: novoComentario.comentario,
      tipo: novoComentario.tipo,
      data_comentario: novoComentario.data_comentario,
      usuario: novoComentario.usuario,
    };
  }

  /**
   * Cria comentário público (do cliente via link de aprovação)
   */
  async createComentarioPublico(dto: ComentarioPublicoDto): Promise<ComentarioResponse> {
    const { versao_id, comentario, token_publico } = dto;

    // Verificar se o token é válido
    const link = await this.prisma.arteLinkAprovacao.findUnique({
      where: { token_publico },
      include: {
        versao: true,
      },
    });

    if (!link) {
      throw new Error('Token de aprovação não encontrado');
    }

    if (!link.ativo) {
      throw new Error('Token de aprovação inativo');
    }

    if (link.expira_em < new Date()) {
      throw new Error('Token de aprovação expirado');
    }

    if (link.versao_id !== versao_id) {
      throw new Error('Token não corresponde à versão');
    }

    // Criar comentário do cliente
    const novoComentario = await this.prisma.arteComentario.create({
      data: {
        versao_id,
        comentario,
        tipo: ComentarioTipo.CLIENTE,
        loja_id: link.versao.loja_id,
        usuario_id: 'system', // ID especial para comentários do cliente
      },
    });

    // Buscar dados do comentário criado
    const comentarioCompleto = await this.prisma.arteComentario.findUnique({
      where: { id: novoComentario.id },
      include: {
        usuario: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

    return {
      id: comentarioCompleto!.id,
      comentario: comentarioCompleto!.comentario,
      tipo: comentarioCompleto!.tipo,
      data_comentario: comentarioCompleto!.data_comentario,
      usuario: {
        nome: 'Cliente',
        email: 'cliente@externo.com',
      },
    };
  }

  /**
   * Lista comentários de uma versão
   */
  async listarComentariosVersao(versao_id: string, loja_id: string): Promise<ComentarioResponse[]> {
    const comentarios = await this.prisma.arteComentario.findMany({
      where: {
        versao_id,
        loja_id,
      },
      include: {
        usuario: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        data_comentario: 'asc',
      },
    });

    return comentarios.map(comentario => ({
      id: comentario.id,
      comentario: comentario.comentario,
      tipo: comentario.tipo,
      data_comentario: comentario.data_comentario,
      usuario: comentario.usuario,
    }));
  }

  /**
   * Lista comentários públicos de uma versão (via token)
   */
  async listarComentariosPublicos(versao_id: string, token_publico: string): Promise<ComentarioResponse[]> {
    // Verificar se o token é válido
    const link = await this.prisma.arteLinkAprovacao.findUnique({
      where: { token_publico },
      include: {
        versao: true,
      },
    });

    if (!link) {
      throw new Error('Token de aprovação não encontrado');
    }

    if (!link.ativo) {
      throw new Error('Token de aprovação inativo');
    }

    if (link.expira_em < new Date()) {
      throw new Error('Token de aprovação expirado');
    }

    if (link.versao_id !== versao_id) {
      throw new Error('Token não corresponde à versão');
    }

    const comentarios = await this.prisma.arteComentario.findMany({
      where: {
        versao_id,
        loja_id: link.versao.loja_id,
      },
      include: {
        usuario: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        data_comentario: 'asc',
      },
    });

    return comentarios.map(comentario => ({
      id: comentario.id,
      comentario: comentario.comentario,
      tipo: comentario.tipo,
      data_comentario: comentario.data_comentario,
      usuario: {
        nome: comentario.usuario_id === 'system' ? 'Cliente' : comentario.usuario.nome,
        email: comentario.usuario_id === 'system' ? 'cliente@externo.com' : comentario.usuario.email,
      },
    }));
  }

  /**
   * Atualiza um comentário
   */
  async updateComentario(comentario_id: string, comentario: string, usuario_id: string, loja_id: string): Promise<ComentarioResponse> {
    // Verificar se o comentário existe e pertence ao usuário
    const comentarioExistente = await this.prisma.arteComentario.findFirst({
      where: {
        id: comentario_id,
        usuario_id,
        loja_id,
      },
    });

    if (!comentarioExistente) {
      throw new Error('Comentário não encontrado ou não pertence ao usuário');
    }

    // Atualizar comentário
    const comentarioAtualizado = await this.prisma.arteComentario.update({
      where: { id: comentario_id },
      data: { comentario },
      include: {
        usuario: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

    return {
      id: comentarioAtualizado.id,
      comentario: comentarioAtualizado.comentario,
      tipo: comentarioAtualizado.tipo,
      data_comentario: comentarioAtualizado.data_comentario,
      usuario: comentarioAtualizado.usuario,
    };
  }

  /**
   * Remove um comentário
   */
  async removeComentario(comentario_id: string, usuario_id: string, loja_id: string): Promise<boolean> {
    // Verificar se o comentário existe e pertence ao usuário
    const comentarioExistente = await this.prisma.arteComentario.findFirst({
      where: {
        id: comentario_id,
        usuario_id,
        loja_id,
      },
    });

    if (!comentarioExistente) {
      throw new Error('Comentário não encontrado ou não pertence ao usuário');
    }

    // Remover comentário
    await this.prisma.arteComentario.delete({
      where: { id: comentario_id },
    });

    return true;
  }

  /**
   * Conta comentários por tipo em uma versão
   */
  async contarComentariosPorTipo(versao_id: string, loja_id: string): Promise<Record<string, number>> {
    const comentarios = await this.prisma.arteComentario.groupBy({
      by: ['tipo'],
      where: {
        versao_id,
        loja_id,
      },
      _count: {
        tipo: true,
      },
    });

    const resultado: Record<string, number> = {
      INTERNO: 0,
      CLIENTE: 0,
      SISTEMA: 0,
    };

    comentarios.forEach(item => {
      resultado[item.tipo] = item._count.tipo;
    });

    return resultado;
  }
}
