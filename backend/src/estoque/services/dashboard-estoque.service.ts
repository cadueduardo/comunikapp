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
				  WHERE table_schema = DATABASE() AND table_name = 'estoque_localizacoes'
				`;
				if (Number((tableCheck as any[])[0]?.total) > 0) {
					const localizacoesResult = await this.prisma.$queryRaw`
					        SELECT COUNT(*) as total FROM estoque_localizacoes 
					  WHERE lojaId = ${context.lojaId} AND ativo = 1
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
				  WHERE table_schema = DATABASE() AND table_name = 'estoque_itens'
				`;
				if (Number((tableCheck as any[])[0]?.total) > 0) {
					const itensResult = await this.prisma.$queryRaw`
					  SELECT COUNT(*) as total FROM estoque_itens 
					  WHERE lojaId = ${context.lojaId} AND ativo = 1
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
				  WHERE table_schema = DATABASE() AND table_name = 'estoque_movimentacoes'
				`;
				if (Number((tableCheck as any[])[0]?.total) > 0) {
					const movsResult = await this.prisma.$queryRaw`
					  SELECT COUNT(*) as total FROM estoque_movimentacoes 
					  WHERE lojaId = ${context.lojaId}
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
				  WHERE table_schema = DATABASE() AND table_name = 'estoque_itens'
				`;
				if (Number((tableCheck as any[])[0]?.total) > 0) {
					const itensAbaixoMinimoResult = await this.prisma.$queryRaw`
					  SELECT COUNT(*) as total FROM estoque_itens 
					  WHERE lojaId = ${context.lojaId} 
					  AND ativo = 1 
					  AND quantidadeAtual <= estoqueMinimo 
					  AND estoqueMinimo > 0
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
				  WHERE table_schema = DATABASE() AND table_name = 'estoque_itens'
				`;
				if (Number((tableCheck as any[])[0]?.total) > 0) {
					const valorTotalResult = await this.prisma.$queryRaw`
					  SELECT SUM(quantidadeAtual * precoUnitario) as valorTotal FROM estoque_itens 
					  WHERE lojaId = ${context.lojaId} AND ativo = 1
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
				  WHERE table_schema = DATABASE() AND table_name = 'estoque_movimentacoes'
				`;
				if (Number((tableCheck as any[])[0]?.total) > 0) {
					const rows: any[] = await this.prisma.$queryRaw`
					  SELECT 
					    m.id,
					    m.tipo,
					    m.quantidade,
					    m.dataMovimentacao,
					    COALESCE(i.nome, '') as insumoNome,
					    COALESCE(m.usuarioId, 'sistema') as usuarioNome
					  FROM estoque_movimentacoes m
					  LEFT JOIN estoque_itens i ON i.id = m.estoqueId
					  WHERE m.lojaId = ${context.lojaId}
					  ORDER BY m.dataMovimentacao DESC
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

			let estatisticas: any = { entradas: 0, saidas: 0, ajustes: 0, transferencias: 0 };
			try {
				const tableCheck = await this.prisma.$queryRaw`
				  SELECT COUNT(*) as total FROM information_schema.tables 
				  WHERE table_schema = DATABASE() AND table_name = 'estoque_movimentacoes'
				`;
				if (Number((tableCheck as any[])[0]?.total) > 0) {
					const statsRows: any[] = await this.prisma.$queryRaw`
					  SELECT tipo, COUNT(*) as total
					  FROM estoque_movimentacoes
					  WHERE lojaId = ${context.lojaId}
					  GROUP BY tipo
					`;
					const map: any = { ENTRADA: 0, SAIDA: 0, AJUSTE: 0, TRANSFERENCIA: 0 };
					for (const r of statsRows) map[r.tipo] = Number(r.total || 0);
					estatisticas = {} as any;
					estatisticas.entradas = map.ENTRADA || 0;
					estatisticas.saidas = map.SAIDA || 0;
					estatisticas.ajustes = map.AJUSTE || 0;
					estatisticas.transferencias = map.TRANSFERENCIA || 0;
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


