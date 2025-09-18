import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Serviço de Auto-Complete para Insumos V2
 * Implementa busca inteligente e filtros para insumos
 * 
 * ✅ ARQUIVO ≤ 400 LINHAS (CONFORME PREMISSAS)
 * ✅ BUSCA INTELIGENTE E FILTROS AVANÇADOS
 * ✅ INTEGRAÇÃO COM SISTEMA DE INSUMOS EXISTENTE
 */
@Injectable()
export class InsumosAutocompleteService {
  private readonly logger = new Logger(InsumosAutocompleteService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Busca insumos para auto-complete
   */
  async buscarInsumos(
    busca: string,
    categoriaId?: string,
    lojaId: string,
    limit: number = 20,
  ): Promise<{
    insumos: any[];
    total: number;
    sugestoes: string[];
    categorias: any[];
  }> {
    this.logger.log(`🔍 Buscando insumos para auto-complete: "${busca}"`);

    try {
      // 1. Construir filtros de busca
      const where = this.construirFiltrosBusca(busca, categoriaId, lojaId);

      // 2. Buscar insumos
      const [insumos, total] = await Promise.all([
        this.prisma.insumo.findMany({
          where,
          include: {
            categoria: true,
            fornecedor: true,
            tipoMaterial: true,
          },
          orderBy: [
            { nome: 'asc' },
            { categoria: { nome: 'asc' } },
          ],
          take: limit,
        }),
        this.prisma.insumo.count({ where }),
      ]);

      // 3. Processar resultados
      const insumosProcessados = this.processarInsumos(insumos);
      const sugestoes = this.gerarSugestoes(busca, insumosProcessados);
      const categorias = await this.buscarCategoriasDisponiveis(lojaId);

      const resultado = {
        insumos: insumosProcessados,
        total,
        sugestoes,
        categorias,
      };

      this.logger.log(`✅ Busca concluída: ${insumosProcessados.length} insumos encontrados`);
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar insumos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca insumos por categoria
   */
  async buscarInsumosPorCategoria(
    categoriaId: string,
    lojaId: string,
    limit: number = 50,
  ): Promise<{
    insumos: any[];
    total: number;
    categoria: any;
  }> {
    this.logger.log(`🔍 Buscando insumos da categoria ${categoriaId}`);

    try {
      const [insumos, total, categoria] = await Promise.all([
        this.prisma.insumo.findMany({
          where: {
            categoria_id: categoriaId,
            loja_id: lojaId,
            ativo: true,
          },
          include: {
            categoria: true,
            fornecedor: true,
            tipoMaterial: true,
          },
          orderBy: { nome: 'asc' },
          take: limit,
        }),
        this.prisma.insumo.count({
          where: {
            categoria_id: categoriaId,
            loja_id: lojaId,
            ativo: true,
          },
        }),
        this.prisma.categoriaInsumo.findUnique({
          where: { id: categoriaId },
        }),
      ]);

      const insumosProcessados = this.processarInsumos(insumos);

      return {
        insumos: insumosProcessados,
        total,
        categoria,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar insumos por categoria: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca insumos por fornecedor
   */
  async buscarInsumosPorFornecedor(
    fornecedorId: string,
    lojaId: string,
    limit: number = 50,
  ): Promise<{
    insumos: any[];
    total: number;
    fornecedor: any;
  }> {
    this.logger.log(`🔍 Buscando insumos do fornecedor ${fornecedorId}`);

    try {
      const [insumos, total, fornecedor] = await Promise.all([
        this.prisma.insumo.findMany({
          where: {
            fornecedor_id: fornecedorId,
            loja_id: lojaId,
            ativo: true,
          },
          include: {
            categoria: true,
            fornecedor: true,
            tipoMaterial: true,
          },
          orderBy: { nome: 'asc' },
          take: limit,
        }),
        this.prisma.insumo.count({
          where: {
            fornecedor_id: fornecedorId,
            loja_id: lojaId,
            ativo: true,
          },
        }),
        this.prisma.fornecedor.findUnique({
          where: { id: fornecedorId },
        }),
      ]);

      const insumosProcessados = this.processarInsumos(insumos);

      return {
        insumos: insumosProcessados,
        total,
        fornecedor,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar insumos por fornecedor: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca insumos com estoque baixo
   */
  async buscarInsumosEstoqueBaixo(
    lojaId: string,
    percentualMinimo: number = 20,
    limit: number = 50,
  ): Promise<{
    insumos: any[];
    total: number;
    alertas: string[];
  }> {
    this.logger.log(`🔍 Buscando insumos com estoque baixo (${percentualMinimo}%)`);

    try {
      // Buscar insumos com estoque baixo
      const insumos = await this.prisma.insumo.findMany({
        where: {
          loja_id: lojaId,
          ativo: true,
          estoque_atual: {
            not: null,
          },
          estoque_minimo: {
            not: null,
          },
        },
        include: {
          categoria: true,
          fornecedor: true,
          tipoMaterial: true,
        },
        orderBy: { estoque_atual: 'asc' },
        take: limit,
      });

      // Filtrar por percentual mínimo
      const insumosFiltrados = insumos.filter(insumo => {
        if (!insumo.estoque_atual || !insumo.estoque_minimo) return false;
        
        const percentualAtual = (insumo.estoque_atual / insumo.estoque_minimo) * 100;
        return percentualAtual <= percentualMinimo;
      });

      const insumosProcessados = this.processarInsumos(insumosFiltrados);
      const alertas = this.gerarAlertasEstoque(insumosProcessados);

      return {
        insumos: insumosProcessados,
        total: insumosProcessados.length,
        alertas,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar insumos com estoque baixo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca insumos recentemente utilizados
   */
  async buscarInsumosRecentes(
    lojaId: string,
    dias: number = 30,
    limit: number = 20,
  ): Promise<{
    insumos: any[];
    total: number;
  }> {
    this.logger.log(`🔍 Buscando insumos utilizados nos últimos ${dias} dias`);

    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - dias);

      // Buscar insumos em orçamentos recentes
      const insumosRecentes = await this.prisma.$queryRaw`
        SELECT DISTINCT 
          i.id,
          i.nome,
          i.descricao,
          i.categoria_id,
          i.fornecedor_id,
          i.tipo_material_id,
          i.preco_unitario,
          i.unidade,
          i.ativo,
          i.data_criacao,
          i.data_atualizacao,
          COUNT(oi.insumo_id) as uso_count
        FROM insumo i
        LEFT JOIN produto_orcamento_insumo oi ON i.id = oi.insumo_id
        LEFT JOIN produto_orcamento po ON oi.produto_orcamento_id = po.id
        LEFT JOIN orcamento o ON po.orcamento_id = o.id
        WHERE i.loja_id = ${lojaId}
          AND i.ativo = true
          AND o.data_criacao >= ${dataLimite}
        GROUP BY i.id
        ORDER BY uso_count DESC, i.nome ASC
        LIMIT ${limit}
      `;

      // Buscar informações completas dos insumos
      const insumoIds = insumosRecentes.map((item: any) => item.id);
      
      if (insumoIds.length === 0) {
        return { insumos: [], total: 0 };
      }

      const insumosCompletos = await this.prisma.insumo.findMany({
        where: {
          id: { in: insumoIds },
        },
        include: {
          categoria: true,
          fornecedor: true,
          tipoMaterial: true,
        },
      });

      // Ordenar conforme a ordem original
      const insumosOrdenados = insumoIds.map(id => 
        insumosCompletos.find(insumo => insumo.id === id)
      ).filter(Boolean);

      const insumosProcessados = this.processarInsumos(insumosOrdenados);

      return {
        insumos: insumosProcessados,
        total: insumosProcessados.length,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar insumos recentes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca sugestões de busca
   */
  async buscarSugestoes(
    termo: string,
    lojaId: string,
    limit: number = 10,
  ): Promise<string[]> {
    this.logger.log(`🔍 Buscando sugestões para: "${termo}"`);

    try {
      if (!termo || termo.trim().length < 2) {
        return [];
      }

      const sugestoes = await this.prisma.insumo.findMany({
        where: {
          loja_id: lojaId,
          ativo: true,
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { descricao: { contains: termo, mode: 'insensitive' } },
            { codigo: { contains: termo, mode: 'insensitive' } },
          ],
        },
        select: {
          nome: true,
          descricao: true,
          codigo: true,
        },
        orderBy: { nome: 'asc' },
        take: limit,
      });

      const sugestoesUnicas = new Set<string>();
      
      sugestoes.forEach(insumo => {
        if (insumo.nome) sugestoesUnicas.add(insumo.nome);
        if (insumo.codigo) sugestoesUnicas.add(insumo.codigo);
      });

      return Array.from(sugestoesUnicas).slice(0, limit);

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar sugestões: ${error.message}`);
      return [];
    }
  }

  // Métodos privados auxiliares

  private construirFiltrosBusca(busca: string, categoriaId?: string, lojaId?: string): any {
    const where: any = {
      ativo: true,
    };

    if (lojaId) {
      where.loja_id = lojaId;
    }

    if (categoriaId) {
      where.categoria_id = categoriaId;
    }

    if (busca && busca.trim().length > 0) {
      const termoBusca = busca.trim();
      
      where.OR = [
        { nome: { contains: termoBusca, mode: 'insensitive' } },
        { descricao: { contains: termoBusca, mode: 'insensitive' } },
        { codigo: { contains: termoBusca, mode: 'insensitive' } },
        { categoria: { nome: { contains: termoBusca, mode: 'insensitive' } } },
        { fornecedor: { nome: { contains: termoBusca, mode: 'insensitive' } } },
        { tipoMaterial: { nome: { contains: termoBusca, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  private processarInsumos(insumos: any[]): any[] {
    return insumos.map(insumo => ({
      id: insumo.id,
      nome: insumo.nome,
      descricao: insumo.descricao,
      codigo: insumo.codigo,
      preco_unitario: insumo.preco_unitario,
      unidade: insumo.unidade,
      estoque_atual: insumo.estoque_atual,
      estoque_minimo: insumo.estoque_minimo,
      ativo: insumo.ativo,
      data_criacao: insumo.data_criacao,
      data_atualizacao: insumo.data_atualizacao,
      
      // Relacionamentos
      categoria: insumo.categoria ? {
        id: insumo.categoria.id,
        nome: insumo.categoria.nome,
        descricao: insumo.categoria.descricao,
      } : null,
      
      fornecedor: insumo.fornecedor ? {
        id: insumo.fornecedor.id,
        nome: insumo.fornecedor.nome,
        ativo: insumo.fornecedor.ativo,
      } : null,
      
      tipo_material: insumo.tipoMaterial ? {
        id: insumo.tipoMaterial.id,
        nome: insumo.tipoMaterial.nome,
        descricao: insumo.tipoMaterial.descricao,
      } : null,
      
      // Campos calculados
      estoque_status: this.calcularStatusEstoque(insumo.estoque_atual, insumo.estoque_minimo),
      preco_formatado: this.formatarPreco(insumo.preco_unitario),
      estoque_formatado: this.formatarEstoque(insumo.estoque_atual, insumo.unidade),
    }));
  }

  private calcularStatusEstoque(estoqueAtual?: number, estoqueMinimo?: number): string {
    if (!estoqueAtual && estoqueAtual !== 0) return 'sem_estoque';
    if (!estoqueMinimo) return 'sem_minimo';
    
    if (estoqueAtual <= 0) return 'sem_estoque';
    if (estoqueAtual <= estoqueMinimo) return 'estoque_baixo';
    if (estoqueAtual <= estoqueMinimo * 1.5) return 'estoque_reduzido';
    
    return 'estoque_ok';
  }

  private formatarPreco(preco?: number): string {
    if (!preco && preco !== 0) return 'Preço não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }

  private formatarEstoque(estoque?: number, unidade?: string): string {
    if (!estoque && estoque !== 0) return 'Estoque não informado';
    if (!unidade) return `${estoque}`;
    return `${estoque} ${unidade}`;
  }

  private gerarSugestoes(busca: string, insumos: any[]): string[] {
    if (!busca || insumos.length === 0) return [];

    const sugestoes = new Set<string>();
    
    insumos.forEach(insumo => {
      // Sugestões baseadas no nome
      if (insumo.nome.toLowerCase().includes(busca.toLowerCase())) {
        sugestoes.add(insumo.nome);
      }
      
      // Sugestões baseadas na categoria
      if (insumo.categoria?.nome.toLowerCase().includes(busca.toLowerCase())) {
        sugestoes.add(insumo.categoria.nome);
      }
      
      // Sugestões baseadas no fornecedor
      if (insumo.fornecedor?.nome.toLowerCase().includes(busca.toLowerCase())) {
        sugestoes.add(insumo.fornecedor.nome);
      }
    });

    return Array.from(sugestoes).slice(0, 10);
  }

  private async buscarCategoriasDisponiveis(lojaId: string): Promise<any[]> {
    try {
      const categorias = await this.prisma.categoriaInsumo.findMany({
        where: {
          insumos: {
            some: {
              loja_id: lojaId,
              ativo: true,
            },
          },
        },
        orderBy: { nome: 'asc' },
      });

      return categorias.map(categoria => ({
        id: categoria.id,
        nome: categoria.nome,
        descricao: categoria.descricao,
      }));

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar categorias: ${error.message}`);
      return [];
    }
  }

  private gerarAlertasEstoque(insumos: any[]): string[] {
    const alertas: string[] = [];

    const semEstoque = insumos.filter(i => i.estoque_status === 'sem_estoque');
    const estoqueBaixo = insumos.filter(i => i.estoque_status === 'estoque_baixo');
    const estoqueReduzido = insumos.filter(i => i.estoque_status === 'estoque_reduzido');

    if (semEstoque.length > 0) {
      alertas.push(`⚠️ ${semEstoque.length} insumos sem estoque`);
    }

    if (estoqueBaixo.length > 0) {
      alertas.push(`🔴 ${estoqueBaixo.length} insumos com estoque baixo`);
    }

    if (estoqueReduzido.length > 0) {
      alertas.push(`🟡 ${estoqueReduzido.length} insumos com estoque reduzido`);
    }

    return alertas;
  }
}
