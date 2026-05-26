import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ArteLinkAprovacao, ArteStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { dirname, join } from 'path';
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
  versao_id?: string; // Permite especificar versÃ£o especÃ­fica para aprovaÃ§Ã£o
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
   * Cria um novo link de aprovaÃ§Ã£o para uma versÃ£o
   */
  async createLinkAprovacao(
    dto: CreateLinkAprovacaoDto,
  ): Promise<LinkAprovacaoResponse> {
    const { versao_id, loja_id } = dto;

    // Verificar se a versÃ£o existe e pertence Ã  loja
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
      throw new Error('VersÃ£o nÃ£o encontrada ou nÃ£o pertence Ã  loja');
    }

    // Verificar se jÃ¡ existe um link ativo para esta versÃ£o
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

    // Gerar token pÃºblico Ãºnico
    const token_publico = this.generatePublicToken();

    // Definir data de expiraÃ§Ã£o (padrÃ£o: 7 dias)
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

    // Atualizar status da versÃ£o para "ENVIADA_CLIENTE"
    await this.prisma.arteVersao.update({
      where: { id: versao_id },
      data: { status: ArteStatus.ENVIADA_CLIENTE },
    });

    // Enviar notificaÃ§Ã£o por email
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
        'âŒ Erro ao enviar notificaÃ§Ã£o de aprovaÃ§Ã£o solicitada:',
        error,
      );
      // NÃ£o falhar a operaÃ§Ã£o principal por causa da notificaÃ§Ã£o
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
   * Busca dados da versÃ£o pelo token pÃºblico
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
      throw new Error('Link de aprovaÃ§Ã£o nÃ£o encontrado');
    }

    // Link pÃºblico permite visualizaÃ§Ã£o mesmo apÃ³s aprovaÃ§Ãµes
    // SÃ³ verifica expiraÃ§Ã£o se houver data de expiraÃ§Ã£o configurada
    if (link.expira_em && link.expira_em < new Date()) {
      throw new Error('Link de aprovaÃ§Ã£o expirado');
    }

    // NÃ£o verificar link.ativo aqui - o link pode estar marcado como inativo
    // mas ainda deve permitir visualizaÃ§Ã£o de artes jÃ¡ aprovadas e aprovar outras pendentes

    const todasVersoes = await this.prisma.arteVersao.findMany({
      where: {
        os_id: link.versao.os_id,
        // Removido filtro por servico_id para buscar TODAS as versÃµes da OS
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

    // Estruturar produtos com suas versÃµes mais recentes
    const decorarArquivosPublicos = (arquivos: any[] = []) =>
      arquivos.map((arquivo) =>
        this.decorarArquivoPublico(arquivo, token_publico),
      );

    const decorarVersaoPublica = (versao: any) => ({
      ...versao,
      arquivos: decorarArquivosPublicos(versao?.arquivos || []),
    });

    const versaoPublica = decorarVersaoPublica(link.versao);
    const todasVersoesPublicas = todasVersoes.map(decorarVersaoPublica);

    const produtosComVersoes = produtos.map((produto) => {
      const versaoProduto = todasVersoesPublicas.find(
        (v) => v.servico_id === produto.id,
      );
      return {
        id: produto.id,
        nome: produto.produto_servico,
        versao_mais_recente: versaoProduto || {
          id: versaoPublica.id,
          versao: versaoPublica.versao,
          status: versaoPublica.status,
          data_criacao: versaoPublica.data_criacao,
          autor: versaoPublica.autor,
          arquivos: versaoPublica.arquivos,
        },
      };
    });

    return serializeBigInt({
      link: {
        ...link,
        versao: versaoPublica,
      },
      versao: versaoPublica,
      os: link.versao.os,
      cliente: link.versao.os.cliente,
      arquivos: versaoPublica.arquivos,
      comentarios: link.versao.comentarios,
      autor: link.versao.autor,
      versoes: todasVersoesPublicas,
      produtos: produtosComVersoes, // Produtos estruturados
    });
  }

  private decorarArquivoPublico(arquivo: any, token_publico: string) {
    const urlArquivo = this.publicDownloadUrl(
      arquivo.versao_id,
      arquivo.nome_arquivo,
      token_publico,
    );

    return {
      ...arquivo,
      url_arquivo: urlArquivo,
      url_thumbnail: arquivo.url_thumbnail
        ? this.publicDownloadUrl(
            arquivo.versao_id,
            this.filenameFromPath(arquivo.url_thumbnail) || arquivo.nome_arquivo,
            token_publico,
          )
        : urlArquivo,
    };
  }

  private publicDownloadUrl(
    versaoId: string,
    filename: string,
    token_publico: string,
  ): string {
    const encodedFilename = encodeURIComponent(filename);
    const encodedToken = encodeURIComponent(token_publico);
    return `/api/arte-aprovacao/versoes/${versaoId}/arquivos/public/download/${encodedFilename}?token=${encodedToken}`;
  }

  private filenameFromPath(path: string): string | null {
    const cleanPath = path.split('?')[0];
    return cleanPath.split('/').pop() || null;
  }

  /**
   * Processa aprovaÃ§Ã£o ou rejeiÃ§Ã£o da arte
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

    // Se versao_id foi fornecido, buscar link ativo para aquela versÃ£o especÃ­fica OU qualquer link da mesma OS
    // O link pÃºblico Ã© compartilhado para todas as artes da mesma OS
    if (versao_id) {
      this.logger.log(`ðŸ” Buscando link para versÃ£o especÃ­fica: ${versao_id}`);

      // Primeiro, buscar versÃ£o para obter os_id
      const versaoSolicitada = await this.prisma.arteVersao.findUnique({
        where: { id: versao_id },
        select: { os_id: true, loja_id: true },
      });

      if (!versaoSolicitada) {
        throw new Error('VersÃ£o nÃ£o encontrada');
      }

      // Buscar link para a versÃ£o especificada OU qualquer link da mesma OS
      // NÃ£o filtrar por ativo - o link Ãºnico da OS sempre permite acesso
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
        // Se nÃ£o encontrou link ativo para a versÃ£o, tentar buscar pelo token como fallback
        this.logger.warn(
          `âš ï¸ Link ativo nÃ£o encontrado para versÃ£o ${versao_id}, tentando pelo token`,
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

        // Se encontrou link pelo token mas nÃ£o Ã© da versÃ£o correta, buscar link correto pela OS
        if (link && link.versao_id !== versao_id) {
          this.logger.log(
            `ðŸ” Link do token nÃ£o corresponde Ã  versÃ£o solicitada, buscando link correto`,
          );
          const versaoSolicitada = await this.prisma.arteVersao.findUnique({
            where: { id: versao_id },
            select: { os_id: true, loja_id: true },
          });

          if (
            versaoSolicitada &&
            versaoSolicitada.os_id === link.versao.os_id
          ) {
            // Buscar link para a versÃ£o correta (nÃ£o filtrar por ativo)
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
      // Se versao_id foi fornecido mas nÃ£o encontrou link, criar um novo link para aquela versÃ£o
      if (versao_id) {
        this.logger.log(
          `ðŸ“ Criando novo link para versÃ£o ${versao_id} (link nÃ£o encontrado)`,
        );

        // Verificar se a versÃ£o existe e pertence Ã  mesma OS do token original
        const versaoSolicitada = await this.prisma.arteVersao.findUnique({
          where: { id: versao_id },
          include: {
            os: true,
          },
        });

        if (!versaoSolicitada) {
          throw new Error('VersÃ£o nÃ£o encontrada');
        }

        // Verificar se jÃ¡ existe link ativo para esta versÃ£o OU qualquer link da mesma OS
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
          // Criar novo link para esta versÃ£o
          const tokenOriginal = await this.prisma.arteLinkAprovacao.findUnique({
            where: { token_publico },
            select: { versao: { select: { os_id: true } } },
          });

          if (
            !tokenOriginal ||
            tokenOriginal.versao.os_id !== versaoSolicitada.os_id
          ) {
            throw new Error(
              'VersÃ£o nÃ£o pertence Ã  mesma OS do token fornecido',
            );
          }

          // Criar novo link ativo para a versÃ£o solicitada
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

          this.logger.log(`âœ… Novo link criado para versÃ£o ${versao_id}`);
        }
      } else {
        throw new Error('Link de aprovaÃ§Ã£o nÃ£o encontrado');
      }
    }

    // Validar se o link encontrado corresponde Ã  versÃ£o solicitada (se foi especificada)
    if (versao_id && link.versao_id !== versao_id) {
      // Se nÃ£o corresponde, buscar qualquer link da mesma OS
      const versaoSolicitada = await this.prisma.arteVersao.findUnique({
        where: { id: versao_id },
        select: { os_id: true },
      });

      if (versaoSolicitada && versaoSolicitada.os_id === link.versao.os_id) {
        // Links da mesma OS - permitir usar este link para aprovar a versÃ£o solicitada
        this.logger.log(
          `âœ… Link da mesma OS, permitindo aprovaÃ§Ã£o da versÃ£o ${versao_id}`,
        );
        // Atualizar link.versao_id temporariamente sÃ³ para a aprovaÃ§Ã£o
        // Mas precisamos buscar o link correto ou criar um novo
      } else {
        throw new Error(
          `Link de aprovaÃ§Ã£o nÃ£o corresponde Ã  versÃ£o solicitada`,
        );
      }
    }

    // Para processo de aprovaÃ§Ã£o: verificar apenas expiraÃ§Ã£o
    // Link pÃºblico nunca fica verdadeiramente inativo - sempre permite visualizaÃ§Ã£o
    // e aprovaÃ§Ã£o de artes pendentes da mesma OS
    if (link.expira_em && link.expira_em < new Date()) {
      throw new Error('Link de aprovaÃ§Ã£o expirado');
    }

    // Se versao_id foi fornecido, verificar se essa versÃ£o especÃ­fica jÃ¡ foi aprovada
    // Se nÃ£o foi fornecido, usar a versÃ£o do link encontrado
    const versaoIdParaVerificar = versao_id || link.versao_id;

    const versao = await this.prisma.arteVersao.findUnique({
      where: { id: versaoIdParaVerificar },
      select: { aprovado_por_cliente: true, status: true },
    });

    if (!versao) {
      throw new Error('VersÃ£o de arte nÃ£o encontrada');
    }

    if (versao.aprovado_por_cliente) {
      throw new Error(
        'Esta versÃ£o de arte jÃ¡ foi aprovada. VocÃª pode visualizÃ¡-la, mas nÃ£o pode aprovÃ¡-la novamente.',
      );
    }

    // Remover validaÃ§Ã£o do link.aprovado jÃ¡ que agora verificamos pela versÃ£o
    // if (link.aprovado) {
    //   throw new Error('Arte jÃ¡ foi aprovada');
    // }

    // Atualizar link - NUNCA desativar automaticamente
    // O link Ã© compartilhado para todas as artes da OS e deve permanecer ativo
    // para permitir visualizaÃ§Ã£o e aprovaÃ§Ã£o de outras versÃµes
    await this.prisma.arteLinkAprovacao.update({
      where: { id: link.id },
      data: {
        aprovado: link.aprovado || aprovado, // Manter true se jÃ¡ estava aprovado
        data_aprovacao: link.data_aprovacao || new Date(),
        ip_aprovacao: ip_address,
        user_agent,
        comentario_cliente: comentario,
        // SEMPRE manter ativo - link pÃºblico nÃ£o expira automaticamente apÃ³s aprovaÃ§Ãµes
        // Permite visualizar artes aprovadas e aprovar outras pendentes
        ativo: true,
      },
    });

    // Atualizar status da versÃ£o (usar versao_id se fornecido, senÃ£o usar do link)
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

    // Adicionar comentÃ¡rio do cliente se fornecido
    if (comentario) {
      await this.prisma.arteComentario.create({
        data: {
          versao_id: versaoIdParaAtualizar,
          usuario_id: 'system', // ID especial para comentÃ¡rios do cliente
          comentario,
          tipo: 'CLIENTE',
          loja_id: link.versao.loja_id,
        },
      });
    }

    // Enviar notificaÃ§Ã£o por email
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
        'âŒ Erro ao enviar notificaÃ§Ã£o de aprovaÃ§Ã£o/rejeiÃ§Ã£o:',
        error,
      );
      // NÃ£o falhar a operaÃ§Ã£o principal por causa da notificaÃ§Ã£o
    }

    return {
      sucesso: true,
      status: novoStatus,
      mensagem: aprovado
        ? 'Arte aprovada com sucesso!'
        : 'SolicitaÃ§Ã£o de alteraÃ§Ã£o enviada!',
    };
  }

  /**
   * Lista links de aprovaÃ§Ã£o de uma versÃ£o
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
   * Desativa um link de aprovaÃ§Ã£o
   */
  async desativarLink(link_id: string, loja_id: string) {
    return this.prisma.arteLinkAprovacao.update({
      where: { id: link_id },
      data: { ativo: false },
    });
  }

  /**
   * Gera token pÃºblico Ãºnico e seguro
   */
  private generatePublicToken(): string {
    // Usar UUID + timestamp + random bytes para mÃ¡xima unicidade
    const uuid = uuidv4();
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');

    return `${uuid}-${timestamp}-${random}`;
  }

  /**
   * Valida se um token Ã© vÃ¡lido
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

  async validarDownloadPublicoArquivo(
    token_publico: string,
    versaoId: string,
    filename: string,
  ): Promise<{ storagePath: string; nomeOriginal: string; tipoArquivo: string }> {
    if (!token_publico || !versaoId || !filename) {
      throw new ForbiddenException('Token pÃºblico obrigatÃ³rio');
    }
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new ForbiddenException('Nome de arquivo invalido');
    }

    const link = await this.prisma.arteLinkAprovacao.findUnique({
      where: { token_publico },
      include: {
        versao: {
          select: {
            id: true,
            os_id: true,
            loja_id: true,
            deletado: true,
          },
        },
      },
    });

    if (!link || !link.ativo || link.expira_em < new Date() || link.versao.deletado) {
      throw new ForbiddenException('Link pÃºblico invÃ¡lido ou expirado');
    }

    const arquivo = await this.prisma.arteArquivo.findFirst({
      where: {
        versao_id: versaoId,
        OR: [
          { nome_arquivo: filename },
          { url_thumbnail: { endsWith: `/${filename}` } },
        ],
      },
      include: {
        versao: {
          select: {
            id: true,
            os_id: true,
            loja_id: true,
            deletado: true,
          },
        },
      },
    });

    if (!arquivo || arquivo.versao.deletado) {
      throw new NotFoundException('Arquivo nÃ£o encontrado');
    }

    const mesmoContexto =
      arquivo.versao.os_id === link.versao.os_id &&
      arquivo.versao.loja_id === link.versao.loja_id;

    if (!mesmoContexto) {
      throw new ForbiddenException('Token pÃºblico nÃ£o autoriza este arquivo');
    }

    const isThumbnail =
      arquivo.nome_arquivo !== filename &&
      this.filenameFromPath(arquivo.url_thumbnail || '') === filename;

    return {
      storagePath: isThumbnail
        ? join(dirname(arquivo.storage_path), filename)
        : arquivo.storage_path,
      nomeOriginal: isThumbnail ? filename : arquivo.nome_original || arquivo.nome_arquivo,
      tipoArquivo: arquivo.tipo_arquivo,
    };
  }
}
