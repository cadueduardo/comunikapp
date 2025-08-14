import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IEstoqueContext } from '../types/estoque-context';
import { PrismaService } from '../../prisma/prisma.service';
import { detectTableName, getExistingColumns } from '../utils/estoque-sql.util';

@Injectable()
export class RelatoriosEstoqueService {
	private readonly logger = new Logger(RelatoriosEstoqueService.name);

	constructor(private readonly prisma: PrismaService) {}

  async relatorioEstoqueBaixo(context: IEstoqueContext) {
		if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
		this.logger.debug(`📊 [RelatoriosEstoqueService] estoque baixo loja=${context.lojaId}`);
		try {
      const itensTable = await detectTableName(this.prisma, ['itens_estoque', 'estoque_itens']);
      if (!itensTable) return [];
      const itensCols = await getExistingColumns(this.prisma, itensTable);
      const idCol = 'id';
      const nomeCol = itensCols.has('nome') ? 'nome' : 'descricao';
      const unidadeCol = itensCols.has('unidadeCompra') ? 'unidadeCompra' : (itensCols.has('unidade_compra') ? 'unidade_compra' : (itensCols.has('unidade_uso') ? 'unidade_uso' : nomeCol));
      const locIdCol = itensCols.has('localizacao_id') ? 'localizacao_id' : (itensCols.has('localizacaoId') ? 'localizacaoId' : 'localizacao_id');
      const lojaCol = itensCols.has('loja_id') ? 'loja_id' : (itensCols.has('lojaId') ? 'lojaId' : 'loja_id');
      const ativoCol = itensCols.has('ativo') ? 'ativo' : (itensCols.has('status') ? 'status' : 'ativo');
      const qtdCol = itensCols.has('quantidadeAtual') ? 'quantidadeAtual' : (itensCols.has('quantidade') ? 'quantidade' : 'quantidade');
      const estMinCol = itensCols.has('estoqueMinimo') ? 'estoqueMinimo' : (itensCols.has('estoque_minimo') ? 'estoque_minimo' : 'estoque_minimo');
      const valorUnitCol = itensCols.has('valorUnitario') ? 'valorUnitario' : (itensCols.has('preco_unitario') ? 'preco_unitario' : (itensCols.has('custo_medio') ? 'custo_medio' : qtdCol));
      const dataUltMovCol = itensCols.has('dataUltimaMov') ? 'dataUltimaMov' : (itensCols.has('updatedAt') ? 'updatedAt' : 'criado_em');

      const itensBaixoEstoque = await this.prisma.$queryRawUnsafe(
        `SELECT 
          ie.${idCol} as id,
          COALESCE(ie.${nomeCol}, ie.codigo) as insumoNome,
          ie.${unidadeCol} as unidadeCompra,
          l.codigo as localizacaoCodigo,
          ie.${qtdCol} as quantidadeAtual,
          ie.${estMinCol} as estoqueMinimo,
          ie.${valorUnitCol} as valorUnitario,
          DATEDIFF(NOW(), COALESCE(ie.${dataUltMovCol}, ie.criado_em)) as diasSemMovimentacao
        FROM ${itensTable} ie
        LEFT JOIN localizacoes l ON l.id = ie.${locIdCol}
        WHERE CONVERT(ie.${lojaCol} USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci
        AND COALESCE(ie.${ativoCol}, 1) = 1
        AND ie.${qtdCol} <= ie.${estMinCol}
        ORDER BY ie.${qtdCol} ASC, diasSemMovimentacao DESC`,
        context.lojaId,
      );
      return itensBaixoEstoque as any[];
		} catch (error) {
			this.logger.error(`❌ Erro ao gerar relatório de estoque baixo: ${(error as any).message}`);
			throw new Error(`Erro ao gerar relatório de estoque baixo: ${(error as any).message}`);
		}
	}

