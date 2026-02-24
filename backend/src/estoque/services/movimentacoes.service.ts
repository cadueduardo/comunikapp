import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface IEstoqueContext {
  lojaId: string;
  usuarioId?: string;
}

@Injectable()
export class MovimentacoesService {
  private readonly logger = new Logger(MovimentacoesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async buscarItemEstoquePorId(context: IEstoqueContext, id: string) {
    const tableName = 'estoque_itens';
    const colsResult: Array<{ COLUMN_NAME: string }> =
      await this.prisma.$queryRawUnsafe(
        'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ',
        tableName,
      );
    const existing = new Set(colsResult.map((r: any) => r.COLUMN_NAME));
    const insumoCol = existing.has('insumoId')
      ? 'insumoId'
      : existing.has('insumo_id')
        ? 'insumo_id'
        : null;
    const unMedCol = existing.has('unidadeMedida')
      ? 'unidadeMedida'
      : existing.has('unidade_medida')
        ? 'unidade_medida'
        : null;
    const precoCol = existing.has('precoUnitario')
      ? 'precoUnitario'
      : existing.has('preco_unitario')
        ? 'preco_unitario'
        : existing.has('valorUnitario')
          ? 'valorUnitario'
          : existing.has('valor_unitario')
            ? 'valor_unitario'
            : null;

    const selectParts: string[] = [
      't.id AS id',
      insumoCol ? `t.${insumoCol} AS insumoId` : 'NULL AS insumoId',
      't.localizacaoId AS localizacaoId',
      "COALESCE(t.nome, '') AS insumoNome",
      't.quantidadeAtual AS quantidadeAtual',
      't.quantidadeReservada AS quantidadeReservada',
      't.estoqueMinimo AS estoqueMinimo',
      't.estoqueMaximo AS estoqueMaximo',
      unMedCol
        ? `COALESCE(t.${unMedCol}, '') AS unidadeCompra`
        : "'' AS unidadeCompra",
      precoCol ? `t.${precoCol} AS valorUnitario` : '0 AS valorUnitario',
      't.dataUltimaMov AS dataUltimaMov',
      't.createdAt AS createdAt',
      't.codigo AS codigo',
      't.descricao AS descricao',
      't.codigoBarras AS codigoBarras',
      't.lote AS lote',
      't.dataValidade AS dataValidade',
      't.observacoes AS observacoes',
      't.ativo AS ativo',
      "COALESCE(l.codigo, '') AS localizacaoCodigo",
    ];

    const sql =
      `SELECT ${selectParts.join(', ')}\n` +
      `FROM ${tableName} t\n` +
      `LEFT JOIN estoque_localizacoes l ON l.id = t.localizacaoId\n` +
      `WHERE t.id = ? AND t.lojaId = ?\n` +
      `LIMIT 1`;

    const items: any[] = await this.prisma.$queryRawUnsafe(
      sql,
      id,
      context.lojaId,
    );
    if (items.length === 0) {
      throw new Error('Item de estoque não encontrado');
    }
    const item = items[0];
    return {
      ...item,
      quantidadeAtual: parseFloat(item.quantidadeAtual) || 0,
      quantidadeReservada: parseFloat(item.quantidadeReservada) || 0,
      estoqueMinimo: parseFloat(item.estoqueMinimo) || 0,
      estoqueMaximo: item.estoqueMaximo ? parseFloat(item.estoqueMaximo) : null,
      valorUnitario: parseFloat(item.valorUnitario) || 0,
      ativo: item.ativo === 1 || item.ativo === true,
    };
  }

  async criarMovimentacao(context: IEstoqueContext, data: any) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📦 Criando movimentação (svc) loja: ${context.lojaId}`);

    const itemEstoque = await this.buscarItemEstoquePorId(
      context,
      data.estoqueId,
    );
    const id = 'mov-' + Date.now();
    const quantidadeAnterior = Number(itemEstoque?.quantidadeAtual || 0);
    const delta =
      data.tipo === 'SAIDA'
        ? -Math.abs(Number(data.quantidade))
        : Math.abs(Number(data.quantidade));
    const quantidadePosterior = quantidadeAnterior + delta;

    try {
      const tableCheck: Array<{ total: any }> = await this.prisma.$queryRaw`
        SELECT COUNT(*) as total FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'estoque_movimentacoes'
      `;
      const hasTable = Number((tableCheck?.[0] as any)?.total || 0) > 0;
      if (hasTable) {
        await this.prisma.$executeRaw`
          INSERT INTO estoque_movimentacoes (
            id, lojaId, estoqueId, tipo, quantidade, quantidadeAnterior, quantidadePosterior,
            documentoRef, orcamentoId, usuarioId, dataMovimentacao, observacoes
          ) VALUES (
            ${id}, ${context.lojaId}, ${data.estoqueId}, ${data.tipo}, ${Number(data.quantidade)},
            ${quantidadeAnterior}, ${quantidadePosterior},
            ${data.documentoRef || null}, ${data.orcamentoId || null}, ${context.usuarioId || 'sistema'}, NOW(),
            ${data.observacoes || null}
          )
        `;

        // Atualizar a quantidade atual do item no estoque
        await this.prisma.$executeRaw`
          UPDATE estoque_itens 
          SET quantidadeAtual = ${quantidadePosterior}, dataUltimaMov = NOW()
          WHERE id = ${data.estoqueId} AND lojaId = ${context.lojaId}
        `;
      }
    } catch (e) {
      this.logger.warn(`⚠️ Falha ao persistir movimentação: ${e?.message}`);
    }

    return {
      id,
      estoqueId: data.estoqueId,
      insumoNome: itemEstoque?.insumoNome || 'Item não encontrado',
      localizacaoCodigo: itemEstoque?.localizacaoCodigo || '',
      localizacaoCompleta: itemEstoque?.localizacaoCodigo || '',
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
  }

  async listarMovimentacoes(context: IEstoqueContext, query: any = {}) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    const tableCheck: Array<{ total: any }> = await this.prisma.$queryRaw`
      SELECT COUNT(*) as total FROM information_schema.tables 
              WHERE table_schema = DATABASE() AND table_name = 'estoque_movimentacoes'
    `;
    const hasTable = Number((tableCheck?.[0] as any)?.total || 0) > 0;
    if (!hasTable) {
      return {
        data: [],
        total: 0,
        page: query.page || 1,
        limit: query.limit || 20,
      };
    }
    const filters: string[] = ['m.lojaId = ?'];
    const params: any[] = [context.lojaId];
    if (query?.tipo) {
      filters.push('m.tipo = ?');
      params.push(query.tipo);
    }
    if (query?.search) {
      const like = `%${String(query.search)}%`;
      filters.push(
        '(i.nome LIKE ? OR m.documentoRef LIKE ? OR m.observacoes LIKE ? OR l.codigo LIKE ?)',
      );
      params.push(like, like, like, like);
    }
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
    const offset = (page - 1) * limit;
    const totalRows: Array<{ total: any }> = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total
       FROM estoque_movimentacoes m
       LEFT JOIN estoque_itens i ON i.id = m.estoqueId
       LEFT JOIN estoque_localizacoes l ON l.id = i.localizacaoId
       ${whereClause}`,
      ...params,
    );
    const total = Number(totalRows?.[0]?.total || 0);
    const selectSql = `
      SELECT 
        m.id,
        m.estoqueId,
        m.tipo,
        m.quantidade,
        m.quantidadeAnterior,
        m.quantidadePosterior,
        m.documentoRef,
        m.usuarioId,
        m.lojaId,
        m.dataMovimentacao,
        m.observacoes,
        COALESCE(i.nome, '') as insumoNome,
        COALESCE(l.codigo, '') as localizacaoCodigo
      FROM estoque_movimentacoes m
      LEFT JOIN estoque_itens i ON i.id = m.estoqueId
      LEFT JOIN estoque_localizacoes l ON l.id = i.localizacaoId
      ${whereClause}
      ORDER BY m.dataMovimentacao DESC
      LIMIT ? OFFSET ?
    `;
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      selectSql,
      ...params,
      limit,
      offset,
    );
    const dataMapped = rows.map((r: any) => ({
      id: r.id,
      estoqueId: r.estoqueId,
      insumoNome: r.insumoNome ?? '',
      localizacaoCodigo: r.localizacaoCodigo ?? '',
      localizacaoCompleta: r.localizacaoCodigo ?? '',
      tipo: r.tipo,
      quantidade: Number(r.quantidade || 0),
      quantidadeAnterior: Number(r.quantidadeAnterior || 0),
      quantidadePosterior: Number(r.quantidadePosterior || 0),
      documentoRef: r.documentoRef ?? null,
      orcamentoId: null,
      usuarioId: r.usuarioId ?? 'sistema',
      usuarioNome: 'Administrador',
      lojaId: r.lojaId,
      dataMovimentacao: r.dataMovimentacao,
      observacoes: r.observacoes ?? null,
      createdAt: r.dataMovimentacao,
    }));
    return { data: dataMapped, total, page, limit };
  }

  async buscarMovimentacaoPorId(context: IEstoqueContext, id: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT 
        m.id,
        m.estoqueId,
        m.tipo,
        m.quantidade,
        m.quantidadeAnterior,
        m.quantidadePosterior,
        m.documentoRef,
        m.usuarioId,
        m.lojaId,
        m.dataMovimentacao,
        m.observacoes,
        COALESCE(i.nome, '') as insumoNome,
        COALESCE(l.codigo, '') as localizacaoCodigo
              FROM estoque_movimentacoes m
        LEFT JOIN estoque_itens i ON i.id = m.estoqueId
        LEFT JOIN estoque_localizacoes l ON l.id = i.localizacaoId
      WHERE m.id = ${id} AND m.lojaId = ${context.lojaId}
      LIMIT 1
    `;
    const r = rows?.[0];
    if (!r) throw new Error('Movimentação não encontrada');
    return {
      id: r.id,
      estoqueId: r.estoqueId,
      insumoNome: r.insumoNome ?? '',
      localizacaoCodigo: r.localizacaoCodigo ?? '',
      localizacaoCompleta: r.localizacaoCodigo ?? '',
      tipo: r.tipo,
      quantidade: Number(r.quantidade || 0),
      quantidadeAnterior: Number(r.quantidadeAnterior || 0),
      quantidadePosterior: Number(r.quantidadePosterior || 0),
      documentoRef: r.documentoRef ?? null,
      usuarioId: r.usuarioId ?? 'sistema',
      usuarioNome: 'Administrador',
      lojaId: r.lojaId,
      dataMovimentacao: r.dataMovimentacao,
      observacoes: r.observacoes ?? null,
      createdAt: r.dataMovimentacao,
    };
  }

  async excluirMovimentacao(context: IEstoqueContext, id: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    // Exclusão lógica não está prevista na tabela; executar delete se existir
    await this.prisma.$executeRaw`
      DELETE FROM estoque_movimentacoes WHERE id = ${id} AND lojaId = ${context.lojaId}
    `;
    return {
      message: 'Movimentação excluída com sucesso',
      id,
      deletedAt: new Date(),
    };
  }
}
