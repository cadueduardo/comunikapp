/**
 * Service para gerenciamento de prazo de produtos da OS
 * Implementa regras de negócio para prazos individuais por produto
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PcpBloqueioSinalService } from '../../instalacao/services/pcp-bloqueio-sinal.service';
import { StatusLiberacaoPcp } from '../../instalacao/constants/pcp-liberacao.constants';
import {
  DefinirPrazoProdutoDTO,
  StatusPrazoProdutoResponse,
  ValidarPrazoProdutoResponse,
} from '../dto/os-produto-prazo.dto';
import {
  computeArteResumoGrid,
  computeLiberacaoResumoGrid,
  computeStatusOSLiberacao,
  getMotivosBloqueioPcp,
  isElegivelPcp,
  labelStatusArte,
  produtoRequerArte,
} from '../utils/os-liberacao-pcp.util';

interface DefinirPrazoProdutoRequest {
  itemId: string;
  osId: string;
  lojaId: string;
  usuarioId: string;
  dataPrazo: Date;
  dataInicio?: Date;
  prioridade?: string;
  ordemProducao?: number;
  motivo?: string;
  ipOrigem?: string;
  userAgent?: string;
  confirmarRetroativa?: boolean;
}

@Injectable()
export class OSProdutoPrazoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pcpBloqueioSinalService: PcpBloqueioSinalService,
  ) {}

  /**
   * Define ou atualiza o prazo de um produto específico
   */
  async definirPrazoProduto(request: DefinirPrazoProdutoRequest) {
    const {
      itemId,
      osId,
      lojaId,
      usuarioId,
      dataPrazo,
      dataInicio,
      prioridade,
      ordemProducao,
      motivo,
      ipOrigem,
      userAgent,
      confirmarRetroativa = false,
    } = request;

    // 1. Verificar se o item existe e pertence à OS/loja
    console.log('🔍 Buscando item:', { itemId, osId, lojaId });

    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemId,
        os: {
          id: osId,
          loja_id: lojaId,
        },
      },
      include: {
        os: {
          select: {
            id: true,
            numero: true,
            data_prazo: true,
            status: true,
            orcamento_id: true,
            aprovacao_tecnica_status: true,
          },
        },
      },
    });

    console.log('📦 Item encontrado:', item ? 'SIM' : 'NÃO');

    if (!item) {
      // Verificar se é um produto do orçamento e migrar para ItemOS
      console.log('🔍 Tentando buscar como produto de orçamento...');

      const os = await this.prisma.ordemServico.findFirst({
        where: {
          id: osId,
          loja_id: lojaId,
        },
        include: {
          orcamento: {
            include: {
              produtos: {
                where: {
                  id: itemId,
                },
              },
            },
          },
        },
      });

      console.log('📋 OS encontrada:', os ? 'SIM' : 'NÃO');
      console.log(
        '🛒 Produto do orçamento:',
        os?.orcamento?.produtos?.length || 0,
      );

      if (os?.orcamento?.produtos?.length > 0) {
        // Migrar produto do orçamento para ItemOS
        const produtoOrcamento = os.orcamento.produtos[0];
        console.log('🔄 Migrando produto do orçamento para ItemOS...');

        // Verificar se já existe um ItemOS com ID diferente (conflito de tabelas)
        const itemExistente = await this.prisma.itemOS.findUnique({
          where: { id: produtoOrcamento.id },
        });

        if (itemExistente) {
          console.log(
            '⚠️  ItemOS já existe (tabelas diferentes). Buscando novamente...',
          );
          // Se já existe, deve ter sido encontrado na primeira busca. Algo está errado.
          throw new NotFoundException(
            'Inconsistência detectada: ItemOS existe mas não foi encontrado na busca inicial',
          );
        }

        // Montar parametros técnicos a partir dos campos do produto
        const parametrosTecnicos = {
          largura: produtoOrcamento.largura?.toString(),
          altura: produtoOrcamento.altura?.toString(),
          profundidade: produtoOrcamento.profundidade?.toString(),
          area: produtoOrcamento.area_produto?.toString(),
          perimetro: produtoOrcamento.perimetro_produto?.toString(),
          unidade_medida: produtoOrcamento.unidade_medida,
          unidade_geometria: produtoOrcamento.unidade_geometria,
          geometria_origem: produtoOrcamento.geometria_origem,
          arquivo_geometria_url: produtoOrcamento.arquivo_geometria_url,
          categoria: produtoOrcamento.categoria,
          observacoes: produtoOrcamento.observacoes,
        };

        try {
          const statusInicial =
            await this.pcpBloqueioSinalService.resolverStatusInicialItem(
              lojaId,
              os.orcamento_id,
            );

          const novoItem = await this.prisma.itemOS.create({
            data: {
              id: produtoOrcamento.id, // Manter o mesmo ID do ProdutoOrcamento
              os_id: osId,
              produto_servico:
                produtoOrcamento.nome ||
                produtoOrcamento.nome_servico ||
                'Produto sem nome',
              quantidade: produtoOrcamento.quantidade,
              parametros_tecnicos: JSON.stringify(parametrosTecnicos),
              insumos_necessarios: null, // Será calculado posteriormente se necessário
              observacoes: produtoOrcamento.descricao,
              materiais_disponivel: false,
              largura: produtoOrcamento.largura,
              altura: produtoOrcamento.altura,
              area: produtoOrcamento.area_produto,
              perimetro: produtoOrcamento.perimetro_produto,
              unidade_medida: produtoOrcamento.unidade_medida,
              unidade_geometria: produtoOrcamento.unidade_geometria,
              geometria_origem: produtoOrcamento.geometria_origem,
              arquivo_geometria_url: produtoOrcamento.arquivo_geometria_url,
              arquivo_geometria_metadados:
                produtoOrcamento.arquivo_geometria_metadados,
              // Inicializar campos de prazo
              data_inicio_producao: null,
              data_prazo_produto: null,
              status_liberacao_pcp: statusInicial,
              prioridade_produto: 'NORMAL',
              ordem_producao: null,
            },
          });

          console.log('✅ ItemOS criado com sucesso:', novoItem.id);

          // Reprocessar com o novo itemId
          const novaRequest = { ...request, itemId: novoItem.id };
          return await this.definirPrazoProduto(novaRequest);
        } catch (error) {
          console.error('❌ Erro ao criar ItemOS:', error);
          throw new BadRequestException(
            'Erro ao migrar produto do orçamento para ItemOS: ' + error.message,
          );
        }
      }

      throw new NotFoundException(
        'Produto não encontrado ou não pertence à OS',
      );
    }

    // 2. Validar se prazo do produto <= prazo final da OS
    if (item.os.data_prazo) {
      const prazoFinal = new Date(item.os.data_prazo);
      prazoFinal.setHours(0, 0, 0, 0);

      const prazoProduto = new Date(dataPrazo);
      prazoProduto.setHours(0, 0, 0, 0);

      if (prazoProduto > prazoFinal) {
        throw new BadRequestException(
          'O prazo do produto não pode ser maior que o prazo final da OS. ' +
            `Prazo final da OS: ${prazoFinal.toLocaleDateString('pt-BR')}`,
        );
      }
    }

    // 3. Validar data
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataComparacao = new Date(dataPrazo);
    dataComparacao.setHours(0, 0, 0, 0);

    const isRetroativa = dataComparacao < hoje;

    // 4. Verificar se é data retroativa e se precisa de confirmação
    if (isRetroativa && !confirmarRetroativa) {
      const diasAtras = Math.ceil(
        (hoje.getTime() - dataComparacao.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        requires_confirmation: true,
        is_retroativa: true,
        dias_atras: diasAtras,
        message: `A data informada é ${diasAtras} dia(s) anterior à data atual. Deseja continuar?`,
        data_original: dataPrazo,
        data_atual: hoje,
      };
    }

    // 5. Atualizar o produto
    //    Auto-liberação: se a OS já foi aprovada tecnicamente e o item ainda
    //    está PENDENTE, definir prazo libera automaticamente para o PCP.
    //    Decisão tomada em 2026-05-25: alterar prazo de um produto de OS já
    //    aprovada deve refletir no PCP imediatamente (antes o usuário tinha
    //    que clicar em "Liberar para PCP" depois, o que confundia).
    const aprovacaoStatus = (
      item.os.aprovacao_tecnica_status || ''
    ).toUpperCase();
    const itemPendente =
      (item.status_liberacao_pcp || 'PENDENTE').toUpperCase() ===
      StatusLiberacaoPcp.PENDENTE;
    const bloqueadoPorSinal =
      (item.status_liberacao_pcp || '').toUpperCase() ===
      StatusLiberacaoPcp.BLOQUEADO_AGUARDANDO_SINAL;
    const deveAutoLiberar =
      aprovacaoStatus === 'APROVADA' && itemPendente && !bloqueadoPorSinal;

    const itemAtualizado = await this.prisma.itemOS.update({
      where: { id: itemId },
      data: {
        data_prazo_produto: dataPrazo,
        data_inicio_producao: dataInicio,
        prioridade_produto: prioridade || 'NORMAL',
        ordem_producao: ordemProducao,
        ...(deveAutoLiberar
          ? {
              status_liberacao_pcp: 'LIBERADO',
              liberado_pcp_por: usuarioId,
              liberado_pcp_em: new Date(),
            }
          : {}),
      },
    });

    // 6. Se for data retroativa, criar log de auditoria
    if (isRetroativa) {
      await this.criarLogPrazoRetroativo({
        os_id: osId,
        item_id: itemId,
        usuario_id: usuarioId,
        data_definida: dataPrazo.toISOString(),
        data_atual: hoje.toISOString(),
        motivo: motivo,
        ip_origem: ipOrigem,
        user_agent: userAgent,
      });
    }

    // 7. Calcular dias restantes
    const diasRestantes = Math.ceil(
      (dataComparacao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      success: true,
      item_id: itemId,
      produto_servico: item.produto_servico,
      data_prazo_produto: dataPrazo,
      data_inicio_producao: dataInicio,
      prioridade_produto: prioridade || 'NORMAL',
      dias_restantes: diasRestantes > 0 ? diasRestantes : 0,
      is_retroativo: isRetroativa,
      // Sinaliza ao caller (frontend) que o produto foi auto-liberado para
      // PCP nesta operação.
      liberado_para_pcp: deveAutoLiberar,
      mensagem: isRetroativa
        ? 'Prazo retroativo definido com sucesso'
        : `Prazo definido: ${diasRestantes} dias restantes`,
    };
  }

  /**
   * Consulta o status do prazo de um produto
   */
  async consultarStatusPrazoProduto(
    itemId: string,
    osId: string,
    lojaId: string,
  ): Promise<StatusPrazoProdutoResponse> {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemId,
        os: {
          id: osId,
          loja_id: lojaId,
        },
      },
      include: {
        os: {
          select: {
            data_prazo: true,
          },
        },
        designer_atribuido: {
          select: { id: true, nome_completo: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        'Produto não encontrado ou não pertence à OS',
      );
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let diasRestantes: number | undefined;
    let isRetroativo = false;
    let excedePrazoFinal = false;
    let mensagem = 'Prazo não definido';

    if (item.data_prazo_produto) {
      const prazoProduto = new Date(item.data_prazo_produto);
      prazoProduto.setHours(0, 0, 0, 0);

      isRetroativo = prazoProduto < hoje;
      diasRestantes = Math.ceil(
        (prazoProduto.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (isRetroativo) {
        mensagem = 'Prazo retroativo';
      } else if (diasRestantes === 0) {
        mensagem = 'Prazo hoje';
      } else {
        mensagem = `${diasRestantes} dia(s) restante(s)`;
      }

      // Verificar se excede prazo final da OS
      if (item.os.data_prazo) {
        const prazoFinal = new Date(item.os.data_prazo);
        prazoFinal.setHours(0, 0, 0, 0);
        excedePrazoFinal = prazoProduto > prazoFinal;
      }
    }

    return {
      item_id: item.id,
      produto_id: item.id, // Para ItemOS migrados, usar o mesmo ID (era original do ProdutoOrcamento)
      produto_servico: item.produto_servico,
      data_inicio_producao: item.data_inicio_producao,
      data_prazo_produto: item.data_prazo_produto,
      status_liberacao_pcp: item.status_liberacao_pcp || 'PENDENTE',
      prioridade_produto: item.prioridade_produto || 'NORMAL',
      dias_restantes: diasRestantes,
      is_retroativo: isRetroativo,
      mensagem,
      excede_prazo_final: excedePrazoFinal,
      responsabilidade_arte: item.responsabilidade_arte,
      status_arte: item.status_arte,
      data_prazo_arte: item.data_prazo_arte,
      designer_atribuido: item.designer_atribuido
        ? {
            id: item.designer_atribuido.id,
            nome: item.designer_atribuido.nome_completo,
          }
        : null,
    };
  }

  /**
   * Valida se o prazo do produto é válido em relação ao prazo final da OS
   */
  async validarPrazoProduto(
    itemId: string,
    osId: string,
    lojaId: string,
    dataPrazo: Date,
  ): Promise<ValidarPrazoProdutoResponse> {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemId,
        os: {
          id: osId,
          loja_id: lojaId,
        },
      },
      include: {
        os: {
          select: {
            data_prazo: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        'Produto não encontrado ou não pertence à OS',
      );
    }

    const avisos: string[] = [];
    const erros: string[] = [];

    // Validar se OS tem prazo final
    if (!item.os.data_prazo) {
      avisos.push('OS não tem prazo final definido');
    }

    // Validar se prazo do produto <= prazo final
    if (item.os.data_prazo) {
      const prazoFinal = new Date(item.os.data_prazo);
      prazoFinal.setHours(0, 0, 0, 0);

      const prazoProduto = new Date(dataPrazo);
      prazoProduto.setHours(0, 0, 0, 0);

      if (prazoProduto > prazoFinal) {
        erros.push(
          `Prazo do produto (${prazoProduto.toLocaleDateString('pt-BR')}) ` +
            `excede o prazo final da OS (${prazoFinal.toLocaleDateString('pt-BR')})`,
        );
      }
    }

    // Validar se prazo está apertado (< 3 dias)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const prazoProduto = new Date(dataPrazo);
    prazoProduto.setHours(0, 0, 0, 0);

    const diasRestantes = Math.ceil(
      (prazoProduto.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diasRestantes < 3 && diasRestantes >= 0) {
      avisos.push(`Prazo apertado: apenas ${diasRestantes} dia(s) restante(s)`);
    }

    if (prazoProduto < hoje) {
      avisos.push(
        'Prazo retroativo: será necessária confirmação e registro em log',
      );
    }

    const valido = erros.length === 0;

    return {
      valido,
      mensagem: valido
        ? 'Prazo do produto está válido'
        : 'Prazo do produto possui erros que impedem a definição',
      avisos: avisos.length > 0 ? avisos : undefined,
      erros: erros.length > 0 ? erros : undefined,
    };
  }

  /**
   * Libera um produto específico para o PCP
   */
  async liberarProdutoPCP(
    itemId: string,
    osId: string,
    lojaId: string,
    usuarioId: string,
    motivo?: string,
  ) {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemId,
        os: {
          id: osId,
          loja_id: lojaId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        'Produto não encontrado ou não pertence à OS',
      );
    }

    const ctx = {
      id: item.id,
      produto_servico: item.produto_servico,
      data_prazo_produto: item.data_prazo_produto,
      status_liberacao_pcp: item.status_liberacao_pcp,
      responsabilidade_arte: item.responsabilidade_arte,
      status_arte: item.status_arte,
      materiais_disponivel: item.materiais_disponivel,
    };

    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: { materiais_disponivel: true },
    });

    const motivos = getMotivosBloqueioPcp(ctx, os?.materiais_disponivel);
    if (motivos.length > 0) {
      throw new BadRequestException(motivos.map((m) => m.mensagem).join('; '));
    }

    // Atualizar status de liberação
    const itemAtualizado = await this.prisma.itemOS.update({
      where: { id: itemId },
      data: {
        status_liberacao_pcp: 'LIBERADO',
        liberado_pcp_por: usuarioId,
        liberado_pcp_em: new Date(),
      },
    });

    // Verificar se é o primeiro produto liberado e atualizar status da OS
    const produtosLiberados = await this.prisma.itemOS.count({
      where: {
        os_id: osId,
        status_liberacao_pcp: 'LIBERADO',
      },
    });

    // Sincronizar status agregado da OS
    const totalItens = await this.prisma.itemOS.count({
      where: { os_id: osId },
    });
    const agregado = computeStatusOSLiberacao(totalItens, produtosLiberados);
    if (agregado === 'PARCIAL') {
      await this.prisma.ordemServico.update({
        where: { id: osId },
        data: { status: 'PARCIALMENTE_LIBERADA' },
      });
    } else if (agregado === 'COMPLETO') {
      await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          status: 'LIBERADA_PARA_PCP',
          aprovacao_tecnica_status: 'APROVADA',
        },
      });
    }

    // Criar log da liberação do produto
    await this.prisma.ordemServicoLog.create({
      data: {
        os_id: osId,
        tipo_acao: 'LIBERACAO_PRODUTO_PCP',
        descricao: `Produto "${item.produto_servico}" liberado para PCP`,
        dados_extras: JSON.stringify({
          item_id: itemId,
          produto_servico: item.produto_servico,
          data_prazo_produto: item.data_prazo_produto,
          motivo: motivo,
          produtos_liberados_total: produtosLiberados,
        }),
        usuario_id: usuarioId,
      },
    });

    return {
      success: true,
      item_id: itemId,
      produto_servico: item.produto_servico,
      status_liberacao_pcp: 'LIBERADO',
      liberado_em: itemAtualizado.liberado_pcp_em,
      produtos_liberados_total: produtosLiberados,
      mensagem: 'Produto liberado para PCP com sucesso',
    };
  }

  /**
   * Consulta status de todos os produtos de uma OS
   */
  async consultarStatusProdutosOS(osId: string, lojaId: string) {
    const os = await this.prisma.ordemServico.findFirst({
      where: {
        id: osId,
        loja_id: lojaId,
      },
      include: {
        itens: true,
        orcamento: {
          include: {
            produtos: true,
          },
        },
      },
    });

    if (!os) {
      throw new NotFoundException(
        'OS não encontrada ou não pertence à sua loja',
      );
    }

    // Combinar produtos: ItemOS migrados + produtos do orçamento não migrados
    let produtos = [];

    // 1. Buscar produtos já migrados para ItemOS
    if (os.itens && os.itens.length > 0) {
      const produtosItemOS = await Promise.all(
        os.itens.map((item) =>
          this.consultarStatusPrazoProduto(item.id, osId, lojaId),
        ),
      );
      produtos.push(...produtosItemOS);
    }

    // 2. Buscar produtos do orçamento que ainda não foram migrados
    if (
      os.orcamento &&
      os.orcamento.produtos &&
      os.orcamento.produtos.length > 0
    ) {
      // Filtrar apenas produtos que não foram migrados para ItemOS
      const idsItemOS = os.itens?.map((item) => item.id) || [];
      const produtosOrcamentoNaoMigrados = os.orcamento.produtos.filter(
        (produto) => !idsItemOS.includes(produto.id),
      );

      console.log('🔍 Produtos ItemOS migrados:', idsItemOS);
      console.log('🔍 Produtos orçamento total:', os.orcamento.produtos.length);
      console.log(
        '🔍 Produtos orçamento não migrados:',
        produtosOrcamentoNaoMigrados.length,
      );

      const produtosOrcamento = produtosOrcamentoNaoMigrados.map((produto) => ({
        item_id: produto.id,
        produto_id: produto.id, // ID original do ProdutoOrcamento para API de detalhes
        produto_servico:
          produto.nome || produto.nome_servico || 'Produto sem nome',
        data_inicio_producao: undefined,
        data_prazo_produto: undefined,
        status_liberacao_pcp: 'PENDENTE',
        prioridade_produto: 'NORMAL',
        dias_restantes: undefined,
        is_retroativo: false,
        mensagem: 'Prazo não definido',
        excede_prazo_final: false,
      }));

      produtos.push(...produtosOrcamento);
    }

    const workflowEtapas = await this.prisma.workflowInstanciaSetor.findMany({
      where: {
        workflow_instancia: {
          os_id: osId,
        },
      },
      select: {
        item_os_id: true,
      },
    });

    const possuiEscopoGeral = workflowEtapas.some(
      (etapa) => etapa.item_os_id === null,
    );

    const itensComWorkflow = new Set(
      workflowEtapas
        .map((etapa) => etapa.item_os_id)
        .filter((id): id is string => Boolean(id)),
    );

    const produtosEnriquecidos = produtos.map((produto: any) => {
      const itemId = produto.item_id ?? null;
      const workflowAtribuido =
        possuiEscopoGeral || (itemId ? itensComWorkflow.has(itemId) : false);

      return {
        ...produto,
        workflow_atribuido: workflowAtribuido,
      };
    });

    produtos = produtosEnriquecidos;

    const liberadosComWorkflow = produtos.filter(
      (produto: any) =>
        (produto.status_liberacao_pcp ?? '').toUpperCase() === 'LIBERADO' &&
        produto.workflow_atribuido,
    ).length;

    const liberadosSemWorkflow = produtos.filter(
      (produto: any) =>
        (produto.status_liberacao_pcp ?? '').toUpperCase() === 'LIBERADO' &&
        !produto.workflow_atribuido,
    ).length;

    const resumo = {
      total_produtos: produtos.length,
      com_prazo: produtos.filter((p) => p.data_prazo_produto).length,
      sem_prazo: produtos.filter((p) => !p.data_prazo_produto).length,
      liberados_pcp: produtos.filter(
        (p) => (p.status_liberacao_pcp ?? '').toUpperCase() === 'LIBERADO',
      ).length,
      pendentes: produtos.filter(
        (p) => (p.status_liberacao_pcp ?? '').toUpperCase() === 'PENDENTE',
      ).length,
      liberados_com_workflow: liberadosComWorkflow,
      liberados_sem_workflow: liberadosSemWorkflow,
      excedendo_prazo: produtos.filter((p) => p.excede_prazo_final).length,
    };

    return {
      os_id: osId,
      data_prazo_final: os.data_prazo,
      produtos,
      resumo,
    };
  }

  /**
   * Cria log de auditoria para prazo retroativo de produto
   */
  private async criarLogPrazoRetroativo(logData: any) {
    try {
      await this.prisma.ordemServicoLog.create({
        data: {
          os_id: logData.os_id,
          tipo_acao: 'PRAZO_PRODUTO_RETROATIVO',
          descricao: `Prazo retroativo definido para produto`,
          dados_extras: JSON.stringify({
            item_id: logData.item_id,
            data_prazo_definida: logData.data_definida,
            data_atual: logData.data_atual,
            motivo: logData.motivo,
            dias_atras: Math.ceil(
              (new Date(logData.data_atual).getTime() -
                new Date(logData.data_definida).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          }),
          usuario_id: logData.usuario_id,
          ip_origem: logData.ip_origem,
          user_agent: logData.user_agent,
        },
      });
    } catch (error) {
      console.error('Erro ao criar log de prazo retroativo de produto:', error);
    }
  }

  async getDetalheLiberacaoPCP(osId: string, lojaId: string) {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      include: { itens: true },
    });
    if (!os) {
      throw new NotFoundException('OS não encontrada');
    }

    const liberados: Array<{
      item_id: string;
      produto_servico: string;
      liberado_em?: Date | null;
    }> = [];
    const pendentes: Array<{
      item_id: string;
      produto_servico: string;
      motivos: string[];
    }> = [];

    for (const item of os.itens) {
      const ctx = {
        id: item.id,
        produto_servico: item.produto_servico,
        data_prazo_produto: item.data_prazo_produto,
        status_liberacao_pcp: item.status_liberacao_pcp,
        responsabilidade_arte: item.responsabilidade_arte,
        status_arte: item.status_arte,
        materiais_disponivel: item.materiais_disponivel,
      };
      if (
        (item.status_liberacao_pcp || 'PENDENTE').toUpperCase() === 'LIBERADO'
      ) {
        liberados.push({
          item_id: item.id,
          produto_servico: item.produto_servico,
          liberado_em: item.liberado_pcp_em,
        });
      } else {
        pendentes.push({
          item_id: item.id,
          produto_servico: item.produto_servico,
          motivos: getMotivosBloqueioPcp(ctx, os.materiais_disponivel).map(
            (m) => m.mensagem,
          ),
        });
      }
    }

    return {
      os_id: osId,
      os_numero: os.numero,
      status: os.status,
      resumo: computeLiberacaoResumoGrid(
        os.itens.map((i) => ({
          id: i.id,
          produto_servico: i.produto_servico,
          status_liberacao_pcp: i.status_liberacao_pcp,
        })),
      ),
      liberados,
      pendentes,
    };
  }

  async getDetalheArteOS(osId: string, lojaId: string) {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      include: {
        itens: {
          include: {
            designer_atribuido: {
              select: { id: true, nome_completo: true },
            },
          },
        },
      },
    });
    if (!os) {
      throw new NotFoundException('OS não encontrada');
    }

    const produtos = os.itens.map((item) => ({
      item_id: item.id,
      produto_servico: item.produto_servico,
      responsabilidade_arte: item.responsabilidade_arte,
      status_arte: item.status_arte,
      status_arte_label: labelStatusArte(item.status_arte),
      requer_arte: produtoRequerArte(
        item.responsabilidade_arte,
        item.status_arte,
      ),
      data_prazo_arte: item.data_prazo_arte,
      designer: item.designer_atribuido
        ? {
            id: item.designer_atribuido.id,
            nome: item.designer_atribuido.nome_completo,
          }
        : null,
    }));

    return {
      os_id: osId,
      os_numero: os.numero,
      resumo: computeArteResumoGrid(
        os.itens.map((i) => ({
          id: i.id,
          produto_servico: i.produto_servico,
          responsabilidade_arte: i.responsabilidade_arte,
          status_arte: i.status_arte,
        })),
      ),
      produtos,
    };
  }
}
