import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IEstoqueContext } from '../types/estoque-context';
import { PrismaService } from '../../prisma/prisma.service';
import { detectTableName, getExistingColumns } from '../utils/estoque-sql.util';

@Injectable()
export class LotesService {
  private readonly logger = new Logger(LotesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async criarLote(context: IEstoqueContext, data: any) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📦 [LotesService] criarLote loja=${context.lojaId}`);

    const itensTable = await detectTableName(this.prisma, [
      'estoque_itens',
      'itens_estoque',
    ]);
    if (!itensTable) throw new BadRequestException('Estrutura de itens de estoque não encontrada');
    const itensCols = await getExistingColumns(this.prisma, itensTable);
    const itemIdCol = 'id';
    const lojaItemCol = itensCols.has('lojaId') ? 'lojaId' : 'loja_id';
    const qtdAtualCol = itensCols.has('quantidadeAtual') ? 'quantidadeAtual' : 'quantidade';

    const itemEstoque = await this.prisma.$queryRawUnsafe(
      `SELECT ${itemIdCol} AS id, ${qtdAtualCol} AS quantidadeAtual FROM ${itensTable} WHERE ${itemIdCol} = ? AND ${lojaItemCol} = ?`,
      data.estoqueId,
      context.lojaId,
    );
    if (!(itemEstoque as any[])?.[0]) throw new BadRequestException('Item de estoque não encontrado');

    const lotesTable = await detectTableName(this.prisma, [
      'estoque_lotes',
      'inventory_lots',
    ]);
    if (!lotesTable) throw new BadRequestException('Estrutura de lotes não encontrada');
    const lotesCols = await getExistingColumns(this.prisma, lotesTable);

    const estoqueIdCol = lotesCols.has('estoque_id') ? 'estoque_id' : (lotesCols.has('estoqueId') ? 'estoqueId' : 'estoque_id');
    const lojaIdCol = lotesCols.has('loja_id') ? 'loja_id' : (lotesCols.has('lojaId') ? 'lojaId' : 'loja_id');
    const numeroLoteCol = lotesCols.has('numero_lote') ? 'numero_lote' : (lotesCols.has('numeroLote') ? 'numeroLote' : 'numero_lote');
    const dataFabCol = lotesCols.has('data_fabricacao') ? 'data_fabricacao' : (lotesCols.has('dataFabricacao') ? 'dataFabricacao' : 'data_fabricacao');
    const dataValCol = lotesCols.has('data_validade') ? 'data_validade' : (lotesCols.has('dataValidade') ? 'dataValidade' : 'data_validade');
    const qtdLoteCol = lotesCols.has('quantidade_lote') ? 'quantidade_lote' : (lotesCols.has('quantidadeLote') ? 'quantidadeLote' : 'quantidade_lote');
    const statusCol = lotesCols.has('status') ? 'status' : 'status';
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

    await this.prisma.$executeRawUnsafe(`INSERT INTO ${lotesTable} (${columns.join(', ')}) VALUES (${placeholders})`, ...values);

    const joinInsumoCol = itensCols.has('insumo_id') ? 'insumo_id' : (itensCols.has('insumoId') ? 'insumoId' : null);
    const joinLocalizacaoCol = itensCols.has('localizacao_id') ? 'localizacao_id' : (itensCols.has('localizacaoId') ? 'localizacaoId' : 'localizacao_id');
    const insumoCols = await getExistingColumns(this.prisma, 'insumos');
    const insumoUnCol = insumoCols.has('unidadeCompra') ? 'unidadeCompra' : (insumoCols.has('unidade_compra') ? 'unidade_compra' : (insumoCols.has('unidade_uso') ? 'unidade_uso' : null));
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

    return (lotes as any[])?.[0];
  }

  async listarLotes(context: IEstoqueContext, query: any = {}) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📦 [LotesService] listarLotes loja=${context.lojaId}`);
    const lotesTable = await detectTableName(this.prisma, ['estoque_lotes', 'inventory_lots']);
    if (!lotesTable) return [];
    const lotesCols = await getExistingColumns(this.prisma, lotesTable);
    const estoqueIdCol = lotesCols.has('estoque_id') ? 'estoque_id' : (lotesCols.has('estoqueId') ? 'estoqueId' : 'estoque_id');
    const lojaIdCol = lotesCols.has('loja_id') ? 'loja_id' : (lotesCols.has('lojaId') ? 'lojaId' : 'loja_id');
    const numeroLoteCol = lotesCols.has('numero_lote') ? 'numero_lote' : (lotesCols.has('numeroLote') ? 'numeroLote' : 'numero_lote');
    const dataFabCol = lotesCols.has('data_fabricacao') ? 'data_fabricacao' : (lotesCols.has('dataFabricacao') ? 'dataFabricacao' : 'data_fabricacao');
    const dataValCol = lotesCols.has('data_validade') ? 'data_validade' : (lotesCols.has('dataValidade') ? 'dataValidade' : 'data_validade');
    const qtdLoteCol = lotesCols.has('quantidade_lote') ? 'quantidade_lote' : (lotesCols.has('quantidadeLote') ? 'quantidadeLote' : 'quantidade_lote');
    const statusCol = 'status';
    const createdAtCol = lotesCols.has('criado_em') ? 'criado_em' : (lotesCols.has('createdAt') ? 'createdAt' : 'createdAt');

