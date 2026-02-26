import { Injectable, Logger } from '@nestjs/common';
import {
  OrcamentoCompleto,
  OrcamentoBase,
  OrcamentoStatus,
  OrcamentoTipo,
  PrioridadeOrcamento,
} from '../interfaces/orcamento.interface';

/**
 * Serviço de Transformação V2 para Orçamentos
 * Responsável por transformar dados entre diferentes formatos
 *
 * ✅ ARQUIVO ≤ 400 LINHAS (CONFORME PREMISSAS)
 * ✅ TRANSFORMAÇÕES ROBUSTAS E COMPLETAS
 * ✅ INTEGRAÇÃO COM INTERFACES DEFINIDAS
 */
@Injectable()
export class TransformacaoV2Service {
  private readonly logger = new Logger(TransformacaoV2Service.name);

  /**
   * Prepara dados para criação de orçamento
   */
  prepararDadosCriacao(dados: any, lojaId: string, usuarioId: string): any {
    this.logger.log(`🔄 Preparando dados para criação de orçamento`);

    const tituloBase = dados.titulo || 'Orçamento sem título';
    const tipoOrcamento =
      dados.tipo_orcamento || dados.tipo || OrcamentoTipo.PRODUTO_SERVICO;

    const dadosPreparados = {
      ...dados,
      titulo: dados.titulo || tituloBase, // Manter o campo titulo
      nome_servico: dados.nome_servico || tituloBase,
      descricao: dados.descricao || dados.resumo || '',
      loja_id: lojaId,
      responsavel_id: usuarioId,
      status: dados.status || OrcamentoStatus.RASCUNHO,
      tipo_orcamento: tipoOrcamento,
      prioridade: dados.prioridade || PrioridadeOrcamento.MEDIA,
      data_criacao: new Date(),
      data_atualizacao: new Date(),
      atualizado_em: new Date(),
      numero: dados.numero,
      horas_producao: dados.horas_producao ?? 0,
      custo_material: dados.custo_material ?? 0,
      custo_mao_obra: dados.custo_mao_obra ?? 0,
      custo_indireto: dados.custo_indireto ?? 0,
      custo_total: dados.custo_total ?? 0,
      margem_lucro: dados.margem_lucro ?? 0,
      impostos: dados.impostos ?? 0,
      preco_final: dados.preco_final ?? 0,
      valor_total: dados.preco_final ?? dados.valor_total ?? 0,
      comissao_percentual: dados.comissao_percentual ?? 5,
      ativo: true,
    };

    // Não deletar titulo - manter para salvar no banco
    delete dadosPreparados.tipo; // Apenas deletar tipo, não titulo

    // Preparar produtos se existirem
    if (dados.produtos && Array.isArray(dados.produtos)) {
      dadosPreparados.produtos = {
        create: dados.produtos.map((produto, index) =>
          this.prepararProdutoCriacao(produto, index),
        ),
      };
    }

    // Preparar configurações: mesma lógica do update — priorizar top-level (margem_lucro_customizada, tipo_margem_lucro, etc.)
    const configMergedCreate = {
      ...(dados.configuracoes || {}),
      margem_lucro_padrao:
        dados.margem_lucro_customizada != null
          ? Number(dados.margem_lucro_customizada)
          : Number(dados.configuracoes?.margem_lucro_padrao ?? 0),
      impostos_padrao:
        dados.impostos_customizados != null
          ? Number(dados.impostos_customizados)
          : Number(dados.configuracoes?.impostos_padrao ?? 0),
      comissao_padrao:
        dados.comissao_percentual != null
          ? Number(dados.comissao_percentual)
          : Number(dados.configuracoes?.comissao_padrao ?? 0),
      tipo_margem_lucro:
        dados.tipo_margem_lucro ??
        dados.configuracoes?.tipo_margem_lucro,
    };
    const temPercentuaisCreate =
      dados.margem_lucro_customizada != null ||
      dados.impostos_customizados != null ||
      dados.comissao_percentual != null;
    const temTipoMargemCreate =
      (dados.tipo_margem_lucro ?? dados.configuracoes?.tipo_margem_lucro) != null &&
      String(dados.tipo_margem_lucro ?? dados.configuracoes?.tipo_margem_lucro).trim() !== '';
    if (temPercentuaisCreate || temTipoMargemCreate) {
      dadosPreparados.configuracao_calculo = JSON.stringify(
        this.prepararConfiguracoes(configMergedCreate),
      );
    }
    delete dadosPreparados.configuracoes;

    // Preparar tags: schema usa tags (String), converter array para JSON string
    if (dados.tags && Array.isArray(dados.tags)) {
      const tagsFiltradas = dados.tags.filter(
        (tag) => typeof tag === 'string' && tag.trim().length > 0,
      );
      dadosPreparados.tags =
        tagsFiltradas.length > 0 ? JSON.stringify(tagsFiltradas) : null;
    }

    // Remover campos que não existem no schema ou causam erro no Prisma
    // margem_lucro_customizada/impostos_customizados/tipo_margem_lucro vão em configuracao_calculo; comissao_percentual é coluna do schema.
    const camposProibidos = [
      'cliente',
      'custos',
      'itens_produto',
      'historicoOrcamento',
      'versoes',
      'aprovacoes',
      'linksPublicos',
      'mensagensChat',
      'anexos',
      'resumo',
      'margem_lucro_customizada',
      'impostos_customizados',
      'tipo_margem_lucro',
      'configuracoes',
    ];
    camposProibidos.forEach((c) => delete dadosPreparados[c]);

    // Garantir que campos JSON sejam strings (Prisma/MySQL)
    if (
      dadosPreparados.custos_calculados != null &&
      typeof dadosPreparados.custos_calculados === 'object'
    ) {
      dadosPreparados.custos_calculados = JSON.stringify(
        dadosPreparados.custos_calculados,
      );
    }

    this.logger.log(`✅ Dados preparados para criação`);
    return dadosPreparados;
  }

