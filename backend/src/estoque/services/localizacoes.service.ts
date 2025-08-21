import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IEstoqueContext } from '../types/estoque-context';
import { PrismaService } from '../../prisma/prisma.service';
import { detectTableName, getExistingColumns } from '../utils/estoque-sql.util';

@Injectable()
export class LocalizacoesService {
  private readonly logger = new Logger(LocalizacoesService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async criarLocalizacao(context: IEstoqueContext, data: any) {
		if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
		this.logger.debug(`📍 [LocalizacoesService] criarLocalizacao loja=${context.lojaId}`);

		const required = ['codigo', 'deposito'];
		for (const f of required) {
			const v = data?.[f];
			if (!v || (typeof v === 'string' && String(v).trim().length === 0)) {
				throw new BadRequestException(`Campo obrigatório ausente: ${f}`);
			}
		}

		const codigo = String(data.codigo).trim().toUpperCase();
		const deposito = String(data.deposito).trim();

		const tableName = 'estoque_localizacoes';
		const existe: any[] = await this.prisma.$queryRawUnsafe(
			`SELECT id FROM ${tableName} WHERE lojaId = ? AND codigo = ? LIMIT 1`,
			context.lojaId,
			codigo,
		);
		if (existe?.length) {
			throw new BadRequestException('Código de localização já existe nesta loja');
		}

		const existing = await getExistingColumns(this.prisma, tableName);

		const id = `loc-${Date.now()}`;
		const now = new Date();
		const columns: string[] = [];
		const values: any[] = [];
		const add = (col: string, val: any) => { if (existing.has(col) && val !== undefined) { columns.push(col); values.push(val); } };

		add('id', id);
		add('lojaId', context.lojaId);
		add('codigo', codigo);
		add('deposito', deposito);
		add('corredor', data.corredor || null);
		add('prateleira', data.prateleira || null);
		add('nivel', data.nivel || null);
		add('posicao', data.posicao || null);
		add('descricao', data.descricao || null);
		add('capacidade', data.capacidade ?? null);
		add('ativo', data.ativo !== undefined ? !!data.ativo : true);
		add('createdAt', now);
		add('updatedAt', now);

		if (!columns.length) throw new BadRequestException('Estrutura da tabela estoque_localizacoes não encontrada.');
		const placeholders = columns.map(() => '?').join(', ');
		await this.prisma.$executeRawUnsafe(
			`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
			...values,
		);
		const selected: any[] = await this.prisma.$queryRawUnsafe(
			`SELECT * FROM ${tableName} WHERE id = ? AND lojaId = ? LIMIT 1`,
			id,
			context.lojaId,
		);
		return selected?.[0] || { id, lojaId: context.lojaId, codigo, deposito };
  }

  async listarLocalizacoes(context: IEstoqueContext, query: any = {}) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📍 [LocalizacoesService] listarLocalizacoes loja=${context.lojaId}`);
    const whereParts: string[] = ['l.lojaId = ?'];
    const params: any[] = [context.lojaId];
    if (query?.deposito) { whereParts.push('l.deposito LIKE ?'); params.push(`%${String(query.deposito)}%`); }
    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
    const tableName = 'estoque_localizacoes';
    const rows: any[] = await this.prisma.$queryRawUnsafe(
             `SELECT l.id, l.codigo, l.deposito, l.ativo, l.createdAt FROM ${tableName} l ${whereClause} ORDER BY l.codigo ASC`,
      ...params,
    );
    const page = Number(query.page) || 1; const limit = Number(query.limit) || 10;
    const slice = rows.slice((page - 1) * limit, (page - 1) * limit + limit);
    return { data: slice, pagination: { page, limit, total: rows.length, pages: Math.ceil(rows.length / limit) } } as any;
  }

  async buscarLocalizacaoPorId(context: IEstoqueContext, id: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📍 [LocalizacoesService] buscarLocalizacaoPorId id=${id} loja=${context.lojaId}`);
    const tableName = 'estoque_localizacoes';
    const rows: any[] = await this.prisma.$queryRawUnsafe(
             `SELECT 
          id,
          lojaId,
          codigo,
          deposito,
          corredor,
          prateleira,
          nivel,
          posicao,
          descricao,
          capacidade,
          ativo,
          createdAt,
          updatedAt
        FROM ${tableName} WHERE id = ? AND lojaId = ? LIMIT 1`,
       id,
       context.lojaId,
     );
     if (!rows?.length) throw new BadRequestException('Localização não encontrada');
     const r = rows[0];
     return {
       id: r.id,
       lojaId: r.lojaId,
      codigo: r.codigo,
      deposito: r.deposito,
      corredor: r.corredor,
      prateleira: r.prateleira,
      nivel: r.nivel,
      posicao: r.posicao,
      descricao: r.descricao,
      capacidade: r.capacidade,
      ativo: r.ativo === 1 || r.ativo === true,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    } as any;
  }

  async atualizarLocalizacao(context: IEstoqueContext, id: string, data: any) {
		if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
		this.logger.debug(`📍 [LocalizacoesService] atualizarLocalizacao id=${id} loja=${context.lojaId}`);

		const tableName = 'estoque_localizacoes';
		const existing = await getExistingColumns(this.prisma, tableName);
		const updates: string[] = [];
		const params: any[] = [];

		const map: Record<string, string> = {
			codigo: 'codigo',
			deposito: 'deposito',
			corredor: 'corredor',
			prateleira: 'prateleira',
			nivel: 'nivel',
			posicao: 'posicao',
			descricao: 'descricao',
			capacidade: 'capacidade',
			ativo: 'ativo',
		};

		for (const key of Object.keys(data || {})) {
			const col = map[key];
			if (col && existing.has(col)) {
				let value = data[key];
				if (key === 'codigo' && typeof value === 'string') value = String(value).trim().toUpperCase();
				updates.push(`${col} = ?`);
				params.push(value);
			}
		}
		if (existing.has('updatedAt')) updates.push('updatedAt = NOW()');
		if (!updates.length) throw new BadRequestException('Nenhum campo válido para atualização');

		params.push(id, context.lojaId);
		await this.prisma.$executeRawUnsafe(
			`UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = ? AND lojaId = ?`,
			...params,
		);
		const row: any[] = await this.prisma.$queryRawUnsafe(
			`SELECT * FROM ${tableName} WHERE id = ? AND lojaId = ? LIMIT 1`,
			id,
			context.lojaId,
		);
		return row?.[0] || { id };
  }

  async desativarLocalizacao(context: IEstoqueContext, id: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📍 [LocalizacoesService] desativarLocalizacao id=${id} loja=${context.lojaId}`);
		return this.atualizarLocalizacao(context, id, { ativo: false });
  }

