import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ArteNotificacaoService } from './arte-notificacao.service';
import { ArteWebSocketGateway } from '../gateways/arte-websocket.gateway';
import { CreateMensagemDto, UpdateMensagemDto } from '../dto/mensagem.dto';
import { AutorTipo } from '@prisma/client';
import { NotificacoesService } from '../../../notificacoes/notificacoes.service';

@Injectable()
export class ArteMensagemService {
  private readonly logger = new Logger(ArteMensagemService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacaoService: ArteNotificacaoService,
    private readonly notificacoesGlobalService: NotificacoesService,
    @Inject(forwardRef(() => ArteWebSocketGateway))
    private readonly websocketGateway: ArteWebSocketGateway,
  ) {}

  /**
   * Processar men├º├Áes na mensagem
   */
  processarMencoes(mensagem: string): {
    mensagemProcessada: string;
    versoesMencionadas: string[];
  } {
    if (!mensagem) {
      return {
        mensagemProcessada: mensagem,
        versoesMencionadas: [],
      };
    }

    const escapeAttribute = (value: string) => value.replace(/"/g, '&quot;');

    const versoesMencionadas: string[] = [];
    let mensagemProcessada = mensagem;

    const mentionSpanRegex =
      /<span\b[^>]*class="mention"[^>]*>(.*?)<\/span>/gis;

    mensagemProcessada = mensagemProcessada.replace(
      mentionSpanRegex,
      (fullMatch, innerHtml) => {
        const idAttr =
          fullMatch.match(/data-(?:id|mention-id)="([^"]*)"/i)?.[1] ?? '';
        const labelAttr =
          fullMatch.match(/data-(?:label|mention-label)="([^"]*)"/i)?.[1]?.trim() ??
          '';

        const plainText = innerHtml
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        const baseLabelRaw = labelAttr.length
          ? labelAttr
          : plainText.replace(/^@/, '').trim();

        if (!baseLabelRaw) {
          return fullMatch;
        }

        const versaoRegex = /^@?\s*v(\d+)(?:\s*-\s*(.*))?$/i;
        const labelMatch = baseLabelRaw.match(versaoRegex);
        const textMatch = plainText.match(versaoRegex);

        let versaoCodigo = '';
        let descricao = '';

        if (labelMatch) {
          versaoCodigo = `V${labelMatch[1]}`;
          descricao = labelMatch[2]?.trim() ?? '';
        } else if (textMatch) {
          versaoCodigo = `V${textMatch[1]}`;
          descricao = textMatch[2]?.trim() ?? '';
        }

        const labelNormalizada =
          versaoCodigo && descricao
            ? `${versaoCodigo} - ${descricao}`
            : versaoCodigo || baseLabelRaw;

        if (versaoCodigo && !versoesMencionadas.includes(versaoCodigo)) {
          versoesMencionadas.push(versaoCodigo);
        }

        const badgeText = labelNormalizada.startsWith('@')
          ? labelNormalizada
          : `@${labelNormalizada}`;

        const dataIdAttr = idAttr
          ? ` data-id="${escapeAttribute(idAttr)}"`
          : '';

        return `<span class="mention" data-type="mention"${dataIdAttr} data-label="${escapeAttribute(
          labelNormalizada,
        )}" data-mention-label="${escapeAttribute(
          labelNormalizada,
        )}">${badgeText}</span>`;
      },
    );

    const placeholders: string[] = [];
    mensagemProcessada = mensagemProcessada.replace(
      /<span class="mention"[^>]*>.*?<\/span>/gis,
      (match) => {
        placeholders.push(match);
        return `__MENTION_PLACEHOLDER_${placeholders.length - 1}__`;
      },
    );

    const textMentionRegex =
      /(^|[\s>])@([vV]\d+)(?:\s*-\s*([^\s@<]+(?:\s+[^\s@<]+){0,4}))?(?=$|\s|[.,!?;:])/g;

    mensagemProcessada = mensagemProcessada.replace(
      textMentionRegex,
      (_, prefix: string, versaoRaw: string, descricaoRaw?: string) => {
        const versao = versaoRaw.toUpperCase();
        const descricao = (descricaoRaw || '').trim();

        if (!versoesMencionadas.includes(versao)) {
          versoesMencionadas.push(versao);
        }

        const label = descricao ? `${versao} - ${descricao}` : versao;
        const badgeText = `@${label}`;

        return `${prefix}<span class="mention" data-type="mention" data-label="${escapeAttribute(
          label,
        )}" data-mention-label="${escapeAttribute(label)}">${badgeText}</span>`;
      },
    );

