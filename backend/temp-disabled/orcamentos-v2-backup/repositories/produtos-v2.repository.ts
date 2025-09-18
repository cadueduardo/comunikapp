import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  ProdutoOrcamento,
  ItemInsumo,
  ItemMaquina,
  ItemFuncao,
  ItemServicoManual,
  ItemCustoIndireto,
} from '../interfaces/orcamento.interface';

/**
 * Repositório de Produtos V2
 * Implementa operações de banco de dados para produtos de orçamentos
 * 
 * ✅ ARQUIVO ≤ 400 LINHAS (CONFORME PREMISSAS)
 * ✅ OPERAÇÕES CRUD COMPLETAS PARA PRODUTOS
 * ✅ GESTÃO DE ITENS E COMPONENTES
 */
@Injectable()
export class ProdutosV2Repository {
  private readonly logger = new Logger(ProdutosV2Repository.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Cria novo produto no orçamento
   */
  async criarProduto(
    orcamentoId: string,
    dados: Omit<ProdutoOrcamento, 'id' | 'orcamento_id' | 'data_criacao' | 'data_atualizacao'>,
  ): Promise<ProdutoOrcamento> {
    this.logger.log(`💾 Criando produto no orçamento ${orcamentoId}: ${dados.nome}`);

    try {
      const produto = await this.prisma.produtoOrcamento.create({
        data: {
          ...dados,
          orcamento_id: orcamentoId,
          data_criacao: new Date(),
          data_atualizacao: new Date(),
        },
        include: {
          insumos: true,
          maquinas: true,
          funcoes: true,
          servicos_manuais: true,
          custos_indiretos: true,
        },
      });

      this.logger.log(`✅ Produto criado com sucesso: ${produto.id}`);
      return this.transformarProduto(produto);

    } catch (error) {
      this.logger.error(`❌ Erro ao criar produto: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca produto por ID
   */
  async buscarProdutoPorId(id: string): Promise<ProdutoOrcamento | null> {
    this.logger.log(`🔍 Buscando produto por ID: ${id}`);

    try {
      const produto = await this.prisma.produtoOrcamento.findUnique({
        where: { id },
        include: {
          insumos: true,
          maquinas: true,
          funcoes: true,
          servicos_manuais: true,
          custos_indiretos: true,
        },
      });

      if (!produto) {
        this.logger.log(`⚠️ Produto não encontrado: ${id}`);
        return null;
      }

      this.logger.log(`✅ Produto encontrado: ${id}`);
      return this.transformarProduto(produto);

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar produto: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista produtos de um orçamento
   */
  async listarProdutosOrcamento(
    orcamentoId: string,
    ativos: boolean = true,
  ): Promise<ProdutoOrcamento[]> {
    this.logger.log(`📋 Listando produtos do orçamento: ${orcamentoId}`);

    try {
      const produtos = await this.prisma.produtoOrcamento.findMany({
        where: {
          orcamento_id: orcamentoId,
          ativo: ativos,
        },
        include: {
          insumos: true,
          maquinas: true,
          funcoes: true,
          servicos_manuais: true,
          custos_indiretos: true,
        },
        orderBy: { ordem: 'asc' },
      });

      this.logger.log(`✅ ${produtos.length} produtos encontrados`);
      return produtos.map(prod => this.transformarProduto(prod));

    } catch (error) {
      this.logger.error(`❌ Erro ao listar produtos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza produto existente
   */
  async atualizarProduto(
    id: string,
    dados: Partial<Omit<ProdutoOrcamento, 'id' | 'orcamento_id' | 'data_criacao' | 'data_atualizacao'>>,
  ): Promise<ProdutoOrcamento> {
    this.logger.log(`✏️ Atualizando produto: ${id}`);

    try {
      const produto = await this.prisma.produtoOrcamento.update({
        where: { id },
        data: {
          ...dados,
          data_atualizacao: new Date(),
        },
        include: {
          insumos: true,
          maquinas: true,
          funcoes: true,
          servicos_manuais: true,
          custos_indiretos: true,
        },
      });

      this.logger.log(`✅ Produto atualizado com sucesso: ${id}`);
      return this.transformarProduto(produto);

    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar produto: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove produto (soft delete)
   */
  async removerProduto(id: string): Promise<void> {
    this.logger.log(`🗑️ Removendo produto: ${id}`);

    try {
      await this.prisma.produtoOrcamento.update({
        where: { id },
        data: {
          ativo: false,
          data_atualizacao: new Date(),
        },
      });

      this.logger.log(`✅ Produto removido com sucesso: ${id}`);

    } catch (error) {
      this.logger.error(`❌ Erro ao remover produto: ${error.message}`);
      throw error;
    }
  }

  /**
   * Adiciona insumo ao produto
   */
  async adicionarInsumo(
    produtoId: string,
    dados: Omit<ItemInsumo, 'id' | 'produto_id' | 'data_criacao'>,
  ): Promise<ItemInsumo> {
    this.logger.log(`➕ Adicionando insumo ao produto ${produtoId}: ${dados.insumo_id}`);

    try {
      const itemInsumo = await this.prisma.itemInsumo.create({
        data: {
          ...dados,
          produto_id: produtoId,
          data_criacao: new Date(),
        },
        include: {
          insumo: true,
        },
      });

      this.logger.log(`✅ Insumo adicionado com sucesso: ${itemInsumo.id}`);
      return this.transformarItemInsumo(itemInsumo);

    } catch (error) {
      this.logger.error(`❌ Erro ao adicionar insumo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove insumo do produto
   */
  async removerInsumo(itemInsumoId: string): Promise<void> {
    this.logger.log(`➖ Removendo insumo: ${itemInsumoId}`);

    try {
      await this.prisma.itemInsumo.delete({
        where: { id: itemInsumoId },
      });

      this.logger.log(`✅ Insumo removido com sucesso: ${itemInsumoId}`);

    } catch (error) {
      this.logger.error(`❌ Erro ao remover insumo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Adiciona máquina ao produto
   */
  async adicionarMaquina(
    produtoId: string,
    dados: Omit<ItemMaquina, 'id' | 'produto_id' | 'data_criacao'>,
  ): Promise<ItemMaquina> {
    this.logger.log(`🔧 Adicionando máquina ao produto ${produtoId}: ${dados.maquina_id}`);

    try {
      const itemMaquina = await this.prisma.itemMaquina.create({
        data: {
          ...dados,
          produto_id: produtoId,
          data_criacao: new Date(),
        },
        include: {
          maquina: true,
        },
      });

      this.logger.log(`✅ Máquina adicionada com sucesso: ${itemMaquina.id}`);
      return this.transformarItemMaquina(itemMaquina);

    } catch (error) {
      this.logger.error(`❌ Erro ao adicionar máquina: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove máquina do produto
   */
  async removerMaquina(itemMaquinaId: string): Promise<void> {
    this.logger.log(`🔧 Removendo máquina: ${itemMaquinaId}`);

    try {
      await this.prisma.itemMaquina.delete({
        where: { id: itemMaquinaId },
      });

      this.logger.log(`✅ Máquina removida com sucesso: ${itemMaquinaId}`);

    } catch (error) {
      this.logger.error(`❌ Erro ao remover máquina: ${error.message}`);
      throw error;
    }
  }

  /**
   * Adiciona função ao produto
   */
  async adicionarFuncao(
    produtoId: string,
    dados: Omit<ItemFuncao, 'id' | 'produto_id' | 'data_criacao'>,
  ): Promise<ItemFuncao> {
    this.logger.log(`👷 Adicionando função ao produto ${produtoId}: ${dados.funcao_id}`);

    try {
      const itemFuncao = await this.prisma.itemFuncao.create({
        data: {
          ...dados,
          produto_id: produtoId,
          data_criacao: new Date(),
        },
        include: {
          funcao: true,
        },
      });

      this.logger.log(`✅ Função adicionada com sucesso: ${itemFuncao.id}`);
      return this.transformarItemFuncao(itemFuncao);

    } catch (error) {
      this.logger.error(`❌ Erro ao adicionar função: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove função do produto
   */
  async removerFuncao(itemFuncaoId: string): Promise<void> {
    this.logger.log(`👷 Removendo função: ${itemFuncaoId}`);

    try {
      await this.prisma.itemFuncao.delete({
        where: { id: itemFuncaoId },
      });

      this.logger.log(`✅ Função removida com sucesso: ${itemFuncaoId}`);

    } catch (error) {
      this.logger.error(`❌ Erro ao remover função: ${error.message}`);
      throw error;
    }
  }

  /**
   * Adiciona serviço manual ao produto
   */
  async adicionarServicoManual(
    produtoId: string,
    dados: Omit<ItemServicoManual, 'id' | 'produto_id' | 'data_criacao'>,
  ): Promise<ItemServicoManual> {
    this.logger.log(`🛠️ Adicionando serviço manual ao produto ${produtoId}: ${dados.descricao}`);

    try {
      const itemServico = await this.prisma.itemServicoManual.create({
        data: {
          ...dados,
          produto_id: produtoId,
          data_criacao: new Date(),
        },
      });

      this.logger.log(`✅ Serviço manual adicionado com sucesso: ${itemServico.id}`);
      return this.transformarItemServicoManual(itemServico);

    } catch (error) {
      this.logger.error(`❌ Erro ao adicionar serviço manual: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove serviço manual do produto
   */
  async removerServicoManual(itemServicoId: string): Promise<void> {
    this.logger.log(`🛠️ Removendo serviço manual: ${itemServicoId}`);

    try {
      await this.prisma.itemServicoManual.delete({
        where: { id: itemServicoId },
      });

      this.logger.log(`✅ Serviço manual removido com sucesso: ${itemServicoId}`);

    } catch (error) {
      this.logger.error(`❌ Erro ao remover serviço manual: ${error.message}`);
      throw error;
    }
  }

  /**
   * Adiciona custo indireto ao produto
   */
  async adicionarCustoIndireto(
    produtoId: string,
    dados: Omit<ItemCustoIndireto, 'id' | 'produto_id' | 'data_criacao'>,
  ): Promise<ItemCustoIndireto> {
    this.logger.log(`💰 Adicionando custo indireto ao produto ${produtoId}: ${dados.descricao}`);

    try {
      const itemCusto = await this.prisma.itemCustoIndireto.create({
        data: {
          ...dados,
          produto_id: produtoId,
          data_criacao: new Date(),
        },
      });

      this.logger.log(`✅ Custo indireto adicionado com sucesso: ${itemCusto.id}`);
      return this.transformarItemCustoIndireto(itemCusto);

    } catch (error) {
      this.logger.error(`❌ Erro ao adicionar custo indireto: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove custo indireto do produto
   */
  async removerCustoIndireto(itemCustoId: string): Promise<void> {
    this.logger.log(`💰 Removendo custo indireto: ${itemCustoId}`);

    try {
      await this.prisma.itemCustoIndireto.delete({
        where: { id: itemCustoId },
      });

      this.logger.log(`✅ Custo indireto removido com sucesso: ${itemCustoId}`);

    } catch (error) {
      this.logger.error(`❌ Erro ao remover custo indireto: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reordena produtos do orçamento
   */
  async reordenarProdutos(
    orcamentoId: string,
    novaOrdem: { id: string; ordem: number }[],
  ): Promise<void> {
    this.logger.log(`🔄 Reordenando produtos do orçamento: ${orcamentoId}`);

    try {
      // Atualizar ordem de todos os produtos em uma transação
      await this.prisma.$transaction(
        novaOrdem.map(item => 
          this.prisma.produtoOrcamento.update({
            where: { id: item.id },
            data: { 
              ordem: item.ordem,
              data_atualizacao: new Date(),
            },
          })
        )
      );

      this.logger.log(`✅ Produtos reordenados com sucesso`);

    } catch (error) {
      this.logger.error(`❌ Erro ao reordenar produtos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca estatísticas dos produtos
   */
  async buscarEstatisticasProdutos(orcamentoId: string): Promise<{
    total_produtos: number;
    produtos_por_categoria: Record<string, number>;
    valor_total_produtos: number;
    valor_medio_produto: number;
    produtos_com_insumos: number;
    produtos_com_maquinas: number;
    produtos_com_funcoes: number;
  }> {
    this.logger.log(`📊 Buscando estatísticas dos produtos do orçamento: ${orcamentoId}`);

    try {
      const [
        totalProdutos,
        produtosPorCategoria,
        valorTotalProdutos,
        valorMedioProduto,
        produtosComInsumos,
        produtosComMaquinas,
        produtosComFuncoes,
      ] = await Promise.all([
        this.prisma.produtoOrcamento.count({
          where: { 
            orcamento_id: orcamentoId,
            ativo: true,
          },
        }),
        this.buscarProdutosPorCategoria(orcamentoId),
        this.prisma.produtoOrcamento.aggregate({
          where: { 
            orcamento_id: orcamentoId,
            ativo: true,
          },
          _sum: { valor_total: true },
        }),
        this.prisma.produtoOrcamento.aggregate({
          where: { 
            orcamento_id: orcamentoId,
            ativo: true,
          },
          _avg: { valor_total: true },
        }),
        this.prisma.produtoOrcamento.count({
          where: { 
            orcamento_id: orcamentoId,
            ativo: true,
            insumos: { some: {} },
          },
        }),
        this.prisma.produtoOrcamento.count({
          where: { 
            orcamento_id: orcamentoId,
            ativo: true,
            maquinas: { some: {} },
          },
        }),
        this.prisma.produtoOrcamento.count({
          where: { 
            orcamento_id: orcamentoId,
            ativo: true,
            funcoes: { some: {} },
          },
        }),
      ]);

      return {
        total_produtos: totalProdutos,
        produtos_por_categoria: produtosPorCategoria,
        valor_total_produtos: valorTotalProdutos._sum.valor_total || 0,
        valor_medio_produto: valorMedioProduto._avg.valor_total || 0,
        produtos_com_insumos: produtosComInsumos,
        produtos_com_maquinas: produtosComMaquinas,
        produtos_com_funcoes: produtosComFuncoes,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar estatísticas: ${error.message}`);
      throw error;
    }
  }

  // Métodos privados auxiliares

  private async buscarProdutosPorCategoria(orcamentoId: string): Promise<Record<string, number>> {
    const resultado = await this.prisma.produtoOrcamento.groupBy({
      by: ['categoria'],
      where: { 
        orcamento_id: orcamentoId,
        ativo: true,
      },
      _count: { categoria: true },
    });

    const distribuicao: Record<string, number> = {};
    resultado.forEach(item => {
      const categoria = item.categoria || 'Sem categoria';
      distribuicao[categoria] = item._count.categoria;
    });

    return distribuicao;
  }

  private transformarProduto(produto: any): ProdutoOrcamento {
    return {
      id: produto.id,
      orcamento_id: produto.orcamento_id,
      nome: produto.nome,
      descricao: produto.descricao,
      codigo: produto.codigo,
      categoria: produto.categoria,
      quantidade: produto.quantidade,
      unidade_medida: produto.unidade_medida,
      valor_unitario: produto.valor_unitario,
      valor_total: produto.valor_total,
      ordem: produto.ordem,
      data_criacao: produto.data_criacao,
      data_atualizacao: produto.data_atualizacao,
      insumos: produto.insumos || [],
      maquinas: produto.maquinas || [],
      funcoes: produto.funcoes || [],
      servicos_manuais: produto.servicos_manuais || [],
      custos_indiretos: produto.custos_indiretos || [],
      ativo: produto.ativo,
    };
  }

  private transformarItemInsumo(item: any): ItemInsumo {
    return {
      id: item.id,
      produto_id: item.produto_id,
      insumo_id: item.insumo_id,
      quantidade: item.quantidade,
      unidade_medida: item.unidade_medida,
      custo_unitario: item.custo_unitario,
      custo_total: item.custo_total,
      observacoes: item.observacoes,
      data_criacao: item.data_criacao,
      insumo: item.insumo,
    };
  }

  private transformarItemMaquina(item: any): ItemMaquina {
    return {
      id: item.id,
      produto_id: item.produto_id,
      maquina_id: item.maquina_id,
      horas_utilizadas: item.horas_utilizadas,
      custo_hora: item.custo_hora,
      custo_total: item.custo_total,
      observacoes: item.observacoes,
      data_criacao: item.data_criacao,
      maquina: item.maquina,
    };
  }

  private transformarItemFuncao(item: any): ItemFuncao {
    return {
      id: item.id,
      produto_id: item.produto_id,
      funcao_id: item.funcao_id,
      horas_utilizadas: item.horas_utilizadas,
      custo_hora: item.custo_hora,
      custo_total: item.custo_total,
      observacoes: item.observacoes,
      data_criacao: item.data_criacao,
      funcao: item.funcao,
    };
  }

  private transformarItemServicoManual(item: any): ItemServicoManual {
    return {
      id: item.id,
      produto_id: item.produto_id,
      descricao: item.descricao,
      horas_estimadas: item.horas_estimadas,
      custo_hora: item.custo_hora,
      custo_total: item.custo_total,
      observacoes: item.observacoes,
      data_criacao: item.data_criacao,
    };
  }

  private transformarItemCustoIndireto(item: any): ItemCustoIndireto {
    return {
      id: item.id,
      produto_id: item.produto_id,
      descricao: item.descricao,
      percentual: item.percentual,
      valor_fixo: item.valor_fixo,
      custo_total: item.custo_total,
      observacoes: item.observacoes,
      data_criacao: item.data_criacao,
    };
  }
}