  async verificarLocalizacaoExclusao(context: IEstoqueContext, id: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📍 [LocalizacoesService] verificarLocalizacaoExclusao id=${id} loja=${context.lojaId}`);
    
    // Detectar nome da tabela de itens automaticamente
    const itensTable = 'estoque_itens';
    
    const countRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM ${itensTable} WHERE localizacaoId = ? AND lojaId = ?`,
      id,
      context.lojaId,
    );
    const totalItens = Number(countRows?.[0]?.total || 0);
    return {
      podeExcluir: totalItens === 0,
      motivo:
        totalItens === 0
          ? 'Localização pode ser excluída com segurança'
          : `Não é possível excluir esta localização. Existem ${totalItens} item(s) estocado(s).`,
    };
  }

  async excluirLocalizacao(context: IEstoqueContext, id: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`📍 [LocalizacoesService] excluirLocalizacao id=${id} loja=${context.lojaId}`);
    const check = await this.verificarLocalizacaoExclusao(context, id);
    if (!check.podeExcluir) throw new BadRequestException(check.motivo);
    const tableName = 'estoque_localizacoes';
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM ${tableName} WHERE id = ? AND lojaId = ?`,
      id,
      context.lojaId,
    );
    return { success: true, id, deletedAt: new Date() } as any;
  }
}