  /**
   * Prepara dados para atualização de orçamento
   */
  prepararDadosAtualizacao(
    dados: any,
    orcamentoExistente: OrcamentoCompleto,
  ): any {
    this.logger.log(
      `🔄 Preparando dados para atualização do orçamento ${orcamentoExistente.id}`,
    );

    const dadosPreparados: any = {
      ...dados,
      data_atualizacao: new Date(),
    };

    const tipoOrcamento = dados.tipo_orcamento || dados.tipo;
    if (tipoOrcamento) {
      dadosPreparados.tipo_orcamento = tipoOrcamento;
    }

    // Preparar produtos se existirem
    if (dados.produtos && Array.isArray(dados.produtos)) {
      dadosPreparados.produtos = this.prepararProdutosAtualizacao(
        dados.produtos,
        orcamentoExistente.produtos,
      );
    }

    // Preparar configurações: priorizar payload, depois config existente do orçamento (para não perder tipo_margem_lucro).
    const configExistente: {
      margem_lucro_padrao?: number;
      impostos_padrao?: number;
      comissao_padrao?: number;
      tipo_margem_lucro?: string;
    } = orcamentoExistente?.configuracoes ?? {};
    const configMerged = {
      ...configExistente,
      ...(dados.configuracoes || {}),
      margem_lucro_padrao:
        dados.margem_lucro_customizada != null
          ? Number(dados.margem_lucro_customizada)
          : dados.configuracoes?.margem_lucro_padrao ?? configExistente.margem_lucro_padrao,
      impostos_padrao:
        dados.impostos_customizados != null
          ? Number(dados.impostos_customizados)
          : dados.configuracoes?.impostos_padrao ?? configExistente.impostos_padrao,
      comissao_padrao:
        dados.comissao_percentual != null
          ? Number(dados.comissao_percentual)
          : dados.configuracoes?.comissao_padrao ?? configExistente.comissao_padrao,
      tipo_margem_lucro:
        dados.tipo_margem_lucro ??
        dados.configuracoes?.tipo_margem_lucro ??
        configExistente.tipo_margem_lucro,
    };
    // Persistir config quando o payload trouxer percentuais ou tipo de margem (para não perder tipo_margem_lucro ao salvar)
    const temPercentuaisNoPayload =
      dados.margem_lucro_customizada != null ||
      dados.impostos_customizados != null ||
      dados.comissao_percentual != null;
    const tipoMargemPayload =
      dados.tipo_margem_lucro ?? dados.configuracoes?.tipo_margem_lucro;
    const temTipoMargemNoPayload =
      tipoMargemPayload != null && String(tipoMargemPayload).trim() !== '';
    if (temPercentuaisNoPayload || temTipoMargemNoPayload) {
      dadosPreparados.configuracao_calculo = JSON.stringify(
        this.prepararConfiguracoes(configMerged),
      );
    }
    delete dadosPreparados.configuracoes;

    // Preparar tags se existirem
    if (dados.tags && Array.isArray(dados.tags)) {
      dadosPreparados.tags = dados.tags.filter(
        (tag) => typeof tag === 'string' && tag.trim().length > 0,
      );
    }

    // Remover campos que não devem ser atualizados ou que causam erro no Prisma
    // Custos: só atualizados pelo motor ou fallback explícito, nunca pelo spread do frontend.
    // margem_lucro_customizada e impostos_customizados não existem no schema; vão em configuracao_calculo.
    const camposProibidos = [
      'id', 'loja_id', 'data_criacao', 'responsavel_id', 'tipo',
      'cliente', 'custos', 'itens_produto', 'historicoOrcamento', 'versoes',
      'aprovacoes', 'linksPublicos', 'mensagensChat', 'anexos', 'numero',
      'criado_em', 'atualizado_em',
      'preco_final', 'custo_total', 'margem_lucro', 'impostos',
      'custo_material', 'custo_mao_obra', 'custo_indireto', 'data_ultimo_calculo',
      'margem_lucro_customizada', 'impostos_customizados', 'tipo_margem_lucro',
    ];
    camposProibidos.forEach((campo) => delete dadosPreparados[campo]);

    // Garantir que campos JSON sejam strings (Prisma/MySQL)
    if (dadosPreparados.custos_calculados != null && typeof dadosPreparados.custos_calculados === 'object') {
      dadosPreparados.custos_calculados = JSON.stringify(dadosPreparados.custos_calculados);
    }
    if (dadosPreparados.tags != null && Array.isArray(dadosPreparados.tags)) {
      dadosPreparados.tags = JSON.stringify(dadosPreparados.tags);
    }

    this.logger.log(`✅ Dados preparados para atualização`);
    return dadosPreparados;
  }

