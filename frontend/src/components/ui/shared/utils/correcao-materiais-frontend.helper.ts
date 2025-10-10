/**
 * Helper para corrigir cálculos de materiais no frontend
 * Aplica multiplicação pela quantidade do produto para materiais não-m²
 */

export interface MaterialPreview {
  insumo_id: string;
  nome: string;
  quantidade: number;
  custo_unitario: number;
  custo_total: number;
  unidade_consumo?: string;
}

export class CorrecaoMateriaisFrontendHelper {
  /**
   * Corrige os materiais aplicando multiplicação pela quantidade do produto
   * para materiais que não usam m² (metros lineares, unidades, etc.)
   */
  static corrigirMateriais(
    materiais: Array<{ insumo_id: string; quantidade?: any }>,
    insumos: any[],
    quantidadeProduto: number
  ): { itens: MaterialPreview[]; total: number } {
    if (!materiais || !Array.isArray(materiais) || materiais.length === 0) {
      return { itens: [], total: 0 };
    }

    if (quantidadeProduto <= 0) {
      quantidadeProduto = 1;
    }

    const itens = materiais.reduce<MaterialPreview[]>((acc, material) => {
      if (!material?.insumo_id) {
        return acc;
      }

      const insumo = insumos.find((i) => i.id === material.insumo_id);
      const quantidadeOriginal = this.parseNumber(material?.quantidade);

      if (quantidadeOriginal <= 0) {
        return acc;
      }

      // Verificar se o insumo precisa de correção
      const precisaCorrecao = this.deveAplicarMultiplicacao(insumo?.unidade_uso);

      // Aplicar multiplicação se necessário
      const quantidadeFinal = precisaCorrecao 
        ? quantidadeOriginal * quantidadeProduto 
        : quantidadeOriginal;

      const custoUnitario = insumo ? this.calcularCustoPorUnidadeUso(insumo) : 0;
      const custoTotal = quantidadeFinal * custoUnitario;

      // Log da correção aplicada
      if (precisaCorrecao && quantidadeFinal !== quantidadeOriginal) {
        console.log(`🔧 Frontend - Correção aplicada para ${insumo?.nome}:`, {
          unidade: insumo?.unidade_uso,
          quantidade_original: quantidadeOriginal,
          quantidade_corrigida: quantidadeFinal,
          quantidade_produto: quantidadeProduto,
          custo_unitario: custoUnitario,
          custo_total_original: quantidadeOriginal * custoUnitario,
          custo_total_corrigido: custoTotal
        });
      }

      acc.push({
        insumo_id: material.insumo_id,
        nome: insumo?.nome || 'Insumo não encontrado',
        quantidade: quantidadeFinal,
        custo_unitario: custoUnitario,
        custo_total: custoTotal,
        unidade_consumo: insumo?.unidade_uso,
      });

      return acc;
    }, []);

    const total = itens.reduce((acc, item) => acc + item.custo_total, 0);
    return { itens, total };
  }

  /**
   * Determina se um insumo deve ter sua quantidade multiplicada pela quantidade do produto
   */
  private static deveAplicarMultiplicacao(unidade: string): boolean {
    if (!unidade) return false;

    const unidadeLower = unidade.toLowerCase().trim();

    // Materiais que NÃO precisam de multiplicação (já são totais)
    const unidadesTotais = ['m²', 'm2', 'metro quadrado', 'metros quadrados'];
    
    // Materiais que PRECISAM de multiplicação (são por unidade do produto)
    const unidadesPorUnidade = [
      'cm', 'centimetro', 'centimetros',
      'm', 'metro', 'metros', 'metro linear', 'metros lineares',
      'un', 'unidade', 'unidades', 'unid', 'pç', 'peca', 'pecas',
      'kg', 'kilograma', 'kilogramas',
      'g', 'grama', 'gramas',
      'l', 'litro', 'litros',
      'ml', 'mililitro', 'mililitros'
    ];

    // Se é uma unidade total (m²), não multiplicar
    if (unidadesTotais.some(u => unidadeLower.includes(u))) {
      return false;
    }

    // Se é uma unidade por unidade do produto, multiplicar
    if (unidadesPorUnidade.some(u => unidadeLower.includes(u))) {
      return true;
    }

    // Por padrão, não multiplicar (casos não identificados)
    return false;
  }

  /**
   * Converte valor para número, tratando vírgulas e pontos
   */
  private static parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Calcula custo por unidade de uso do insumo
   * Replica a lógica do backend
   */
  private static calcularCustoPorUnidadeUso(insumo: any): number {
    if (!insumo) return 0;

    const custoCompra = this.parseNumber(insumo.custo_compra) || 0;
    const quantidadeCompra = this.parseNumber(insumo.quantidade_compra) || 1;
    const quantidadeUso = this.parseNumber(insumo.quantidade_uso) || 1;

    if (quantidadeCompra <= 0 || quantidadeUso <= 0) {
      return 0;
    }

    // Custo por unidade de uso = (custo_compra / quantidade_compra) * quantidade_uso
    return (custoCompra / quantidadeCompra) * quantidadeUso;
  }
}















