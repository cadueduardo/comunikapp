import { Injectable, Logger } from '@nestjs/common';
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
  versao_id?: string; // Permite especificar versão específica para aprovação
  produto_id?: string; // ID do produto para contexto
}

@Injectable()
export class ArteLinkAprovacaoService {
  private readonly logger = new Logger(ArteLinkAprovacaoService.name);

  constructor(
    private prisma: PrismaService,
    private notificacaoService: ArteNotificacaoService,
  ) {}

  /**
   * Cria um novo link de aprovação para uma versão
   */
  async createLinkAprovacao(
    dto: CreateLinkAprovacaoDto,
  ): Promise<LinkAprovacaoResponse> {
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
    const expira_em =
      dto.expira_em || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
      console.error(
        '❌ Erro ao enviar notificação de aprovação solicitada:',
        error,
      );
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

    // Link público permite visualização mesmo após aprovações
    // Só verifica expiração se houver data de expiração configurada
    if (link.expira_em && link.expira_em < new Date()) {
      throw new Error('Link de aprovação expirado');
    }

    // Não verificar link.ativo aqui - o link pode estar marcado como inativo
    // mas ainda deve permitir visualização de artes já aprovadas e aprovar outras pendentes

    // Buscar todas as versões da mesma OS (todos os produtos/serviços)
    console.log('🔍 [getVersaoByToken] Buscando versões para:', {
      os_id: link.versao.os_id,
      loja_id: link.versao.loja_id,
    });

    const todasVersoes = await this.prisma.arteVersao.findMany({
      where: {
        os_id: link.versao.os_id,
        // Removido filtro por servico_id para buscar TODAS as versões da OS
        loja_id: link.versao.loja_id,
        deletado: false,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        arquivos: true,
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nome_completo: true,
              },
            },
          },
          orderBy: {
            data_comentario: 'desc',
          },
        },
      },
      orderBy: {
        data_criacao: 'desc',
      },
    });

    console.log('📋 [getVersaoByToken] Encontradas versões:', {
      quantidade: todasVersoes.length,
      versoes: todasVersoes.map((v) => ({
        id: v.id,
        versao: v.versao,
        servico_id: v.servico_id,
        status: v.status,
        data_criacao: v.data_criacao,
      })),
    });

    // Buscar produtos da OS para estruturar os dados corretamente
    const produtos = await this.prisma.itemOS.findMany({
      where: {
        os_id: link.versao.os_id,
      },
      select: {
        id: true,
        produto_servico: true,
        quantidade: true,
      },
    });

    // Estruturar produtos com suas versões mais recentes
    const produtosComVersoes = produtos.map((produto) => {
      const versaoProduto = todasVersoes.find(
        (v) => v.servico_id === produto.id,
      );
      return {
        id: produto.id,
        nome: produto.produto_servico,
        versao_mais_recente: versaoProduto || {
          id: link.versao.id,
          versao: link.versao.versao,
          status: link.versao.status,
          data_criacao: link.versao.data_criacao,
          autor: link.versao.autor,
          arquivos: link.versao.arquivos,
        },
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
    const {
      token_publico,
      aprovado,
      comentario,
      ip_address,
      user_agent,
      versao_id,
    } = dto;

    let link;

    // Se versao_id foi fornecido, buscar link ativo para aquela versão específica OU qualquer link da mesma OS
    // O link público é compartilhado para todas as artes da mesma OS
    if (versao_id) {
      this.logger.log(`🔍 Buscando link para versão específica: ${versao_id}`);

      // Primeiro, buscar versão para obter os_id
      const versaoSolicitada = await this.prisma.arteVersao.findUnique({
        where: { id: versao_id },
        select: { os_id: true, loja_id: true },
      });

      if (!versaoSolicitada) {
        throw new Error('Versão não encontrada');
      }

      // Buscar link para a versão especificada OU qualquer link da mesma OS
      // Não filtrar por ativo - o link único da OS sempre permite acesso
      link = await this.prisma.arteLinkAprovacao.findFirst({
        where: {
          OR: [
            { versao_id },
            {
              versao: {
                os_id: versaoSolicitada.os_id,
              },
            },
          ],
          expira_em: {
            gt: new Date(),
          },
        },
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
        // Se não encontrou link ativo para a versão, tentar buscar pelo token como fallback
        this.logger.warn(
          `⚠️ Link ativo não encontrado para versão ${versao_id}, tentando pelo token`,
        );
        link = await this.prisma.arteLinkAprovacao.findUnique({
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

        // Se encontrou link pelo token mas não é da versão correta, buscar link correto pela OS
        if (link && link.versao_id !== versao_id) {
          this.logger.log(
            `🔍 Link do token não corresponde à versão solicitada, buscando link correto`,
          );
          const versaoSolicitada = await this.prisma.arteVersao.findUnique({
            where: { id: versao_id },
            select: { os_id: true, loja_id: true },
          });

          if (
            versaoSolicitada &&
            versaoSolicitada.os_id === link.versao.os_id
          ) {
            // Buscar link para a versão correta (não filtrar por ativo)
            link = await this.prisma.arteLinkAprovacao.findFirst({
              where: {
                versao_id,
                expira_em: {
                  gt: new Date(),
                },
              },
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
          }
        }
      }
    } else {
      // Buscar link pelo token (comportamento original)
      link = await this.prisma.arteLinkAprovacao.findUnique({
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
    }

    if (!link) {
      // Se versao_id foi fornecido mas não encontrou link, criar um novo link para aquela versão
      if (versao_id) {
        this.logger.log(
          `📝 Criando novo link para versão ${versao_id} (link não encontrado)`,
        );

        // Verificar se a versão existe e pertence à mesma OS do token original
        const versaoSolicitada = await this.prisma.arteVersao.findUnique({
          where: { id: versao_id },
          include: {
            os: true,
          },
        });

        if (!versaoSolicitada) {
          throw new Error('Versão não encontrada');
        }

        // Verificar se já existe link ativo para esta versão OU qualquer link da mesma OS
        const linkExistente = await this.prisma.arteLinkAprovacao.findFirst({
          where: {
            OR: [
              { versao_id },
              {
                versao: {
                  os_id: versaoSolicitada.os_id,
                },
              },
            ],
            expira_em: { gt: new Date() },
          },
        });

        if (linkExistente) {
          link = linkExistente;
          // Recarregar com includes
          link = await this.prisma.arteLinkAprovacao.findUnique({
            where: { id: linkExistente.id },
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
        } else {
          // Criar novo link para esta versão
          const tokenOriginal = await this.prisma.arteLinkAprovacao.findUnique({
            where: { token_publico },
            select: { versao: { select: { os_id: true } } },
          });

          if (
            !tokenOriginal ||
            tokenOriginal.versao.os_id !== versaoSolicitada.os_id
          ) {
            throw new Error(
              'Versão não pertence à mesma OS do token fornecido',
            );
          }

          // Criar novo link ativo para a versão solicitada
          const novoToken = this.generatePublicToken();
          const expira_em = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

          link = await this.prisma.arteLinkAprovacao.create({
            data: {
              versao_id,
              token_publico: novoToken,
              expira_em,
              loja_id: versaoSolicitada.loja_id,
              ativo: true,
            },
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

          this.logger.log(`✅ Novo link criado para versão ${versao_id}`);
        }
      } else {
        throw new Error('Link de aprovação não encontrado');
      }
    }

    // Validar se o link encontrado corresponde à versão solicitada (se foi especificada)
    if (versao_id && link.versao_id !== versao_id) {
      // Se não corresponde, buscar qualquer link da mesma OS
      const versaoSolicitada = await this.prisma.arteVersao.findUnique({
        where: { id: versao_id },
        select: { os_id: true },
      });

      if (versaoSolicitada && versaoSolicitada.os_id === link.versao.os_id) {
        // Links da mesma OS - permitir usar este link para aprovar a versão solicitada
        this.logger.log(
          `✅ Link da mesma OS, permitindo aprovação da versão ${versao_id}`,
        );
        // Atualizar link.versao_id temporariamente só para a aprovação
        // Mas precisamos buscar o link correto ou criar um novo
      } else {
        throw new Error(
          `Link de aprovação não corresponde à versão solicitada`,
        );
      }
    }

    // Para processo de aprovação: verificar apenas expiração
    // Link público nunca fica verdadeiramente inativo - sempre permite visualização
    // e aprovação de artes pendentes da mesma OS
    if (link.expira_em && link.expira_em < new Date()) {
      throw new Error('Link de aprovação expirado');
    }

    // Se versao_id foi fornecido, verificar se essa versão específica já foi aprovada
    // Se não foi fornecido, usar a versão do link encontrado
    const versaoIdParaVerificar = versao_id || link.versao_id;

    const versao = await this.prisma.arteVersao.findUnique({
      where: { id: versaoIdParaVerificar },
      select: { aprovado_por_cliente: true, status: true },
    });

    if (!versao) {
      throw new Error('Versão de arte não encontrada');
    }

    if (versao.aprovado_por_cliente) {
      throw new Error(
        'Esta versão de arte já foi aprovada. Você pode visualizá-la, mas não pode aprová-la novamente.',
      );
    }

    // Remover validação do link.aprovado já que agora verificamos pela versão
    // if (link.aprovado) {
    //   throw new Error('Arte já foi aprovada');
    // }

    // Atualizar link - NUNCA desativar automaticamente
    // O link é compartilhado para todas as artes da OS e deve permanecer ativo
    // para permitir visualização e aprovação de outras versões
    await this.prisma.arteLinkAprovacao.update({
      where: { id: link.id },
      data: {
        aprovado: link.aprovado || aprovado, // Manter true se já estava aprovado
        data_aprovacao: link.data_aprovacao || new Date(),
        ip_aprovacao: ip_address,
        user_agent,
        comentario_cliente: comentario,
        // SEMPRE manter ativo - link público não expira automaticamente após aprovações
        // Permite visualizar artes aprovadas e aprovar outras pendentes
        ativo: true,
      },
    });

    // Atualizar status da versão (usar versao_id se fornecido, senão usar do link)
    const versaoIdParaAtualizar = versao_id || link.versao_id;
    const novoStatus = aprovado
      ? ArteStatus.APROVADA
      : ArteStatus.REVISAO_SOLICITADA;

    await this.prisma.arteVersao.update({
      where: { id: versaoIdParaAtualizar },
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
          versao_id: versaoIdParaAtualizar,
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
          versao_id: versaoIdParaAtualizar,
          destinatarios: [link.versao.autor.email],
          dados: {},
        });
      } else {
        await this.notificacaoService.notificarArteRejeitada({
          tipo: 'ARTE_REJEITADA',
          os_id: link.versao.os_id,
          versao_id: versaoIdParaAtualizar,
          destinatarios: [link.versao.autor.email],
          dados: {
            comentario_cliente: comentario,
          },
        });
      }
    } catch (error) {
      console.error(
        '❌ Erro ao enviar notificação de aprovação/rejeição:',
        error,
      );
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