  /**
   * Transforma dados do banco para interface
   */
  transformarParaInterface(dados: any): OrcamentoCompleto {
    this.logger.log(`🔄 Transformando dados do banco para interface`);

    // Debug: verificar dados do banco
    this.logger.log(`🔍 Debug - Dados do banco:`, {
      id: dados.id,
      preco_final: dados.preco_final,
      custo_total: dados.custo_total,
      margem_lucro: dados.margem_lucro,
      impostos: dados.impostos,
      criado_em: dados.criado_em,
    });

    let configuracoesPersistidas = dados.configuracoes;
    if (!configuracoesPersistidas && dados.configuracao_calculo) {
      try {
        configuracoesPersistidas =
          typeof dados.configuracao_calculo === 'string'
            ? JSON.parse(dados.configuracao_calculo)
            : dados.configuracao_calculo;
      } catch {
        configuracoesPersistidas = null;
      }
    }

    const orcamento: OrcamentoCompleto = {
      id: dados.id,
      numero: dados.numero,
      titulo: dados.titulo,
      descricao: dados.descricao,
      cliente_id: dados.cliente_id,
      loja_id: dados.loja_id,
      status: dados.status,
      status_aprovacao: dados.status_aprovacao,
      tipo: (dados.tipo || dados.tipo_orcamento) as OrcamentoTipo,
      tipo_orcamento: (dados.tipo_orcamento || dados.tipo) as OrcamentoTipo,
      data_criacao: dados.data_criacao,
      data_atualizacao: dados.data_atualizacao,
      data_validade: dados.data_validade,
      observacoes: dados.observacoes,
      tags: dados.tags || [],
      prioridade: dados.prioridade,
      responsavel_id: dados.responsavel_id,
      ativo: dados.ativo,
      comissao_percentual:
        dados.comissao_percentual != null
          ? Number(dados.comissao_percentual)
          : undefined,

      // Campos do produto principal
      largura_produto: dados.largura_produto,
      altura_produto: dados.altura_produto,
      area_produto: dados.area_produto,
      quantidade_produto: dados.quantidade_produto,
      unidade_medida_produto: dados.unidade_medida_produto,

      // Dados relacionados
      cliente: this.transformarCliente(dados.cliente),
      produtos: this.transformarProdutos(dados.produtos),
      custos: this.transformarCustos(dados),
      configuracoes: this.transformarConfiguracoes(configuracoesPersistidas),
      // Campos que o formulário de edição espera no top level (evita zerar margem/impostos ao abrir).
      // Só expor número quando for > 0; 0 ou vazio = undefined para o form usar fallback (30/25).
      margem_lucro_customizada:
        configuracoesPersistidas?.margem_lucro_padrao != null &&
        Number(configuracoesPersistidas.margem_lucro_padrao) > 0
          ? Number(configuracoesPersistidas.margem_lucro_padrao)
          : undefined,
      impostos_customizados:
        configuracoesPersistidas?.impostos_padrao != null &&
        Number(configuracoesPersistidas.impostos_padrao) > 0
          ? Number(configuracoesPersistidas.impostos_padrao)
          : undefined,
      tipo_margem_lucro: (() => {
        const t = configuracoesPersistidas?.tipo_margem_lucro;
        if (t == null || String(t).trim() === '') return undefined;
        const normalized = String(t).trim().toLowerCase();
        return normalized === 'markup' || normalized === 'margem_por_dentro' ? normalized : undefined;
      })(),
      versoes: this.transformarVersoes(dados.versoes),
      historicoOrcamento: this.transformarHistorico(dados.historicoOrcamento),
      aprovacoes: this.transformarAprovacoes(dados.aprovacoes),
      linksPublicos: this.transformarLinks(dados.linksPublicos),
      mensagensChat: this.transformarMensagens(dados.mensagensChat),
      anexos: this.transformarAnexos(dados.anexos),
    };

    // Debug: verificar dados transformados
    this.logger.log(`🔍 Debug - Dados transformados:`, {
      id: orcamento.id,
      preco_final: orcamento.custos?.preco_final,
      custo_total: orcamento.custos?.custo_total,
      margem_lucro: orcamento.custos?.margem_lucro,
      impostos: orcamento.custos?.impostos,
      data_criacao: orcamento.data_criacao,
    });

    this.logger.log(`✅ Dados transformados para interface`);
    return orcamento;
  }