  async relatorioVencimento(context: IEstoqueContext) {
		if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
		this.logger.debug(`📊 [RelatoriosEstoqueService] vencimento loja=${context.lojaId}`);
		try {
      const lotesTable = await detectTableName(this.prisma, ['estoque_lotes', 'inventory_lots']);
      if (!lotesTable) return [];
      const lotesCols = await getExistingColumns(this.prisma, lotesTable);
      const lojaLoteCol = lotesCols.has('loja_id') ? 'loja_id' : (lotesCols.has('lojaId') ? 'lojaId' : 'loja_id');
      const estIdCol = lotesCols.has('estoque_id') ? 'estoque_id' : (lotesCols.has('estoqueId') ? 'estoqueId' : 'estoque_id');
      const numeroLoteCol = lotesCols.has('numero_lote') ? 'numero_lote' : (lotesCols.has('numeroLote') ? 'numeroLote' : 'numero_lote');
      const dataValCol = lotesCols.has('data_validade') ? 'data_validade' : (lotesCols.has('dataValidade') ? 'dataValidade' : 'data_validade');
      const qtdLoteCol = lotesCols.has('quantidade_lote') ? 'quantidade_lote' : (lotesCols.has('quantidadeLote') ? 'quantidadeLote' : 'quantidade_lote');
      const statusCol = lotesCols.has('status') ? 'status' : 'status';

      const itensTable = await detectTableName(this.prisma, ['itens_estoque', 'estoque_itens']);
      const itensCols = itensTable ? await getExistingColumns(this.prisma, itensTable) : new Set<string>();
      const locIdCol = itensCols.has('localizacao_id') ? 'localizacao_id' : (itensCols.has('localizacaoId') ? 'localizacaoId' : 'localizacao_id');
      const nomeCol = itensCols.has('nome') ? 'nome' : 'descricao';
      const unidadeCol = itensCols.has('unidadeCompra') ? 'unidadeCompra' : (itensCols.has('unidade_compra') ? 'unidade_compra' : (itensCols.has('unidade_uso') ? 'unidade_uso' : nomeCol));

      const lotesVencimento = await this.prisma.$queryRawUnsafe(
        `SELECT 
          el.id,
          COALESCE(ie.${nomeCol}, ie.codigo) as insumoNome,
          COALESCE(ie.${unidadeCol}, '') as unidadeCompra,
          l.codigo as localizacaoCodigo,
          el.${numeroLoteCol} as numeroLote,
          el.${dataValCol} as dataValidade,
          DATEDIFF(el.${dataValCol}, NOW()) as diasRestantes,
          el.${qtdLoteCol} as quantidadeLote
        FROM ${lotesTable} el
        LEFT JOIN ${itensTable ?? 'itens_estoque'} ie ON el.${estIdCol} = ie.id
        LEFT JOIN localizacoes l ON ie.${locIdCol} = l.id
        WHERE CONVERT(el.${lojaLoteCol} USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci
        AND el.${statusCol} = 'ATIVO'
        AND el.${dataValCol} IS NOT NULL
        AND el.${dataValCol} <= DATE_ADD(NOW(), INTERVAL 30 DAY)
        ORDER BY el.${dataValCol} ASC`,
        context.lojaId,
      );
      return lotesVencimento as any[];
		} catch (error) {
			this.logger.error(`❌ Erro ao gerar relatório de vencimentos: ${(error as any).message}`);
			if ((error as any).message?.includes("doesn't exist")) {
				this.logger.warn('⚠️ Tabela estoque_lotes não existe, retornando array vazio');
				return [];
			}
			throw new Error(`Erro ao gerar relatório de vencimentos: ${(error as any).message}`);
		}
	}

  async relatorioOcupacao(context: IEstoqueContext) {
		if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
		this.logger.debug(`📊 [RelatoriosEstoqueService] ocupacao loja=${context.lojaId}`);
		try {
      const itensTable = await detectTableName(this.prisma, ['itens_estoque', 'estoque_itens']);
      const itensCols = itensTable ? await getExistingColumns(this.prisma, itensTable) : new Set<string>();
      const locIdCol = itensCols.has('localizacao_id') ? 'localizacao_id' : (itensCols.has('localizacaoId') ? 'localizacaoId' : 'localizacao_id');
      const lojaItemCol = itensCols.has('loja_id') ? 'loja_id' : (itensCols.has('lojaId') ? 'lojaId' : 'loja_id');
      const ativoCol = itensCols.has('ativo') ? 'ativo' : (itensCols.has('status') ? 'status' : 'ativo');

      const ocupacaoDepositos = await this.prisma.$queryRawUnsafe(
        `SELECT 
          l.deposito,
          COUNT(l.id) as totalLocalizacoes,
          SUM(CASE WHEN EXISTS (
            SELECT 1 FROM ${itensTable ?? 'itens_estoque'} ie 
            WHERE ie.${locIdCol} = l.id 
            AND CONVERT(ie.${lojaItemCol} USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci
            AND COALESCE(ie.${ativoCol}, 1) = 1
          ) THEN 1 ELSE 0 END) as localizacoesOcupadas,
          SUM(CASE WHEN NOT EXISTS (
            SELECT 1 FROM ${itensTable ?? 'itens_estoque'} ie 
            WHERE ie.${locIdCol} = l.id 
            AND CONVERT(ie.${lojaItemCol} USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci
            AND COALESCE(ie.${ativoCol}, 1) = 1
          ) THEN 1 ELSE 0 END) as localizacoesVazias,
          COALESCE(SUM(l.capacidade), 0) as capacidadeTotal,
          COALESCE(SUM(
            CASE 
              WHEN EXISTS (SELECT 1 FROM ${itensTable ?? 'itens_estoque'} ie WHERE ie.${locIdCol} = l.id AND CONVERT(ie.${lojaItemCol} USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci AND COALESCE(ie.${ativoCol}, 1) = 1)
              THEN 1 ELSE 0
            END
          ), 0) as ocupacaoAproximada
        FROM localizacoes l
        WHERE l.loja_id = ?
        GROUP BY l.deposito`,
        context.lojaId,
        context.lojaId,
        context.lojaId,
        context.lojaId,
      );
      // Normalizar BigInt (COUNT/SUM podem vir como BigInt dependendo do driver)
      const normalized = (ocupacaoDepositos as any[]).map((r) => ({
        deposito: r.deposito,
        totalLocalizacoes: Number(r.totalLocalizacoes),
        localizacoesOcupadas: Number(r.localizacoesOcupadas),
        localizacoesVazias: Number(r.localizacoesVazias),
        capacidadeTotal: Number(r.capacidadeTotal ?? 0),
        capacidadeUtilizada: Number(r.ocupacaoAproximada ?? 0),
        taxaOcupacao: Number(r.totalLocalizacoes) > 0 ? Math.round((Number(r.localizacoesOcupadas) / Number(r.totalLocalizacoes)) * 100) : 0,
      }));
      return normalized as any[];
		} catch (error) {
			this.logger.error(`❌ Erro ao gerar relatório de ocupação: ${(error as any).message}`);
			throw new Error(`Erro ao gerar relatório de ocupação: ${(error as any).message}`);
		}
	}
}