    mensagemProcessada = mensagemProcessada.replace(
      /__MENTION_PLACEHOLDER_(\d+)__/g,
      (_, index) => placeholders[Number(index)],
    );

    return {
      mensagemProcessada,
      versoesMencionadas,
    };
  }

  /**
   * Criar nova mensagem
   */
  async criarMensagem(data: CreateMensagemDto & { usuario_id?: string | null; loja_id: string }) {
    try {
      // Verificar se a OS existe e pertence ├á loja
      const os = await this.prisma.ordemServico.findFirst({
        where: {
          id: data.os_id,
          loja_id: data.loja_id,
        },
        include: {
          cliente: true,
        },
      });

      if (!os) {
        throw new Error('OS n├úo encontrada ou n├úo pertence ├á loja');
      }

      // Buscar dados do usu├írio se for mensagem da equipe
      let autorNome = data.autor_nome;
      let autorEmail = data.autor_email;

      if (data.autor_tipo === AutorTipo.EQUIPE && data.usuario_id) {
        const usuario = await this.prisma.usuario.findUnique({
          where: { id: data.usuario_id },
          select: { nome: true, email: true },
        });

        if (usuario) {
          autorNome = usuario.nome;
          autorEmail = usuario.email;
        } else {
          this.logger.warn(`Usu├írio n├úo encontrado: ${data.usuario_id}`);
        }
      } else if (data.autor_tipo === AutorTipo.CLIENTE) {
        // Para mensagens do cliente, usar dados da OS
        autorNome = os.cliente.nome;
        autorEmail = os.cliente.email;
      }

      // Se ainda n├úo tiver nome, usar um padr├úo
      if (!autorNome) {
        autorNome = data.autor_tipo === AutorTipo.EQUIPE ? 'Equipe' : 'Cliente';
        this.logger.warn(`Autor sem nome, usando padr├úo: ${autorNome}`);
      }

      // Processar men├º├Áes na mensagem
      const { mensagemProcessada, versoesMencionadas } = this.processarMencoes(data.mensagem);

      // Criar mensagem
      const mensagem = await this.prisma.arteMensagem.create({
        data: {
          os_id: data.os_id,
          produto_id: data.produto_id,
          versao_id: data.versao_id,
          mensagem: mensagemProcessada, // Usar mensagem com men├º├Áes processadas
          autor_tipo: data.autor_tipo,
          autor_nome: autorNome,
          autor_email: autorEmail || '',
          lida: data.lida || false,
          loja_id: data.loja_id,
        },
        include: {
          os: {
            include: {
              cliente: true,
            },
          },
        },
      });

      this.logger.log(`Mensagem criada: ${mensagem.id} para OS ${data.os_id}`);

      // Emitir evento WebSocket em tempo real
      if (data.versao_id && this.websocketGateway) {
        await this.websocketGateway.emitirNovaMensagem(data.versao_id, {
          id: mensagem.id,
          os_id: mensagem.os_id,
          produto_id: mensagem.produto_id,
          versao_id: mensagem.versao_id,
          mensagem: mensagem.mensagem,
          autor_tipo: mensagem.autor_tipo,
          autor_nome: mensagem.autor_nome,
          autor_email: mensagem.autor_email,
          created_at: mensagem.created_at,
          lida: mensagem.lida,
          loja_id: mensagem.loja_id,
          versoesMencionadas, // Incluir dados das men├º├Áes
          mensagemOriginal: data.mensagem, // Manter mensagem original para refer├¬ncia
        });
      }

      // Enviar notifica├º├Áes
      await this.enviarNotificacoesMensagem(mensagem, data.autor_tipo as AutorTipo);

      return mensagem;
    } catch (error) {
      this.logger.error('Erro ao criar mensagem:', error);
      throw error;
    }
  }

  /**
   * Listar mensagens de um produto
   */
  async listarMensagensProduto(osId: string, produtoId: string, lojaId: string) {
    return this.prisma.arteMensagem.findMany({
      where: {
        os_id: osId,
        produto_id: produtoId,
        loja_id: lojaId,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  /**
   * Listar mensagens de uma vers├úo espec├¡fica
   */
  async listarMensagensVersao(versaoId: string, lojaId: string) {
    // Log removido para reduzir spam no console
    
    const mensagens = await this.prisma.arteMensagem.findMany({
      where: {
        versao_id: versaoId,
        loja_id: lojaId,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
    
    // Log removido para reduzir spam no console
    return mensagens;
  }

  /**
   * Listar mensagens de uma OS (todos os produtos)
   */
  async listarMensagensOS(osId: string, lojaId: string) {
    return this.prisma.arteMensagem.findMany({
      where: {
        os_id: osId,
        loja_id: lojaId,
      },
      orderBy: [
        { produto_id: 'asc' },
        { created_at: 'asc' },
      ],
    });
  }

  /**
   * Atualizar mensagem
   */
  async atualizarMensagem(id: string, dto: UpdateMensagemDto, usuarioId: string, lojaId: string) {
    // Verificar se a mensagem existe e pertence ao usu├írio/loja
    const mensagemExistente = await this.prisma.arteMensagem.findFirst({
      where: {
        id,
        loja_id: lojaId,
      },
    });

    if (!mensagemExistente) {
      throw new Error('Mensagem n├úo encontrada');
    }

    // Verificar se o usu├írio pode editar (apenas mensagens da equipe)
    if (mensagemExistente.autor_tipo === AutorTipo.CLIENTE) {
      throw new Error('N├úo ├® poss├¡vel editar mensagens do cliente');
    }

    return this.prisma.arteMensagem.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Deletar mensagem
   */
  async deletarMensagem(id: string, usuarioId: string, lojaId: string) {
    // Verificar se a mensagem existe e pertence ao usu├írio/loja
    const mensagemExistente = await this.prisma.arteMensagem.findFirst({
      where: {
        id,
        loja_id: lojaId,
      },
    });

    if (!mensagemExistente) {
      throw new Error('Mensagem n├úo encontrada');
    }

    // Verificar se o usu├írio pode deletar (apenas mensagens da equipe)
    if (mensagemExistente.autor_tipo === AutorTipo.CLIENTE) {
      throw new Error('N├úo ├® poss├¡vel deletar mensagens do cliente');
    }

    return this.prisma.arteMensagem.delete({
      where: { id },
    });
  }

  /**
   * Marcar mensagens como lidas
   */
  async marcarMensagensLidas(mensagemIds: string[], usuarioId: string, lojaId: string) {
    return this.prisma.arteMensagem.updateMany({
      where: {
        id: { in: mensagemIds },
        loja_id: lojaId,
      },
      data: {
        lida: true,
      },
    });
  }

  /**
   * Marcar todas as mensagens de um produto/vers├úo como lidas
   */
  async marcarMensagensLidasPorProduto(osId: string, produtoId: string, versaoId: string | null, lojaId: string) {
    this.logger.log(`🔄 [marcarMensagensLidasPorProduto] Marcando mensagens como lidas para OS: ${osId}, Produto: ${produtoId}, Versão: ${versaoId}`);
    
    const whereClause: any = {
      os_id: osId,
      produto_id: produtoId,
      loja_id: lojaId,
      lida: false, // Apenas mensagens n├úo lidas
      autor_tipo: 'CLIENTE', // Apenas mensagens do cliente
    };

    if (versaoId) {
      whereClause.versao_id = versaoId;
    }

    const result = await this.prisma.arteMensagem.updateMany({
      where: whereClause,
      data: {
        lida: true,
        data_leitura: new Date(),
      },
    });

    this.logger.log(`✅ [marcarMensagensLidasPorProduto] ${result.count} mensagens marcadas como lidas`);
    
    return result;
  }

  /**
   * Contar mensagens n├úo lidas por vers├úo (apenas do cliente)
   */
  async contarMensagensNaoLidas(osId: string, lojaId: string) {
    try {
      this.logger.log(`🔄 [contarMensagensNaoLidas] Buscando mensagens não lidas para OS: ${osId}, Loja: ${lojaId}`);
      
      const mensagensNaoLidas = await this.prisma.arteMensagem.groupBy({
        by: ['versao_id'],
        where: {
          os_id: osId,
          loja_id: lojaId,
          lida: false,
          autor_tipo: AutorTipo.CLIENTE, // Apenas mensagens n├úo lidas do cliente
          versao_id: { not: null }, // Apenas mensagens com vers├úo
        },
        _count: {
          id: true,
        },
      });
      
      this.logger.log(`📊 [contarMensagensNaoLidas] Mensagens não lidas encontradas:`, mensagensNaoLidas);

      // Buscar dados das vers├Áes
      const versaoIds = mensagensNaoLidas.map(m => m.versao_id).filter(Boolean);
      const versoes = await this.prisma.arteVersao.findMany({
        where: {
          id: { in: versaoIds },
          loja_id: lojaId,
        },
        select: {
          id: true,
          versao: true,
          servico_id: true,
          descricao: true,
        },
      });

      const resultado = mensagensNaoLidas.map(mensagem => {
        const versao = versoes.find(v => v.id === mensagem.versao_id);
        return {
          produto_id: mensagem.versao_id, // Usar versao_id como produto_id para compatibilidade
          produto_nome: versao?.descricao || `Vers├úo ${versao?.versao || 'N/A'}`,
          mensagens_nao_lidas: mensagem._count.id,
        };
      });
      
      this.logger.log(`✅ [contarMensagensNaoLidas] Resultado final:`, resultado);
      return resultado;
    } catch (error) {
      this.logger.error('ÔØî Erro ao contar mensagens n├úo lidas:', error);
      throw error;
    }
  }

  /**
   * Buscar ├║ltimas mensagens por produto
   */
  async buscarUltimasMensagensPorProduto(osId: string, lojaId: string) {
    // Buscar todas as mensagens da OS
    const mensagens = await this.prisma.arteMensagem.findMany({
      where: {
        os_id: osId,
        loja_id: lojaId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Agrupar por produto e pegar a ├║ltima mensagem de cada
    const mensagensPorProduto = new Map();
    
    for (const mensagem of mensagens) {
      if (!mensagensPorProduto.has(mensagem.produto_id)) {
        mensagensPorProduto.set(mensagem.produto_id, mensagem);
      }
    }

    // Ô£à USAR EXATAMENTE A MESMA L├ôGICA DO useOSProdutos
    // Buscar produtos usando a API status-produtos (que funciona perfeitamente)
    const os = await this.prisma.ordemServico.findFirst({
      where: {
        id: osId,
        loja_id: lojaId
      },
      include: {
        itens: true,
        orcamento: {
          include: {
            produtos: true
          }
        }
      }
    });

    if (!os) {
      throw new NotFoundException('OS n├úo encontrada');
    }

    // Combinar produtos: ItemOS migrados + produtos do or├ºamento n├úo migrados
    let produtos = [];

    // 1. Buscar produtos j├í migrados para ItemOS
    if (os.itens && os.itens.length > 0) {
      const produtosItemOS = os.itens.map(item => ({
        item_id: item.id,
        produto_id: item.id, // Para ItemOS, usar o mesmo ID
        produto_servico: item.produto_servico,
        data_inicio_producao: item.data_inicio_producao,
        data_prazo_produto: item.data_prazo_produto,
        status_liberacao_pcp: item.status_liberacao_pcp || 'PENDENTE',
        prioridade_produto: item.prioridade_produto || 'NORMAL',
        dias_restantes: null,
        is_retroativo: false,
        mensagem: 'Prazo n├úo definido',
        excede_prazo_final: false
      }));
      produtos.push(...produtosItemOS);
    }

    // 2. Buscar produtos do or├ºamento que ainda n├úo foram migrados
    if (os.orcamento?.produtos && os.orcamento.produtos.length > 0) {
      const produtosOrcamento = os.orcamento.produtos
        .filter(produto => !os.itens.some(item => item.produto_servico === produto.nome_servico))
        .map(produto => ({
          item_id: produto.id,
          produto_id: produto.id,
          produto_servico: produto.nome_servico || produto.nome || 'Produto',
          data_inicio_producao: null,
          data_prazo_produto: null,
          status_liberacao_pcp: 'PENDENTE',
          prioridade_produto: 'NORMAL',
          dias_restantes: null,
          is_retroativo: false,
          mensagem: 'Prazo n├úo definido',
          excede_prazo_final: false
        }));
      produtos.push(...produtosOrcamento);
    }

    console.log('­ƒöì [buscarUltimasMensagensPorProduto] Produtos da API status-produtos:', produtos);

    // Formatar resposta
    const resultado = Array.from(mensagensPorProduto.values()).map(mensagem => {
      // Buscar o produto pelo ID da mensagem
      let produto = produtos.find(p => p.item_id === mensagem.produto_id || p.produto_id === mensagem.produto_id);
      
      // Ô£à FALLBACK: Se n├úo encontrou o produto espec├¡fico e h├í apenas um produto na OS, usar esse
      if (!produto && produtos.length === 1) {
        produto = produtos[0];
        console.log('­ƒöì [buscarUltimasMensagensPorProduto] Usando produto ├║nico da OS como fallback:', produto);
      }
      
      console.log('­ƒöì [buscarUltimasMensagensPorProduto] Processando mensagem:', {
        mensagem_id: mensagem.id,
        produto_id: mensagem.produto_id,
        produto_encontrado: produto,
        produto_nome_final: produto?.produto_servico || 'Produto n├úo encontrado',
        produtos_disponiveis: produtos.length
      });
      
      return {
        id: mensagem.id,
        produto_id: produto?.item_id || produto?.produto_id || mensagem.produto_id, // Ô£à RETORNAR ID CORRETO DO PRODUTO
        produto_nome: produto?.produto_servico || 'Produto n├úo encontrado', // Ô£à USAR produto_servico
        autor_nome: mensagem.autor_nome,
        autor_tipo: mensagem.autor_tipo,
        mensagem: mensagem.mensagem,
        created_at: mensagem.created_at,
        versao_id: mensagem.versao_id,
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    console.log('­ƒöì [buscarUltimasMensagensPorProduto] Resultado final:', resultado);
    return resultado;
  }

  /**
   * Enviar notifica├º├Áes para nova mensagem
   */
  private async enviarNotificacoesMensagem(mensagem: any, autorTipo: AutorTipo) {
    try {
      if (autorTipo === AutorTipo.EQUIPE) {
        // Notificar cliente por email
        await this.notificacaoService.notificarNovaMensagemCliente({
          tipo: 'NOVA_MENSAGEM_CLIENTE',
          os_id: mensagem.os_id,
          versao_id: mensagem.versao_id,
          destinatarios: [mensagem.os.cliente.email],
          dados: {
            produto_id: mensagem.produto_id,
            mensagem: mensagem.mensagem,
            autor_nome: mensagem.autor_nome,
            os_numero: mensagem.os.numero,
          },
        });

        // Criar notifica├º├úo no sistema para o cliente
        await this.criarNotificacaoSistema({
          tipo: 'NOVA_MENSAGEM_CLIENTE',
          os_id: mensagem.os_id,
          produto_id: mensagem.produto_id,
          titulo: `Nova mensagem - OS #${mensagem.os.numero}`,
          mensagem: `${mensagem.autor_nome} enviou uma nova mensagem sobre o produto.`,
          destinatario_email: mensagem.os.cliente.email,
          loja_id: mensagem.loja_id,
          dados_extras: {
            produto_id: mensagem.produto_id,
            versao_id: mensagem.versao_id,
          },
        });
      } else if (autorTipo === AutorTipo.CLIENTE) {
        // Notificar equipe por email
        await this.notificacaoService.notificarNovaMensagemEquipe({
          tipo: 'NOVA_MENSAGEM_EQUIPE',
          os_id: mensagem.os_id,
          versao_id: mensagem.versao_id,
          destinatarios: [mensagem.autor_email],
          dados: {
            produto_id: mensagem.produto_id,
            mensagem: mensagem.mensagem,
            cliente_nome: mensagem.os.cliente.nome,
            os_numero: mensagem.os.numero,
          },
        });

        // Criar notifica├º├úo global para a equipe
        await this.notificacoesGlobalService.notificarNovaMensagemArte(
          mensagem.os_id,
          mensagem.loja_id,
          mensagem.os.cliente.nome,
          'Produto', // TODO: Buscar nome do produto espec├¡fico
          mensagem.versao_id,
        );
      }
    } catch (error) {
      this.logger.error('Erro ao enviar notifica├º├Áes de mensagem:', error);
      // N├úo falhar a opera├º├úo principal por causa das notifica├º├Áes
    }
  }

  /**
   * Criar notifica├º├úo no sistema
   */
  private async criarNotificacaoSistema(data: {
    tipo: string;
    os_id: string;
    produto_id: string;
    titulo: string;
    mensagem: string;
    destinatario_email?: string;
    dados_extras?: any;
    loja_id: string;
  }) {
    try {
      await this.prisma.notificacao.create({
        data: {
          tipo: data.tipo,
          titulo: data.titulo,
          mensagem: data.mensagem,
          orcamento_id: null,
          loja_id: data.loja_id,
          visualizada: false,
          dados_extras: JSON.stringify({
            os_id: data.os_id,
            produto_id: data.produto_id,
            ...data.dados_extras,
          }),
        },
      });

      this.logger.log(`Notifica├º├úo criada: ${data.tipo} para OS ${data.os_id}`);
    } catch (error) {
      this.logger.error('Erro ao criar notifica├º├úo no sistema:', error);
    }
  }
}