  /**
   * Transforma dados da interface para banco
   */
  transformarParaBanco(dados: OrcamentoCompleto): any {
    this.logger.log(`🔄 Transformando dados da interface para banco`);

    const dadosBanco: any = {
      id: dados.id,
      titulo: dados.titulo,
      descricao: dados.descricao,
      cliente_id: dados.cliente_id,
      loja_id: dados.loja_id,
      status: dados.status,
      tipo_orcamento: dados.tipo_orcamento || dados.tipo,
      tipo: undefined,
      data_criacao: dados.data_criacao,
      data_atualizacao: dados.data_atualizacao,
      data_validade: dados.data_validade,
      observacoes: dados.observacoes,
      tags: dados.tags,
      prioridade: dados.prioridade,
      responsavel_id: dados.responsavel_id,
      ativo: dados.ativo,
      custos_calculados: dados.custos,
      comissao_percentual: (dados as any).comissao_percentual,
    };
    delete dadosBanco.tipo;

    this.logger.log(`✅ Dados transformados para banco`);
    return dadosBanco;
  }

  /**
   * Prepara dados para cálculo via motor
   */
  prepararDadosParaMotor(dados: any, lojaId: string): any {
    this.logger.log(`🔄 Preparando dados para motor de cálculo`);

    const dadosMotor = {
      loja_id: lojaId,
      produtos: this.prepararProdutosParaMotor(dados.produtos),
      configuracoes: dados.configuracoes || {},
      opcoes: {
        incluir_estoque: true,
        incluir_alertas: true,
        incluir_recomendacoes: true,
        incluir_detalhamento: true,
      },
    };

    this.logger.log(`✅ Dados preparados para motor`);
    return dadosMotor;
  }

