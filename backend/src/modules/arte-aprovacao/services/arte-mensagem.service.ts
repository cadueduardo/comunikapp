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
   * Processar menções na mensagem
   */
  processarMencoes(mensagem: string): { 
    mensagemProcessada: string; 
    versoesMencionadas: string[] 
  } {
    // Regex para capturar menções de versões (@V1, @v1, @V2, etc.)
    const regex = /@[vV](\d+)/g;
    const versoesMencionadas: string[] = [];
    let mensagemProcessada = mensagem;
    
    let match;
    while ((match = regex.exec(mensagem)) !== null) {
      const versaoNumero = match[1];
      const versaoCompleta = `V${versaoNumero}`;
      
      if (!versoesMencionadas.includes(versaoCompleta)) {
        versoesMencionadas.push(versaoCompleta);
      }
      
      // Substituir a menção por um link formatado
      mensagemProcessada = mensagemProcessada.replace(
        match[0], 
        `<span class="mention" data-versao="${versaoCompleta}">@${versaoCompleta}</span>`
      );
    }
    
    this.logger.log(`Menções processadas: ${versoesMencionadas.join(', ')}`);
    
    return {
      mensagemProcessada,
      versoesMencionadas
    };
  }

  /**
   * Criar nova mensagem
   */
  async criarMensagem(data: CreateMensagemDto & { usuario_id?: string | null; loja_id: string }) {
    try {
      // Verificar se a OS existe e pertence à loja
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
        throw new Error('OS não encontrada ou não pertence à loja');
      }

      // Buscar dados do usuário se for mensagem da equipe
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
          this.logger.warn(`Usuário não encontrado: ${data.usuario_id}`);
        }
      } else if (data.autor_tipo === AutorTipo.CLIENTE) {
        // Para mensagens do cliente, usar dados da OS
        autorNome = os.cliente.nome;
        autorEmail = os.cliente.email;
      }

      // Se ainda não tiver nome, usar um padrão
      if (!autorNome) {
        autorNome = data.autor_tipo === AutorTipo.EQUIPE ? 'Equipe' : 'Cliente';
        this.logger.warn(`Autor sem nome, usando padrão: ${autorNome}`);
      }

      // Processar menções na mensagem
      const { mensagemProcessada, versoesMencionadas } = this.processarMencoes(data.mensagem);

      // Criar mensagem
      const mensagem = await this.prisma.arteMensagem.create({
        data: {
          os_id: data.os_id,
          produto_id: data.produto_id,
          versao_id: data.versao_id,
          mensagem: mensagemProcessada, // Usar mensagem com menções processadas
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
          versoesMencionadas, // Incluir dados das menções
          mensagemOriginal: data.mensagem, // Manter mensagem original para referência
        });
      }

      // Enviar notificações
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
   * Listar mensagens de uma versão específica
   */
  async listarMensagensVersao(versaoId: string, lojaId: string) {
    this.logger.log(`🔍 Listando mensagens para versão: ${versaoId}, loja: ${lojaId}`);
    
    const mensagens = await this.prisma.arteMensagem.findMany({
      where: {
        versao_id: versaoId,
        loja_id: lojaId,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
    
    this.logger.log(`📊 Encontradas ${mensagens.length} mensagens para versão ${versaoId}`);
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
    // Verificar se a mensagem existe e pertence ao usuário/loja
    const mensagemExistente = await this.prisma.arteMensagem.findFirst({
      where: {
        id,
        loja_id: lojaId,
      },
    });

    if (!mensagemExistente) {
      throw new Error('Mensagem não encontrada');
    }

    // Verificar se o usuário pode editar (apenas mensagens da equipe)
    if (mensagemExistente.autor_tipo === AutorTipo.CLIENTE) {
      throw new Error('Não é possível editar mensagens do cliente');
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
    // Verificar se a mensagem existe e pertence ao usuário/loja
    const mensagemExistente = await this.prisma.arteMensagem.findFirst({
      where: {
        id,
        loja_id: lojaId,
      },
    });

    if (!mensagemExistente) {
      throw new Error('Mensagem não encontrada');
    }

    // Verificar se o usuário pode deletar (apenas mensagens da equipe)
    if (mensagemExistente.autor_tipo === AutorTipo.CLIENTE) {
      throw new Error('Não é possível deletar mensagens do cliente');
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
   * Contar mensagens não lidas por produto (apenas do cliente)
   */
  async contarMensagensNaoLidas(osId: string, lojaId: string) {
    try {
      this.logger.log(`🔍 Contando mensagens não lidas - OS: ${osId}, Loja: ${lojaId}`);
      
      const mensagensNaoLidas = await this.prisma.arteMensagem.groupBy({
        by: ['produto_id'],
        where: {
          os_id: osId,
          loja_id: lojaId,
          lida: false,
          autor_tipo: AutorTipo.CLIENTE, // Apenas mensagens não lidas do cliente
        },
        _count: {
          id: true,
        },
      });
      
      this.logger.log(`✅ Mensagens agrupadas: ${mensagensNaoLidas.length} produtos com mensagens`);

    // Buscar nomes dos produtos através do relacionamento com orcamento
    const produtoIds = mensagensNaoLidas.map(m => m.produto_id);
    const produtos = await this.prisma.produtoOrcamento.findMany({
      where: {
        id: { in: produtoIds },
        orcamento: {
          loja_id: lojaId,
        },
      },
      select: {
        id: true,
        nome: true,
        nome_servico: true
      },
    });

      const resultado = mensagensNaoLidas.map(mensagem => {
        const produto = produtos.find(p => p.id === mensagem.produto_id);
        return {
          produto_id: mensagem.produto_id,
          produto_nome: produto?.nome || 'Produto não encontrado',
          mensagens_nao_lidas: mensagem._count.id,
        };
      });
      
      this.logger.log(`✅ Resultado final: ${resultado.length} produtos com mensagens não lidas`);
      return resultado;
    } catch (error) {
      this.logger.error('❌ Erro ao contar mensagens não lidas:', error);
      throw error;
    }
  }

  /**
   * Buscar últimas mensagens por produto
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

    // Agrupar por produto e pegar a última mensagem de cada
    const mensagensPorProduto = new Map();
    
    for (const mensagem of mensagens) {
      if (!mensagensPorProduto.has(mensagem.produto_id)) {
        mensagensPorProduto.set(mensagem.produto_id, mensagem);
      }
    }

    // ✅ USAR EXATAMENTE A MESMA LÓGICA DO useOSProdutos
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
      throw new NotFoundException('OS não encontrada');
    }

    // Combinar produtos: ItemOS migrados + produtos do orçamento não migrados
    let produtos = [];

    // 1. Buscar produtos já migrados para ItemOS
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
        mensagem: 'Prazo não definido',
        excede_prazo_final: false
      }));
      produtos.push(...produtosItemOS);
    }

    // 2. Buscar produtos do orçamento que ainda não foram migrados
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
          mensagem: 'Prazo não definido',
          excede_prazo_final: false
        }));
      produtos.push(...produtosOrcamento);
    }

    console.log('🔍 [buscarUltimasMensagensPorProduto] Produtos da API status-produtos:', produtos);

    // Formatar resposta
    const resultado = Array.from(mensagensPorProduto.values()).map(mensagem => {
      // Buscar o produto pelo ID da mensagem
      let produto = produtos.find(p => p.item_id === mensagem.produto_id || p.produto_id === mensagem.produto_id);
      
      // ✅ FALLBACK: Se não encontrou o produto específico e há apenas um produto na OS, usar esse
      if (!produto && produtos.length === 1) {
        produto = produtos[0];
        console.log('🔍 [buscarUltimasMensagensPorProduto] Usando produto único da OS como fallback:', produto);
      }
      
      console.log('🔍 [buscarUltimasMensagensPorProduto] Processando mensagem:', {
        mensagem_id: mensagem.id,
        produto_id: mensagem.produto_id,
        produto_encontrado: produto,
        produto_nome_final: produto?.produto_servico || 'Produto não encontrado',
        produtos_disponiveis: produtos.length
      });
      
      return {
        id: mensagem.id,
        produto_id: produto?.item_id || produto?.produto_id || mensagem.produto_id, // ✅ RETORNAR ID CORRETO DO PRODUTO
        produto_nome: produto?.produto_servico || 'Produto não encontrado', // ✅ USAR produto_servico
        autor_nome: mensagem.autor_nome,
        autor_tipo: mensagem.autor_tipo,
        mensagem: mensagem.mensagem,
        created_at: mensagem.created_at,
        versao_id: mensagem.versao_id,
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    console.log('🔍 [buscarUltimasMensagensPorProduto] Resultado final:', resultado);
    return resultado;
  }

  /**
   * Enviar notificações para nova mensagem
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

        // Criar notificação no sistema para o cliente
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

        // Criar notificação global para a equipe
        await this.notificacoesGlobalService.notificarNovaMensagemArte(
          mensagem.os_id,
          mensagem.loja_id,
          mensagem.os.cliente.nome,
          'Produto', // TODO: Buscar nome do produto específico
          mensagem.versao_id,
        );
      }
    } catch (error) {
      this.logger.error('Erro ao enviar notificações de mensagem:', error);
      // Não falhar a operação principal por causa das notificações
    }
  }

  /**
   * Criar notificação no sistema
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

      this.logger.log(`Notificação criada: ${data.tipo} para OS ${data.os_id}`);
    } catch (error) {
      this.logger.error('Erro ao criar notificação no sistema:', error);
    }
  }
}
