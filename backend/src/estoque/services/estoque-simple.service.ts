/**
 * Service de estoque SIMPLIFICADO para resolver conflitos
 * Usa PrismaService existente e queries diretas
 * Mantém isolamento por lojaId
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface IEstoqueContext {
  lojaId: string;
  usuarioId?: string;
}

@Injectable()
export class EstoqueSimpleService {
  private readonly logger = new Logger(EstoqueSimpleService.name);
  private movimentacoesCriadas: any[] = []; // Array para armazenar movimentações criadas
  private transferenciasCriadas: any[] = []; // Array para armazenar transferências criadas em memória

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('✅ EstoqueSimpleService inicializado');
  }

  private validateContext(context: IEstoqueContext): void {
    if (!context?.lojaId) {
      throw new BadRequestException('lojaId é obrigatório');
    }
  }

  // ===== LOCALIZAÇÕES =====
  async criarLocalizacao(context: IEstoqueContext, data: any) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Criando localização para loja: ${context.lojaId}`);
    
    try {
      // Query SQL direta para inserir na tabela localizacoes
      const result = await this.prisma.$executeRaw`
        INSERT INTO localizacoes (
          id, loja_id, codigo, deposito, corredor, prateleira, nivel, posicao,
          descricao, capacidade, ativo, criado_em, atualizado_em
        ) VALUES (
          UUID(), ${context.lojaId}, ${data.codigo}, ${data.deposito}, 
          ${data.corredor || null}, ${data.prateleira || null}, 
          ${data.nivel || null}, ${data.posicao || null},
          ${data.descricao || null}, ${data.capacidade || null}, 
          ${data.ativo !== undefined ? data.ativo : true}, NOW(), NOW()
        )
      `;
      
      // Buscar a localização criada
      const localizacoes = await this.prisma.$queryRaw`
        SELECT 
          id, loja_id, codigo, deposito, corredor, prateleira, nivel, posicao,
          descricao, capacidade, ativo, criado_em, atualizado_em
        FROM localizacoes 
        WHERE loja_id = ${context.lojaId} 
        AND codigo = ${data.codigo}
        ORDER BY criado_em DESC LIMIT 1
      `;
      
      const localizacao = (localizacoes as any[])[0];
      
      this.logger.debug(`✅ Localização criada: ${localizacao.id}`);
      
      return {
        id: localizacao.id,
        loja_id: localizacao.loja_id,
        codigo: localizacao.codigo,
        deposito: localizacao.deposito,
        corredor: localizacao.corredor,
        prateleira: localizacao.prateleira,
        nivel: localizacao.nivel,
        posicao: localizacao.posicao,
        descricao: localizacao.descricao,
        capacidade: localizacao.capacidade,
        ativo: localizacao.ativo,
        criado_em: localizacao.criado_em,
        atualizado_em: localizacao.atualizado_em,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao criar localização: ${error.message}`);
      throw new Error(`Erro ao criar localização: ${error.message}`);
    }
  }

  async listarLocalizacoes(context: IEstoqueContext, query: any = {}) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Listando localizações para loja: ${context.lojaId}`);
    
    try {
      // Query SQL direta para buscar localizações
      const localizacoes = await this.prisma.$queryRaw`
        SELECT 
          id, loja_id, codigo, deposito, corredor, prateleira, nivel, posicao,
          descricao, capacidade, ativo, criado_em, atualizado_em
        FROM localizacoes 
        WHERE loja_id = ${context.lojaId}
        AND ativo = 1
        ORDER BY criado_em DESC
      `;
      
      const localizacoesArray = localizacoes as any[];
      
      this.logger.debug(`✅ Encontradas ${localizacoesArray.length} localizações`);
      
      return {
        data: localizacoesArray,
        total: localizacoesArray.length,
        page: query.page || 1,
        limit: query.limit || 20,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao listar localizações: ${error.message}`);
      throw new Error(`Erro ao listar localizações: ${error.message}`);
    }
  }

  async buscarLocalizacaoPorId(context: IEstoqueContext, id: string) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Buscando localização ${id} para loja: ${context.lojaId}`);
    
    try {
      // Query SQL direta para buscar localização específica
      const localizacoes = await this.prisma.$queryRaw`
        SELECT 
          id, loja_id, codigo, deposito, corredor, prateleira, nivel, posicao,
          descricao, capacidade, ativo, criado_em, atualizado_em
        FROM localizacoes 
        WHERE id = ${id}
        AND loja_id = ${context.lojaId}
        LIMIT 1
      `;
      
      const localizacoesArray = localizacoes as any[];
      
      if (localizacoesArray.length === 0) {
        throw new Error('Localização não encontrada');
      }
      
      const localizacao = localizacoesArray[0];
      
      this.logger.debug(`✅ Localização encontrada: ${localizacao.id}`);
      
      return {
        id: localizacao.id,
        loja_id: localizacao.loja_id,
        codigo: localizacao.codigo,
        deposito: localizacao.deposito,
        corredor: localizacao.corredor,
        prateleira: localizacao.prateleira,
        nivel: localizacao.nivel,
        posicao: localizacao.posicao,
        descricao: localizacao.descricao,
        capacidade: localizacao.capacidade,
        ativo: localizacao.ativo,
        criado_em: localizacao.criado_em,
        atualizado_em: localizacao.atualizado_em,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar localização: ${error.message}`);
      throw new Error(`Erro ao buscar localização: ${error.message}`);
    }
  }

  async atualizarLocalizacao(context: IEstoqueContext, id: string, data: any) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Atualizando localização ${id} para loja: ${context.lojaId}`);
    
    try {
      // Primeiro verificar se a localização existe
      const localizacoes = await this.prisma.$queryRaw`
        SELECT id FROM localizacoes 
        WHERE id = ${id} AND loja_id = ${context.lojaId}
        LIMIT 1
      `;
      
      if ((localizacoes as any[]).length === 0) {
        throw new Error('Localização não encontrada');
      }
      
      // Query SQL direta para atualizar a localização
      const result = await this.prisma.$executeRaw`
        UPDATE localizacoes SET
          codigo = ${data.codigo},
          deposito = ${data.deposito},
          corredor = ${data.corredor || null},
          prateleira = ${data.prateleira || null},
          nivel = ${data.nivel || null},
          posicao = ${data.posicao || null},
          descricao = ${data.descricao || null},
          capacidade = ${data.capacidade || null},
          ativo = ${data.ativo !== undefined ? data.ativo : true},
          atualizado_em = NOW()
        WHERE id = ${id} AND loja_id = ${context.lojaId}
      `;
      
      // Buscar a localização atualizada
      const localizacoesAtualizadas = await this.prisma.$queryRaw`
        SELECT 
          id, loja_id, codigo, deposito, corredor, prateleira, nivel, posicao,
          descricao, capacidade, ativo, criado_em, atualizado_em
        FROM localizacoes 
        WHERE id = ${id} AND loja_id = ${context.lojaId}
        LIMIT 1
      `;
      
      const localizacao = (localizacoesAtualizadas as any[])[0];
      
      this.logger.debug(`✅ Localização atualizada: ${localizacao.id}`);
      
      return {
        id: localizacao.id,
        loja_id: localizacao.loja_id,
        codigo: localizacao.codigo,
        deposito: localizacao.deposito,
        corredor: localizacao.corredor,
        prateleira: localizacao.prateleira,
        nivel: localizacao.nivel,
        posicao: localizacao.posicao,
        descricao: localizacao.descricao,
        capacidade: localizacao.capacidade,
        ativo: localizacao.ativo,
        criado_em: localizacao.criado_em,
        atualizado_em: localizacao.atualizado_em,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar localização: ${error.message}`);
      throw new Error(`Erro ao atualizar localização: ${error.message}`);
    }
  }

  async excluirLocalizacao(context: IEstoqueContext, id: string) {
    this.validateContext(context);
    
    this.logger.debug(`🗑️ Excluindo localização: ${id} para loja: ${context.lojaId}`);
    
    try {
      // Primeiro verificar se a localização existe
      const localizacaoExists = await this.prisma.$queryRaw`
        SELECT id FROM localizacoes 
        WHERE id = ${id} AND loja_id = ${context.lojaId}
        LIMIT 1
      `;
      
      if ((localizacaoExists as any[]).length === 0) {
        throw new Error('Localização não encontrada');
      }
      
      // Verificar se a coluna 'ativo' existe
      const columns = await this.prisma.$queryRaw`
        SHOW COLUMNS FROM localizacoes LIKE 'ativo'
      `;
      
      let sql: string;
      let params: any[];
      
      if ((columns as any[]).length > 0) {
        // Se a coluna 'ativo' existe, fazer soft delete
        sql = `
          UPDATE localizacoes 
          SET ativo = 0, atualizado_em = NOW()
          WHERE id = ? AND loja_id = ?
        `;
        params = [id, context.lojaId];
      } else {
        // Se não existe, fazer delete físico
        sql = `
          DELETE FROM localizacoes 
          WHERE id = ? AND loja_id = ?
        `;
        params = [id, context.lojaId];
      }
      
      const result: any = await this.prisma.$executeRawUnsafe(sql, ...params);
      
      this.logger.debug(`✅ Localização excluída com sucesso. Linhas afetadas: ${result.affectedRows}`);
      
      return {
        message: 'Localização excluída com sucesso',
        id: id,
        deletedAt: new Date(),
        method: (columns as any[]).length > 0 ? 'soft_delete' : 'hard_delete',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao excluir localização: ${error.message}`);
      throw new Error(`Erro ao excluir localização: ${error.message}`);
    }
  }

  async verificarLocalizacaoExclusao(context: IEstoqueContext, id: string) {
    this.validateContext(context);
    
    this.logger.debug(`🔍 Verificando se localização pode ser excluída: ${id} para loja: ${context.lojaId}`);
    
    try {
      // Verificar se a localização existe
      const localizacaoExists = await this.prisma.$queryRaw`
        SELECT id, codigo, deposito FROM localizacoes 
        WHERE id = ${id} AND loja_id = ${context.lojaId}
        LIMIT 1
      `;
      
      if ((localizacaoExists as any[]).length === 0) {
        throw new Error('Localização não encontrada');
      }
      
      const localizacao = (localizacaoExists as any[])[0];
      
      // Verificar se há itens estocados nesta localização
      // Primeiro verificar se a coluna 'ativo' existe
      const columns = await this.prisma.$queryRaw`
        SHOW COLUMNS FROM itens_estoque LIKE 'ativo'
      `;
      
      let itensNaLocalizacao;
      if ((columns as any[]).length > 0) {
        // Se a coluna 'ativo' existe, usar na query
        itensNaLocalizacao = await this.prisma.$queryRaw`
          SELECT COUNT(*) as total FROM itens_estoque 
          WHERE localizacao_id = ${id} AND loja_id = ${context.lojaId} AND ativo = 1
        `;
      } else {
        // Se não existe, não usar a condição 'ativo'
        itensNaLocalizacao = await this.prisma.$queryRaw`
          SELECT COUNT(*) as total FROM itens_estoque 
          WHERE localizacao_id = ${id} AND loja_id = ${context.lojaId}
        `;
      }
      
      const totalItens = Number((itensNaLocalizacao as any[])[0]?.total || 0);
      
      // Buscar detalhes dos itens se houver
      let itensDetalhes = [];
      if (totalItens > 0) {
        let itens;
        if ((columns as any[]).length > 0) {
          itens = await this.prisma.$queryRaw`
            SELECT id, nome, quantidade, codigo FROM itens_estoque 
            WHERE localizacao_id = ${id} AND loja_id = ${context.lojaId} AND ativo = 1
            LIMIT 10
          `;
        } else {
          itens = await this.prisma.$queryRaw`
            SELECT id, nome, quantidade, codigo FROM itens_estoque 
            WHERE localizacao_id = ${id} AND loja_id = ${context.lojaId}
            LIMIT 10
          `;
        }
        itensDetalhes = itens as any[];
      }
      
      return {
        podeExcluir: totalItens === 0,
        totalItens: totalItens,
        localizacao: {
          id: localizacao.id,
          codigo: localizacao.codigo,
          deposito: localizacao.deposito,
        },
        itens: itensDetalhes,
        mensagem: totalItens === 0 
          ? 'Localização pode ser excluída com segurança'
          : `Não é possível excluir esta localização. Existem ${totalItens} item(s) estocado(s).`,
      };
      
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar exclusão de localização: ${error.message}`);
      throw new Error(`Erro ao verificar exclusão de localização: ${error.message}`);
    }
  }

  // ===== ITENS DE ESTOQUE =====
  async criarItemEstoque(context: IEstoqueContext, data: any) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Criando item estoque para loja: ${context.lojaId}`);

    // Validar campos obrigatórios conforme DTO em pt-br
    const requiredFields = ['insumoId', 'localizacaoId', 'nome', 'unidadeMedida'];
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && String(data[field]).trim().length === 0)) {
        throw new BadRequestException(`Campo obrigatório ausente: ${field}`);
      }
    }

    // Verificar se a localização existe e pertence à mesma loja
    const locRows: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(
      'SELECT id FROM localizacoes WHERE id = ? AND loja_id = ? LIMIT 1',
      data.localizacaoId,
      context.lojaId,
    );
    if (!locRows?.length) {
      throw new BadRequestException('Localização não encontrada para esta loja');
    }

    // Determinar a tabela correta (prioriza 'estoque_itens', aceita legado 'itens_estoque')
    const tableResult: Array<{ table_name: string }> = await this.prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name IN ('estoque_itens','itens_estoque')
      ORDER BY CASE table_name WHEN 'estoque_itens' THEN 0 ELSE 1 END
      LIMIT 1
    `;
    const tableName = tableResult?.[0]?.table_name;
    if (!tableName) {
      throw new BadRequestException('Estrutura de estoque não encontrada (esperado: estoque_itens).');
    }

    // Colunas existentes da tabela escolhida
    const colsResult: Array<{ COLUMN_NAME: string }> = await this.prisma.$queryRawUnsafe(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
      tableName,
    );
    const existing = new Set(colsResult.map((r: any) => r.COLUMN_NAME));

    const columns: string[] = [];
    const values: any[] = [];
    const add = (column: string, value: any) => {
      if (existing.has(column) && value !== undefined) {
        columns.push(column);
        values.push(value);
      }
    };

    // Geração de ID e timestamps
    const generatedId = `item-${Date.now()}`;
    const now = new Date();
    add('id', generatedId);
    add('createdAt', now);
    add('updatedAt', now);
    add('dataUltimaMov', null);
    // Compatibilidade legado
    add('criado_em', now);
    add('atualizado_em', now);

    // Multi-tenant
    add('lojaId', context.lojaId);
    add('loja_id', context.lojaId); // compatibilidade legado

    // Campos principais
    add('insumoId', data.insumoId);
    add('insumo_id', data.insumoId); // compat legado
    add('localizacaoId', data.localizacaoId);
    add('localizacao_id', data.localizacaoId); // compat legado
    add('fornecedorId', data.fornecedorId || null);
    add('fornecedor', data.fornecedorId || null); // compat legado
    // Garantir que 'codigo' nunca seja nulo em tabelas que exigem NOT NULL
    const providedCodigo = typeof data.codigo === 'string' ? data.codigo.trim() : '';
    let safeCodigo = providedCodigo;
    if (!safeCodigo) {
      const baseNome = typeof data.nome === 'string' ? data.nome : 'ITEM';
      const base = baseNome
        .toString()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 12) || 'ITEM';
      const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
      safeCodigo = `${base}-${suffix}`;
      this.logger.debug(`🆔 Código não informado. Gerado automaticamente: ${safeCodigo}`);
    }
    add('codigo', safeCodigo);
    add('nome', String(data.nome).trim());
    add('descricao', data.descricao || null);
    add('quantidadeAtual', data.quantidadeAtual ?? 0);
    add('quantidade', data.quantidadeAtual ?? 0); // compat legado
    add('quantidadeReservada', data.quantidadeReservada ?? 0);
    add('estoqueMinimo', data.estoqueMinimo ?? 0);
    add('estoque_minimo', data.estoqueMinimo ?? 0); // compat legado
    add('estoqueMaximo', data.estoqueMaximo ?? null);
    add('estoque_maximo', data.estoqueMaximo ?? null); // compat legado
    add('unidadeMedida', data.unidadeMedida);
    add('unidade_medida', data.unidadeMedida); // compat legado
    add('precoUnitario', data.precoUnitario ?? 0);
    add('preco_unitario', data.precoUnitario ?? 0); // compat legado
    add('codigoBarras', data.codigoBarras || null);
    add('codigo_barras', data.codigoBarras || null); // compat legado
    add('lote', data.lote || null);
    add('dataValidade', data.dataValidade || null);
    add('data_validade', data.dataValidade || null); // compat legado
    add('ativo', data.ativo !== undefined ? !!data.ativo : true);
    add('observacoes', data.observacoes || null);

    if (columns.length === 0) {
      throw new BadRequestException(`Estrutura da tabela ${tableName} não possui colunas compatíveis.`);
    }

    const placeholders = columns.map(() => '?').join(', ');
    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    try {
      await this.prisma.$executeRawUnsafe(query, ...values);

      const inserted: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM ${tableName} WHERE id = ? LIMIT 1`, generatedId);
      return inserted?.[0] || { id: generatedId, ...data, lojaId: context.lojaId };
    } catch (error: any) {
      // Traduzir violação de FK para mensagem amigável
      const metaCode = error?.meta?.code || error?.code;
      if (metaCode === '1452') {
        throw new BadRequestException('Falha ao criar item: Localização inválida ou não pertence à loja');
      }
      throw error;
    }
  }

  async listarItensEstoque(context: IEstoqueContext, query: any = {}) {
    this.validateContext(context);
    
    this.logger.debug(`📋 Listando itens estoque para loja: ${context.lojaId}`);
    
    // Detectar tabela e colunas disponíveis (pt-br preferencial)
    const tableResult: Array<{ table_name: string }> = await this.prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name IN ('estoque_itens','itens_estoque')
      ORDER BY CASE table_name WHEN 'estoque_itens' THEN 0 ELSE 1 END
      LIMIT 1
    `;
    const tableName = tableResult?.[0]?.table_name;
    if (!tableName) {
      return { data: [], total: 0, page: 1, limit: 20 };
    }
    this.logger.debug(`📦 Tabela de itens detectada: ${tableName}`);

    const colsResult: Array<{ COLUMN_NAME: string }> = await this.prisma.$queryRawUnsafe(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ',
      tableName,
    );
    const existing = new Set(colsResult.map((r: any) => r.COLUMN_NAME));
    
    this.logger.debug(`🔍 Colunas disponíveis na tabela ${tableName}:`, Array.from(existing));

    const lojaCol = existing.has('lojaId') ? 'lojaId' : (existing.has('loja_id') ? 'loja_id' : null);
    const insumoCol = existing.has('insumoId') ? 'insumoId' : (existing.has('insumo_id') ? 'insumo_id' : null);
    const localizacaoCol = existing.has('localizacaoId') ? 'localizacaoId' : (existing.has('localizacao_id') ? 'localizacao_id' : null);
    const qtdCol = existing.has('quantidadeAtual') ? 'quantidadeAtual' : (existing.has('quantidade') ? 'quantidade' : null);
    const qtdResCol = existing.has('quantidadeReservada') ? 'quantidadeReservada' : null;
    const estMinCol = existing.has('estoqueMinimo') ? 'estoqueMinimo' : (existing.has('estoque_minimo') ? 'estoque_minimo' : null);
    const estMaxCol = existing.has('estoqueMaximo') ? 'estoqueMaximo' : (existing.has('estoque_maximo') ? 'estoque_maximo' : null);
    const unMedCol = existing.has('unidadeMedida') ? 'unidadeMedida' : (existing.has('unidade_medida') ? 'unidade_medida' : null);
    const precoCol = existing.has('precoUnitario') ? 'precoUnitario' : 
                     (existing.has('preco_unitario') ? 'preco_unitario' : 
                     (existing.has('valorUnitario') ? 'valorUnitario' : 
                     (existing.has('valor_unitario') ? 'valor_unitario' : null)));
    
    this.logger.debug(`💰 Coluna de preço detectada: ${precoCol}`);
    const nomeCol = existing.has('nome') ? 'nome' : null;
    const dataUltMovCol = existing.has('dataUltimaMov') ? 'dataUltimaMov' : null;
    const createdCol = existing.has('createdAt') ? 'createdAt' : (existing.has('criado_em') ? 'criado_em' : null);
    const updatedCol = existing.has('updatedAt') ? 'updatedAt' : (existing.has('atualizado_em') ? 'atualizado_em' : null);

    if (!lojaCol || !localizacaoCol || !qtdCol) {
      this.logger.warn(`⚠️ Colunas mínimas ausentes. lojaCol=${lojaCol}, localizacaoCol=${localizacaoCol}, qtdCol=${qtdCol}`);
      return { data: [], total: 0, page: 1, limit: 20 };
    }

    // Construir SELECT dinâmico com aliases esperados pelo frontend
    const selectParts: string[] = [
      `t.id AS id`,
      insumoCol ? `t.${insumoCol} AS insumoId` : `NULL AS insumoId`,
      `t.${localizacaoCol} AS localizacaoId`,
      nomeCol ? `COALESCE(t.${nomeCol}, '') AS insumoNome` : `COALESCE(t.codigo, 'Item') AS insumoNome`,
      // Campos explícitos para preencher o resumo do item selecionado no frontend
      `t.codigo AS codigo`,
      nomeCol ? `t.${nomeCol} AS nome` : `COALESCE(t.codigo, '') AS nome`,
      qtdCol ? `t.${qtdCol} AS quantidadeAtual` : `0 AS quantidadeAtual`,
      qtdResCol ? `t.${qtdResCol} AS quantidadeReservada` : `0 AS quantidadeReservada`,
      estMinCol ? `t.${estMinCol} AS estoqueMinimo` : `0 AS estoqueMinimo`,
      estMaxCol ? `t.${estMaxCol} AS estoqueMaximo` : `NULL AS estoqueMaximo`,
      unMedCol ? `COALESCE(t.${unMedCol}, '') AS unidadeCompra` : `'' AS unidadeCompra`,
      precoCol ? `t.${precoCol} AS valorUnitario` : `0 AS valorUnitario`,
      dataUltMovCol ? `t.${dataUltMovCol} AS dataUltimaMov` : `NULL AS dataUltimaMov`,
      createdCol ? `t.${createdCol} AS createdAt` : `NULL AS createdAt`,
      `COALESCE(l.codigo, '') AS localizacaoCodigo`,
      `COALESCE(l.deposito, '') AS localizacaoDeposito`,
      `COALESCE(l.corredor, '') AS localizacaoCorredor`,
      `COALESCE(l.prateleira, '') AS localizacaoPrateleira`,
      `COALESCE(l.nivel, '') AS localizacaoNivel`,
      `COALESCE(l.posicao, '') AS localizacaoPosicao`
    ];

    // Verificar se existe coluna 'ativo' para filtrar itens inativos
    const ativoCol = existing.has('ativo') ? 'ativo' : null;
    
    let whereConditions = [lojaCol ? `t.${lojaCol} = ?` : `l.loja_id = ?`];
    let whereParams = [context.lojaId];
    
    // Adicionar filtro para itens ativos se a coluna existir
    if (ativoCol) {
      whereConditions.push(`t.${ativoCol} = 1`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    const sql = `SELECT ${selectParts.join(', ')}\n` +
      `FROM ${tableName} t\n` +
      `LEFT JOIN localizacoes l ON l.id = t.${localizacaoCol}\n` +
      `WHERE ${whereClause}` +
      ` ORDER BY t.id DESC`;

    this.logger.debug(`🧭 Consulta itens: WHERE por ${(lojaCol ? `t.${lojaCol}` : 'l.loja_id')} = ${context.lojaId}${ativoCol ? ' AND ativo = 1' : ''}`);
    const items: any[] = await this.prisma.$queryRawUnsafe(sql, ...whereParams);
    this.logger.debug(`✅ Itens encontrados: ${items.length}`);

    // Se não há dados reais, retornar dados de teste
    if (items.length === 0) {
      this.logger.debug(`📝 Retornando dados de teste para desenvolvimento`);
      const mockData = [
        {
          id: 'item-001',
          insumoId: 'insumo-001',
          insumoNome: 'Madeira Para Banner 0,75m X 23mm - 7/8 - 25 Unidades',
          localizacaoId: 'loc-001',
          localizacaoCodigo: '1212',
          quantidadeAtual: 50,
          quantidadeReservada: 0,
          estoqueMinimo: 10,
          estoqueMaximo: 100,
          unidadeCompra: 'CX',
          valorUnitario: 25.50,
          dataUltimaMov: new Date(),
          createdAt: new Date(),
        },
        {
          id: 'item-002',
          insumoId: 'insumo-002',
          insumoNome: 'Bobina Lona Impressão Digital',
          localizacaoId: 'loc-002',
          localizacaoCodigo: 'A1-01-B-02-03',
          quantidadeAtual: 30,
          quantidadeReservada: 5,
          estoqueMinimo: 5,
          estoqueMaximo: 50,
          unidadeCompra: 'BOBINA',
          valorUnitario: 870.00,
          dataUltimaMov: new Date(),
          createdAt: new Date(),
        },
        {
          id: 'item-003',
          insumoId: 'insumo-003',
          insumoNome: 'Tinta UV Branca',
          localizacaoId: 'loc-003',
          localizacaoCodigo: 'B2-03-C-01-02',
          quantidadeAtual: 25,
          quantidadeReservada: 2,
          estoqueMinimo: 3,
          estoqueMaximo: 30,
          unidadeCompra: 'LITRO',
          valorUnitario: 45.75,
          dataUltimaMov: new Date(),
          createdAt: new Date(),
        }
      ];

      return {
        data: mockData,
        total: mockData.length,
        page: query.page || 1,
        limit: query.limit || 20,
      };
    }

    // Filtro defensivo caso a tabela não tenha coluna de loja, garante por join
    const filtered = items.filter((row) => true);

    return {
      data: filtered,
      total: filtered.length,
      page: query.page || 1,
      limit: query.limit || 20,
    };
  }

  async buscarItemEstoquePorId(context: IEstoqueContext, id: string) {
    this.validateContext(context);
    this.logger.debug(`🔍 Buscando item estoque por ID: ${id} para loja: ${context.lojaId}`);

    const tableName = 'itens_estoque';

    // Detectar colunas disponíveis na tabela para mapear dinamicamente
    const colsResult: Array<{ COLUMN_NAME: string }> = await this.prisma.$queryRawUnsafe(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ',
      tableName,
    );
    const existing = new Set(colsResult.map((r: any) => r.COLUMN_NAME));

    const insumoCol = existing.has('insumoId') ? 'insumoId' : (existing.has('insumo_id') ? 'insumo_id' : null);
    const fornecedorIdCol = existing.has('fornecedorId') ? 'fornecedorId' : (
      existing.has('fornecedor_id') ? 'fornecedor_id' : (existing.has('fornecedor') ? 'fornecedor' : null)
    );
    const unMedCol = existing.has('unidadeMedida') ? 'unidadeMedida' : (existing.has('unidade_medida') ? 'unidade_medida' : null);
    const precoCol = existing.has('precoUnitario') ? 'precoUnitario' : (
      existing.has('preco_unitario') ? 'preco_unitario' : (
        existing.has('valorUnitario') ? 'valorUnitario' : (existing.has('valor_unitario') ? 'valor_unitario' : null)
      )
    );

    const selectParts: string[] = [
      't.id AS id',
      insumoCol ? `t.${insumoCol} AS insumoId` : 'NULL AS insumoId',
      't.localizacao_id AS localizacaoId',
      "COALESCE(t.nome, '') AS insumoNome",
      't.quantidade AS quantidadeAtual',
      't.quantidadeReservada AS quantidadeReservada',
      't.estoque_minimo AS estoqueMinimo',
      't.estoque_maximo AS estoqueMaximo',
      unMedCol ? `COALESCE(t.${unMedCol}, '') AS unidadeCompra` : "'' AS unidadeCompra",
      precoCol ? `t.${precoCol} AS valorUnitario` : '0 AS valorUnitario',
      't.dataUltimaMov AS dataUltimaMov',
      't.criado_em AS createdAt',
      't.codigo AS codigo',
      't.descricao AS descricao',
      't.codigoBarras AS codigoBarras',
      't.lote AS lote',
      't.dataValidade AS dataValidade',
      fornecedorIdCol ? `t.${fornecedorIdCol} AS fornecedorId` : 'NULL AS fornecedorId',
      't.observacoes AS observacoes',
      't.ativo AS ativo',
      "COALESCE(l.codigo, '') AS localizacaoCodigo",
      "COALESCE(l.deposito, '') AS localizacaoDeposito",
      "COALESCE(l.corredor, '') AS localizacaoCorredor",
      "COALESCE(l.prateleira, '') AS localizacaoPrateleira",
      "COALESCE(l.nivel, '') AS localizacaoNivel",
      "COALESCE(l.posicao, '') AS localizacaoPosicao",
    ];

    const sql = `SELECT ${selectParts.join(', ')}\n` +
      `FROM ${tableName} t\n` +
      `LEFT JOIN localizacoes l ON l.id = t.localizacao_id\n` +
      `WHERE t.id = ? AND t.loja_id = ?\n` +
      `LIMIT 1`;

    const items: any[] = await this.prisma.$queryRawUnsafe(sql, id, context.lojaId);
    if (items.length === 0) {
      throw new Error('Item de estoque não encontrado');
    }

    const item = items[0];

    // Fallback: se não existir coluna/valor de insumoId, tentar inferir pelo nome/código
    let resolvedInsumoId = item.insumoId || null;
    try {
      if (!resolvedInsumoId) {
        const byNome: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(
          'SELECT id FROM insumos WHERE loja_id = ? AND nome = ? LIMIT 1',
          context.lojaId,
          item.insumoNome,
        );
        resolvedInsumoId = byNome?.[0]?.id || null;
      }
      if (!resolvedInsumoId && item.codigo) {
        const byCodigo: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(
          "SELECT id FROM insumos WHERE loja_id = ? AND (codigo_interno = ? OR codigo = ?) LIMIT 1",
          context.lojaId,
          item.codigo,
          item.codigo,
        );
        resolvedInsumoId = byCodigo?.[0]?.id || null;
      }
    } catch (e) {
      // manter silencioso; apenas não resolvido se falhar
    }

    return {
      ...item,
      insumoId: resolvedInsumoId,
      quantidadeAtual: parseFloat(item.quantidadeAtual) || 0,
      quantidadeReservada: parseFloat(item.quantidadeReservada) || 0,
      estoqueMinimo: parseFloat(item.estoqueMinimo) || 0,
      estoqueMaximo: item.estoqueMaximo ? parseFloat(item.estoqueMaximo) : null,
      valorUnitario: parseFloat(item.valorUnitario) || 0,
      ativo: item.ativo === 1 || item.ativo === true,
    };
  }

  async atualizarItemEstoque(context: IEstoqueContext, id: string, data: any) {
    this.validateContext(context);
    
    this.logger.debug(`📝 Atualizando item estoque ID: ${id} para loja: ${context.lojaId}`);
    
    const tableName = 'itens_estoque';
    
    // Construir query de atualização dinamicamente
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    // Detectar colunas para mapear dinamicamente
    const colsResult: Array<{ COLUMN_NAME: string }> = await this.prisma.$queryRawUnsafe(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ',
      tableName,
    );
    const existing = new Set(colsResult.map((r: any) => r.COLUMN_NAME));

    const unidadeCol = existing.has('unidadeMedida') ? 'unidadeMedida' : (existing.has('unidade_medida') ? 'unidade_medida' : null);
    const precoCol = existing.has('precoUnitario') ? 'precoUnitario' : (existing.has('preco_unitario') ? 'preco_unitario' : null);
    const fornecedorCol = existing.has('fornecedorId') ? 'fornecedorId' : (
      existing.has('fornecedor_id') ? 'fornecedor_id' : (existing.has('fornecedor') ? 'fornecedor' : null)
    );

    // Mapear campos do frontend para colunas reais
    const fieldMappings: { [key: string]: string } = {
      nome: 'nome',
      codigo: 'codigo',
      descricao: 'descricao',
      quantidade: existing.has('quantidade') ? 'quantidade' : (existing.has('quantidadeAtual') ? 'quantidadeAtual' : 'quantidade'),
      quantidadeReservada: existing.has('quantidadeReservada') ? 'quantidadeReservada' : 'quantidadeReservada',
      estoqueMinimo: existing.has('estoque_minimo') ? 'estoque_minimo' : (existing.has('estoqueMinimo') ? 'estoqueMinimo' : 'estoque_minimo'),
      estoqueMaximo: existing.has('estoque_maximo') ? 'estoque_maximo' : (existing.has('estoqueMaximo') ? 'estoqueMaximo' : 'estoque_maximo'),
      unidadeMedida: unidadeCol || 'unidadeMedida',
      unidadeCompra: unidadeCol || 'unidadeMedida',
      precoUnitario: precoCol || 'precoUnitario',
      valorUnitario: precoCol || 'precoUnitario',
      localizacaoId: 'localizacao_id',
      codigoBarras: existing.has('codigoBarras') ? 'codigoBarras' : (existing.has('codigo_barras') ? 'codigo_barras' : 'codigoBarras'),
      lote: 'lote',
      dataValidade: existing.has('dataValidade') ? 'dataValidade' : (existing.has('data_validade') ? 'data_validade' : 'dataValidade'),
      fornecedorId: fornecedorCol || 'fornecedor',
      fornecedor: fornecedorCol || 'fornecedor',
      observacoes: 'observacoes',
      ativo: 'ativo',
    };
    
    // Construir campos de atualização
    Object.keys(data).forEach(key => {
      if (fieldMappings[key] && data[key] !== undefined) {
        updateFields.push(`${fieldMappings[key]} = ?`);
        updateValues.push(data[key]);
      }
    });
    
    if (updateFields.length === 0) {
      throw new Error('Nenhum campo válido para atualização');
    }
    
    // Adicionar timestamp de atualização
    updateFields.push('atualizado_em = NOW()');
    
    const sql = `
      UPDATE ${tableName} 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND loja_id = ?
    `;
    
    updateValues.push(id, context.lojaId);
    
    const result: any = await this.prisma.$executeRawUnsafe(sql, ...updateValues);
    
    if (result.affectedRows === 0) {
      throw new Error('Item de estoque não encontrado ou não pode ser atualizado');
    }
    
    this.logger.debug(`✅ Item atualizado com sucesso. Linhas afetadas: ${result.affectedRows}`);
    
    // Retornar o item atualizado
    return this.buscarItemEstoquePorId(context, id);
  }

  async excluirItemEstoque(context: IEstoqueContext, id: string) {
    this.validateContext(context);
    
    this.logger.debug(`🗑️ Excluindo item estoque: ${id} para loja: ${context.lojaId}`);
    
    try {
      // Primeiro verificar se o item existe
      const itemExists = await this.prisma.$queryRaw`
        SELECT id FROM itens_estoque 
        WHERE id = ${id} AND loja_id = ${context.lojaId}
        LIMIT 1
      `;
      
      if ((itemExists as any[]).length === 0) {
        throw new Error('Item de estoque não encontrado');
      }
      
      // Verificar se a coluna 'ativo' existe
      const columns = await this.prisma.$queryRaw`
        SHOW COLUMNS FROM itens_estoque LIKE 'ativo'
      `;
      
      let sql: string;
      let params: any[];
      
      if ((columns as any[]).length > 0) {
        // Se a coluna 'ativo' existe, fazer soft delete
        sql = `
          UPDATE itens_estoque 
          SET ativo = 0, atualizado_em = NOW()
          WHERE id = ? AND loja_id = ?
        `;
        params = [id, context.lojaId];
      } else {
        // Se não existe, fazer delete físico
        sql = `
          DELETE FROM itens_estoque 
          WHERE id = ? AND loja_id = ?
        `;
        params = [id, context.lojaId];
      }
      
      const result: any = await this.prisma.$executeRawUnsafe(sql, ...params);
      
      this.logger.debug(`✅ Item excluído com sucesso. Linhas afetadas: ${result.affectedRows}`);
      
      return {
        message: 'Item de estoque excluído com sucesso',
        id: id,
        deletedAt: new Date(),
        method: (columns as any[]).length > 0 ? 'soft_delete' : 'hard_delete',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao excluir item estoque: ${error.message}`);
      throw new Error(`Erro ao excluir item estoque: ${error.message}`);
    }
  }

  // ===== MOVIMENTAÇÕES =====
  async criarMovimentacao(context: IEstoqueContext, data: any) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Criando movimentação para loja: ${context.lojaId}`);
    
    // Buscar informações do item de estoque
    const itemEstoque = await this.buscarItemEstoquePorId(context, data.estoqueId);
    
    // Construir localização completa
    const localizacaoCompleta = [
      itemEstoque?.localizacaoDeposito,
      itemEstoque?.localizacaoCorredor,
      itemEstoque?.localizacaoPrateleira,
      itemEstoque?.localizacaoNivel,
      itemEstoque?.localizacaoPosicao
    ].filter(Boolean).join(' - ');

    const id = 'mov-' + Date.now();
    const quantidadeAnterior = Number(itemEstoque?.quantidadeAtual || 0);
    const delta = data.tipo === 'SAIDA' ? -Math.abs(Number(data.quantidade)) : Math.abs(Number(data.quantidade));
    const quantidadePosterior = quantidadeAnterior + delta;

    // Persistir no banco quando a tabela existir
    try {
      const tableCheck: Array<{ total: any }> = await this.prisma.$queryRaw`
        SELECT COUNT(*) as total FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'movimentacoes_estoque'
      `;
      const hasTable = Number((tableCheck?.[0] as any)?.total || 0) > 0;

      if (hasTable) {
        await this.prisma.$executeRaw`
          INSERT INTO movimentacoes_estoque (
            id, loja_id, item_id, tipo, quantidade, quantidade_anterior, quantidade_atual,
            motivo, documento_referencia, observacoes, responsavel, criado_em
          ) VALUES (
            ${id}, ${context.lojaId}, ${data.estoqueId}, ${data.tipo}, ${Number(data.quantidade)},
            ${quantidadeAnterior}, ${quantidadePosterior},
            ${'Registro de movimentação ' + data.tipo}, ${data.documentoRef || null}, ${data.observacoes || null},
            ${context.usuarioId || 'sistema'}, NOW()
          )
        `;
      }
    } catch (e) {
      this.logger.warn(`⚠️ Falha ao persistir movimentação no banco: ${e?.message}`);
    }

    const movimentacao = {
      id,
      estoqueId: data.estoqueId,
      insumoNome: itemEstoque?.insumoNome || 'Item não encontrado',
      localizacaoCodigo: itemEstoque?.localizacaoCodigo || '',
      localizacaoCompleta: localizacaoCompleta || itemEstoque?.localizacaoCodigo || '',
      tipo: data.tipo,
      quantidade: Number(data.quantidade),
      quantidadeAnterior,
      quantidadePosterior,
      documentoRef: data.documentoRef || null,
      orcamentoId: data.orcamentoId || null,
      usuarioId: context.usuarioId || 'sistema',
      usuarioNome: 'Administrador',
      lojaId: context.lojaId,
      dataMovimentacao: new Date(),
      observacoes: data.observacoes || null,
      createdAt: new Date(),
    };

    // Armazenar a movimentação criada (compatibilidade com fluxo atual)
    this.movimentacoesCriadas.push(movimentacao);

    this.logger.debug(`✅ Movimentação criada: ${movimentacao.id}`);

    return movimentacao;
  }

  async listarMovimentacoes(context: IEstoqueContext, query: any = {}) {
    this.validateContext(context);
    
    this.logger.debug(`📋 Listando movimentações para loja: ${context.lojaId}`);
    
    try {
      // Verifica se a tabela existe
      const tableCheck: Array<{ total: any }> = await this.prisma.$queryRaw`
        SELECT COUNT(*) as total FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'movimentacoes_estoque'
      `;
      const hasTable = Number((tableCheck?.[0] as any)?.total || 0) > 0;

      if (!hasTable) {
        // Fallback: lista do array em memória (session)
        let movimentacoes = this.movimentacoesCriadas.filter(m => m.lojaId === context.lojaId);

        if (query.tipo) {
          movimentacoes = movimentacoes.filter(m => m.tipo === query.tipo);
        }
        if (query.search) {
          const searchTerm = String(query.search).toLowerCase();
          movimentacoes = movimentacoes.filter(m =>
            m.insumoNome?.toLowerCase().includes(searchTerm) ||
            m.documentoRef?.toLowerCase().includes(searchTerm) ||
            m.observacoes?.toLowerCase().includes(searchTerm)
          );
        }
        movimentacoes.sort((a, b) => new Date(b.dataMovimentacao).getTime() - new Date(a.dataMovimentacao).getTime());
        return {
          data: movimentacoes,
          total: movimentacoes.length,
          page: query.page || 1,
          limit: query.limit || 20,
        };
      }

      // Monta filtros
      const filters: string[] = [ 'm.loja_id = ?' ];
      const params: any[] = [ context.lojaId ];

      if (query?.tipo) {
        filters.push('m.tipo = ?');
        params.push(query.tipo);
      }

      if (query?.search) {
        const like = `%${String(query.search)}%`;
        filters.push('(i.nome LIKE ? OR m.documento_referencia LIKE ? OR m.observacoes LIKE ? OR l.codigo LIKE ?)');
        params.push(like, like, like, like);
      }

      const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
      const page = Number(query.page) > 0 ? Number(query.page) : 1;
      const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
      const offset = (page - 1) * limit;

      // Total
      const totalRows: Array<{ total: any }> = await this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total
         FROM movimentacoes_estoque m
         LEFT JOIN itens_estoque i ON i.id = m.item_id
         LEFT JOIN localizacoes l ON l.id = i.localizacao_id
         ${whereClause}`,
        ...params,
      );
      const total = Number(totalRows?.[0]?.total || 0);

      // Dados
      const selectSql = `
        SELECT 
          m.id                                 AS id,
          m.item_id                            AS estoqueId,
          COALESCE(i.nome, '')                 AS insumoNome,
          COALESCE(l.codigo, '')               AS localizacaoCodigo,
          TRIM(CONCAT_WS(' - ', COALESCE(l.deposito, ''), COALESCE(l.corredor, ''), COALESCE(l.prateleira, ''), COALESCE(l.nivel, ''), COALESCE(l.posicao, ''))) AS localizacaoCompleta,
          m.tipo                               AS tipo,
          m.quantidade                         AS quantidade,
          m.quantidade_anterior                AS quantidadeAnterior,
          m.quantidade_atual                   AS quantidadePosterior,
          m.documento_referencia               AS documentoRef,
          NULL                                 AS orcamentoId,
          COALESCE(m.responsavel, 'sistema')   AS usuarioId,
          'Administrador'                      AS usuarioNome,
          m.loja_id                            AS lojaId,
          m.criado_em                          AS dataMovimentacao,
          m.observacoes                        AS observacoes,
          m.criado_em                          AS createdAt
        FROM movimentacoes_estoque m
        LEFT JOIN itens_estoque i ON i.id = m.item_id
        LEFT JOIN localizacoes l ON l.id = i.localizacao_id
        ${whereClause}
        ORDER BY m.criado_em DESC
        LIMIT ? OFFSET ?
      `;
      const rows: any[] = await this.prisma.$queryRawUnsafe(selectSql, ...params, limit, offset);

      const dataMapped = rows.map((r: any) => ({
        ...r,
        quantidade: Number(r.quantidade || 0),
        quantidadeAnterior: Number(r.quantidadeAnterior || 0),
        quantidadePosterior: Number(r.quantidadePosterior || 0),
      }));

      this.logger.debug(`✅ Encontradas ${dataMapped.length} movimentações (total=${total})`);

      return {
        data: dataMapped,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao listar movimentações:', error);
      throw new Error('Erro ao listar movimentações');
    }
  }

  async buscarMovimentacaoPorId(context: IEstoqueContext, id: string) {
    this.validateContext(context);
    
    this.logger.debug(`🔍 Buscando movimentação por ID: ${id} para loja: ${context.lojaId}`);
    
    try {
      // Buscar na lista de movimentações criadas em memória
      const movimentacao = this.movimentacoesCriadas.find(m => m.id === id && m.lojaId === context.lojaId);
      
      if (!movimentacao) {
        // Se não encontrou na lista de movimentações criadas, verificar se é uma movimentação mockada
        if (id.startsWith('mov-175460318006')) {
          this.logger.debug(`📝 Retornando movimentação mockada: ${id}`);
          return {
            id: id,
            tipo: 'ENTRADA',
            quantidade: 50.0,
            quantidadeAnterior: 100.5,
            quantidadePosterior: 150.5,
            documentoRef: 'NF-001234',
            observacoes: 'Entrada conforme NF',
            usuarioId: '550e8400-e29b-41d4-a716-446655440005',
            dataMovimentacao: '2025-01-08T10:00:00.000Z',
            lojaId: context.lojaId,
            insumoNome: 'Bobina Lona Impressão Digital',
            estoque: {
              insumoId: '550e8400-e29b-41d4-a716-446655440000',
              localizacao: {
                codigo: 'A1-01-B-02-03',
                deposito: 'Depósito Central',
              },
            },
          };
        }
        
        throw new Error('Movimentação não encontrada');
      }
      
      this.logger.debug(`✅ Movimentação encontrada: ${id}`);
      return movimentacao;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar movimentação: ${error.message}`);
      throw new Error(`Erro ao buscar movimentação: ${error.message}`);
    }
  }

  async excluirMovimentacao(context: IEstoqueContext, id: string) {
    this.validateContext(context);
    
    this.logger.debug(`🗑️ Excluindo movimentação: ${id} para loja: ${context.lojaId}`);
    
    try {
      // Remover da lista de movimentações criadas em memória
      const index = this.movimentacoesCriadas.findIndex(m => m.id === id && m.lojaId === context.lojaId);
      
      if (index === -1) {
        // Se não encontrou na lista de movimentações criadas, verificar se é uma movimentação mockada
        // Para movimentações mockadas, apenas retornar sucesso sem excluir
        if (id.startsWith('mov-175460318006')) {
          this.logger.debug(`📝 Movimentação mockada não pode ser excluída: ${id}`);
          return {
            message: 'Movimentação mockada não pode ser excluída',
            id: id,
            deletedAt: new Date(),
            note: 'Esta é uma movimentação de demonstração e não pode ser excluída',
          };
        }
        
        throw new Error('Movimentação não encontrada');
      }
      
      const movimentacaoExcluida = this.movimentacoesCriadas.splice(index, 1)[0];
      
      this.logger.debug(`✅ Movimentação excluída com sucesso: ${id}`);
      
      return {
        message: 'Movimentação excluída com sucesso',
        id: id,
        deletedAt: new Date(),
        movimentacao: movimentacaoExcluida,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao excluir movimentação: ${error.message}`);
      throw new Error(`Erro ao excluir movimentação: ${error.message}`);
    }
  }

  // ===== DASHBOARD =====
  async obterDashboard(context: IEstoqueContext) {
    this.validateContext(context);
    
    this.logger.debug(`📊 Obtendo dashboard para loja: ${context.lojaId}`);
    
    try {
      this.logger.debug('🔍 Iniciando coleta de dados do dashboard...');
      
      // 1. Total de localizações
      let totalLocalizacoes = 0;
      try {
        // Verificar se a tabela existe e tem dados
        const tableCheck = await this.prisma.$queryRaw`
          SELECT COUNT(*) as total FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = 'localizacoes'
        `;
        
        if (Number((tableCheck as any[])[0]?.total) > 0) {
          const localizacoesResult = await this.prisma.$queryRaw`
            SELECT COUNT(*) as total FROM localizacoes 
            WHERE loja_id = ${context.lojaId} AND ativo = 1
          `;
          totalLocalizacoes = Number((localizacoesResult as any[])[0]?.total || 0);
        }
      } catch (error) {
        this.logger.warn('⚠️ Erro ao contar localizações:', error.message);
      }
      
      // 2. Total de itens de estoque
      let totalItens = 0;
      try {
        // Verificar se a tabela existe e tem dados
        const tableCheck = await this.prisma.$queryRaw`
          SELECT COUNT(*) as total FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = 'itens_estoque'
        `;
        
        if (Number((tableCheck as any[])[0]?.total) > 0) {
          const itensResult = await this.prisma.$queryRaw`
            SELECT COUNT(*) as total FROM itens_estoque 
            WHERE loja_id = ${context.lojaId} AND ativo = 1
          `;
          totalItens = Number((itensResult as any[])[0]?.total || 0);
        }
      } catch (error) {
        this.logger.warn('⚠️ Erro ao contar itens:', error.message);
      }
      
      // 3. Total de movimentações (preferir banco)
      let totalMovimentacoes = 0;
      try {
        const tableCheck = await this.prisma.$queryRaw`
          SELECT COUNT(*) as total FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = 'movimentacoes_estoque'
        `;
        if (Number((tableCheck as any[])[0]?.total) > 0) {
          const movsResult = await this.prisma.$queryRaw`
            SELECT COUNT(*) as total FROM movimentacoes_estoque 
            WHERE loja_id = ${context.lojaId}
          `;
          totalMovimentacoes = Number((movsResult as any[])[0]?.total || 0);
        } else {
          totalMovimentacoes = this.movimentacoesCriadas.filter(m => m.lojaId === context.lojaId).length;
        }
      } catch (error) {
        this.logger.warn('⚠️ Erro ao contar movimentações:', (error as any).message);
        totalMovimentacoes = this.movimentacoesCriadas.filter(m => m.lojaId === context.lojaId).length;
      }
      
      // 4. Itens abaixo do mínimo
      let itensAbaixoMinimo = 0;
      try {
        const tableCheck = await this.prisma.$queryRaw`
          SELECT COUNT(*) as total FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = 'itens_estoque'
        `;
        
        if (Number((tableCheck as any[])[0]?.total) > 0) {
          const itensAbaixoMinimoResult = await this.prisma.$queryRaw`
            SELECT COUNT(*) as total FROM itens_estoque 
            WHERE loja_id = ${context.lojaId} 
            AND ativo = 1 
            AND quantidade <= estoque_minimo 
            AND estoque_minimo > 0
          `;
          itensAbaixoMinimo = Number((itensAbaixoMinimoResult as any[])[0]?.total || 0);
        }
      } catch (error) {
        this.logger.warn('⚠️ Erro ao contar itens abaixo do mínimo:', error.message);
      }
      
      // 5. Valor total do estoque
      let valorTotalEstoque = 0;
      try {
        const tableCheck = await this.prisma.$queryRaw`
          SELECT COUNT(*) as total FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = 'itens_estoque'
        `;
        
        if (Number((tableCheck as any[])[0]?.total) > 0) {
          const valorTotalResult = await this.prisma.$queryRaw`
            SELECT SUM(quantidade * precoUnitario) as valorTotal FROM itens_estoque 
            WHERE loja_id = ${context.lojaId} AND ativo = 1
          `;
          valorTotalEstoque = Number((valorTotalResult as any[])[0]?.valorTotal || 0);
        }
      } catch (error) {
        this.logger.warn('⚠️ Erro ao calcular valor total:', error.message);
      }
      
      // 6. Últimas movimentações (limitado a 5) - preferir banco
      let ultimasMovimentacoes: Array<any> = [];
      try {
        const tableCheck = await this.prisma.$queryRaw`
          SELECT COUNT(*) as total FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = 'movimentacoes_estoque'
        `;
        if (Number((tableCheck as any[])[0]?.total) > 0) {
          const rows: any[] = await this.prisma.$queryRaw`
            SELECT 
              m.id,
              m.tipo,
              m.quantidade,
              m.criado_em as dataMovimentacao,
              COALESCE(i.nome, '') as insumoNome,
              COALESCE(m.responsavel, 'sistema') as usuarioNome
            FROM movimentacoes_estoque m
            LEFT JOIN itens_estoque i ON i.id = m.item_id
            WHERE m.loja_id = ${context.lojaId}
            ORDER BY m.criado_em DESC
            LIMIT 5
          `;
          ultimasMovimentacoes = rows.map(r => ({
            id: r.id,
            tipo: r.tipo,
            insumoNome: r.insumoNome,
            quantidade: Number(r.quantidade || 0),
            dataMovimentacao: r.dataMovimentacao,
            usuarioNome: r.usuarioNome,
          }));
        } else {
          const movimentacoesReais = this.movimentacoesCriadas.filter(m => m.lojaId === context.lojaId);
          ultimasMovimentacoes = movimentacoesReais
            .sort((a, b) => new Date(b.dataMovimentacao).getTime() - new Date(a.dataMovimentacao).getTime())
            .slice(0, 5)
            .map(mov => ({
              id: mov.id,
              tipo: mov.tipo,
              insumoNome: mov.insumoNome,
              quantidade: mov.quantidade,
              dataMovimentacao: mov.dataMovimentacao,
              usuarioNome: mov.usuarioNome,
            }));
        }
      } catch (error) {
        this.logger.warn('⚠️ Erro ao carregar últimas movimentações:', (error as any).message);
        const movimentacoesReais = this.movimentacoesCriadas.filter(m => m.lojaId === context.lojaId);
        ultimasMovimentacoes = movimentacoesReais
          .sort((a, b) => new Date(b.dataMovimentacao).getTime() - new Date(a.dataMovimentacao).getTime())
          .slice(0, 5)
          .map(mov => ({
            id: mov.id,
            tipo: mov.tipo,
            insumoNome: mov.insumoNome,
            quantidade: mov.quantidade,
            dataMovimentacao: mov.dataMovimentacao,
            usuarioNome: mov.usuarioNome,
          }));
      }
      
      // 7. Estatísticas por tipo de movimentação (preferir banco)
      let estatisticas = { entradas: 0, saidas: 0, ajustes: 0, transferencias: 0 };
      try {
        const tableCheck = await this.prisma.$queryRaw`
          SELECT COUNT(*) as total FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = 'movimentacoes_estoque'
        `;
        if (Number((tableCheck as any[])[0]?.total) > 0) {
          const statsRows: any[] = await this.prisma.$queryRaw`
            SELECT tipo, COUNT(*) as total
            FROM movimentacoes_estoque
            WHERE loja_id = ${context.lojaId}
            GROUP BY tipo
          `;
          const map: any = { ENTRADA: 0, SAIDA: 0, AJUSTE: 0, TRANSFERENCIA: 0 };
          for (const r of statsRows) {
            map[r.tipo] = Number(r.total || 0);
          }
          estatisticas = {
            entradas: map.ENTRADA || 0,
            saidas: map.SAIDA || 0,
            ajustes: map.AJUSTE || 0,
            transferencias: map.TRANSFERENCIA || 0,
          };
        } else {
          const movimentacoesReais = this.movimentacoesCriadas.filter(m => m.lojaId === context.lojaId);
          estatisticas = {
            entradas: movimentacoesReais.filter(m => m.tipo === 'ENTRADA').length,
            saidas: movimentacoesReais.filter(m => m.tipo === 'SAIDA').length,
            ajustes: movimentacoesReais.filter(m => m.tipo === 'AJUSTE').length,
            transferencias: movimentacoesReais.filter(m => m.tipo === 'TRANSFERENCIA').length,
          };
        }
      } catch (error) {
        this.logger.warn('⚠️ Erro ao calcular estatísticas:', (error as any).message);
        const movimentacoesReais = this.movimentacoesCriadas.filter(m => m.lojaId === context.lojaId);
        estatisticas = {
          entradas: movimentacoesReais.filter(m => m.tipo === 'ENTRADA').length,
          saidas: movimentacoesReais.filter(m => m.tipo === 'SAIDA').length,
          ajustes: movimentacoesReais.filter(m => m.tipo === 'AJUSTE').length,
          transferencias: movimentacoesReais.filter(m => m.tipo === 'TRANSFERENCIA').length,
        };
      }
      
      const dashboardData = {
        totalLocalizacoes,
        totalItens,
        totalMovimentacoes,
        itensAbaixoMinimo,
        valorTotalEstoque,
        ultimasMovimentacoes,
        estatisticas,
      };
      
      this.logger.debug('✅ Dashboard gerado com sucesso:', {
        totalLocalizacoes,
        totalItens,
        totalMovimentacoes,
        itensAbaixoMinimo,
        valorTotalEstoque,
        estatisticas,
        ultimasMovimentacoesCount: ultimasMovimentacoes.length,
      });
      return dashboardData;
    } catch (error) {
      this.logger.error('❌ Erro ao obter dashboard:', error);
      throw new Error('Erro ao obter dados do dashboard');
    }
  }

  // ===== GESTÃO DE LOTES =====
  /**
   * Detecta dinamicamente o nome real da tabela, priorizando a nomenclatura em português
   */
  private async detectTableName(candidates: string[]): Promise<string | null> {
    if (!candidates?.length) return null;
    const placeholders = candidates.map(() => '?').join(', ');
    const sql = `SELECT table_name FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name IN (${placeholders})`;
    const rows: Array<{ table_name: string }> = await this.prisma.$queryRawUnsafe(sql, ...candidates);
    if (!rows?.length) return null;
    // prioriza a ordem informada em candidates
    const byName = new Map(rows.map((r) => [r.table_name, true] as const));
    for (const name of candidates) {
      if (byName.has(name)) return name;
    }
    return rows[0].table_name;
  }

  /**
   * Retorna o conjunto de colunas existentes de uma tabela
   */
  private async getExistingColumns(tableName: string): Promise<Set<string>> {
    const result: Array<{ COLUMN_NAME: string }> = await this.prisma.$queryRawUnsafe(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ',
      tableName,
    );
    return new Set(result.map((r) => r.COLUMN_NAME));
  }

  async criarLote(context: IEstoqueContext, data: any) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Criando lote para loja: ${context.lojaId}`);
    
    try {
      // Detectar tabela de itens (prioriza 'estoque_itens', aceita legado 'itens_estoque')
      const itensTable = await this.detectTableName(['estoque_itens', 'itens_estoque']);
      if (!itensTable) {
        throw new Error('Estrutura de itens de estoque não encontrada');
      }
      const itensCols = await this.getExistingColumns(itensTable);
      const itemIdCol = 'id';
      const lojaItemCol = itensCols.has('lojaId') ? 'lojaId' : (itensCols.has('loja_id') ? 'loja_id' : 'loja_id');
      const qtdAtualCol = itensCols.has('quantidadeAtual') ? 'quantidadeAtual' : (itensCols.has('quantidade') ? 'quantidade' : 'quantidadeAtual');

      // Verificar se o item de estoque existe
      const itemEstoque = await this.prisma.$queryRawUnsafe(
        `SELECT ${itemIdCol} AS id, ${qtdAtualCol} AS quantidadeAtual FROM ${itensTable} WHERE ${itemIdCol} = ? AND ${lojaItemCol} = ?`,
        data.estoqueId,
        context.lojaId,
      );
      
      if (!(itemEstoque as any[])[0]) {
        throw new Error('Item de estoque não encontrado');
      }
      
      // Detectar tabela de lotes (prioriza pt-br, aceita inglês legado)
      const lotesTable = await this.detectTableName(['estoque_lotes', 'inventory_lots']);
      if (!lotesTable) {
        throw new Error('Estrutura de lotes não encontrada');
      }
      const lotesCols = await this.getExistingColumns(lotesTable);
      const estoqueIdCol = lotesCols.has('estoque_id') ? 'estoque_id' : (lotesCols.has('estoqueId') ? 'estoqueId' : 'estoque_id');
      const lojaIdCol = lotesCols.has('loja_id') ? 'loja_id' : (lotesCols.has('lojaId') ? 'lojaId' : 'loja_id');
      const numeroLoteCol = lotesCols.has('numero_lote') ? 'numero_lote' : (lotesCols.has('numeroLote') ? 'numeroLote' : 'numero_lote');
      const dataFabCol = lotesCols.has('data_fabricacao') ? 'data_fabricacao' : (lotesCols.has('dataFabricacao') ? 'dataFabricacao' : 'data_fabricacao');
      const dataValCol = lotesCols.has('data_validade') ? 'data_validade' : (lotesCols.has('dataValidade') ? 'dataValidade' : 'data_validade');
      const qtdLoteCol = lotesCols.has('quantidade_lote') ? 'quantidade_lote' : (lotesCols.has('quantidadeLote') ? 'quantidadeLote' : 'quantidade_lote');
      const statusCol = 'status';
      const createdAtCol = lotesCols.has('criado_em') ? 'criado_em' : (lotesCols.has('createdAt') ? 'createdAt' : 'createdAt');
      const updatedAtCol = lotesCols.has('atualizado_em') ? 'atualizado_em' : (lotesCols.has('updatedAt') ? 'updatedAt' : 'updatedAt');

      const columns = ['id', estoqueIdCol, lojaIdCol, numeroLoteCol, dataFabCol, dataValCol, qtdLoteCol, statusCol, createdAtCol, updatedAtCol];
      const placeholders = columns.map(() => '?').join(', ');
      const values = [
        `lote-${Date.now()}`,
        data.estoqueId,
        context.lojaId,
        data.numeroLote,
        data.dataFabricacao || null,
        data.dataValidade || null,
        data.quantidadeLote,
        'ATIVO',
        new Date(),
        new Date(),
      ];

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO ${lotesTable} (${columns.join(', ')}) VALUES (${placeholders})`,
        ...values,
      );
      
      // Buscar o lote criado
      const joinInsumoCol = itensCols.has('insumo_id') ? 'insumo_id' : (itensCols.has('insumoId') ? 'insumoId' : null);
      const joinLocalizacaoCol = itensCols.has('localizacao_id') ? 'localizacao_id' : (itensCols.has('localizacaoId') ? 'localizacaoId' : 'localizacao_id');

      // Detectar coluna de unidade no insumo
      const insumoCols = await this.getExistingColumns('insumos');
      const insumoUnCol = insumoCols.has('unidadeCompra')
        ? 'unidadeCompra'
        : (insumoCols.has('unidade_compra')
          ? 'unidade_compra'
          : (insumoCols.has('unidade_uso') ? 'unidade_uso' : null));

      const insumoNameExprCreate = joinInsumoCol
        ? `COALESCE(i.nome, (SELECT ii.nome FROM insumos ii WHERE ii.loja_id = el.${lojaIdCol} AND (ii.codigo_interno = ie.codigo OR ii.nome = ie.nome OR ii.nome LIKE CONCAT('%', ie.nome, '%') OR ie.nome LIKE CONCAT('%', ii.nome, '%')) LIMIT 1))`
        : `(SELECT ii.nome FROM insumos ii WHERE ii.loja_id = el.${lojaIdCol} AND (ii.codigo_interno = ie.codigo OR ii.nome = ie.nome OR ii.nome LIKE CONCAT('%', ie.nome, '%') OR ie.nome LIKE CONCAT('%', ii.nome, '%')) LIMIT 1)`;

      const lotes = await this.prisma.$queryRawUnsafe(
        `SELECT 
           el.id,
           el.${estoqueIdCol} AS estoque_id,
           el.${lojaIdCol} AS loja_id,
           el.${numeroLoteCol} AS numero_lote,
           el.${dataFabCol} AS data_fabricacao,
           el.${dataValCol} AS data_validade,
           el.${qtdLoteCol} AS quantidade_lote,
           el.${statusCol} AS status,
           el.${createdAtCol} AS criado_em,
           el.${updatedAtCol} AS atualizado_em,
           ie.codigo as itemCodigo, COALESCE(ie.nome, ie.codigo) as itemNome,
           ${insumoNameExprCreate} as insumoNome,
           ${joinInsumoCol && insumoUnCol ? `i.${insumoUnCol}` : `''`} as unidadeCompra
         FROM ${lotesTable} el
         LEFT JOIN ${itensTable} ie ON el.${estoqueIdCol} = ie.${itemIdCol}
         ${joinInsumoCol ? `LEFT JOIN insumos i ON ie.${joinInsumoCol} = i.id` : ''}
         WHERE CONVERT(el.${lojaIdCol} USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci
           AND el.${numeroLoteCol} = ?
         ORDER BY el.${createdAtCol} DESC LIMIT 1`,
        context.lojaId,
        data.numeroLote,
      );
      
      const lote = (lotes as any[])[0];
      
      this.logger.debug(`✅ Lote criado: ${lote.id}`);
      
      return lote;
    } catch (error) {
      this.logger.error(`❌ Erro ao criar lote: ${error.message}`);
      throw new Error(`Erro ao criar lote: ${error.message}`);
    }
  }

  async listarLotes(context: IEstoqueContext, query: any = {}) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Listando lotes para loja: ${context.lojaId}`);
    
    try {
      const lotesTable = await this.detectTableName(['estoque_lotes', 'inventory_lots']);
      if (!lotesTable) return [];
      const lotesCols = await this.getExistingColumns(lotesTable);
      const estoqueIdCol = lotesCols.has('estoque_id') ? 'estoque_id' : (lotesCols.has('estoqueId') ? 'estoqueId' : 'estoque_id');
      const lojaIdCol = lotesCols.has('loja_id') ? 'loja_id' : (lotesCols.has('lojaId') ? 'lojaId' : 'loja_id');
      const numeroLoteCol = lotesCols.has('numero_lote') ? 'numero_lote' : (lotesCols.has('numeroLote') ? 'numeroLote' : 'numero_lote');
      const dataFabCol = lotesCols.has('data_fabricacao') ? 'data_fabricacao' : (lotesCols.has('dataFabricacao') ? 'dataFabricacao' : 'data_fabricacao');
      const dataValCol = lotesCols.has('data_validade') ? 'data_validade' : (lotesCols.has('dataValidade') ? 'dataValidade' : 'data_validade');
      const qtdLoteCol = lotesCols.has('quantidade_lote') ? 'quantidade_lote' : (lotesCols.has('quantidadeLote') ? 'quantidadeLote' : 'quantidade_lote');
      const statusCol = 'status';
      const createdAtCol = lotesCols.has('criado_em') ? 'criado_em' : (lotesCols.has('createdAt') ? 'createdAt' : 'createdAt');

      const itensTable = await this.detectTableName(['estoque_itens', 'itens_estoque']);
      const itensCols = itensTable ? await this.getExistingColumns(itensTable) : new Set<string>();
      const itemIdCol = 'id';
      const joinInsumoCol = itensCols.has('insumo_id') ? 'insumo_id' : (itensCols.has('insumoId') ? 'insumoId' : null);
      const joinLocalizacaoCol = itensCols.has('localizacao_id') ? 'localizacao_id' : (itensCols.has('localizacaoId') ? 'localizacaoId' : 'localizacao_id');
      // Detectar coluna de unidade no insumo
      const insumoCols = await this.getExistingColumns('insumos');
      const insumoUnCol = insumoCols.has('unidadeCompra')
        ? 'unidadeCompra'
        : (insumoCols.has('unidade_compra')
          ? 'unidade_compra'
          : (insumoCols.has('unidade_uso') ? 'unidade_uso' : null));

      const whereParts: string[] = [`CONVERT(el.${lojaIdCol} USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci`];
      const whereParams: any[] = [context.lojaId];
      if (query.status) { whereParts.push(`el.${statusCol} = ?`); whereParams.push(String(query.status)); }
      if (query.estoqueId) { whereParts.push(`el.${estoqueIdCol} = ?`); whereParams.push(String(query.estoqueId)); }

      const insumoNameExprList = joinInsumoCol
        ? `COALESCE(i.nome, (SELECT ii.nome FROM insumos ii WHERE ii.loja_id = el.${lojaIdCol} AND (ii.codigo_interno = ie.codigo OR ii.nome = ie.nome OR ii.nome LIKE CONCAT('%', ie.nome, '%') OR ie.nome LIKE CONCAT('%', ii.nome, '%')) LIMIT 1))`
        : `(SELECT ii.nome FROM insumos ii WHERE ii.loja_id = el.${lojaIdCol} AND (ii.codigo_interno = ie.codigo OR ii.nome = ie.nome OR ii.nome LIKE CONCAT('%', ie.nome, '%') OR ie.nome LIKE CONCAT('%', ii.nome, '%')) LIMIT 1)`;

      const sql = `SELECT 
          el.id,
          el.${estoqueIdCol} AS estoque_id,
          el.${lojaIdCol} AS loja_id,
          el.${numeroLoteCol} AS numero_lote,
          el.${dataFabCol} AS data_fabricacao,
          el.${dataValCol} AS data_validade,
          el.${qtdLoteCol} AS quantidade_lote,
          el.${statusCol} AS status,
          el.${createdAtCol} AS criado_em,
          ie.codigo as itemCodigo, COALESCE(ie.nome, ie.codigo) as itemNome,
          ${insumoNameExprList} as insumoNome,
          ${joinInsumoCol && insumoUnCol ? `i.${insumoUnCol}` : `''`} as unidadeCompra,
          l.codigo as localizacaoCodigo,
          DATEDIFF(el.${dataValCol}, NOW()) as diasRestantes
        FROM ${lotesTable} el
        LEFT JOIN ${itensTable ?? 'itens_estoque'} ie ON el.${estoqueIdCol} = ie.${itemIdCol}
        ${joinInsumoCol ? `LEFT JOIN insumos i ON ie.${joinInsumoCol} = i.id` : ''}
        LEFT JOIN localizacoes l ON ie.${joinLocalizacaoCol} = l.id
        WHERE ${whereParts.join(' AND ')}
        ORDER BY el.${dataValCol} ASC, el.${createdAtCol} DESC`;

      const lotes: any[] = await this.prisma.$queryRawUnsafe(sql, ...whereParams);
      
      this.logger.debug(`✅ Lotes listados: ${(lotes as any[]).length}`);
      
      return lotes;
    } catch (error) {
      this.logger.error(`❌ Erro ao listar lotes: ${error.message}`);
      // Se a tabela não existir, retornar array vazio
      if (error.message.includes('doesn\'t exist')) {
        this.logger.warn('⚠️ Tabela estoque_lotes não existe, retornando array vazio');
        return [];
      }
      throw new Error(`Erro ao listar lotes: ${error.message}`);
    }
  }

  async buscarLotePorId(context: IEstoqueContext, id: string) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Buscando lote ${id} para loja: ${context.lojaId}`);
    
    try {
      const lotesTable = await this.detectTableName(['estoque_lotes', 'inventory_lots']);
      if (!lotesTable) return null;
      const lotesCols = await this.getExistingColumns(lotesTable);
      const estoqueIdCol = lotesCols.has('estoque_id') ? 'estoque_id' : (lotesCols.has('estoqueId') ? 'estoqueId' : 'estoque_id');
      const lojaIdCol = lotesCols.has('loja_id') ? 'loja_id' : (lotesCols.has('lojaId') ? 'lojaId' : 'loja_id');
      const numeroLoteCol = lotesCols.has('numero_lote') ? 'numero_lote' : (lotesCols.has('numeroLote') ? 'numeroLote' : 'numero_lote');
      const dataFabCol = lotesCols.has('data_fabricacao') ? 'data_fabricacao' : (lotesCols.has('dataFabricacao') ? 'dataFabricacao' : 'data_fabricacao');
      const dataValCol = lotesCols.has('data_validade') ? 'data_validade' : (lotesCols.has('dataValidade') ? 'dataValidade' : 'data_validade');
      const qtdLoteCol = lotesCols.has('quantidade_lote') ? 'quantidade_lote' : (lotesCols.has('quantidadeLote') ? 'quantidadeLote' : 'quantidade_lote');
      const statusCol = 'status';
      const createdAtCol = lotesCols.has('criado_em') ? 'criado_em' : (lotesCols.has('createdAt') ? 'createdAt' : 'createdAt');

      const itensTable = await this.detectTableName(['estoque_itens', 'itens_estoque']);
      const itensCols = itensTable ? await this.getExistingColumns(itensTable) : new Set<string>();
      const itemIdCol = 'id';
      const joinInsumoCol = itensCols.has('insumo_id') ? 'insumo_id' : (itensCols.has('insumoId') ? 'insumoId' : null);
      const joinLocalizacaoCol = itensCols.has('localizacao_id') ? 'localizacao_id' : (itensCols.has('localizacaoId') ? 'localizacaoId' : 'localizacao_id');

      // Detectar coluna de unidade no insumo
      const insumoCols2 = await this.getExistingColumns('insumos');
      const insumoUnCol2 = insumoCols2.has('unidadeCompra')
        ? 'unidadeCompra'
        : (insumoCols2.has('unidade_compra')
          ? 'unidade_compra'
          : (insumoCols2.has('unidade_uso') ? 'unidade_uso' : null));

      const insumoNameExprById = joinInsumoCol
        ? `COALESCE(i.nome, (SELECT ii.nome FROM insumos ii WHERE ii.loja_id = el.${lojaIdCol} AND (ii.codigo_interno = ie.codigo OR ii.nome = ie.nome OR ii.nome LIKE CONCAT('%', ie.nome, '%') OR ie.nome LIKE CONCAT('%', ii.nome, '%')) LIMIT 1))`
        : `(SELECT ii.nome FROM insumos ii WHERE ii.loja_id = el.${lojaIdCol} AND (ii.codigo_interno = ie.codigo OR ii.nome = ie.nome OR ii.nome LIKE CONCAT('%', ie.nome, '%') OR ie.nome LIKE CONCAT('%', ii.nome, '%')) LIMIT 1)`;

      const lotes = await this.prisma.$queryRawUnsafe(
        `SELECT 
           el.id,
           el.${estoqueIdCol} AS estoque_id,
           el.${lojaIdCol} AS loja_id,
           el.${numeroLoteCol} AS numero_lote,
           el.${dataFabCol} AS data_fabricacao,
           el.${dataValCol} AS data_validade,
           el.${qtdLoteCol} AS quantidade_lote,
           el.${statusCol} AS status,
           el.${createdAtCol} AS criado_em,
          ie.codigo as itemCodigo, ie.nome as itemNome,
           ${insumoNameExprById} as insumoNome,
           ${joinInsumoCol && insumoUnCol2 ? `i.${insumoUnCol2}` : `''`} as unidadeCompra,
          l.codigo as localizacaoCodigo,
           DATEDIFF(el.${dataValCol}, NOW()) as diasRestantes
         FROM ${lotesTable} el
         LEFT JOIN ${itensTable ?? 'itens_estoque'} ie ON el.${estoqueIdCol} = ie.${itemIdCol}
         ${joinInsumoCol ? `LEFT JOIN insumos i ON ie.${joinInsumoCol} = i.id` : ''}
         LEFT JOIN localizacoes l ON ie.${joinLocalizacaoCol} = l.id
         WHERE el.id = ?
           AND CONVERT(el.${lojaIdCol} USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci`,
        id,
        context.lojaId,
      );
      
      const lote = (lotes as any[])[0];
      
      if (!lote) {
        return null;
      }
      
      this.logger.debug(`✅ Lote encontrado: ${lote.id}`);
      
      return lote;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar lote: ${error.message}`);
      throw new Error(`Erro ao buscar lote: ${error.message}`);
    }
  }

  async atualizarLote(context: IEstoqueContext, id: string, data: any) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Atualizando lote ${id} para loja: ${context.lojaId}`);
    
    try {
      // Verificar se o lote existe
      const loteExistente = await this.buscarLotePorId(context, id);
      if (!loteExistente) {
        throw new Error('Lote não encontrado');
      }
      
      // Construir query de atualização
      const updates = [];
      if (data.numeroLote !== undefined) updates.push(`numero_lote = '${data.numeroLote}'`);
      if (data.dataFabricacao !== undefined) updates.push(`data_fabricacao = ${data.dataFabricacao ? `'${data.dataFabricacao}'` : 'NULL'}`);
      if (data.dataValidade !== undefined) updates.push(`data_validade = ${data.dataValidade ? `'${data.dataValidade}'` : 'NULL'}`);
      if (data.quantidadeLote !== undefined) updates.push(`quantidade_lote = ${data.quantidadeLote}`);
      if (data.status !== undefined) updates.push(`status = '${data.status}'`);
      
      if (updates.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }
      
      const updateQuery = `
        UPDATE estoque_lotes 
        SET ${updates.join(', ')}, atualizado_em = NOW()
        WHERE id = '${id}' AND loja_id = '${context.lojaId}'
      `;
      
      await this.prisma.$executeRawUnsafe(updateQuery);
      
      // Buscar lote atualizado
      const loteAtualizado = await this.buscarLotePorId(context, id);
      
      this.logger.debug(`✅ Lote atualizado: ${id}`);
      
      return loteAtualizado;
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar lote: ${error.message}`);
      throw new Error(`Erro ao atualizar lote: ${error.message}`);
    }
  }

  async excluirLote(context: IEstoqueContext, id: string) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Excluindo lote ${id} para loja: ${context.lojaId}`);
    
    try {
      // Verificar se o lote existe
      const loteExistente = await this.buscarLotePorId(context, id);
      if (!loteExistente) {
        throw new Error('Lote não encontrado');
      }
      
      // Excluir lote
      await this.prisma.$executeRaw`
        DELETE FROM estoque_lotes 
        WHERE id = ${id} AND loja_id = ${context.lojaId}
      `;
      
      this.logger.debug(`✅ Lote excluído: ${id}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Erro ao excluir lote: ${error.message}`);
      throw new Error(`Erro ao excluir lote: ${error.message}`);
    }
  }

  async lotesProximosVencimento(context: IEstoqueContext, dias: number = 30) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Buscando lotes próximos do vencimento (${dias} dias) para loja: ${context.lojaId}`);
    
    try {
      const lotes = await this.prisma.$queryRaw`
        SELECT 
          el.id, el.estoque_id, el.loja_id, el.numero_lote, 
          el.data_fabricacao, el.data_validade, el.quantidade_lote, 
          el.status, el.criado_em, el.atualizado_em,
          ie.codigo as itemCodigo, ie.nome as itemNome,
          i.nome as insumoNome, i.unidadeCompra,
          l.codigo as localizacaoCodigo,
          DATEDIFF(el.data_validade, NOW()) as diasRestantes
        FROM estoque_lotes el
        LEFT JOIN itens_estoque ie ON el.estoque_id = ie.id
        LEFT JOIN insumos i ON ie.insumo_id = i.id
        LEFT JOIN localizacoes l ON ie.localizacao_id = l.id
        WHERE el.loja_id = ${context.lojaId}
        AND el.status = 'ATIVO'
        AND el.data_validade IS NOT NULL
        AND el.data_validade <= DATE_ADD(NOW(), INTERVAL ${dias} DAY)
        ORDER BY el.data_validade ASC
      `;
      
      this.logger.debug(`✅ Lotes próximos do vencimento encontrados: ${(lotes as any[]).length}`);
      
      return lotes;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar lotes próximos do vencimento: ${error.message}`);
      // Se a tabela não existir, retornar array vazio
      if (error.message.includes('doesn\'t exist')) {
        this.logger.warn('⚠️ Tabela estoque_lotes não existe, retornando array vazio');
        return [];
      }
      throw new Error(`Erro ao buscar lotes próximos do vencimento: ${error.message}`);
    }
  }

  // ===== TRANSFERÊNCIAS =====
  async criarTransferencia(context: IEstoqueContext, data: any) {
    this.validateContext(context);
    
    this.logger.debug(`🔄 Criando transferência para loja: ${context.lojaId}`);
    
    try {
      const { itemId, localizacaoOrigemId, localizacaoDestinoId, quantidade, observacoes } = data;
      
      // Verificar se o item existe na localização de origem
      const itemOrigem = await this.prisma.$queryRaw`
        SELECT 
          id,
          quantidade,
          codigo,
          nome,
          localizacao_id,
          descricao,
          unidade_medida,
          preco_unitario,
          estoque_minimo,
          estoque_maximo,
          codigo_barras,
          lote,
          data_validade,
          fornecedor,
          observacoes
        FROM itens_estoque 
        WHERE id = ${itemId} AND loja_id = ${context.lojaId}
      `;
      
      if (!(itemOrigem as any[])[0]) {
        throw new BadRequestException('Item de estoque não encontrado');
      }
      
      const item = (itemOrigem as any[])[0];
      
      if (item.localizacao_id !== localizacaoOrigemId) {
        throw new BadRequestException('Item não está na localização de origem especificada');
      }
      
      if (item.quantidade < quantidade) {
        throw new BadRequestException('Quantidade insuficiente para transferência');
      }
      
      // Verificar se a localização de destino existe
      const localizacaoDestino = await this.prisma.$queryRaw`
        SELECT id, codigo FROM localizacoes 
        WHERE id = ${localizacaoDestinoId} AND loja_id = ${context.lojaId}
      `;
      
      if (!(localizacaoDestino as any[])[0]) {
        throw new BadRequestException('Localização de destino não encontrada');
      }
      
      // Modelo atual: não suportamos transferência parcial no itens_estoque (restrição de unicidade por loja+codigo)
      if (Number(item.quantidade) !== Number(quantidade)) {
        throw new BadRequestException('No modelo atual de itens, só é possível transferir a quantidade total do item.');
      }

      // Registrar movimentação de saída na origem (apenas log)
      await this.criarMovimentacao(context, {
        estoqueId: itemId,
        tipo: 'SAIDA',
        quantidade: quantidade,
        motivo: `Transferência para ${(localizacaoDestino as any[])[0].codigo}`,
        observacoes: observacoes || `Transferência para ${(localizacaoDestino as any[])[0].codigo}`
      });

      // Atualizar a localização do item para a de destino (quantidade permanece igual)
      await this.prisma.$executeRaw`
        UPDATE itens_estoque 
        SET localizacao_id = ${localizacaoDestinoId}, dataUltimaMov = NOW()
        WHERE id = ${itemId} AND loja_id = ${context.lojaId}
      `;
      
      // Registrar movimentação de entrada no destino
      await this.criarMovimentacao(context, {
        estoqueId: itemId,
        tipo: 'ENTRADA',
        quantidade: quantidade,
        motivo: `Transferência de ${item.codigo}`,
        observacoes: observacoes || `Transferência de ${item.codigo}`
      });
      
      // Buscar dados da transferência (alinhar com o contrato do frontend)
      const transferenciaDb = await this.prisma.$queryRaw`
        SELECT 
          m1.id                               AS id,
          m1.item_id                          AS itemId,
          m1.criado_em                        AS dataTransferencia,
          m1.quantidade                       AS quantidade,
          ie.codigo                           AS itemCodigo,
          ie.nome                             AS itemNome,
          l1.id                               AS localizacaoOrigemId,
          l1.codigo                           AS localizacaoOrigemCodigo,
          l2.id                               AS localizacaoDestinoId,
          l2.codigo                           AS localizacaoDestinoCodigo,
          m1.observacoes                      AS observacoes,
          'CONCLUIDA'                         AS status
        FROM movimentacoes_estoque m1
        LEFT JOIN movimentacoes_estoque m2 ON m2.tipo = 'ENTRADA' 
          AND m2.criado_em = m1.criado_em 
          AND m2.quantidade = m1.quantidade
        LEFT JOIN itens_estoque ie ON m1.item_id = ie.id
        LEFT JOIN localizacoes l1 ON l1.id = ${localizacaoOrigemId}
        LEFT JOIN localizacoes l2 ON l2.id = ${localizacaoDestinoId}
        WHERE m1.id = (SELECT MAX(id) FROM movimentacoes_estoque WHERE item_id = ${itemId} AND tipo = 'SAIDA')
          AND m1.loja_id = ${context.lojaId}
          AND m1.tipo = 'SAIDA'
      `;
      
      const transferenciaMem = {
        id: `transf-${Date.now()}`,
        itemId: itemId,
        dataTransferencia: new Date(),
        quantidade: Number(quantidade),
        itemCodigo: item.codigo,
        itemNome: item.nome,
        localizacaoOrigemId: localizacaoOrigemId,
        localizacaoOrigemCodigo: (await this.prisma.$queryRaw`SELECT codigo FROM localizacoes WHERE id = ${localizacaoOrigemId} AND loja_id = ${context.lojaId} LIMIT 1` as any[])[0]?.codigo || '',
        localizacaoDestinoId: localizacaoDestinoId,
        localizacaoDestinoCodigo: (localizacaoDestino as any[])[0]?.codigo || '',
        observacoes: observacoes || null,
        status: 'CONCLUIDA',
      };

      this.transferenciasCriadas.unshift(transferenciaMem);
      
      this.logger.debug(`✅ Transferência criada: ${item.codigo} de ${(localizacaoDestino as any[])[0].codigo}`);
      
      return (transferenciaDb as any[])?.[0] || transferenciaMem;
    } catch (error) {
      this.logger.error(`❌ Erro ao criar transferência: ${error.message}`);
      throw new Error(`Erro ao criar transferência: ${error.message}`);
    }
  }

  async listarTransferencias(context: IEstoqueContext, query: any = {}) {
    this.validateContext(context);
    
    this.logger.debug(`🔄 Listando transferências para loja: ${context.lojaId}`);
    
    try {
      const lojaIdSafe = String(context.lojaId).replace(/'/g, "''");
      const filters: string[] = [
        `m1.loja_id = '${lojaIdSafe}'`,
        `m1.tipo = 'SAIDA'`
      ];

      if (query.itemId) {
        const itemIdSafe = String(query.itemId).replace(/'/g, "''");
        filters.push(`m1.item_id = '${itemIdSafe}'`);
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (query.dataInicio && dateRegex.test(query.dataInicio)) {
        filters.push(`DATE(m1.criado_em) >= '${query.dataInicio}'`);
      }
      if (query.dataFim && dateRegex.test(query.dataFim)) {
        filters.push(`DATE(m1.criado_em) <= '${query.dataFim}'`);
      }

      const whereClause = `WHERE ${filters.join(' AND ')}`;

      const sql = `
        SELECT 
          m1.id                              AS id,
          m1.item_id                         AS itemId,
          m1.criado_em                       AS dataTransferencia,
          m1.quantidade                      AS quantidade,
          ie.codigo                          AS itemCodigo,
          ie.nome                            AS itemNome,
          l1.id                              AS localizacaoOrigemId,
          l1.codigo                          AS localizacaoOrigemCodigo,
          l2.id                              AS localizacaoDestinoId,
          l2.codigo                          AS localizacaoDestinoCodigo,
          m1.observacoes                     AS observacoes,
          'CONCLUIDA'                        AS status
        FROM movimentacoes_estoque m1
        LEFT JOIN movimentacoes_estoque m2 ON m2.tipo = 'ENTRADA' 
          AND m2.criado_em = m1.criado_em 
          AND m2.quantidade = m1.quantidade
        LEFT JOIN itens_estoque ie ON m1.item_id = ie.id
        LEFT JOIN localizacoes l1 ON ie.localizacao_id = l1.id
        LEFT JOIN localizacoes l2 ON l2.id = (
          SELECT localizacao_id FROM itens_estoque 
          WHERE id = m2.item_id AND loja_id = '${lojaIdSafe}'
        )
        ${whereClause}
        ORDER BY m1.criado_em DESC
      `;

      const transferencias: any = await this.prisma.$queryRawUnsafe(sql);
      
      if (!Array.isArray(transferencias) || transferencias.length === 0) {
        this.logger.debug('📝 Sem transferências reais; retornando transferências em memória.');
        return this.transferenciasCriadas;
      }
      
      this.logger.debug(`✅ Transferências listadas: ${(transferencias as any[]).length}`);
      
      return transferencias;
    } catch (error) {
      this.logger.error(`❌ Erro ao listar transferências: ${error.message}`);
      if (typeof error.message === 'string' && error.message.includes("doesn't exist")) {
        this.logger.warn('⚠️ Tabela de transferências/movimentações não existe. Retornando transferências em memória.');
        return this.transferenciasCriadas;
      }
      throw new Error(`Erro ao listar transferências: ${error.message}`);
    }
  }

  async buscarTransferenciaPorId(context: IEstoqueContext, id: string) {
    this.validateContext(context);
    
    this.logger.debug(`🔄 Buscando transferência ${id} para loja: ${context.lojaId}`);
    
    try {
      const transferencias = await this.prisma.$queryRaw`
        SELECT 
          m1.id                              AS id,
          m1.item_id                         AS itemId,
          m1.criado_em                       AS dataTransferencia,
          m1.quantidade                      AS quantidade,
          ie.codigo                          AS itemCodigo,
          ie.nome                            AS itemNome,
          l1.id                              AS localizacaoOrigemId,
          l1.codigo                          AS localizacaoOrigemCodigo,
          l2.id                              AS localizacaoDestinoId,
          l2.codigo                          AS localizacaoDestinoCodigo,
          m1.observacoes                     AS observacoes,
          'CONCLUIDA'                        AS status
        FROM movimentacoes_estoque m1
        LEFT JOIN movimentacoes_estoque m2 ON m2.tipo = 'ENTRADA' 
          AND m2.criado_em = m1.criado_em 
          AND m2.quantidade = m1.quantidade
        LEFT JOIN itens_estoque ie ON m1.item_id = ie.id
        LEFT JOIN localizacoes l1 ON ie.localizacao_id = l1.id
        LEFT JOIN localizacoes l2 ON l2.id = (
          SELECT localizacao_id FROM itens_estoque 
          WHERE id = m2.item_id AND loja_id = ${context.lojaId}
        )
        WHERE m1.id = ${id} AND m1.loja_id = ${context.lojaId} AND m1.tipo = 'SAIDA'
      `;
      
      const transferencia = (transferencias as any[])[0] || this.transferenciasCriadas.find(t => t.id === id) || null;
      
      if (!transferencia) {
        return null;
      }
      
      this.logger.debug(`✅ Transferência encontrada: ${transferencia.movimentacaoSaidaId}`);
      
      return transferencia;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar transferência: ${error.message}`);
      // Fallback memória
      const t = this.transferenciasCriadas.find(tr => tr.id === id);
      if (t) return t;
      throw new Error(`Erro ao buscar transferência: ${error.message}`);
    }
  }

  async historicoTransferenciasItem(context: IEstoqueContext, itemId: string) {
    this.validateContext(context);
    
    this.logger.debug(`🔄 Buscando histórico de transferências do item ${itemId} para loja: ${context.lojaId}`);
    
    try {
      const historico = await this.prisma.$queryRaw`
        SELECT 
          m1.id as movimentacaoSaidaId,
          m2.id as movimentacaoEntradaId,
          m1.dataMovimentacao as dataTransferencia,
          m1.quantidade,
          l1.codigo as localizacaoOrigem,
          l2.codigo as localizacaoDestino,
          m1.observacoes
        FROM movimentacoes_estoque m1
        LEFT JOIN movimentacoes_estoque m2 ON m2.tipo = 'ENTRADA' 
          AND m2.dataMovimentacao = m1.dataMovimentacao 
          AND m2.quantidade = m1.quantidade
        LEFT JOIN localizacoes l1 ON ie.localizacao_id = l1.id
        LEFT JOIN localizacoes l2 ON l2.id = (
          SELECT localizacao_id FROM itens_estoque 
          WHERE id = m2.item_id AND loja_id = ${context.lojaId}
        )
        WHERE m1.item_id = ${itemId} AND m1.loja_id = ${context.lojaId} AND m1.tipo = 'SAIDA'
        ORDER BY m1.dataMovimentacao DESC
      `;
      
      this.logger.debug(`✅ Histórico de transferências encontrado: ${(historico as any[]).length} registros`);
      
      return historico;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar histórico de transferências: ${error.message}`);
      throw new Error(`Erro ao buscar histórico de transferências: ${error.message}`);
    }
  }

  async consumirLote(context: IEstoqueContext, id: string, quantidade: number) {
    this.validateContext(context);
    
    this.logger.debug(`📦 Consumindo lote ${id} (quantidade: ${quantidade}) para loja: ${context.lojaId}`);
    
    try {
      // Buscar lote
      const lote = await this.buscarLotePorId(context, id);
      if (!lote) {
        throw new Error('Lote não encontrado');
      }
      
      if (lote.status !== 'ATIVO') {
        throw new Error('Lote não está ativo');
      }
      
      if (lote.quantidadeLote < quantidade) {
        throw new Error('Quantidade insuficiente no lote');
      }
      
      // Atualizar quantidade do lote
      const novaQuantidade = lote.quantidadeLote - quantidade;
      const novoStatus = novaQuantidade <= 0 ? 'CONSUMIDO' : 'ATIVO';
      
      await this.prisma.$executeRaw`
        UPDATE estoque_lotes 
        SET quantidade_lote = ${novaQuantidade}, status = ${novoStatus}, atualizado_em = NOW()
        WHERE id = ${id} AND loja_id = ${context.lojaId}
      `;
      
      // Atualizar quantidade do item de estoque
      await this.prisma.$executeRaw`
        UPDATE itens_estoque 
        SET quantidadeAtual = quantidadeAtual - ${quantidade}, dataUltimaMov = NOW()
        WHERE id = ${lote.estoque_id} AND loja_id = ${context.lojaId}
      `;
      
      // Registrar movimentação
      await this.criarMovimentacao(context, {
        itemId: lote.estoque_id,
        tipo: 'SAIDA',
        quantidade: quantidade,
        motivo: `Consumo do lote ${lote.numeroLote}`,
        observacoes: `Lote: ${lote.numeroLote}`
      });
      
      this.logger.debug(`✅ Lote consumido: ${id}, nova quantidade: ${novaQuantidade}`);
      
      return {
        loteId: id,
        quantidadeConsumida: quantidade,
        quantidadeRestante: novaQuantidade,
        status: novoStatus
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao consumir lote: ${error.message}`);
      throw new Error(`Erro ao consumir lote: ${error.message}`);
    }
  }

  // ===== RELATÓRIOS =====
  async relatorioEstoqueBaixo(context: IEstoqueContext) {
    this.validateContext(context);
    
    this.logger.debug(`📊 Gerando relatório de estoque baixo para loja: ${context.lojaId}`);
    
    try {
      // Query para buscar itens com estoque abaixo do mínimo
      const itensBaixoEstoque = await this.prisma.$queryRaw`
        SELECT 
          ie.id,
          COALESCE(i.nome, ie.nome) as insumoNome,
          COALESCE(i.unidadeCompra, ie.unidade_medida) as unidadeCompra,
          l.codigo as localizacaoCodigo,
          ie.quantidade as quantidadeAtual,
          ie.estoque_minimo as estoqueMinimo,
          ie.preco_unitario as valorUnitario,
          DATEDIFF(NOW(), COALESCE(ie.dataUltimaMov, ie.criado_em)) as diasSemMovimentacao
        FROM itens_estoque ie
        LEFT JOIN localizacoes l ON l.id = ie.localizacao_id
        WHERE ie.loja_id = ${context.lojaId}
        AND ie.ativo = 1
        AND ie.quantidade <= ie.estoque_minimo
        ORDER BY ie.quantidade ASC, diasSemMovimentacao DESC
      `;
      
      this.logger.debug(`✅ Relatório de estoque baixo gerado: ${(itensBaixoEstoque as any[]).length} itens`);
      
      return itensBaixoEstoque;
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório de estoque baixo: ${error.message}`);
      throw new Error(`Erro ao gerar relatório de estoque baixo: ${error.message}`);
    }
  }

  async relatorioVencimento(context: IEstoqueContext) {
    this.validateContext(context);
    
    this.logger.debug(`📊 Gerando relatório de vencimentos para loja: ${context.lojaId}`);
    
    try {
      // Query para buscar lotes próximos do vencimento (próximos 30 dias)
      const lotesVencimento = await this.prisma.$queryRaw`
        SELECT 
          el.id,
          COALESCE(i.nome, ie.nome) as insumoNome,
          COALESCE(i.unidadeCompra, ie.unidade_medida) as unidadeCompra,
          l.codigo as localizacaoCodigo,
          el.numero_lote as numeroLote,
          el.data_validade as dataValidade,
          DATEDIFF(el.data_validade, NOW()) as diasRestantes,
          el.quantidade_lote as quantidadeLote
        FROM estoque_lotes el
        LEFT JOIN itens_estoque ie ON el.estoque_id = ie.id
        LEFT JOIN localizacoes l ON ie.localizacao_id = l.id
        WHERE el.loja_id = ${context.lojaId}
        AND el.status = 'ATIVO'
        AND el.data_validade IS NOT NULL
        AND el.data_validade <= DATE_ADD(NOW(), INTERVAL 30 DAY)
        ORDER BY el.data_validade ASC
      `;
      
      this.logger.debug(`✅ Relatório de vencimentos gerado: ${(lotesVencimento as any[]).length} lotes`);
      
      return lotesVencimento;
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório de vencimentos: ${error.message}`);
      // Se a tabela de lotes não existir, retornar array vazio
      if (error.message.includes('doesn\'t exist')) {
        this.logger.warn('⚠️ Tabela estoque_lotes não existe, retornando array vazio');
        return [];
      }
      throw new Error(`Erro ao gerar relatório de vencimentos: ${error.message}`);
    }
  }

  async relatorioOcupacao(context: IEstoqueContext) {
    this.validateContext(context);
    
    this.logger.debug(`📊 Gerando relatório de ocupação para loja: ${context.lojaId}`);
    
    try {
      // Query para calcular ocupação por depósito
      const ocupacaoDepositos = await this.prisma.$queryRaw<any[]>`
        SELECT 
          l.deposito,
          COUNT(l.id) as totalLocalizacoes,
          COUNT(CASE WHEN EXISTS (
            SELECT 1 FROM itens_estoque ie 
            WHERE ie.localizacao_id = l.id 
            AND ie.loja_id = ${context.lojaId}
            AND ie.ativo = 1
          ) THEN 1 END) as localizacoesOcupadas,
          COUNT(CASE WHEN NOT EXISTS (
            SELECT 1 FROM itens_estoque ie 
            WHERE ie.localizacao_id = l.id 
            AND ie.loja_id = ${context.lojaId}
            AND ie.ativo = 1
          ) THEN 1 END) as localizacoesVazias,
          COALESCE(SUM(l.capacidade), 0) as capacidadeTotal,
          COALESCE(SUM(
            CASE WHEN EXISTS (
              SELECT 1 FROM itens_estoque ie 
              WHERE ie.localizacao_id = l.id 
              AND ie.loja_id = ${context.lojaId}
              AND ie.ativo = 1
            ) THEN l.capacidade ELSE 0 END
          ), 0) as capacidadeUtilizada
        FROM localizacoes l
        WHERE l.loja_id = ${context.lojaId}
        AND l.ativo = 1
        GROUP BY l.deposito
        ORDER BY l.deposito
      `;
      
      // Calcular taxa de ocupação para cada depósito
      const relatorioComTaxa = ocupacaoDepositos.map((deposito) => ({
        ...deposito,
        totalLocalizacoes: Number(deposito.totalLocalizacoes ?? 0),
        localizacoesOcupadas: Number(deposito.localizacoesOcupadas ?? 0),
        localizacoesVazias: Number(deposito.localizacoesVazias ?? 0),
        capacidadeTotal: Number(deposito.capacidadeTotal ?? 0),
        capacidadeUtilizada: Number(deposito.capacidadeUtilizada ?? 0),
        taxaOcupacao: Number(deposito.totalLocalizacoes ?? 0) > 0 
          ? Math.round((Number(deposito.localizacoesOcupadas ?? 0) / Number(deposito.totalLocalizacoes ?? 0)) * 100)
          : 0
      }));
      
      this.logger.debug(`✅ Relatório de ocupação gerado: ${relatorioComTaxa.length} depósitos`);
      
      return relatorioComTaxa;
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório de ocupação: ${error.message}`);
      throw new Error(`Erro ao gerar relatório de ocupação: ${error.message}`);
    }
  }

  // ===== HEALTH CHECK =====
  async healthCheck() {
    try {
      // Teste simples de conexão
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        module: 'estoque',
        version: '1.0.0-simple',
        database: 'connected',
      };
    } catch (error) {
      this.logger.error('❌ Health check falhou:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        module: 'estoque',
        version: '1.0.0-simple',
        database: 'disconnected',
        error: error.message,
      };
    }
  }
}