  // Métodos privados de transformação

  private prepararProdutoCriacao(produto: any, index: number): any {
    const nomeProduto = (
      produto.nome_servico ||
      produto.nome ||
      `Produto ${index + 1}`
    ).toString();
    const toNumber = (valor: any, precision?: number): number => {
      const numero = typeof valor === 'number' ? valor : Number(valor);
      if (!Number.isFinite(numero)) {
        return 0;
      }
      if (typeof precision === 'number') {
        return Number(numero.toFixed(precision));
      }
      return numero;
    };

    this.logger.log(`🔍 Preparando produto ${index + 1} - Medidas recebidas:`, {
      nome: produto.nome_servico || produto.nome,
      largura: produto.largura,
      altura: produto.altura,
      area: produto.area_produto || produto.area,
    });

    const produtoPreparado: any = {
      nome_servico: nomeProduto,
      nome: nomeProduto,
      descricao: produto.descricao ?? '',
      quantidade: Math.max(toNumber(produto.quantidade), 0.001),
      largura: produto.largura ?? null,
      altura: produto.altura ?? null,
      area_produto: produto.area_produto || produto.area || null,
      unidade_medida: produto.unidade_medida || produto.unidade || 'un',
      observacoes: produto.observacoes,
      ordem: index,
      custo_total_producao: toNumber(produto.custo_total_producao),
      preco_unitario: toNumber(produto.preco_unitario),
      preco_total: toNumber(produto.preco_total),
      margem_lucro: toNumber(produto.margem_lucro),
      impostos: toNumber(produto.impostos),
      ativo: true,
    };

    if (produto.insumos && produto.insumos.length > 0) {
      produtoPreparado.insumos = {
        create: produto.insumos
          .filter((insumo: any) => insumo?.insumo_id)
          .map((insumo: any) => {
            const quantidade = toNumber(insumo.quantidade, 3);
            const precoUnitario = toNumber(
              insumo.preco_unitario ?? insumo.custo_unitario,
            );
            const precoTotal = toNumber(
              insumo.preco_total ??
                insumo.custo_total ??
                quantidade * precoUnitario,
            );

            return {
              insumo_id: insumo.insumo_id,
              quantidade,
              unidade: insumo.unidade || insumo.unidade_consumo || 'un',
              preco_unitario: precoUnitario,
              preco_total: precoTotal,
              material_do_cliente: Boolean(insumo.material_do_cliente),
            };
          }),
      };
    }

    if (produto.maquinas && produto.maquinas.length > 0) {
      produtoPreparado.maquinas = {
        create: produto.maquinas
          .filter((maquina: any) => maquina?.maquina_id)
          .map((maquina: any) => {
            const tempoHoras = toNumber(
              maquina.tempo_horas ?? maquina.horas_utilizadas,
              3,
            );
            const custoHora = toNumber(
              maquina.custo_hora ?? maquina.custo_por_hora,
            );
            const custoTotal = toNumber(
              maquina.custo_total ?? tempoHoras * custoHora,
            );

            return {
              maquina_id: maquina.maquina_id,
              tempo_horas: tempoHoras,
              custo_hora: custoHora,
              custo_total: custoTotal,
            };
          }),
      };
    }

    if (produto.funcoes && produto.funcoes.length > 0) {
      produtoPreparado.funcoes = {
        create: produto.funcoes
          .filter((funcao: any) => funcao?.funcao_id)
          .map((funcao: any) => {
            const tempoHoras = toNumber(
              funcao.tempo_horas ?? funcao.horas_trabalhadas,
              3,
            );
            const custoHora = toNumber(
              funcao.custo_hora ?? funcao.custo_por_hora ?? funcao.valor_hora,
            );
            const custoTotal = toNumber(
              funcao.custo_total ?? tempoHoras * custoHora,
            );

            return {
              funcao_id: funcao.funcao_id,
              tempo_horas: tempoHoras,
              custo_hora: custoHora,
              custo_total: custoTotal,
            };
          }),
      };
    }

    if (produto.servicos_manuais && produto.servicos_manuais.length > 0) {
      produtoPreparado.servicos_manuais = {
        create: produto.servicos_manuais
          .filter((servico: any) => servico?.servico_id)
          .map((servico: any) => {
            const tempoHoras = toNumber(
              servico.tempo_horas ?? servico.horas_trabalhadas,
              3,
            );
            const custoHora = toNumber(
              servico.custo_hora ?? servico.custo_por_hora,
            );
            const custoTotal = toNumber(
              servico.custo_total ?? tempoHoras * custoHora,
            );

            return {
              servico_id: servico.servico_id,
              tempo_horas: tempoHoras,
              custo_hora: custoHora,
              custo_total: custoTotal,
            };
          }),
      };
    }

    if (produto.custos_indiretos && produto.custos_indiretos.length > 0) {
      produtoPreparado.custos_indiretos = {
        create: produto.custos_indiretos.map((custo: any) => ({
          custo_id: custo.custo_id,
          percentual: toNumber(custo.percentual),
          valor_fixo: toNumber(custo.valor_fixo),
          custo_total: toNumber(custo.custo_total),
        })),
      };
    }

    return produtoPreparado;
  }