    const itensTable = await detectTableName(this.prisma, ['estoque_itens', 'itens_estoque']);
    const itensCols = itensTable ? await getExistingColumns(this.prisma, itensTable) : new Set<string>();
    const itemIdCol = 'id';
    const joinInsumoCol = itensCols.has('insumo_id') ? 'insumo_id' : (itensCols.has('insumoId') ? 'insumoId' : null);
    const joinLocalizacaoCol = itensCols.has('localizacao_id') ? 'localizacao_id' : (itensCols.has('localizacaoId') ? 'localizacaoId' : 'localizacao_id');
    const insumoCols = await getExistingColumns(this.prisma, 'insumos');
    const insumoUnCol = insumoCols.has('unidadeCompra') ? 'unidadeCompra' : (insumoCols.has('unidade_compra') ? 'unidade_compra' : (insumoCols.has('unidade_uso') ? 'unidade_uso' : null));

    const whereParts: string[] = [
      `CONVERT(el.${lojaIdCol} USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci`,
    ];
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

    return this.prisma.$queryRawUnsafe(sql, ...whereParams) as any;
  }

  async buscarLotePorId(context: IEstoqueContext, id: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📦 [LotesService] buscarLotePorId id=${id} loja=${context.lojaId}`);

    const lotesTable = await detectTableName(this.prisma, ['estoque_lotes', 'inventory_lots']);
    if (!lotesTable) return null;
    const lotesCols = await getExistingColumns(this.prisma, lotesTable);
    const estoqueIdCol = lotesCols.has('estoque_id') ? 'estoque_id' : (lotesCols.has('estoqueId') ? 'estoqueId' : 'estoque_id');
    const lojaIdCol = lotesCols.has('loja_id') ? 'loja_id' : (lotesCols.has('lojaId') ? 'lojaId' : 'loja_id');
    const numeroLoteCol = lotesCols.has('numero_lote') ? 'numero_lote' : (lotesCols.has('numeroLote') ? 'numeroLote' : 'numero_lote');
    const dataFabCol = lotesCols.has('data_fabricacao') ? 'data_fabricacao' : (lotesCols.has('dataFabricacao') ? 'dataFabricacao' : 'data_fabricacao');
    const dataValCol = lotesCols.has('data_validade') ? 'data_validade' : (lotesCols.has('dataValidade') ? 'dataValidade' : 'data_validade');
    const qtdLoteCol = lotesCols.has('quantidade_lote') ? 'quantidade_lote' : (lotesCols.has('quantidadeLote') ? 'quantidadeLote' : 'quantidade_lote');
    const statusCol = 'status';
    const createdAtCol = lotesCols.has('criado_em') ? 'criado_em' : (lotesCols.has('createdAt') ? 'createdAt' : 'createdAt');

    const itensTable = await detectTableName(this.prisma, ['estoque_itens', 'itens_estoque']);
    const itensCols = itensTable ? await getExistingColumns(this.prisma, itensTable) : new Set<string>();
    const itemIdCol = 'id';
    const joinInsumoCol = itensCols.has('insumo_id') ? 'insumo_id' : (itensCols.has('insumoId') ? 'insumoId' : null);
    const joinLocalizacaoCol = itensCols.has('localizacao_id') ? 'localizacao_id' : (itensCols.has('localizacaoId') ? 'localizacaoId' : 'localizacao_id');

    const insumoCols2 = await getExistingColumns(this.prisma, 'insumos');
    const insumoUnCol2 = insumoCols2.has('unidadeCompra') ? 'unidadeCompra' : (insumoCols2.has('unidade_compra') ? 'unidade_compra' : (insumoCols2.has('unidade_uso') ? 'unidade_uso' : null));

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

    return (lotes as any[])?.[0] || null;
  }

  async atualizarLote(context: IEstoqueContext, id: string, data: any) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📦 [LotesService] atualizarLote id=${id} loja=${context.lojaId}`);
    const lote = await this.buscarLotePorId(context, id);
    if (!lote) throw new BadRequestException('Lote não encontrado');
    const updates: string[] = [];
    const params: any[] = [];
    if (data.numeroLote !== undefined) { updates.push('numero_lote = ?'); params.push(data.numeroLote || null); }
    if (data.dataFabricacao !== undefined) { updates.push('data_fabricacao = ?'); params.push(data.dataFabricacao || null); }
    if (data.dataValidade !== undefined) { updates.push('data_validade = ?'); params.push(data.dataValidade || null); }
    if (data.quantidadeLote !== undefined) { updates.push('quantidade_lote = ?'); params.push(Number(data.quantidadeLote)); }
    if (data.status !== undefined) { updates.push('status = ?'); params.push(String(data.status)); }
    if (!updates.length) throw new BadRequestException('Nenhum campo para atualizar');
    const sql = `UPDATE estoque_lotes SET ${updates.join(', ')}, atualizado_em = NOW() WHERE id = ? AND loja_id = ?`;
    await this.prisma.$executeRawUnsafe(sql, ...params, id, context.lojaId);
    return this.buscarLotePorId(context, id);
  }

  async excluirLote(context: IEstoqueContext, id: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📦 [LotesService] excluirLote id=${id} loja=${context.lojaId}`);
    const lote = await this.buscarLotePorId(context, id);
    if (!lote) throw new BadRequestException('Lote não encontrado');
    await this.prisma.$executeRawUnsafe(`DELETE FROM estoque_lotes WHERE id = ? AND loja_id = ?`, id, context.lojaId);
    return { success: true } as any;
  }

  async lotesProximosVencimento(context: IEstoqueContext, dias: number = 30) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📦 [LotesService] lotesProximosVencimento dias=${dias} loja=${context.lojaId}`);
    return this.prisma.$queryRaw`
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
    ` as any;
  }

  async consumirLote(context: IEstoqueContext, id: string, quantidade: number) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📦 [LotesService] consumirLote id=${id} qtd=${quantidade} loja=${context.lojaId}`);
    const lote = await this.buscarLotePorId(context, id);
    if (!lote) throw new BadRequestException('Lote não encontrado');
    if (lote.status !== 'ATIVO') throw new BadRequestException('Lote não está ativo');
    if (Number(lote.quantidade_lote ?? lote.quantidadeLote) < Number(quantidade)) throw new BadRequestException('Quantidade insuficiente no lote');
    const novaQuantidade = Number(lote.quantidade_lote ?? lote.quantidadeLote) - Number(quantidade);
    const novoStatus = novaQuantidade <= 0 ? 'CONSUMIDO' : 'ATIVO';
    await this.prisma.$executeRawUnsafe(
      `UPDATE estoque_lotes SET quantidade_lote = ?, status = ?, atualizado_em = NOW() WHERE id = ? AND loja_id = ?`,
      novaQuantidade,
      novoStatus,
      id,
      context.lojaId,
    );
    await this.prisma.$executeRawUnsafe(
      `UPDATE itens_estoque SET quantidade = quantidade - ?, dataUltimaMov = NOW() WHERE id = (SELECT estoque_id FROM estoque_lotes WHERE id = ?) AND loja_id = ?`,
      quantidade,
      id,
      context.lojaId,
    );
    return { loteId: id, quantidadeConsumida: quantidade, quantidadeRestante: novaQuantidade, status: novoStatus } as any;
  }
}


