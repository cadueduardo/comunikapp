import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IEstoqueContext } from '../types/estoque-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardEstoqueService {
	private readonly logger = new Logger(DashboardEstoqueService.name);

	constructor(private readonly prisma: PrismaService) {}

	async obterDashboard(context: IEstoqueContext) {
		if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
		this.logger.debug(`📊 [DashboardEstoqueService] obterDashboard loja=${context.lojaId}`);

		try {
			let totalLocalizacoes = 0;
			try {
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
				this.logger.warn('⚠️ Erro ao contar localizações:', (error as any).message);
			}

			let totalItens = 0;
			try {
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
				this.logger.warn('⚠️ Erro ao contar itens:', (error as any).message);
			}

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
				}
			} catch (error) {
				this.logger.warn('⚠️ Erro ao contar movimentações:', (error as any).message);
			}

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
				this.logger.warn('⚠️ Erro ao contar itens abaixo do mínimo:', (error as any).message);
			}

			let valorTotalEstoque = 0;
			try {
				const tableCheck = await this.prisma.$queryRaw`
				  SELECT COUNT(*) as total FROM information_schema.tables 
				  WHERE table_schema = DATABASE() AND table_name = 'itens_estoque'
				`;
				if (Number((tableCheck as any[])[0]?.total) > 0) {
					const valorTotalResult = await this.prisma.$queryRaw`
					  SELECT SUM(quantidade * preco_unitario) as valorTotal FROM itens_estoque 
					  WHERE loja_id = ${context.lojaId} AND ativo = 1
					`;
					valorTotalEstoque = Number((valorTotalResult as any[])[0]?.valorTotal || 0);
				}
			} catch (error) {
				this.logger.warn('⚠️ Erro ao calcular valor total:', (error as any).message);
			}

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
					ultimasMovimentacoes = rows.map((r) => ({
						id: r.id,
						tipo: r.tipo,
						insumoNome: r.insumoNome,
						quantidade: Number(r.quantidade || 0),
						dataMovimentacao: r.dataMovimentacao,
						usuarioNome: r.usuarioNome,
					}));
				}
			} catch (error) {
				this.logger.warn('⚠️ Erro ao carregar últimas movimentações:', (error as any).message);
			}

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
					for (const r of statsRows) map[r.tipo] = Number(r.total || 0);
					estatisticas = {
						entradas: map.ENTRADA || 0,
						saias: map.SAIDA || 0,
						ajustes: map.AJUSTE || 0,
						transferencias: map.TRANSFERENCIA || 0,
					} as any;
				}
			} catch (error) {
				this.logger.warn('⚠️ Erro ao calcular estatísticas:', (error as any).message);
			}

			return {
				totalLocalizacoes,
				totalItens,
				totalMovimentacoes,
				itensAbaixoMinimo,
				valorTotalEstoque,
				ultimasMovimentacoes,
				estatisticas,
			};
		} catch (error) {
			this.logger.error('❌ Erro ao obter dashboard:', error as any);
			throw new Error('Erro ao obter dados do dashboard');
		}
	}
}


