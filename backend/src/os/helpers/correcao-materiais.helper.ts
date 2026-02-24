/**
 * Helper para corrigir cálculos de materiais em OS
 * Aplica multiplicação pela quantidade do produto para materiais não-m²
 */

export interface InsumoCalculado {
  insumo_id: string;
  nome: string;
  quantidade_necessaria: number;
  unidade: string;
  custo_unitario: number;
  custo_total: number;
  disponivel_estoque: boolean;
  quantidade_disponivel?: number;
  localizacao_estoque?: string;
}

export class CorrecaoMateriaisHelper {
  /**
   * Corrige os insumos calculados aplicando multiplicação pela quantidade do produto
   * para materiais que não usam m² (metros lineares, unidades, etc.)
   */
  static corrigirInsumosCalculados(
    insumosCalculados: InsumoCalculado[],
    quantidadeProduto: number,
  ): InsumoCalculado[] {
    if (
      !insumosCalculados ||
      !Array.isArray(insumosCalculados) ||
      insumosCalculados.length === 0
    ) {
      return [];
    }

    if (quantidadeProduto <= 0) {
      return insumosCalculados;
    }

    return insumosCalculados.map((insumo) => {
      // Criar cópia do insumo para não modificar o original
      const insumoCorrigido = { ...insumo };

      // Verificar se o insumo precisa de correção
      const precisaCorrecao = this.deveAplicarMultiplicacao(insumo.unidade);

      if (precisaCorrecao) {
        // Aplicar multiplicação pela quantidade do produto
        insumoCorrigido.quantidade_necessaria =
          insumo.quantidade_necessaria * quantidadeProduto;
        insumoCorrigido.custo_total =
          insumoCorrigido.quantidade_necessaria * insumo.custo_unitario;

        console.log(`🔧 Correção aplicada para ${insumo.nome}:`, {
          unidade: insumo.unidade,
          quantidade_original: insumo.quantidade_necessaria,
          quantidade_corrigida: insumoCorrigido.quantidade_necessaria,
          quantidade_produto: quantidadeProduto,
          custo_unitario: insumo.custo_unitario,
          custo_total_original: insumo.custo_total,
          custo_total_corrigido: insumoCorrigido.custo_total,
        });
      }

      return insumoCorrigido;
    });
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
      'cm',
      'centimetro',
      'centimetros',
      'm',
      'metro',
      'metros',
      'metro linear',
      'metros lineares',
      'un',
      'unidade',
      'unidades',
      'unid',
      'pç',
      'peca',
      'pecas',
      'kg',
      'kilograma',
      'kilogramas',
      'g',
      'grama',
      'gramas',
      'l',
      'litro',
      'litros',
      'ml',
      'mililitro',
      'mililitros',
    ];

    // Se é uma unidade total (m²), não multiplicar
    if (unidadesTotais.some((u) => unidadeLower.includes(u))) {
      return false;
    }

    // Se é uma unidade por unidade do produto, multiplicar
    if (unidadesPorUnidade.some((u) => unidadeLower.includes(u))) {
      return true;
    }

    // Por padrão, não multiplicar (casos não identificados)
    return false;
  }

  /**
   * Valida se a correção foi aplicada corretamente
   */
  static validarCorrecao(
    insumosOriginais: InsumoCalculado[],
    insumosCorrigidos: InsumoCalculado[],
    quantidadeProduto: number,
  ): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (insumosOriginais.length !== insumosCorrigidos.length) {
      erros.push('Número de insumos alterado após correção');
    }

    insumosOriginais.forEach((original, index) => {
      const corrigido = insumosCorrigidos[index];

      if (!corrigido) {
        erros.push(`Insumo ${original.nome} perdido na correção`);
        return;
      }

      const deveMultiplicar = this.deveAplicarMultiplicacao(original.unidade);

      if (deveMultiplicar) {
        const quantidadeEsperada =
          original.quantidade_necessaria * quantidadeProduto;
        const custoTotalEsperado = quantidadeEsperada * original.custo_unitario;

        if (
          Math.abs(corrigido.quantidade_necessaria - quantidadeEsperada) > 0.01
        ) {
          erros.push(
            `Quantidade incorreta para ${original.nome}: esperado ${quantidadeEsperada}, obtido ${corrigido.quantidade_necessaria}`,
          );
        }

        if (Math.abs(corrigido.custo_total - custoTotalEsperado) > 0.01) {
          erros.push(
            `Custo total incorreto para ${original.nome}: esperado ${custoTotalEsperado}, obtido ${corrigido.custo_total}`,
          );
        }
      } else {
        // Para materiais m², não deve haver alteração
        if (
          original.quantidade_necessaria !== corrigido.quantidade_necessaria
        ) {
          erros.push(
            `Quantidade alterada incorretamente para ${original.nome} (m²): esperado ${original.quantidade_necessaria}, obtido ${corrigido.quantidade_necessaria}`,
          );
        }

        if (original.custo_total !== corrigido.custo_total) {
          erros.push(
            `Custo total alterado incorretamente para ${original.nome} (m²): esperado ${original.custo_total}, obtido ${corrigido.custo_total}`,
          );
        }
      }
    });

    return {
      valido: erros.length === 0,
      erros,
    };
  }
}