  private prepararProdutosAtualizacao(
    produtosNovos: any[],
    produtosExistentes: any[],
  ): any {
    // Estratégia: remover todos e recriar
    return {
      deleteMany: {},
      create: produtosNovos.map((produto, index) =>
        this.prepararProdutoCriacao(produto, index),
      ),
    };
  }

  private prepararConfiguracoes(configuracoes: any): any {
    const base = {
      margem_lucro_padrao: Number(
        configuracoes.margem_lucro_padrao ??
          configuracoes.margem_lucro_customizada ??
          0,
      ),
      impostos_padrao: Number(
        configuracoes.impostos_padrao ??
          configuracoes.impostos_customizados ??
          0,
      ),
      comissao_padrao: Number(
        configuracoes.comissao_padrao ??
          configuracoes.comissao_percentual ??
          0,
      ),
      custos_indiretos_padrao: configuracoes.custos_indiretos_padrao || 0,
      horas_produtivas_mensais: configuracoes.horas_produtivas_mensais || 0,
      custos_indiretos_mensais: configuracoes.custos_indiretos_mensais,
      regras_especiais: configuracoes.regras_especiais || [],
    };
    const tipoRaw = configuracoes.tipo_margem_lucro != null
      ? String(configuracoes.tipo_margem_lucro).trim().toLowerCase()
      : '';
    if (tipoRaw === 'markup' || tipoRaw === 'margem_por_dentro') {
      (base as any).tipo_margem_lucro = tipoRaw;
    }
    return base;
  }

