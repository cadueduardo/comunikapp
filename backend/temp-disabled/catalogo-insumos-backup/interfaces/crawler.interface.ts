export interface CrawlerConfig {
  maxConcurrentRequests: number;
  requestDelay: number;
  timeout: number;
  retryAttempts: number;
  userAgent: string;
}

export interface CrawlerSource {
  id: string;
  name: string;
  url: string;
  type: 'fornecedor' | 'catalogo' | 'associacao' | 'feira';
  segment: 'grafica' | 'comunicacao_visual' | 'ambos';
  active: boolean;
  lastCrawl: Date;
  successRate: number;
}

export interface CrawledMaterial {
  nome: string;
  descricao: string;
  categoria: string;
  segment: 'grafica' | 'comunicacao_visual';
  especificacoes: MaterialSpecifications;
  fornecedor: string;
  fonte: string;
  dataColeta: Date;
  confiabilidade: number;
}

export interface MaterialSpecifications {
  unidadeCompra?: string;
  unidadeUso?: string;
  fatorConversao?: number;
  largura?: number;
  altura?: number;
  espessura?: number;
  gramatura?: number;
  unidadeDimensao?: string;
  tipoCalculo?: string;
  logicaConsumo?: string;
  cores?: string[];
  acabamentos?: string[];
  aplicacoes?: string[];
}

export interface CrawlerResult {
  success: boolean;
  materialsFound: number;
  materialsProcessed: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

export interface SegmentClassifier {
  keywords: string[];
  segment: 'grafica' | 'comunicacao_visual';
  confidence: number;
}

export interface CrawlerStats {
  totalCrawls: number;
  totalMaterials: number;
  successRate: number;
  lastCrawl: Date;
  activeSources: number;
  averageProcessingTime: number;
}

