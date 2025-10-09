/**
 * Serviço de Cálculo Inteligente de Materiais por Unidade de Produção
 * Converte área total (m²) para unidades de compra (bobinas, chapas, rolos)
 * Considera desperdício padrão e calcula sobras aproveitáveis
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface MaterialCalculado {
  insumo_id: string;
  nome: string;
  tipo_material: string;
  unidade_compra: string;
  dimensoes_compra: {
    largura: number; // em metros
    comprimento: number; // em metros
    area_unidade: number; // em m²
  };
  quantidade_necessaria: number; // área total em m²
  desperdicio_percentual: number; // % de desperdício padrão
  desperdicio_area: number; // área de desperdício em m²
  area_total_com_desperdicio: number; // área total + desperdício
  unidades_necessarias: number; // unidades de compra necessárias
  area_total_comprada: number; // área total das unidades compradas
  sobra_aproveitavel: number; // sobra em m²
  custo_unitario: number;
  custo_total: number;
  estoque_disponivel: number;
  estoque_suficiente: boolean;
  sugestoes_otimizacao: string[];
}

export interface ResultadoCalculoMaterial {
  materiais: MaterialCalculado[];
  resumo: {
    total_materiais: number;
    materiais_suficientes: number;
    materiais_insuficientes: number;
    custo_total: number;
    desperdicio_total: number;
    sobras_aproveitaveis: number;
  };
  alertas: string[];
  recomendacoes: string[];
}

@Injectable()
export class CalculoMaterialUnidadeService {
  private readonly logger = new Logger(CalculoMaterialUnidadeService.name);

  // Desperdício padrão por tipo de material (%)
  private readonly DESPERDICIO_PADRAO = {
    'LONA_FRONT': 5,      // 5% para lonas frontlight
    'LONA_BACK': 3,       // 3% para lonas backlight
    'VINIL_ADESIVO': 8,   // 8% para vinil adesivo
    'ACRILICO': 10,       // 10% para acrílico
    'PAPEL': 15,          // 15% para papel
    'TINTA': 5,           // 5% para tintas
    'CORDAO': 2,          // 2% para cordões
    'DEFAULT': 5           // 5% padrão
  };

  // Dimensões padrão de unidades de compra
  private readonly DIMENSOES_PADRAO = {
    'LONA_FRONT': { largura: 1.60, comprimento: 30, area: 48 },
    'LONA_BACK': { largura: 1.60, comprimento: 30, area: 48 },
    'VINIL_ADESIVO': { largura: 1.37, comprimento: 50, area: 68.5 },
    'ACRILICO': { largura: 1.22, comprimento: 2.44, area: 2.98 },
    'PAPEL': { largura: 0.70, comprimento: 100, area: 70 },
    'TINTA': { largura: 0, comprimento: 0, area: 0 }, // Unidade por litro
    'CORDAO': { largura: 0, comprimento: 50, area: 0 }, // Unidade por metro
    'DEFAULT': { largura: 1.0, comprimento: 1.0, area: 1.0 }
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcula materiais necessários para uma OS
   */
  async calcularMateriaisOS(osId: string): Promise<ResultadoCalculoMaterial> {
    this.logger.log(`Calculando materiais para OS ${osId}`);

    try {
      // Buscar OS com insumos calculados
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId },
        include: {
          orcamento: {
            include: {
              produtos: {
                include: {
                  insumos: {
                    include: {
                      insumo: {
                        include: {
                          tipoMaterial: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!os) {
        throw new Error(`OS ${osId} não encontrada`);
      }

      if (!os.insumos_calculados) {
        throw new Error(`OS ${osId} não possui insumos calculados`);
      }

      const insumosCalculados = JSON.parse(os.insumos_calculados as string);
      const materiais: MaterialCalculado[] = [];
      const alertas: string[] = [];
      const recomendacoes: string[] = [];

      // Processar cada insumo
      for (const insumo of insumosCalculados) {
        const materialCalculado = await this.calcularMaterial(insumo);
        materiais.push(materialCalculado);

        // Gerar alertas e recomendações
        if (!materialCalculado.estoque_suficiente) {
          alertas.push(`Estoque insuficiente para ${materialCalculado.nome}: necessário ${materialCalculado.unidades_necessarias} unidades, disponível ${materialCalculado.estoque_disponivel}`);
        }

        if (materialCalculado.sobra_aproveitavel > 0) {
          recomendacoes.push(`Sobra de ${materialCalculado.sobra_aproveitavel.toFixed(2)}m² de ${materialCalculado.nome} pode ser aproveitada para outros projetos`);
        }

        if (materialCalculado.desperdicio_area > 0) {
          recomendacoes.push(`Desperdício estimado de ${materialCalculado.desperdicio_area.toFixed(2)}m² (${materialCalculado.desperdicio_percentual}%) para ${materialCalculado.nome}`);
        }
      }

      // Calcular resumo
      const resumo = this.calcularResumo(materiais);

      this.logger.log(`Cálculo concluído para OS ${osId}:`, {
        total_materiais: resumo.total_materiais,
        custo_total: resumo.custo_total,
        alertas: alertas.length
      });

      return {
        materiais,
        resumo,
        alertas,
        recomendacoes
      };

    } catch (error) {
      this.logger.error(`Erro ao calcular materiais para OS ${osId}:`, error);
      throw error;
    }
  }

  /**
   * Calcula um material específico
   */
  private async calcularMaterial(insumo: any): Promise<MaterialCalculado> {
    const tipoMaterial = insumo.insumo?.tipoMaterial?.nome || 'DEFAULT';
    const nome = insumo.nome || insumo.insumo?.nome || 'Material desconhecido';
    const quantidadeNecessaria = parseFloat(insumo.quantidade_necessaria || '0');
    const unidade = insumo.unidade || insumo.insumo?.unidade_uso || 'm²';
    
    // Determinar tipo de material e dimensões
    const tipoMaterialKey = this.identificarTipoMaterial(tipoMaterial, nome);
    const dimensoes = this.DIMENSOES_PADRAO[tipoMaterialKey] || this.DIMENSOES_PADRAO.DEFAULT;
    const desperdicioPercentual = this.DESPERDICIO_PADRAO[tipoMaterialKey] || this.DESPERDICIO_PADRAO.DEFAULT;

    // Calcular desperdício
    const desperdicioArea = (quantidadeNecessaria * desperdicioPercentual) / 100;
    const areaTotalComDesperdicio = quantidadeNecessaria + desperdicioArea;

    // Calcular unidades necessárias
    let unidadesNecessarias = 0;
    if (dimensoes.area > 0) {
      unidadesNecessarias = Math.ceil(areaTotalComDesperdicio / dimensoes.area);
    } else if (unidade.includes('litro') || unidade.includes('L')) {
      // Para tintas, usar quantidade direta
      unidadesNecessarias = Math.ceil(areaTotalComDesperdicio);
    } else if (unidade.includes('metro') || unidade.includes('m')) {
      // Para cordões, usar quantidade direta
      unidadesNecessarias = Math.ceil(areaTotalComDesperdicio);
    } else {
      // Para outros materiais, assumir 1 unidade
      unidadesNecessarias = 1;
    }

    const areaTotalComprada = unidadesNecessarias * dimensoes.area;
    const sobraAproveitavel = Math.max(0, areaTotalComprada - areaTotalComDesperdicio);

    // Buscar estoque disponível
    const estoqueDisponivel = await this.buscarEstoqueDisponivel(insumo.insumo_id);

    // Calcular custos
    const custoUnitario = parseFloat(insumo.custo_unitario || '0');
    const custoTotal = unidadesNecessarias * custoUnitario;

    // Gerar sugestões de otimização
    const sugestoes = this.gerarSugestoesOtimizacao({
      nome,
      tipoMaterial: tipoMaterialKey,
      unidadesNecessarias,
      sobraAproveitavel,
      desperdicioArea,
      estoqueDisponivel
    });

    return {
      insumo_id: insumo.insumo_id,
      nome,
      tipo_material: tipoMaterialKey,
      unidade_compra: this.obterUnidadeCompra(tipoMaterialKey),
      dimensoes_compra: {
        largura: dimensoes.largura,
        comprimento: dimensoes.comprimento,
        area_unidade: dimensoes.area
      },
      quantidade_necessaria: quantidadeNecessaria,
      desperdicio_percentual: desperdicioPercentual,
      desperdicio_area: desperdicioArea,
      area_total_com_desperdicio: areaTotalComDesperdicio,
      unidades_necessarias: unidadesNecessarias,
      area_total_comprada: areaTotalComprada,
      sobra_aproveitavel: sobraAproveitavel,
      custo_unitario: custoUnitario,
      custo_total: custoTotal,
      estoque_disponivel: estoqueDisponivel,
      estoque_suficiente: estoqueDisponivel >= unidadesNecessarias,
      sugestoes_otimizacao: sugestoes
    };
  }

  /**
   * Identifica o tipo de material baseado no nome e tipo
   */
  private identificarTipoMaterial(tipoMaterial: string, nome: string): string {
    const nomeLower = nome.toLowerCase();
    const tipoLower = tipoMaterial.toLowerCase();

    if (nomeLower.includes('front') || nomeLower.includes('frontlight')) return 'LONA_FRONT';
    if (nomeLower.includes('back') || nomeLower.includes('backlight')) return 'LONA_BACK';
    if (nomeLower.includes('vinil') || nomeLower.includes('adesivo')) return 'VINIL_ADESIVO';
    if (nomeLower.includes('acrilico') || nomeLower.includes('acrílico')) return 'ACRILICO';
    if (nomeLower.includes('papel')) return 'PAPEL';
    if (nomeLower.includes('tinta') || nomeLower.includes('ink')) return 'TINTA';
    if (nomeLower.includes('cordao') || nomeLower.includes('cordão')) return 'CORDAO';

    return 'DEFAULT';
  }

  /**
   * Obtém a unidade de compra para o tipo de material
   */
  private obterUnidadeCompra(tipoMaterial: string): string {
    const unidades = {
      'LONA_FRONT': 'bobina',
      'LONA_BACK': 'bobina',
      'VINIL_ADESIVO': 'rolo',
      'ACRILICO': 'chapa',
      'PAPEL': 'rolo',
      'TINTA': 'litro',
      'CORDAO': 'metro',
      'DEFAULT': 'unidade'
    };

    return unidades[tipoMaterial] || 'unidade';
  }

  /**
   * Busca estoque disponível para um insumo
   */
  private async buscarEstoqueDisponivel(insumoId: string): Promise<number> {
    try {
      const estoque = await this.prisma.estoque.findFirst({
        where: { insumo_id: insumoId },
        select: { quantidade_atual: true }
      });

      return parseFloat(estoque?.quantidade_atual?.toString() || '0');
    } catch (error) {
      this.logger.warn(`Erro ao buscar estoque para insumo ${insumoId}:`, error);
      return 0;
    }
  }

  /**
   * Gera sugestões de otimização
   */
  private gerarSugestoesOtimizacao(params: {
    nome: string;
    tipoMaterial: string;
    unidadesNecessarias: number;
    sobraAproveitavel: number;
    desperdicioArea: number;
    estoqueDisponivel: number;
  }): string[] {
    const sugestoes: string[] = [];

    if (params.sobraAproveitavel > 0) {
      sugestoes.push(`Sobra de ${params.sobraAproveitavel.toFixed(2)}m² pode ser usada para banners menores`);
    }

    if (params.desperdicioArea > 0) {
      sugestoes.push(`Considere otimizar o layout para reduzir desperdício de ${params.desperdicioArea.toFixed(2)}m²`);
    }

    if (params.estoqueDisponivel < params.unidadesNecessarias) {
      sugestoes.push(`Necessário comprar ${params.unidadesNecessarias - params.estoqueDisponivel} unidades adicionais`);
    }

    if (params.tipoMaterial === 'LONA_FRONT' || params.tipoMaterial === 'LONA_BACK') {
      sugestoes.push('Considere agrupar projetos para otimizar o uso de bobinas');
    }

    return sugestoes;
  }

  /**
   * Calcula resumo dos materiais
   */
  private calcularResumo(materiais: MaterialCalculado[]): {
    total_materiais: number;
    materiais_suficientes: number;
    materiais_insuficientes: number;
    custo_total: number;
    desperdicio_total: number;
    sobras_aproveitaveis: number;
  } {
    return {
      total_materiais: materiais.length,
      materiais_suficientes: materiais.filter(m => m.estoque_suficiente).length,
      materiais_insuficientes: materiais.filter(m => !m.estoque_suficiente).length,
      custo_total: materiais.reduce((sum, m) => sum + m.custo_total, 0),
      desperdicio_total: materiais.reduce((sum, m) => sum + m.desperdicio_area, 0),
      sobras_aproveitaveis: materiais.reduce((sum, m) => sum + m.sobra_aproveitavel, 0)
    };
  }

  /**
   * Obtém configurações de desperdício
   */
  getDesperdicioPadrao(): Record<string, number> {
    return { ...this.DESPERDICIO_PADRAO };
  }

  /**
   * Obtém dimensões padrão
   */
  getDimensoesPadrao(): Record<string, any> {
    return { ...this.DIMENSOES_PADRAO };
  }
}
