import { Injectable, Logger } from '@nestjs/common';
import { IndustrySegment, GraficaCategory, ComunicacaoVisualCategory } from '../enums/segment.enum';

export interface ClassificationResult {
  segment: IndustrySegment;
  category: string;
  confidence: number;
  keywords: string[];
}

@Injectable()
export class SegmentClassifierService {
  private readonly logger = new Logger(SegmentClassifierService.name);

  // Palavras-chave para classificação automática
  private readonly graficaKeywords = {
    [GraficaCategory.PAPEL]: [
      'papel', 'couche', 'offset', 'colorido', 'sulfite', 'kraft', 'cartão', 'cartao',
      'gramatura', 'g/m²', 'g/m2', 'gramas', 'folha', 'resma', 'pacote'
    ],
    [GraficaCategory.TINTA]: [
      'tinta', 'offset', 'digital', 'uv', 'ecológica', 'ecologica', 'pigmentada',
      'litro', 'ml', 'mililitro', 'galão', 'galao'
    ],
    [GraficaCategory.VERNIZ]: [
      'verniz', 'uv', 'acrílico', 'acrilico', 'brilho', 'fosco', 'mate',
      'litro', 'ml', 'mililitro'
    ],
    [GraficaCategory.ADESIVO]: [
      'adesivo', 'cola', 'barniz', 'verniz', 'acabamento', 'proteção', 'protecao'
    ],
    [GraficaCategory.ACABAMENTO]: [
      'acabamento', 'verniz', 'laminação', 'laminacao', 'hot-stamp', 'hot stamp',
      'vinco', 'dobra', 'corte', 'refile'
    ]
  };

  private readonly comunicacaoVisualKeywords = {
    [ComunicacaoVisualCategory.VINIL]: [
      'vinil', 'vinil adesivo', 'vinil impressão', 'vinil impressao', 'plotter',
      'corte', 'adesivo', 'decalque', 'transfer'
    ],
    [ComunicacaoVisualCategory.LONA]: [
      'lona', 'banner', 'outdoor', 'front light', 'back light', 'mesh',
      'gramatura', 'g/m²', 'g/m2', 'resistente', 'impermeável', 'impermeavel'
    ],
    [ComunicacaoVisualCategory.ACRILICO]: [
      'acrílico', 'acrilico', 'plexiglass', 'policarbonato', 'transparente',
      'colorido', 'espessura', 'mm', 'milímetro', 'milimetro'
    ],
    [ComunicacaoVisualCategory.MDF]: [
      'mdf', 'medium density fiberboard', 'fibra', 'compensado', 'chapa',
      'espessura', 'mm', 'milímetro', 'milimetro', '6mm', '12mm', '18mm'
    ],
    [ComunicacaoVisualCategory.PVC]: [
      'pvc', 'policloreto de vinila', 'rígido', 'rigido', 'flexível', 'flexivel',
      'espessura', 'mm', 'milímetro', 'milimetro', 'chapa', 'placa'
    ],
    [ComunicacaoVisualCategory.METAL]: [
      'metal', 'alumínio', 'aluminio', 'ferro', 'aço', 'aco', 'chapa',
      'espessura', 'mm', 'milímetro', 'milimetro', 'galvanizado'
    ],
    [ComunicacaoVisualCategory.TECIDO]: [
      'tecido', 'pano', 'banner', 'bandeira', 'faixa', 'estandarte',
      'gramatura', 'g/m²', 'g/m2', 'resistente', 'lavável', 'lavavel'
    ]
  };

