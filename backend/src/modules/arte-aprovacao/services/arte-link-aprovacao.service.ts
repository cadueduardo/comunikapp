import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ArteLinkAprovacao, ArteStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { ArteNotificacaoService } from './arte-notificacao.service';

/**
 * Converte BigInt para string em objetos
 */
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeBigInt(obj[key]);
      }
    }
    return serialized;
  }
  
  return obj;
}

export interface CreateLinkAprovacaoDto {
  versao_id: string;
  expira_em?: Date;
  loja_id: string;
}

export interface LinkAprovacaoResponse {
  id: string;
  token_publico: string;
  url_aprovacao: string;
  expira_em: Date;
  ativo: boolean;
  versao_id: string;
}

export interface AprovarArteDto {
  token_publico: string;
  aprovado: boolean;
  comentario?: string;
  ip_address?: string;
  user_agent?: string;
}

@Injectable()
export class ArteLinkAprovacaoService {
  constructor(
    private prisma: PrismaService,
    private notificacaoService: ArteNotificacaoService
  ) {}

  /**
   * Cria um novo link de aprovação para uma versão
   */
  async createLinkAprovacao(dto: CreateLinkAprovacaoDto): Promise<LinkAprovacaoResponse> {
    const { versao_id, loja_id } = dto;
    
    // Verificar se a versão existe e pertence à loja
    const versao = await this.prisma.arteVersao.findFirst({
      where: {
        id: versao_id,
        loja_id,
        deletado: false,
      },
      include: {
        os: {
          include: {
            cliente: true,
          },
        },
      },
    });

    if (!versao) {
      throw new Error('Versão não encontrada ou não pertence à loja');
    }

    // Verificar se já existe um link ativo para esta versão
    const linkExistente = await this.prisma.arteLinkAprovacao.findFirst({
      where: {
        versao_id,
        ativo: true,
        expira_em: {
          gt: new Date(),
        },
      },
    });

    if (linkExistente) {
      // Desativar link anterior
      await this.prisma.arteLinkAprovacao.update({
        where: { id: linkExistente.id },
        data: { ativo: false },
      });
    }

    // Gerar token público único
    const token_publico = this.generatePublicToken();
    
    // Definir data de expiração (padrão: 7 dias)
    const expira_em = dto.expira_em || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Criar novo link
    const link = await this.prisma.arteLinkAprovacao.create({
      data: {
        versao_id,
        token_publico,
        expira_em,
        loja_id,
        ativo: true,
      },
    });

    // Atualizar status da versão para "ENVIADA_CLIENTE"
    await this.prisma.arteVersao.update({
      where: { id: versao_id },
      data: { status: ArteStatus.ENVIADA_CLIENTE },
    });

    // Enviar notificação por email
    try {
      await this.notificacaoService.notificarAprovacaoSolicitada({
        tipo: 'APROVACAO_SOLICITADA',
        os_id: versao.os_id,
        versao_id,
        destinatarios: [versao.os.cliente.email],
        dados: {
          link_id: link.id,
        },
      });
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de aprovação solicitada:', error);
      // Não falhar a operação principal por causa da notificação
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return {
      id: link.id,
      token_publico: link.token_publico,
      url_aprovacao: `${frontendUrl}/arte/aprovacao/${link.token_publico}`,
      expira_em: link.expira_em,
      ativo: link.ativo,
      versao_id: link.versao_id,
    };
  }

  /**
   * Busca dados da versão pelo token público
   */
  async getVersaoByToken(token_publico: string) {
    const link = await this.prisma.arteLinkAprovacao.findUnique({
      where: { token_publico },
      include: {
        versao: {
          include: {
            os: {
              include: {
                cliente: true,
              },
            },
            arquivos: true,
            comentarios: {
              include: {
                usuario: {
                  select: {
                    nome: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                data_comentario: 'desc',
              },
            },
            autor: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!link) {
      throw new Error('Link de aprovação não encontrado');
    }

    if (!link.ativo) {
      throw new Error('Link de aprovação inativo');
    }

    if (link.expira_em < new Date()) {
      throw new Error('Link de aprovação expirado');
    }

    // Buscar todas as versões da mesma OS (todos os produtos/serviços)
    console.log('🔍 [getVersaoByToken] Buscando versões para:', {
      os_id: link.versao.os_id,
      loja_id: link.versao.loja_id
    });

    const todasVersoes = await this.prisma.arteVersao.findMany({
      where: {
        os_id: link.versao.os_id,
        // Removido filtro por servico_id para buscar TODAS as versões da OS
        loja_id: link.versao.loja_id,
        deletado: false
      },
      include: {
        autor: {
          select: {
            id: true,
            nome_completo: true
          }
        },
        arquivos: true,
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nome_completo: true
              }
            }
          },
          orderBy: {
            data_comentario: 'desc'
          }
        }
      },
      orderBy: {
        data_criacao: 'desc'
      }
    });

    console.log('📋 [getVersaoByToken] Encontradas versões:', {
      quantidade: todasVersoes.length,
      versoes: todasVersoes.map(v => ({
        id: v.id,
        versao: v.versao,
        servico_id: v.servico_id,
        status: v.status,
        data_criacao: v.data_criacao
      }))
    });

    // Buscar produtos da OS para estruturar os dados corretamente
    const produtos = await this.prisma.itemOS.findMany({
      where: {
        os_id: link.versao.os_id
      },
      select: {
        id: true,
        produto_servico: true,
        quantidade: true
      }
    });

    // Estruturar produtos com suas versões mais recentes
    const produtosComVersoes = produtos.map(produto => {
      const versaoProduto = todasVersoes.find(v => v.servico_id === produto.id);
      return {
        id: produto.id,
        nome: produto.produto_servico,
        versao_mais_recente: versaoProduto || {
          id: link.versao.id,
          versao: link.versao.versao,
          status: link.versao.status,
          data_criacao: link.versao.data_criacao,
          autor: link.versao.autor,
          arquivos: link.versao.arquivos
        }
      };
    });

    return serializeBigInt({
      link,
      versao: link.versao,
      os: link.versao.os,
      cliente: link.versao.os.cliente,
      arquivos: link.versao.arquivos,
      comentarios: link.versao.comentarios,
      autor: link.versao.autor,
      versoes: todasVersoes, // Todas as versões da mesma OS
      produtos: produtosComVersoes, // Produtos estruturados
    });
  }

  /**
   * Processa aprovação ou rejeição da arte
   */
  async processarAprovacao(dto: AprovarArteDto) {
    const { token_publico, aprovado, comentario, ip_address, user_agent } = dto;

    // Buscar link
    const link = await this.prisma.arteLinkAprovacao.findUnique({
      where: { token_publico },
      include: {
        versao: {
          include: {
            autor: true,
            os: {
              include: {
                cliente: true,
              },
            },
          },
        },
      },
    });

    if (!link) {
      throw new Error('Link de aprovação não encontrado');
    }

    if (!link.ativo) {
      throw new Error('Link de aprovação inativo');
    }

    if (link.expira_em < new Date()) {
      throw new Error('Link de aprovação expirado');
    }

    if (link.aprovado) {
      throw new Error('Arte já foi aprovada');
    }

    // Atualizar link
    await this.prisma.arteLinkAprovacao.update({
      where: { id: link.id },
      data: {
        aprovado,
        data_aprovacao: new Date(),
        ip_aprovacao: ip_address,
        user_agent,
        comentario_cliente: comentario,
        ativo: false, // Desativar após uso
      },
    });

    // Atualizar status da versão
    const novoStatus = aprovado ? ArteStatus.APROVADA : ArteStatus.REVISAO_SOLICITADA;
    
    await this.prisma.arteVersao.update({
      where: { id: link.versao_id },
      data: {
        status: novoStatus,
        aprovado_por_cliente: aprovado,
        data_aprovacao: aprovado ? new Date() : null,
      },
    });

    // Adicionar comentário do cliente se fornecido
    if (comentario) {
      await this.prisma.arteComentario.create({
        data: {
          versao_id: link.versao_id,
          usuario_id: 'system', // ID especial para comentários do cliente
          comentario,
          tipo: 'CLIENTE',
          loja_id: link.versao.loja_id,
        },
      });
    }

    // Enviar notificação por email
    try {
      if (aprovado) {
        await this.notificacaoService.notificarArteAprovada({
          tipo: 'ARTE_APROVADA',
          os_id: link.versao.os_id,
          versao_id: link.versao_id,
          destinatarios: [link.versao.autor.email],
          dados: {},
        });
      } else {
        await this.notificacaoService.notificarArteRejeitada({
          tipo: 'ARTE_REJEITADA',
          os_id: link.versao.os_id,
          versao_id: link.versao_id,
          destinatarios: [link.versao.autor.email],
          dados: {
            comentario_cliente: comentario,
          },
        });
      }
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de aprovação/rejeição:', error);
      // Não falhar a operação principal por causa da notificação
    }

    return {
      sucesso: true,
      status: novoStatus,
      mensagem: aprovado 
        ? 'Arte aprovada com sucesso!' 
        : 'Solicitação de alteração enviada!',
    };
  }

  /**
   * Lista links de aprovação de uma versão
   */
  async listarLinksVersao(versao_id: string, loja_id: string) {
    return this.prisma.arteLinkAprovacao.findMany({
      where: {
        versao_id,
        loja_id,
      },
      orderBy: {
        data_aprovacao: 'desc',
      },
    });
  }

  /**
   * Desativa um link de aprovação
   */
  async desativarLink(link_id: string, loja_id: string) {
    return this.prisma.arteLinkAprovacao.update({
      where: { id: link_id },
      data: { ativo: false },
    });
  }

  /**
   * Gera token público único e seguro
   */
  private generatePublicToken(): string {
    // Usar UUID + timestamp + random bytes para máxima unicidade
    const uuid = uuidv4();
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    
    return `${uuid}-${timestamp}-${random}`;
  }

  /**
   * Valida se um token é válido
   */
  async validarToken(token_publico: string): Promise<boolean> {
    try {
      const link = await this.prisma.arteLinkAprovacao.findUnique({
        where: { token_publico },
      });

      if (!link) return false;
      if (!link.ativo) return false;
      if (link.expira_em < new Date()) return false;

      return true;
    } catch {
      return false;
    }
  }
}