  private prepararProdutosParaMotor(produtos: any[]): any[] {
    if (!produtos || !Array.isArray(produtos)) return [];

    const toNumber = (valor: any, precision?: number): number => {
      const numero = typeof valor === 'number' ? valor : Number(valor);
      if (!Number.isFinite(numero)) {
        return 0;
      }
      if (typeof precision === 'number') {
        return Number(numero.toFixed(precision));
      }
      return numero;
    };

    return produtos.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      quantidade: produto.quantidade,
      unidade: produto.unidade,

      insumos:
        produto.insumos?.map((insumo) => ({
          insumo_id: insumo.insumo_id,
          quantidade: toNumber(insumo.quantidade, 3),
          unidade: insumo.unidade || insumo.unidade_consumo,
          preco_unitario: toNumber(
            insumo.preco_unitario ?? insumo.custo_unitario,
          ),
        })) || [],

      maquinas:
        produto.maquinas?.map((maquina) => ({
          maquina_id: maquina.maquina_id,
          tempo_horas: toNumber(
            maquina.tempo_horas ?? maquina.horas_utilizadas,
            3,
          ),
          custo_hora: toNumber(maquina.custo_hora ?? maquina.custo_por_hora),
        })) || [],

      funcoes:
        produto.funcoes?.map((funcao) => ({
          funcao_id: funcao.funcao_id,
          tempo_horas: toNumber(
            funcao.tempo_horas ?? funcao.horas_trabalhadas,
            3,
          ),
          custo_hora: toNumber(
            funcao.custo_hora ?? funcao.custo_por_hora ?? funcao.valor_hora,
          ),
        })) || [],

      servicos_manuais:
        produto.servicos_manuais?.map((servico) => ({
          servico_id: servico.servico_id,
          tempo_horas: toNumber(
            servico.tempo_horas ?? servico.horas_trabalhadas,
            3,
          ),
          custo_hora: toNumber(servico.custo_hora ?? servico.custo_por_hora),
        })) || [],

      custos_indiretos:
        produto.custos_indiretos?.map((custo) => ({
          custo_id: custo.custo_id,
          percentual: toNumber(custo.percentual),
          valor_fixo: toNumber(custo.valor_fixo),
        })) || [],
    }));
  }

  private transformarCliente(cliente: any): any {
    if (!cliente) return null;

    return {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      documento: cliente.documento,
    };
  }

  private transformarProdutos(produtos: any[]): any[] {
    if (!produtos || !Array.isArray(produtos)) return [];

    return produtos.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      quantidade: produto.quantidade,
      unidade: produto.unidade,
      largura: produto.largura,
      altura: produto.altura,
      area: produto.area,
      preco_unitario: produto.preco_unitario || 0,
      preco_total: produto.preco_total || 0,
      margem_lucro: produto.margem_lucro || 0,
      impostos: produto.impostos || 0,
      observacoes: produto.observacoes,

      insumos:
        produto.insumos?.map((insumo) => ({
          id: insumo.id, // ID do relacionamento ItemInsumo
          insumo_id: insumo.insumo_id, // ID real do insumo no banco
          nome: insumo.nome,
          quantidade: insumo.quantidade,
          unidade: insumo.unidade,
          preco_unitario: insumo.preco_unitario || 0,
          preco_total: insumo.preco_total || 0,
          material_do_cliente: Boolean(insumo.material_do_cliente),
          estoque_disponivel: insumo.estoque_disponivel,
          alerta_estoque: insumo.alerta_estoque || false,
        })) || [],

      maquinas:
        produto.maquinas?.map((maquina) => ({
          id: maquina.id, // ID do relacionamento ItemMaquina
          maquina_id: maquina.maquina_id, // ID real da máquina no banco
          nome: maquina.nome,
          tempo_horas: maquina.tempo_horas,
          custo_hora: maquina.custo_hora || 0,
          custo_total: maquina.custo_total || 0,
        })) || [],

      funcoes:
        produto.funcoes?.map((funcao) => ({
          id: funcao.id, // ID do relacionamento ItemFuncao
          funcao_id: funcao.funcao_id, // ID real da função no banco
          nome: funcao.nome,
          tempo_horas: funcao.tempo_horas,
          custo_hora: funcao.custo_hora || 0,
          custo_total: funcao.custo_total || 0,
        })) || [],

      servicos_manuais:
        produto.servicos_manuais?.map((servico) => ({
          id: servico.id, // ID do relacionamento ItemServicoManual
          servico_id: servico.servico_id, // ID real do serviço no banco
          nome: servico.nome,
          tempo_horas: servico.tempo_horas,
          custo_hora: servico.custo_hora || 0,
          custo_total: servico.custo_total || 0,
        })) || [],

      custos_indiretos:
        produto.custos_indiretos?.map((custo) => ({
          custo_id: custo.custo_id,
          percentual: custo.percentual,
          valor_fixo: custo.valor_fixo || 0,
          custo_total: custo.custo_total || 0,
        })) || [],
    }));
  }

  private transformarCustos(dados: any): any {
    if (!dados) return null;
    const precoFinal =
      Number(dados.preco_final) ||
      Number(dados.valor_total) ||
      (dados.custos_calculados && typeof dados.custos_calculados === 'object'
        ? Number((dados.custos_calculados as any).preco_final ?? (dados.custos_calculados as any).valor_total)
        : 0) ||
      (typeof dados.custos_calculados === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(dados.custos_calculados);
              return Number(parsed?.preco_final ?? parsed?.valor_total) || 0;
            } catch {
              return 0;
            }
          })()
        : 0);
    return {
      custos_diretos: {
        insumos: dados.custo_material || 0,
        maquinas: 0,
        funcoes: 0,
        servicos_manuais: 0,
        subtotal: dados.custo_material || 0,
      },
      custos_indiretos: dados.custo_indireto || 0,
      impostos: dados.impostos || 0,
      margem_lucro: dados.margem_lucro || 0,
      custo_total: dados.custo_total || 0,
      preco_final: precoFinal,
      lucro_estimado: precoFinal - (Number(dados.custo_total) || 0),
    };
  }

  private transformarConfiguracoes(configuracoes: any): any {
    if (!configuracoes) return null;

    const base = {
      margem_lucro_padrao: configuracoes.margem_lucro_padrao || 0,
      impostos_padrao: configuracoes.impostos_padrao || 0,
      comissao_padrao: configuracoes.comissao_padrao || 0,
      custos_indiretos_padrao: configuracoes.custos_indiretos_padrao || 0,
      horas_produtivas_mensais: configuracoes.horas_produtivas_mensais || 0,
      custos_indiretos_mensais: configuracoes.custos_indiretos_mensais,
      regras_especiais: configuracoes.regras_especiais || [],
    };
    const tipoRaw = configuracoes.tipo_margem_lucro != null
      ? String(configuracoes.tipo_margem_lucro).trim().toLowerCase()
      : '';
    if (tipoRaw === 'markup' || tipoRaw === 'margem_por_dentro') {
      (base as any).tipo_margem_lucro = tipoRaw;
    }
    return base;
  }

  private transformarVersoes(versoes: any[]): any[] {
    if (!versoes || !Array.isArray(versoes)) return [];

    return versoes.map((versao) => ({
      numero: versao.numero,
      data_criacao: versao.data_criacao,
      responsavel_id: versao.responsavel_id,
      mudancas: versao.mudancas || [],
      custos_anteriores: versao.custos_anteriores,
      custos_novos: versao.custos_novos,
    }));
  }

  private transformarHistorico(historico: any[]): any[] {
    if (!historico || !Array.isArray(historico)) return [];

    return historico.map((item) => ({
      id: item.id,
      data: item.data,
      tipo: item.tipo,
      descricao: item.descricao,
      usuario_id: item.usuario_id,
      dados_anteriores: item.dados_anteriores,
      dados_novos: item.dados_novos,
      observacoes: item.observacoes,
    }));
  }

  private transformarAprovacoes(aprovacoes: any[]): any[] {
    if (!aprovacoes || !Array.isArray(aprovacoes)) return [];

    return aprovacoes.map((aprovacao) => ({
      id: aprovacao.id,
      nivel: aprovacao.nivel,
      responsavel_id: aprovacao.responsavel_id,
      status: aprovacao.status,
      data_aprovacao: aprovacao.data_aprovacao,
      observacoes: aprovacao.observacoes,
      condicoes: aprovacao.condicoes || [],
    }));
  }

  private transformarLinks(links: any[]): any[] {
    if (!links || !Array.isArray(links)) return [];

    return links.map((link) => ({
      id: link.id,
      codigo: link.codigo,
      url: link.url,
      data_expiracao: link.data_expiracao,
      max_acessos: link.max_acessos,
      acessos_restantes: link.acessos_restantes,
      ativo: link.ativo,
      permissoes: link.permissoes || [],
    }));
  }

  private transformarMensagens(mensagens: any[]): any[] {
    if (!mensagens || !Array.isArray(mensagens)) return [];

    return mensagens.map((mensagem) => ({
      id: mensagem.id,
      usuario_id: mensagem.usuario_id,
      tipo: mensagem.tipo,
      conteudo: mensagem.conteudo,
      data_envio: mensagem.data_envio,
      lida: mensagem.lida,
      anexos: mensagem.anexos || [],
    }));
  }

  private transformarAnexos(anexos: any[]): any[] {
    if (!anexos || !Array.isArray(anexos)) return [];

    return anexos.map((anexo) => ({
      id: anexo.id,
      nome: anexo.nome,
      tipo: anexo.tipo,
      tamanho: anexo.tamanho,
      url: anexo.url,
      data_upload: anexo.data_upload,
      usuario_id: anexo.usuario_id,
    }));
  }
}
