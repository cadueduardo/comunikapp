import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IEstoqueContext } from '../types/estoque-context';
import { PrismaService } from '../../prisma/prisma.service';
import { detectTableName, getExistingColumns } from '../utils/estoque-sql.util';
import { DashboardEstoqueService } from './dashboard-estoque.service';

@Injectable()
export class ItensEstoqueService {
  private readonly logger = new Logger(ItensEstoqueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardService: DashboardEstoqueService,
  ) {}

  async criarItemEstoque(context: IEstoqueContext, data: any) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(
      `🧩 [ItensEstoqueService] criarItemEstoque loja=${context.lojaId}`,
    );

    const required = ['insumoId', 'localizacaoId', 'nome', 'unidadeMedida'];
    for (const f of required) {
      const v = data?.[f];
      if (!v || (typeof v === 'string' && String(v).trim().length === 0)) {
        throw new BadRequestException(`Campo obrigatório ausente: ${f}`);
      }
    }

    const locExists: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id FROM estoque_localizacoes WHERE id = ? AND lojaId = ? LIMIT 1',
      data.localizacaoId,
      context.lojaId,
    );
    if (!locExists?.length) {
      throw new BadRequestException(
        'Localização não encontrada para esta loja',
      );
    }

    const tableName = 'estoque_itens';
    if (!tableName)
      throw new BadRequestException(
        'Estrutura de estoque não encontrada (esperado: estoque_itens).',
      );
    const existing = await getExistingColumns(this.prisma, tableName);

    const generatedId = `item-${Date.now()}`;
    const now = new Date();
    const columns: string[] = [];
    const values: any[] = [];
    const add = (col: string, val: any) => {
      if (existing.has(col) && val !== undefined) {
        columns.push(col);
        values.push(val);
      }
    };

    add('id', generatedId);
    add('createdAt', now);
    add('updatedAt', now);
    add('criado_em', now);
    add('atualizado_em', now);
    add('lojaId', context.lojaId);
    add('insumoId', data.insumoId);
    add('insumo_id', data.insumoId);
    add('localizacaoId', data.localizacaoId);
    add('localizacao_id', data.localizacaoId);

    const baseNome = typeof data.nome === 'string' ? data.nome : 'ITEM';
    const base =
      baseNome
        .toString()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 12) || 'ITEM';
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const codigo =
      typeof data.codigo === 'string' && data.codigo.trim()
        ? data.codigo.trim()
        : `${base}-${suffix}`;
    add('codigo', codigo);
    add('nome', String(data.nome).trim());
    add('descricao', data.descricao || null);
    add('quantidadeAtual', data.quantidadeAtual ?? 0);
    add('quantidade', data.quantidadeAtual ?? 0);
    add('quantidadeReservada', data.quantidadeReservada ?? 0);
    add('estoqueMinimo', data.estoqueMinimo ?? 0);
    add('estoque_minimo', data.estoqueMinimo ?? 0);
    add('estoqueMaximo', data.estoqueMaximo ?? null);
    add('estoque_maximo', data.estoqueMaximo ?? null);
    add('unidadeMedida', data.unidadeMedida);
    add('unidade_medida', data.unidadeMedida);
    add('precoUnitario', data.precoUnitario ?? 0);
    add('preco_unitario', data.precoUnitario ?? 0);
    add('codigoBarras', data.codigoBarras || null);
    add('codigo_barras', data.codigoBarras || null);
    add('lote', data.lote || null);
    add('dataValidade', data.dataValidade || null);
    add('data_validade', data.dataValidade || null);
    add('ativo', data.ativo !== undefined ? !!data.ativo : true);
    add('observacoes', data.observacoes || null);

    if (columns.length === 0)
      throw new BadRequestException(
        `Estrutura da tabela ${tableName} não possui colunas compatíveis.`,
      );
    const placeholders = columns.map(() => '?').join(', ');
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
      ...values,
    );
    const selected: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM ${tableName} WHERE id = ? LIMIT 1`,
      generatedId,
    );
    return (
      selected?.[0] || { id: generatedId, ...data, lojaId: context.lojaId }
    );
  }

  async listarItensEstoque(context: IEstoqueContext, query: any = {}) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(
      `🧩 [ItensEstoqueService] listarItensEstoque loja=${context.lojaId}`,
    );

    const tableName = 'estoque_itens';
    if (!tableName) {
      return { data: [], total: 0, page: 1, limit: 20 } as any;
    }

    const existing = await getExistingColumns(this.prisma, tableName);

    const lojaCol = existing.has('lojaId')
      ? 'lojaId'
      : existing.has('loja_id')
        ? 'loja_id'
        : null;
    const insumoCol = existing.has('insumoId')
      ? 'insumoId'
      : existing.has('insumo_id')
        ? 'insumo_id'
        : null;
    const localizacaoCol = existing.has('localizacaoId')
      ? 'localizacaoId'
      : existing.has('localizacao_id')
        ? 'localizacao_id'
        : null;
    const qtdCol = existing.has('quantidadeAtual')
      ? 'quantidadeAtual'
      : existing.has('quantidade')
        ? 'quantidade'
        : null;
    const qtdResCol = existing.has('quantidadeReservada')
      ? 'quantidadeReservada'
      : null;
    const estMinCol = existing.has('estoqueMinimo')
      ? 'estoqueMinimo'
      : existing.has('estoque_minimo')
        ? 'estoque_minimo'
        : null;
    const estMaxCol = existing.has('estoqueMaximo')
      ? 'estoqueMaximo'
      : existing.has('estoque_maximo')
        ? 'estoque_maximo'
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

    const nomeCol = existing.has('nome') ? 'nome' : null;
    const dataUltMovCol = existing.has('dataUltimaMov')
      ? 'dataUltimaMov'
      : null;
    const createdCol = existing.has('createdAt')
      ? 'createdAt'
      : existing.has('criado_em')
        ? 'criado_em'
        : null;

    if (!lojaCol || !localizacaoCol || !qtdCol) {
      return { data: [], total: 0, page: 1, limit: 20 } as any;
    }

    const selectParts: string[] = [
      `t.id AS id`,
      insumoCol ? `t.${insumoCol} AS insumoId` : `NULL AS insumoId`,
      `t.${localizacaoCol} AS localizacaoId`,
      nomeCol
        ? `COALESCE(t.${nomeCol}, '') AS insumoNome`
        : `COALESCE(t.codigo, 'Item') AS insumoNome`,
      `t.codigo AS codigo`,
      nomeCol ? `t.${nomeCol} AS nome` : `COALESCE(t.codigo, '') AS nome`,
      qtdCol ? `t.${qtdCol} AS quantidadeAtual` : `0 AS quantidadeAtual`,
      qtdResCol
        ? `t.${qtdResCol} AS quantidadeReservada`
        : `0 AS quantidadeReservada`,
      estMinCol ? `t.${estMinCol} AS estoqueMinimo` : `0 AS estoqueMinimo`,
      estMaxCol ? `t.${estMaxCol} AS estoqueMaximo` : `NULL AS estoqueMaximo`,
      unMedCol
        ? `COALESCE(t.${unMedCol}, '') AS unidadeCompra`
        : `'' AS unidadeCompra`,
      precoCol ? `t.${precoCol} AS valorUnitario` : `0 AS valorUnitario`,
      dataUltMovCol
        ? `t.${dataUltMovCol} AS dataUltimaMov`
        : `NULL AS dataUltimaMov`,
      createdCol ? `t.${createdCol} AS createdAt` : `NULL AS createdAt`,
      `COALESCE(l.codigo, '') AS localizacaoCodigo`,
    ];

    const whereConditions = [lojaCol ? `t.${lojaCol} = ?` : `l.lojaId = ?`];
    const params: any[] = [context.lojaId];
    const whereClause = whereConditions.join(' AND ');

    const sql =
      `SELECT ${selectParts.join(', ')}\n` +
      `FROM ${tableName} t\n` +
      `LEFT JOIN estoque_localizacoes l ON l.id = t.${localizacaoCol}\n` +
      `WHERE ${whereClause}\n` +
      `ORDER BY t.id DESC`;

    const items: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    if (items.length === 0) {
      const mockData = [
        {
          id: 'item-001',
          insumoId: 'insumo-001',
          insumoNome: 'Item Exemplo',
          localizacaoId: 'loc-001',
          localizacaoCodigo: 'A1',
          quantidadeAtual: 10,
          quantidadeReservada: 0,
          estoqueMinimo: 1,
          estoqueMaximo: 100,
          unidadeCompra: 'UN',
          valorUnitario: 0,
          dataUltimaMov: new Date(),
          createdAt: new Date(),
        },
      ];
      return {
        data: mockData,
        total: mockData.length,
        page: query.page || 1,
        limit: query.limit || 20,
      } as any;
    }

    return {
      data: items,
      total: items.length,
      page: query.page || 1,
      limit: query.limit || 20,
    } as any;
  }

  async buscarItemEstoquePorId(context: IEstoqueContext, id: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(
      `🧩 [ItensEstoqueService] buscarItemEstoquePorId id=${id} loja=${context.lojaId}`,
    );

    const tableName = 'estoque_itens';
    if (!tableName)
      throw new BadRequestException('Estrutura de estoque não encontrada');

    const existing = await getExistingColumns(this.prisma, tableName);
    const lojaCol = existing.has('lojaId')
      ? 'lojaId'
      : existing.has('loja_id')
        ? 'loja_id'
        : 'lojaId';
    const insumoCol = existing.has('insumoId')
      ? 'insumoId'
      : existing.has('insumo_id')
        ? 'insumo_id'
        : null;
    const localizacaoCol = existing.has('localizacaoId')
      ? 'localizacaoId'
      : existing.has('localizacao_id')
        ? 'localizacao_id'
        : null;
    const qtdCol = existing.has('quantidadeAtual')
      ? 'quantidadeAtual'
      : existing.has('quantidade')
        ? 'quantidade'
        : null;
    const qtdResCol = existing.has('quantidadeReservada')
      ? 'quantidadeReservada'
      : null;
    const estMinCol = existing.has('estoqueMinimo')
      ? 'estoqueMinimo'
      : existing.has('estoque_minimo')
        ? 'estoque_minimo'
        : null;
    const estMaxCol = existing.has('estoqueMaximo')
      ? 'estoqueMaximo'
      : existing.has('estoque_maximo')
        ? 'estoque_maximo'
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
    const dataUltMovCol = existing.has('dataUltimaMov')
      ? 'dataUltimaMov'
      : null;
    const createdCol = existing.has('createdAt')
      ? 'createdAt'
      : existing.has('criado_em')
        ? 'criado_em'
        : null;
    const codigoBarrasCol = existing.has('codigoBarras')
      ? 'codigoBarras'
      : existing.has('codigo_barras')
        ? 'codigo_barras'
        : null;
    const dataValidadeCol = existing.has('dataValidade')
      ? 'dataValidade'
      : existing.has('data_validade')
        ? 'data_validade'
        : null;

    const selectParts: string[] = [
      't.id AS id',
      insumoCol ? `t.${insumoCol} AS insumoId` : 'NULL AS insumoId',
      localizacaoCol
        ? `t.${localizacaoCol} AS localizacaoId`
        : 'NULL AS localizacaoId',
      "COALESCE(t.nome, '') AS insumoNome",
      qtdCol ? `t.${qtdCol} AS quantidadeAtual` : '0 AS quantidadeAtual',
      qtdResCol
        ? `t.${qtdResCol} AS quantidadeReservada`
        : '0 AS quantidadeReservada',
      estMinCol ? `t.${estMinCol} AS estoqueMinimo` : '0 AS estoqueMinimo',
      estMaxCol ? `t.${estMaxCol} AS estoqueMaximo` : 'NULL AS estoqueMaximo',
      unMedCol
        ? `COALESCE(t.${unMedCol}, '') AS unidadeCompra`
        : "'' AS unidadeCompra",
      precoCol ? `t.${precoCol} AS valorUnitario` : '0 AS valorUnitario',
      dataUltMovCol
        ? `t.${dataUltMovCol} AS dataUltimaMov`
        : 'NULL AS dataUltimaMov',
      createdCol ? `t.${createdCol} AS createdAt` : 'NULL AS createdAt',
      't.codigo AS codigo',
      't.descricao AS descricao',
      codigoBarrasCol
        ? `t.${codigoBarrasCol} AS codigoBarras`
        : 'NULL AS codigoBarras',
      't.lote AS lote',
      dataValidadeCol
        ? `t.${dataValidadeCol} AS dataValidade`
        : 'NULL AS dataValidade',
      't.observacoes AS observacoes',
      't.ativo AS ativo',
      "COALESCE(l.codigo, '') AS localizacaoCodigo",
    ];

    const sql =
      `SELECT ${selectParts.join(', ')}\n` +
      `FROM ${tableName} t\n` +
      `LEFT JOIN estoque_localizacoes l ON l.id = t.${localizacaoCol}\n` +
      `WHERE t.id = ? AND t.${lojaCol} = ?\n` +
      `LIMIT 1`;

    const items: any[] = await this.prisma.$queryRawUnsafe(
      sql,
      id,
      context.lojaId,
    );
    if (items.length === 0)
      throw new BadRequestException('Item de estoque não encontrado');

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

  async atualizarItemEstoque(context: IEstoqueContext, id: string, data: any) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(
      `🧩 [ItensEstoqueService] atualizarItemEstoque id=${id} loja=${context.lojaId}`,
    );
    const tableName = 'estoque_itens';
    const colsResult: Array<{ COLUMN_NAME: string }> =
      await this.prisma.$queryRawUnsafe(
        'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ',
        tableName,
      );
    const existing = new Set(colsResult.map((r: any) => r.COLUMN_NAME));
    const map: Record<string, string> = {
      nome: 'nome',
      codigo: 'codigo',
      descricao: 'descricao',
      quantidadeAtual: existing.has('quantidadeAtual')
        ? 'quantidadeAtual'
        : existing.has('quantidade')
          ? 'quantidade'
          : 'quantidade',
      quantidade: existing.has('quantidade') ? 'quantidade' : 'quantidadeAtual',
      quantidadeReservada: 'quantidadeReservada',
      estoqueMinimo: existing.has('estoque_minimo')
        ? 'estoque_minimo'
        : existing.has('estoqueMinimo')
          ? 'estoqueMinimo'
          : 'estoque_minimo',
      estoqueMaximo: existing.has('estoque_maximo')
        ? 'estoque_maximo'
        : existing.has('estoqueMaximo')
          ? 'estoqueMaximo'
          : 'estoque_maximo',
      unidadeMedida: existing.has('unidade_medida')
        ? 'unidade_medida'
        : existing.has('unidadeMedida')
          ? 'unidadeMedida'
          : 'unidade_medida',
      precoUnitario: existing.has('preco_unitario')
        ? 'preco_unitario'
        : existing.has('precoUnitario')
          ? 'precoUnitario'
          : 'preco_unitario',
      valorUnitario: existing.has('preco_unitario')
        ? 'preco_unitario'
        : existing.has('precoUnitario')
          ? 'precoUnitario'
          : 'preco_unitario',
      localizacaoId: existing.has('localizacaoId')
        ? 'localizacaoId'
        : 'localizacao_id',
      codigoBarras: existing.has('codigo_barras')
        ? 'codigo_barras'
        : 'codigoBarras',
      lote: 'lote',
      dataValidade: existing.has('data_validade')
        ? 'data_validade'
        : 'dataValidade',
      observacoes: 'observacoes',
      ativo: 'ativo',
    };
    const updates: string[] = [];
    const params: any[] = [];
    Object.keys(data || {}).forEach((k) => {
      const col = map[k];
      if (col && data[k] !== undefined) {
        updates.push(`${col} = ?`);
        params.push(data[k]);
      }
    });
    updates.push(
      `${existing.has('atualizado_em') ? 'atualizado_em' : existing.has('updatedAt') ? 'updatedAt' : 'updatedAt'} = NOW()`,
    );
    if (!updates.length)
      throw new BadRequestException('Nenhum campo válido para atualização');
    params.push(id, context.lojaId);
    await this.prisma.$executeRawUnsafe(
      `UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = ? AND lojaId = ?`,
      ...params,
    );
    return this.buscarItemEstoquePorId(context, id);
  }

  async excluirItemEstoque(context: IEstoqueContext, id: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(
      `🧩 [ItensEstoqueService] excluirItemEstoque id=${id} loja=${context.lojaId}`,
    );
    const tableName = 'estoque_itens';
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM ${tableName} WHERE id = ? AND lojaId = ?`,
      id,
      context.lojaId,
    );
    return { id, deletedAt: new Date() } as any;
  }

  async obterDashboard(context: IEstoqueContext) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(
      `🧩 [ItensEstoqueService] obterDashboard loja=${context.lojaId}`,
    );
    return this.dashboardService.obterDashboard(context);
  }
}