  /**
   * Classifica automaticamente um material baseado em seu nome e descrição
   */
  classifyMaterial(nome: string, descricao?: string): ClassificationResult {
    const text = `${nome} ${descricao || ''}`.toLowerCase();
    
    // Calcular scores para cada segmento
    const graficaScore = this.calculateGraficaScore(text);
    const comunicacaoVisualScore = this.calculateComunicacaoVisualScore(text);
    
    // Determinar o segmento com maior confiança
    if (graficaScore.total > comunicacaoVisualScore.total) {
      return {
        segment: IndustrySegment.GRAFICA,
        category: graficaScore.bestCategory,
        confidence: graficaScore.confidence,
        keywords: graficaScore.matchedKeywords
      };
    } else {
      return {
        segment: IndustrySegment.COMUNICACAO_VISUAL,
        category: comunicacaoVisualScore.bestCategory,
        confidence: comunicacaoVisualScore.confidence,
        keywords: comunicacaoVisualScore.matchedKeywords
      };
    }
  }

  /**
   * Calcula score para segmento Gráfica
   */
  private calculateGraficaScore(text: string) {
    let totalScore = 0;
    let bestCategory = '';
    let bestScore = 0;
    const matchedKeywords: string[] = [];

    for (const [category, keywords] of Object.entries(this.graficaKeywords)) {
      let categoryScore = 0;
      const categoryKeywords: string[] = [];

      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          categoryScore += 1;
          categoryKeywords.push(keyword);
          matchedKeywords.push(keyword);
        }
      }

      if (categoryScore > bestScore) {
        bestScore = categoryScore;
        bestCategory = category;
      }

      totalScore += categoryScore;
    }

    const confidence = Math.min((totalScore / 10) * 100, 100); // Normalizar para 0-100

    return {
      total: totalScore,
      bestCategory,
      confidence,
      matchedKeywords
    };
  }

  /**
   * Calcula score para segmento Comunicação Visual
   */
  private calculateComunicacaoVisualScore(text: string) {
    let totalScore = 0;
    let bestCategory = '';
    let bestScore = 0;
    const matchedKeywords: string[] = [];

    for (const [category, keywords] of Object.entries(this.comunicacaoVisualKeywords)) {
      let categoryScore = 0;
      const categoryKeywords: string[] = [];

      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          categoryScore += 1;
          categoryKeywords.push(keyword);
          matchedKeywords.push(keyword);
        }
      }

      if (categoryScore > bestScore) {
        bestScore = categoryScore;
        bestCategory = category;
      }

      totalScore += categoryScore;
    }

    const confidence = Math.min((totalScore / 15) * 100, 100); // Normalizar para 0-100

    return {
      total: totalScore,
      bestCategory,
      confidence,
      matchedKeywords
    };
  }

  /**
   * Extrai especificações técnicas do texto
   */
  extractSpecifications(text: string) {
    const specs: any = {};
    
    // Extrair dimensões
    const dimensoesMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m|pol|"|')\s*x\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m|pol|"|')/i);
    if (dimensoesMatch) {
      specs.largura = parseFloat(dimensoesMatch[1]);
      specs.altura = parseFloat(dimensoesMatch[3]);
      specs.unidadeDimensao = dimensoesMatch[2];
    }

    // Extrair espessura
    const espessuraMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m|pol|"|')/i);
    if (espessuraMatch && !specs.largura) {
      specs.espessura = parseFloat(espessuraMatch[1]);
      specs.unidadeDimensao = espessuraMatch[2];
    }

    // Extrair gramatura
    const gramaturaMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(g\/m²|g\/m2|g\/m|gramas?)/i);
    if (gramaturaMatch) {
      specs.gramatura = parseFloat(gramaturaMatch[1]);
    }

    // Extrair unidades de compra
    const unidadeCompraMatch = text.match(/(metro|m²|m2|kg|litro|unidade|pacote|rolo|folha|chapa)/i);
    if (unidadeCompraMatch) {
      specs.unidadeCompra = unidadeCompraMatch[1];
    }

    return specs;
  }

  /**
   * Valida se a classificação é confiável
   */
  isClassificationReliable(confidence: number): boolean {
    return confidence >= 60; // Mínimo 60% de confiança
  }
}

