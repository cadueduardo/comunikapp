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

  private parseConfiguracaoCalculo(raw: unknown): Record<string, any> | null {
    if (raw == null) return null;

    let parsed: unknown = raw;
    // Protege contra casos antigos com JSON serializado mais de uma vez.
    for (let i = 0; i < 2; i++) {
      if (typeof parsed !== 'string') break;
      const texto = parsed.trim();
      if (!texto) return null;
      try {
        parsed = JSON.parse(texto);
      } catch {
        return null;
      }
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    return parsed as Record<string, any>;
  }

  private devePersistirConfiguracao(
    config: Record<string, any> | null,
  ): boolean {
    if (!config) return false;

    const numeroValido = (value: unknown): boolean =>
      typeof value === 'number' && Number.isFinite(value) && value >= 0;

    const tipoRaw =
      config.tipo_margem_lucro != null
        ? String(config.tipo_margem_lucro).trim().toLowerCase()
        : '';
    const temTipoValido =
      tipoRaw === 'markup' || tipoRaw === 'margem_por_dentro';

    return (
      temTipoValido ||
      numeroValido(config.margem_lucro_padrao) ||
      numeroValido(config.impostos_padrao) ||
      numeroValido(config.comissao_padrao) ||
      numeroValido(config.custos_indiretos_padrao) ||
      numeroValido(config.horas_produtivas_mensais) ||
      numeroValido(config.custos_indiretos_mensais) ||
      numeroValido(config.valor_final_manual) ||
      (typeof config.entrega_modalidade_nome === 'string' &&
        config.entrega_modalidade_nome.trim().length > 0) ||
      (Array.isArray(config.regras_especiais) &&
        config.regras_especiais.length > 0)
    );
  }

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
      horas_producao: Math.max(Number(dados.horas_producao ?? 0), 0.01),
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
          this.prepararProdutoCriacao(produto, index, lojaId),
        ),
      };
    }

    // Preparar configurações: mesma lógica do update — priorizar top-level (margem_lucro_customizada, tipo_margem_lucro, etc.)
    const configPayloadCreate =
      this.parseConfiguracaoCalculo(dados.configuracoes) ?? {};
    const configMergedCreate = {
      ...configPayloadCreate,
      margem_lucro_padrao:
        dados.margem_lucro_customizada != null
          ? Number(dados.margem_lucro_customizada)
          : Number(configPayloadCreate.margem_lucro_padrao ?? 0),
      impostos_padrao:
        dados.impostos_customizados != null
          ? Number(dados.impostos_customizados)
          : Number(configPayloadCreate.impostos_padrao ?? 0),
      comissao_padrao:
        dados.comissao_percentual != null
          ? Number(dados.comissao_percentual)
          : Number(configPayloadCreate.comissao_padrao ?? 0),
      tipo_margem_lucro:
        dados.tipo_margem_lucro ?? configPayloadCreate.tipo_margem_lucro,
    };
    const tipoMargemCreateRaw =
      configMergedCreate.tipo_margem_lucro != null
        ? String(configMergedCreate.tipo_margem_lucro).trim().toLowerCase()
        : '';
    const tipoMargemCreate =
      tipoMargemCreateRaw === 'markup' ||
      tipoMargemCreateRaw === 'margem_por_dentro'
        ? tipoMargemCreateRaw
        : undefined;
    dadosPreparados.tipo_margem_lucro = tipoMargemCreate;
    const configuracaoCreate = this.prepararConfiguracoes(configMergedCreate);
    if (this.devePersistirConfiguracao(configuracaoCreate)) {
      dadosPreparados.configuracao_calculo = JSON.stringify(configuracaoCreate);
    }
    delete dadosPreparados.configuracoes;

    if (dados.condicao_pagamento_tipo !== undefined) {
      dadosPreparados.condicao_pagamento_tipo =
        dados.condicao_pagamento_tipo || null;
    }
    if (dados.condicao_pagamento_entrada_pct !== undefined) {
      dadosPreparados.condicao_pagamento_entrada_pct =
        dados.condicao_pagamento_entrada_pct ?? null;
    }
    if (dados.condicao_pagamento_parcelas !== undefined) {
      dadosPreparados.condicao_pagamento_parcelas =
        dados.condicao_pagamento_parcelas ?? null;
    }
    if (dados.condicao_pagamento_descricao !== undefined) {
      dadosPreparados.condicao_pagamento_descricao =
        dados.condicao_pagamento_descricao || null;
    }
    this.aplicarCamposEntrega(dadosPreparados, dados);

    const clienteId =
      typeof dados.cliente_id === 'string' ? dados.cliente_id.trim() : '';
    dadosPreparados.cliente_id = clienteId.length > 0 ? clienteId : null;

    // Preparar tags: schema usa tags (String), converter array para JSON string
    if (dados.tags && Array.isArray(dados.tags)) {
      const tagsFiltradas = dados.tags.filter(
        (tag) => typeof tag === 'string' && tag.trim().length > 0,
      );
      dadosPreparados.tags =
        tagsFiltradas.length > 0 ? JSON.stringify(tagsFiltradas) : null;
    }

    // Remover campos que não existem no schema ou causam erro no Prisma
    // margem_lucro_customizada/impostos_customizados vão em configuracao_calculo; tipo_margem_lucro também persiste em coluna própria.
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
      'configuracoes',
      'profundidade_produto',
      'valor_final_manual',
      'preco_final_manual',
      'alerta_preco_abaixo_custo',
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
        orcamentoExistente.loja_id,
      );
    }

    // Preparar configurações: priorizar payload, depois config existente do orçamento (para não perder tipo_margem_lucro).
    const configExistenteParsed = this.parseConfiguracaoCalculo(
      orcamentoExistente?.configuracoes,
    );
    const configExistente: {
      margem_lucro_padrao?: number;
      impostos_padrao?: number;
      comissao_padrao?: number;
      tipo_margem_lucro?: string;
    } = configExistenteParsed ?? {};
    const configPayload =
      this.parseConfiguracaoCalculo(dados.configuracoes) ?? {};
    const configMerged = {
      ...configExistente,
      ...configPayload,
      margem_lucro_padrao:
        dados.margem_lucro_customizada != null
          ? Number(dados.margem_lucro_customizada)
          : (configPayload.margem_lucro_padrao ??
            configExistente.margem_lucro_padrao),
      impostos_padrao:
        dados.impostos_customizados != null
          ? Number(dados.impostos_customizados)
          : (configPayload.impostos_padrao ?? configExistente.impostos_padrao),
      comissao_padrao:
        dados.comissao_percentual != null
          ? Number(dados.comissao_percentual)
          : (configPayload.comissao_padrao ?? configExistente.comissao_padrao),
      tipo_margem_lucro:
        dados.tipo_margem_lucro ??
        configPayload.tipo_margem_lucro ??
        configExistente.tipo_margem_lucro,
    };
    const tipoMargemUpdateRaw =
      configMerged.tipo_margem_lucro != null
        ? String(configMerged.tipo_margem_lucro).trim().toLowerCase()
        : '';
    const tipoMargemUpdate =
      tipoMargemUpdateRaw === 'markup' ||
      tipoMargemUpdateRaw === 'margem_por_dentro'
        ? tipoMargemUpdateRaw
        : undefined;
    if (tipoMargemUpdate !== undefined) {
      dadosPreparados.tipo_margem_lucro = tipoMargemUpdate;
    }
    const configuracaoUpdate = this.prepararConfiguracoes(configMerged);
    if (this.devePersistirConfiguracao(configuracaoUpdate)) {
      dadosPreparados.configuracao_calculo = JSON.stringify(configuracaoUpdate);
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
      'id',
      'loja_id',
      'data_criacao',
      'responsavel_id',
      'tipo',
      'cliente',
      'custos',
      'itens_produto',
      'historicoOrcamento',
      'versoes',
      'aprovacoes',
      'linksPublicos',
      'mensagensChat',
      'anexos',
      'numero',
      'criado_em',
      'atualizado_em',
      'cliente_id',
      'profundidade_produto',
      'preco_final',
      'custo_total',
      'margem_lucro',
      'impostos',
      'custo_material',
      'custo_mao_obra',
      'custo_indireto',
      'data_ultimo_calculo',
      'margem_lucro_customizada',
      'impostos_customizados',
      'valor_final_manual',
      'preco_final_manual',
      'alerta_preco_abaixo_custo',
    ];
    camposProibidos.forEach((campo) => delete dadosPreparados[campo]);

    if (Object.prototype.hasOwnProperty.call(dados, 'cliente_id')) {
      dadosPreparados.cliente = dados.cliente_id
        ? { connect: { id: dados.cliente_id } }
        : { disconnect: true };
    }

    if (dados.condicao_pagamento_tipo !== undefined) {
      dadosPreparados.condicao_pagamento_tipo =
        dados.condicao_pagamento_tipo || null;
    }
    if (dados.condicao_pagamento_entrada_pct !== undefined) {
      dadosPreparados.condicao_pagamento_entrada_pct =
        dados.condicao_pagamento_entrada_pct ?? null;
    }
    if (dados.condicao_pagamento_parcelas !== undefined) {
      dadosPreparados.condicao_pagamento_parcelas =
        dados.condicao_pagamento_parcelas ?? null;
    }
    if (dados.condicao_pagamento_descricao !== undefined) {
      dadosPreparados.condicao_pagamento_descricao =
        dados.condicao_pagamento_descricao || null;
    }
    this.aplicarCamposEntrega(dadosPreparados, dados);
    if (
      Object.prototype.hasOwnProperty.call(
        dadosPreparados,
        'entrega_modalidade_id',
      )
    ) {
      dadosPreparados.entrega_modalidade = dadosPreparados.entrega_modalidade_id
        ? { connect: { id: dadosPreparados.entrega_modalidade_id } }
        : { disconnect: true };
      delete dadosPreparados.entrega_modalidade_id;
    }

    // Garantir que campos JSON sejam strings (Prisma/MySQL)
    if (
      dadosPreparados.custos_calculados != null &&
      typeof dadosPreparados.custos_calculados === 'object'
    ) {
      dadosPreparados.custos_calculados = JSON.stringify(
        dadosPreparados.custos_calculados,
      );
    }
    if (dadosPreparados.tags != null && Array.isArray(dadosPreparados.tags)) {
      dadosPreparados.tags = JSON.stringify(dadosPreparados.tags);
    }

    if (
      Object.prototype.hasOwnProperty.call(dadosPreparados, 'horas_producao')
    ) {
      dadosPreparados.horas_producao = Math.max(
        Number(dadosPreparados.horas_producao ?? 0),
        0.01,
      );
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

    const configuracoesPersistidas =
      this.parseConfiguracaoCalculo(dados.configuracoes) ??
      this.parseConfiguracaoCalculo(dados.configuracao_calculo);

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
      valor_final_manual:
        configuracoesPersistidas?.valor_final_manual != null &&
        Number.isFinite(Number(configuracoesPersistidas.valor_final_manual))
          ? Number(configuracoesPersistidas.valor_final_manual)
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
        Number.isFinite(Number(configuracoesPersistidas.margem_lucro_padrao))
          ? Number(configuracoesPersistidas.margem_lucro_padrao)
          : undefined,
      impostos_customizados:
        configuracoesPersistidas?.impostos_padrao != null &&
        Number.isFinite(Number(configuracoesPersistidas.impostos_padrao))
          ? Number(configuracoesPersistidas.impostos_padrao)
          : undefined,
      tipo_margem_lucro: (() => {
        const t =
          dados.tipo_margem_lucro ??
          configuracoesPersistidas?.tipo_margem_lucro;
        if (t == null || String(t).trim() === '') return undefined;
        const normalized = String(t).trim().toLowerCase();
        return normalized === 'markup' || normalized === 'margem_por_dentro'
          ? normalized
          : undefined;
      })(),
      prazo_entrega: dados.prazo_entrega ?? undefined,
      validade_proposta: dados.validade_proposta ?? undefined,
      condicoes_comerciais: dados.condicoes_comerciais ?? undefined,
      atendente: dados.atendente ?? undefined,
      condicao_pagamento_tipo: dados.condicao_pagamento_tipo ?? undefined,
      condicao_pagamento_entrada_pct:
        dados.condicao_pagamento_entrada_pct != null
          ? Number(dados.condicao_pagamento_entrada_pct)
          : undefined,
      condicao_pagamento_parcelas:
        dados.condicao_pagamento_parcelas ?? undefined,
      condicao_pagamento_descricao:
        dados.condicao_pagamento_descricao ?? undefined,
      entrega_modalidade_id: dados.entrega_modalidade_id ?? undefined,
      entrega_usar_endereco_cliente:
        dados.entrega_usar_endereco_cliente ?? undefined,
      entrega_endereco_snapshot: dados.entrega_endereco_snapshot ?? undefined,
      entrega_cep: dados.entrega_cep ?? undefined,
      entrega_logradouro: dados.entrega_logradouro ?? undefined,
      entrega_numero: dados.entrega_numero ?? undefined,
      entrega_complemento: dados.entrega_complemento ?? undefined,
      entrega_bairro: dados.entrega_bairro ?? undefined,
      entrega_cidade: dados.entrega_cidade ?? undefined,
      entrega_estado: dados.entrega_estado ?? undefined,
      entrega_prazo_dias: dados.entrega_prazo_dias ?? undefined,
      entrega_valor_cobrado:
        dados.entrega_valor_cobrado != null
          ? Number(dados.entrega_valor_cobrado)
          : undefined,
      entrega_custo_estimado:
        dados.entrega_custo_estimado != null
          ? Number(dados.entrega_custo_estimado)
          : undefined,
      entrega_observacoes: dados.entrega_observacoes ?? undefined,
      entrega_modalidade_nome:
        dados.entrega_modalidade?.nome?.trim() ||
        (typeof configuracoesPersistidas?.entrega_modalidade_nome === 'string'
          ? configuracoesPersistidas.entrega_modalidade_nome.trim()
          : undefined),
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

  private normalizarTextoOpcional(
    valor: any,
    maxLength: number,
  ): string | null {
    if (valor === null || valor === undefined) return null;
    const texto = String(valor).trim();
    if (!texto) return null;
    return texto.slice(0, maxLength);
  }

  private normalizarNumeroOpcional(valor: any): number | null {
    if (valor === null || valor === undefined || valor === '') return null;
    const normalizado =
      typeof valor === 'string' ? valor.trim().replace(',', '.') : valor;
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : null;
  }

  private normalizarInteiroOpcional(valor: any): number | null {
    const numero = this.normalizarNumeroOpcional(valor);
    return numero === null ? null : Math.trunc(numero);
  }

  private normalizarBooleanOpcional(valor: any, fallback: boolean): boolean {
    if (valor === null || valor === undefined || valor === '') return fallback;
    return Boolean(valor);
  }

  private aplicarCamposEntrega(destino: any, origem: any): void {
    const camposEntrega = [
      'entrega_modalidade_id',
      'entrega_usar_endereco_cliente',
      'entrega_endereco_snapshot',
      'entrega_cep',
      'entrega_logradouro',
      'entrega_numero',
      'entrega_complemento',
      'entrega_bairro',
      'entrega_cidade',
      'entrega_estado',
      'entrega_prazo_dias',
      'entrega_valor_cobrado',
      'entrega_custo_estimado',
      'entrega_observacoes',
    ];
    const possuiCampoEntrega = camposEntrega.some((campo) =>
      Object.prototype.hasOwnProperty.call(origem, campo),
    );

    if (!possuiCampoEntrega) return;

    destino.entrega_modalidade_id = this.normalizarTextoOpcional(
      origem.entrega_modalidade_id,
      191,
    );
    destino.entrega_usar_endereco_cliente = this.normalizarBooleanOpcional(
      origem.entrega_usar_endereco_cliente,
      true,
    );
    destino.entrega_endereco_snapshot = this.normalizarTextoOpcional(
      origem.entrega_endereco_snapshot,
      300000,
    );
    destino.entrega_cep = this.normalizarTextoOpcional(origem.entrega_cep, 16);
    destino.entrega_logradouro = this.normalizarTextoOpcional(
      origem.entrega_logradouro,
      255,
    );
    destino.entrega_numero = this.normalizarTextoOpcional(
      origem.entrega_numero,
      32,
    );
    destino.entrega_complemento = this.normalizarTextoOpcional(
      origem.entrega_complemento,
      255,
    );
    destino.entrega_bairro = this.normalizarTextoOpcional(
      origem.entrega_bairro,
      120,
    );
    destino.entrega_cidade = this.normalizarTextoOpcional(
      origem.entrega_cidade,
      120,
    );
    destino.entrega_estado = this.normalizarTextoOpcional(
      origem.entrega_estado,
      2,
    )?.toUpperCase();
    destino.entrega_prazo_dias = this.normalizarInteiroOpcional(
      origem.entrega_prazo_dias,
    );
    destino.entrega_valor_cobrado = this.normalizarNumeroOpcional(
      origem.entrega_valor_cobrado,
    );
    destino.entrega_custo_estimado = this.normalizarNumeroOpcional(
      origem.entrega_custo_estimado,
    );
    destino.entrega_observacoes = this.normalizarTextoOpcional(
      origem.entrega_observacoes,
      500_000,
    );
  }

  private prepararCamposInstalacao(produto: any): any {
    return {
      instalacao_necessaria: this.normalizarBooleanOpcional(
        produto.instalacao_necessaria,
        false,
      ),
      instalacao_tipo_id: this.normalizarTextoOpcional(
        produto.instalacao_tipo_id,
        191,
      ),
      instalacao_regra_cobranca: this.normalizarTextoOpcional(
        produto.instalacao_regra_cobranca,
        24,
      ),
      instalacao_valor_unitario: this.normalizarNumeroOpcional(
        produto.instalacao_valor_unitario,
      ),
      instalacao_usar_endereco_entrega: this.normalizarBooleanOpcional(
        produto.instalacao_usar_endereco_entrega,
        true,
      ),
      instalacao_endereco_snapshot: this.normalizarTextoOpcional(
        produto.instalacao_endereco_snapshot,
        30000,
      ),
      instalacao_cep: this.normalizarTextoOpcional(produto.instalacao_cep, 16),
      instalacao_logradouro: this.normalizarTextoOpcional(
        produto.instalacao_logradouro,
        255,
      ),
      instalacao_numero: this.normalizarTextoOpcional(
        produto.instalacao_numero,
        32,
      ),
      instalacao_complemento: this.normalizarTextoOpcional(
        produto.instalacao_complemento,
        255,
      ),
      instalacao_bairro: this.normalizarTextoOpcional(
        produto.instalacao_bairro,
        120,
      ),
      instalacao_cidade: this.normalizarTextoOpcional(
        produto.instalacao_cidade,
        120,
      ),
      instalacao_estado: this.normalizarTextoOpcional(
        produto.instalacao_estado,
        2,
      )?.toUpperCase(),
      instalacao_preco_cobrado: this.normalizarNumeroOpcional(
        produto.instalacao_preco_cobrado,
      ),
      instalacao_custo_mao_obra: this.normalizarNumeroOpcional(
        produto.instalacao_custo_mao_obra,
      ),
      instalacao_custo_deslocamento: this.normalizarNumeroOpcional(
        produto.instalacao_custo_deslocamento,
      ),
      instalacao_tempo_estimado_min: this.normalizarInteiroOpcional(
        produto.instalacao_tempo_estimado_min,
      ),
      instalacao_quantidade_pessoas: this.normalizarInteiroOpcional(
        produto.instalacao_quantidade_pessoas,
      ),
      instalacao_observacoes: this.normalizarTextoOpcional(
        produto.instalacao_observacoes,
        50_000,
      ),
    };
  }

  private prepararProdutoCriacao(
    produto: any,
    index: number,
    lojaId?: string,
  ): any {
    const nomeProduto = (
      produto.nome_servico ||
      produto.nome ||
      `Produto ${index + 1}`
    ).toString();
    const toNumber = (valor: any, precision?: number): number => {
      const valorNormalizado =
        typeof valor === 'string' ? valor.trim().replace(',', '.') : valor;
      const numero =
        typeof valorNormalizado === 'number'
          ? valorNormalizado
          : Number(valorNormalizado);
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

    // Fase 11: profundidade convertida para number (Decimal aceitavel pelo Prisma) ou null.
    // Source-of-truth unica (guardrail 3): persistir o valor exatamente como veio do payload do operador.
    const profundidadeInput =
      produto.profundidade ??
      produto.profundidade_produto ??
      produto.profundidadeProduto;
    const profundidadeNum =
      profundidadeInput === null ||
      profundidadeInput === undefined ||
      profundidadeInput === ''
        ? null
        : toNumber(profundidadeInput, 3);
    const profundidadeNormalizada =
      profundidadeNum !== null &&
      Number.isFinite(profundidadeNum) &&
      profundidadeNum > 0
        ? profundidadeNum
        : null;

    // Fase 11 - log de diagnostico (guardrail 3). Mostra o input e o que sera persistido.
    this.logger.log(
      `[FASE11] prepararProdutoCriacao produto[${index}] "${nomeProduto}": ` +
        `input.profundidade=${JSON.stringify(profundidadeInput)} ` +
        `(type=${typeof profundidadeInput}), ` +
        `normalizada=${profundidadeNormalizada}`,
    );

    const produtoPreparado: any = {
      nome_servico: nomeProduto,
      nome: nomeProduto,
      descricao: produto.descricao ?? '',
      quantidade: Math.max(toNumber(produto.quantidade), 0.001),
      largura: produto.largura ?? null,
      altura: produto.altura ?? null,
      // Fase 11: profundidade opcional para produtos 3D. Null quando ausente ou invalida.
      profundidade: profundidadeNormalizada,
      area_produto: produto.area_produto || produto.area || null,
      unidade_medida: produto.unidade_medida || produto.unidade || 'un',
      perimetro_produto: produto.perimetro_produto ?? null,
      unidade_geometria: produto.unidade_geometria ?? null,
      geometria_origem: produto.geometria_origem ?? null,
      arquivo_geometria_url: produto.arquivo_geometria_url ?? null,
      arquivo_geometria_metadados: produto.arquivo_geometria_metadados ?? null,
      responsabilidade_arte: produto.responsabilidade_arte ?? 'NAO_APLICAVEL',
      politica_cobranca_arte: produto.politica_cobranca_arte ?? 'NAO_APLICAVEL',
      finalidade_anexo: produto.finalidade_anexo ?? null,
      complexidade_arte: produto.complexidade_arte ?? null,
      arte_custo_automatico: Boolean(produto.arte_custo_automatico),
      arte_referencia_servico_id: produto.arte_referencia_servico_id ?? null,
      arte_horas_calculadas: produto.arte_horas_calculadas ?? null,
      arte_custo_calculado: produto.arte_custo_calculado ?? null,
      observacoes: produto.observacoes,
      ordem: index,
      custo_total_producao: toNumber(produto.custo_total_producao, 2),
      preco_unitario: toNumber(produto.preco_unitario, 2),
      preco_total: toNumber(produto.preco_total, 2),
      margem_lucro: toNumber(produto.margem_lucro, 2),
      impostos: toNumber(produto.impostos, 2),
      ativo: true,
      tipo_item: produto.tipo_item || 'SOB_DEMANDA',
      produto_finito_id: produto.produto_finito_id || null,
      modo_fulfillment: produto.modo_fulfillment || null,
      fornecedor_terceirizado_id:
        produto.modo_fulfillment === 'OUTSOURCE' ||
        produto.modo_fulfillment === 'HIBRIDO'
          ? produto.fornecedor_terceirizado_id || null
          : null,
      terceirizacao_custo_unitario: this.normalizarNumeroOpcional(
        produto.terceirizacao_custo_unitario,
      ),
      terceirizacao_custo_setup: this.normalizarNumeroOpcional(
        produto.terceirizacao_custo_setup,
      ),
      terceirizacao_custo_frete: this.normalizarNumeroOpcional(
        produto.terceirizacao_custo_frete,
      ),
      terceirizacao_custo_total: this.normalizarNumeroOpcional(
        produto.terceirizacao_custo_total,
      ),
      terceirizacao_prazo_dias: this.normalizarInteiroOpcional(
        produto.terceirizacao_prazo_dias,
      ),
      terceirizacao_observacoes: this.normalizarTextoOpcional(
        produto.terceirizacao_observacoes,
        50_000,
      ),
      ...this.prepararCamposInstalacao(produto),
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
              usa_medida_propria: Boolean(insumo.usa_medida_propria),
              largura_material: insumo.usa_medida_propria
                ? toNumber(insumo.largura_material)
                : null,
              altura_material: insumo.usa_medida_propria
                ? toNumber(insumo.altura_material)
                : null,
              profundidade_material: insumo.usa_medida_propria
                ? toNumber(insumo.profundidade_material)
                : null,
              unidade_medida_material: insumo.usa_medida_propria
                ? insumo.unidade_medida_material || null
                : null,
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
              descricao: servico.descricao ?? null,
              origem: servico.origem ?? 'MANUAL',
              exibir_no_pdf:
                servico.exibir_no_pdf !== undefined
                  ? Boolean(servico.exibir_no_pdf)
                  : true,
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

    if (produto.personalizacao && lojaId) {
      const pers = produto.personalizacao;
      produtoPreparado.personalizacao = {
        create: {
          loja_id: lojaId,
          modo: pers.modo || 'NENHUM',
          estampa_id: pers.estampa_id || null,
          processo_id: pers.processo_id || null,
          valores_campos: pers.valores_campos ?? null,
          grade_distribuicao: pers.grade_distribuicao ?? null,
        },
      };
    }

    return produtoPreparado;
  }

  private prepararProdutosAtualizacao(
    produtosNovos: any[],
    produtosExistentes: any[],
    lojaId: string,
  ): any {
    // Estratégia: remover todos e recriar
    return {
      deleteMany: {},
      create: produtosNovos.map((produto, index) =>
        this.prepararProdutoCriacao(produto, index, lojaId),
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
        configuracoes.comissao_padrao ?? configuracoes.comissao_percentual ?? 0,
      ),
      custos_indiretos_padrao: configuracoes.custos_indiretos_padrao || 0,
      horas_produtivas_mensais: configuracoes.horas_produtivas_mensais || 0,
      custos_indiretos_mensais: configuracoes.custos_indiretos_mensais,
      regras_especiais: configuracoes.regras_especiais || [],
      valor_final_manual:
        configuracoes.valor_final_manual === null
          ? null
          : this.normalizarNumeroOpcional(configuracoes.valor_final_manual),
    };
    const tipoRaw =
      configuracoes.tipo_margem_lucro != null
        ? String(configuracoes.tipo_margem_lucro).trim().toLowerCase()
        : '';
    if (tipoRaw === 'markup' || tipoRaw === 'margem_por_dentro') {
      (base as any).tipo_margem_lucro = tipoRaw;
    }
    const nomeModalidadeEntrega =
      typeof configuracoes.entrega_modalidade_nome === 'string'
        ? configuracoes.entrega_modalidade_nome.trim()
        : '';
    if (nomeModalidadeEntrega) {
      (base as any).entrega_modalidade_nome = nomeModalidadeEntrega;
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

    return produtos.map((produto) => {
      const unidade = produto.unidade_medida || produto.unidade || 'un';
      return {
        id: produto.id,
        nome_servico: produto.nome_servico || produto.nome,
        nome: produto.nome || produto.nome_servico,
        descricao: produto.descricao,
        quantidade: produto.quantidade,
        unidade,
        unidade_medida: unidade,
        largura: produto.largura,
        altura: produto.altura,
        // Fase 11: profundidade propagada na resposta da listagem/detalhe (guardrail 3 - round-trip sem mutacao).
        profundidade: produto.profundidade ?? null,
        area: produto.area_produto || produto.area,
        area_produto: produto.area_produto || produto.area,
        perimetro_produto: produto.perimetro_produto,
        unidade_geometria: produto.unidade_geometria,
        geometria_origem: produto.geometria_origem,
        arquivo_geometria_url: produto.arquivo_geometria_url,
        arquivo_geometria_metadados: produto.arquivo_geometria_metadados,
        responsabilidade_arte: produto.responsabilidade_arte ?? 'NAO_APLICAVEL',
        politica_cobranca_arte:
          produto.politica_cobranca_arte ?? 'NAO_APLICAVEL',
        finalidade_anexo: produto.finalidade_anexo ?? null,
        complexidade_arte: produto.complexidade_arte ?? null,
        arte_custo_automatico: Boolean(produto.arte_custo_automatico),
        arte_referencia_servico_id: produto.arte_referencia_servico_id ?? null,
        arte_horas_calculadas:
          produto.arte_horas_calculadas != null
            ? Number(produto.arte_horas_calculadas)
            : null,
        arte_custo_calculado:
          produto.arte_custo_calculado != null
            ? Number(produto.arte_custo_calculado)
            : null,
        preco_unitario: produto.preco_unitario || 0,
        preco_total: produto.preco_total || 0,
        custo_total_producao:
          produto.custo_total_producao != null
            ? Number(produto.custo_total_producao)
            : undefined,
        margem_lucro: produto.margem_lucro || 0,
        impostos: produto.impostos || 0,
        observacoes: produto.observacoes,
        instalacao_necessaria: Boolean(produto.instalacao_necessaria),
        instalacao_tipo_id: produto.instalacao_tipo_id ?? null,
        instalacao_regra_cobranca: produto.instalacao_regra_cobranca ?? null,
        instalacao_valor_unitario:
          produto.instalacao_valor_unitario != null
            ? Number(produto.instalacao_valor_unitario)
            : null,
        instalacao_usar_endereco_entrega:
          produto.instalacao_usar_endereco_entrega ?? true,
        instalacao_endereco_snapshot:
          produto.instalacao_endereco_snapshot ?? null,
        instalacao_cep: produto.instalacao_cep ?? null,
        instalacao_logradouro: produto.instalacao_logradouro ?? null,
        instalacao_numero: produto.instalacao_numero ?? null,
        instalacao_complemento: produto.instalacao_complemento ?? null,
        instalacao_bairro: produto.instalacao_bairro ?? null,
        instalacao_cidade: produto.instalacao_cidade ?? null,
        instalacao_estado: produto.instalacao_estado ?? null,
        instalacao_preco_cobrado:
          produto.instalacao_preco_cobrado != null
            ? Number(produto.instalacao_preco_cobrado)
            : null,
        instalacao_custo_mao_obra:
          produto.instalacao_custo_mao_obra != null
            ? Number(produto.instalacao_custo_mao_obra)
            : null,
        instalacao_custo_deslocamento:
          produto.instalacao_custo_deslocamento != null
            ? Number(produto.instalacao_custo_deslocamento)
            : null,
        instalacao_tempo_estimado_min:
          produto.instalacao_tempo_estimado_min ?? null,
        instalacao_quantidade_pessoas:
          produto.instalacao_quantidade_pessoas ?? null,
        instalacao_observacoes: produto.instalacao_observacoes ?? null,
        modo_fulfillment: produto.modo_fulfillment ?? null,
        fornecedor_terceirizado_id:
          produto.fornecedor_terceirizado_id ?? null,
        terceirizacao_custo_unitario:
          produto.terceirizacao_custo_unitario != null
            ? Number(produto.terceirizacao_custo_unitario)
            : null,
        terceirizacao_custo_setup:
          produto.terceirizacao_custo_setup != null
            ? Number(produto.terceirizacao_custo_setup)
            : null,
        terceirizacao_custo_frete:
          produto.terceirizacao_custo_frete != null
            ? Number(produto.terceirizacao_custo_frete)
            : null,
        terceirizacao_custo_total:
          produto.terceirizacao_custo_total != null
            ? Number(produto.terceirizacao_custo_total)
            : null,
        terceirizacao_prazo_dias:
          produto.terceirizacao_prazo_dias ?? null,
        terceirizacao_observacoes:
          produto.terceirizacao_observacoes ?? null,

        tipo_item: produto.tipo_item || 'SOB_DEMANDA',
        produto_finito_id: produto.produto_finito_id ?? null,
        produto_finito: produto.produto_finito ?? null,
        personalizacao: produto.personalizacao
          ? {
              modo: produto.personalizacao.modo,
              estampa_id: produto.personalizacao.estampa_id ?? null,
              processo_id: produto.personalizacao.processo_id ?? null,
              valores_campos: produto.personalizacao.valores_campos ?? null,
              grade_distribuicao:
                produto.personalizacao.grade_distribuicao ?? null,
            }
          : undefined,

        insumos:
          produto.insumos?.map((insumo) => ({
            id: insumo.id,
            insumo_id: insumo.insumo_id,
            nome: insumo.nome,
            quantidade: insumo.quantidade,
            unidade: insumo.unidade,
            preco_unitario: insumo.preco_unitario || 0,
            preco_total: insumo.preco_total || 0,
            material_do_cliente: Boolean(insumo.material_do_cliente),
            usa_medida_propria: Boolean(insumo.usa_medida_propria),
            largura_material: insumo.largura_material ?? null,
            altura_material: insumo.altura_material ?? null,
            profundidade_material: insumo.profundidade_material ?? null,
            unidade_medida_material: insumo.unidade_medida_material ?? null,
            estoque_disponivel: insumo.estoque_disponivel,
            alerta_estoque: insumo.alerta_estoque || false,
          })) || [],

        maquinas:
          produto.maquinas?.map((maquina) => ({
            id: maquina.id,
            maquina_id: maquina.maquina_id,
            nome: maquina.nome,
            tempo_horas: maquina.tempo_horas,
            custo_hora: maquina.custo_hora || 0,
            custo_total: maquina.custo_total || 0,
          })) || [],

        funcoes:
          produto.funcoes?.map((funcao) => ({
            id: funcao.id,
            funcao_id: funcao.funcao_id,
            nome: funcao.nome,
            tempo_horas: funcao.tempo_horas,
            custo_hora: funcao.custo_hora || 0,
            custo_total: funcao.custo_total || 0,
          })) || [],

        servicos_manuais:
          produto.servicos_manuais?.map((servico) => ({
            id: servico.id,
            servico_id: servico.servico_id,
            nome: servico.nome,
            tempo_horas: servico.tempo_horas,
            horas_trabalhadas: servico.tempo_horas,
            custo_hora: servico.custo_hora || 0,
            custo_total: servico.custo_total || 0,
            origem: servico.origem ?? 'MANUAL',
            exibir_no_pdf: servico.exibir_no_pdf,
            descricao: servico.descricao ?? null,
          })) || [],

        custos_indiretos:
          produto.custos_indiretos?.map((custo) => ({
            custo_id: custo.custo_id,
            percentual: custo.percentual,
            valor_fixo: custo.valor_fixo || 0,
            custo_total: custo.custo_total || 0,
          })) || [],
      };
    });
  }

  /**
   * Normaliza produto vindo da interface/Prisma para criação (ex.: duplicar orçamento).
   */
  normalizarProdutoParaDuplicacao(produto: any): any {
    const unidade =
      produto?.unidade_medida ||
      produto?.unidade ||
      produto?.unidade_medida_produto ||
      'un';
    const nome = produto?.nome_servico || produto?.nome || 'Produto';

    return {
      nome_servico: nome,
      nome,
      descricao: produto?.descricao ?? '',
      quantidade: produto?.quantidade ?? 1,
      unidade,
      unidade_medida: unidade,
      largura: produto?.largura ?? null,
      altura: produto?.altura ?? null,
      profundidade: produto?.profundidade ?? null,
      area_produto: produto?.area_produto ?? produto?.area ?? null,
      perimetro_produto: produto?.perimetro_produto ?? null,
      unidade_geometria: produto?.unidade_geometria ?? null,
      geometria_origem: produto?.geometria_origem ?? null,
      arquivo_geometria_url: produto?.arquivo_geometria_url ?? null,
      arquivo_geometria_metadados: produto?.arquivo_geometria_metadados ?? null,
      responsabilidade_arte: produto?.responsabilidade_arte ?? 'NAO_APLICAVEL',
      politica_cobranca_arte:
        produto?.politica_cobranca_arte ?? 'NAO_APLICAVEL',
      finalidade_anexo: produto?.finalidade_anexo ?? null,
      complexidade_arte: produto?.complexidade_arte ?? null,
      arte_custo_automatico: Boolean(produto?.arte_custo_automatico),
      arte_referencia_servico_id: produto?.arte_referencia_servico_id ?? null,
      arte_horas_calculadas: produto?.arte_horas_calculadas ?? null,
      arte_custo_calculado: produto?.arte_custo_calculado ?? null,
      observacoes: produto?.observacoes,
      custo_total_producao: produto?.custo_total_producao,
      preco_unitario: produto?.preco_unitario,
      preco_total: produto?.preco_total,
      margem_lucro: produto?.margem_lucro,
      impostos: produto?.impostos,
      instalacao_necessaria: Boolean(produto?.instalacao_necessaria),
      instalacao_tipo_id: produto?.instalacao_tipo_id ?? null,
      instalacao_regra_cobranca: produto?.instalacao_regra_cobranca ?? null,
      instalacao_valor_unitario: produto?.instalacao_valor_unitario ?? null,
      instalacao_usar_endereco_entrega:
        produto?.instalacao_usar_endereco_entrega ?? true,
      instalacao_endereco_snapshot:
        produto?.instalacao_endereco_snapshot ?? null,
      instalacao_cep: produto?.instalacao_cep ?? null,
      instalacao_logradouro: produto?.instalacao_logradouro ?? null,
      instalacao_numero: produto?.instalacao_numero ?? null,
      instalacao_complemento: produto?.instalacao_complemento ?? null,
      instalacao_bairro: produto?.instalacao_bairro ?? null,
      instalacao_cidade: produto?.instalacao_cidade ?? null,
      instalacao_estado: produto?.instalacao_estado ?? null,
      instalacao_preco_cobrado: produto?.instalacao_preco_cobrado ?? null,
      instalacao_custo_mao_obra: produto?.instalacao_custo_mao_obra ?? null,
      instalacao_custo_deslocamento:
        produto?.instalacao_custo_deslocamento ?? null,
      instalacao_tempo_estimado_min:
        produto?.instalacao_tempo_estimado_min ?? null,
      instalacao_quantidade_pessoas:
        produto?.instalacao_quantidade_pessoas ?? null,
      instalacao_observacoes: produto?.instalacao_observacoes ?? null,
      modo_fulfillment: produto?.modo_fulfillment ?? null,
      fornecedor_terceirizado_id:
        produto?.fornecedor_terceirizado_id ?? null,
      terceirizacao_custo_unitario:
        produto?.terceirizacao_custo_unitario ?? null,
      terceirizacao_custo_setup: produto?.terceirizacao_custo_setup ?? null,
      terceirizacao_custo_frete: produto?.terceirizacao_custo_frete ?? null,
      terceirizacao_custo_total: produto?.terceirizacao_custo_total ?? null,
      terceirizacao_prazo_dias: produto?.terceirizacao_prazo_dias ?? null,
      terceirizacao_observacoes:
        produto?.terceirizacao_observacoes ?? null,
      insumos: (produto?.insumos || [])
        .filter((i: any) => i?.insumo_id)
        .map((insumo: any) => ({
          insumo_id: insumo.insumo_id,
          quantidade: insumo.quantidade,
          unidade: insumo.unidade || unidade,
          preco_unitario: insumo.preco_unitario,
          preco_total: insumo.preco_total,
          material_do_cliente: Boolean(insumo.material_do_cliente),
          usa_medida_propria: Boolean(insumo.usa_medida_propria),
          largura_material: insumo.largura_material ?? null,
          altura_material: insumo.altura_material ?? null,
          profundidade_material: insumo.profundidade_material ?? null,
          unidade_medida_material: insumo.unidade_medida_material ?? null,
        })),
      maquinas: (produto?.maquinas || [])
        .filter((m: any) => m?.maquina_id)
        .map((maquina: any) => ({
          maquina_id: maquina.maquina_id,
          tempo_horas: maquina.tempo_horas ?? maquina.horas_utilizadas,
          custo_hora: maquina.custo_hora,
          custo_total: maquina.custo_total,
        })),
      funcoes: (produto?.funcoes || [])
        .filter((f: any) => f?.funcao_id)
        .map((funcao: any) => ({
          funcao_id: funcao.funcao_id,
          tempo_horas: funcao.tempo_horas ?? funcao.horas_trabalhadas,
          custo_hora: funcao.custo_hora,
          custo_total: funcao.custo_total,
        })),
      servicos_manuais: (produto?.servicos_manuais || [])
        .filter((s: any) => s?.servico_id)
        .map((servico: any) => ({
          servico_id: servico.servico_id,
          tempo_horas: servico.tempo_horas ?? servico.horas_trabalhadas,
          custo_hora: servico.custo_hora,
          custo_total: servico.custo_total,
          origem: servico.origem ?? 'MANUAL',
          exibir_no_pdf: servico.exibir_no_pdf,
          descricao: servico.descricao ?? null,
        })),
      custos_indiretos: (produto?.custos_indiretos || [])
        .filter((c: any) => c?.custo_id)
        .map((custo: any) => ({
          custo_id: custo.custo_id,
          percentual: custo.percentual,
          valor_fixo: custo.valor_fixo,
        })),
    };
  }

  private transformarCustos(dados: any): any {
    if (!dados) return null;
    const precoFinal =
      Number(dados.preco_final) ||
      Number(dados.valor_total) ||
      (dados.custos_calculados && typeof dados.custos_calculados === 'object'
        ? Number(
            dados.custos_calculados.preco_final ??
              dados.custos_calculados.valor_total,
          )
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
      valor_final_manual:
        configuracoes.valor_final_manual != null &&
        Number.isFinite(Number(configuracoes.valor_final_manual))
          ? Number(configuracoes.valor_final_manual)
          : undefined,
    };
    const tipoRaw =
      configuracoes.tipo_margem_lucro != null
        ? String(configuracoes.tipo_margem_lucro).trim().toLowerCase()
        : '';
    if (tipoRaw === 'markup' || tipoRaw === 'margem_por_dentro') {
      (base as any).tipo_margem_lucro = tipoRaw;
    }
    const nomeModalidadeEntrega =
      typeof configuracoes.entrega_modalidade_nome === 'string'
        ? configuracoes.entrega_modalidade_nome.trim()
        : '';
    if (nomeModalidadeEntrega) {
      (base as any).entrega_modalidade_nome = nomeModalidadeEntrega;
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
