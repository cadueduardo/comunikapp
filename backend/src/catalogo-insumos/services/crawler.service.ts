import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { SegmentClassifierService } from './segment-classifier.service';
import { CatalogoInsumosPrismaService } from '../prisma/catalogo-insumos-prisma.service';
import {
  CrawlerConfig,
  CrawlerSource,
  CrawledMaterial,
  CrawlerResult,
  CrawlerStats,
  MaterialSpecifications
} from '../interfaces/crawler.interface';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly config: CrawlerConfig;
  private isRunning = false;
  private stats: CrawlerStats = {
    totalCrawls: 0,
    totalMaterials: 0,
    successRate: 0,
    lastCrawl: new Date(),
    activeSources: 0,
    averageProcessingTime: 0
  };

  // Fontes de dados configuradas
  private readonly sources: CrawlerSource[] = [
    {
      id: 'acrilex',
      name: 'Acrilex',
      url: 'https://www.acrilex.com.br',
      type: 'fornecedor',
      segment: 'comunicacao_visual',
      active: true,
      lastCrawl: new Date(0),
      successRate: 0
    },
    {
      id: 'policarbonatos',
      name: 'Policarbonatos',
      url: 'https://www.policarbonatos.com.br',
      type: 'fornecedor',
      segment: 'comunicacao_visual',
      active: true,
      lastCrawl: new Date(0),
      successRate: 0
    },
    {
      id: 'metalurgica',
      name: 'Metalúrgica',
      url: 'https://www.metalurgica.com.br',
      type: 'fornecedor',
      segment: 'comunicacao_visual',
      active: true,
      lastCrawl: new Date(0),
      successRate: 0
    },
    {
      id: 'papelaria',
      name: 'Papelaria Gráfica',
      url: 'https://www.papelariagrafica.com.br',
      type: 'fornecedor',
      segment: 'grafica',
      active: true,
      lastCrawl: new Date(0),
      successRate: 0
    }
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly segmentClassifier: SegmentClassifierService,
    private readonly prisma: CatalogoInsumosPrismaService
  ) {
    this.config = {
      maxConcurrentRequests: 3,
      requestDelay: 1000, // 1 segundo entre requests
      timeout: 30000, // 30 segundos
      retryAttempts: 3,
      userAgent: 'ComunikApp-Crawler/1.0'
    };
  }

  /**
   * Inicia o processo de crawling
   */
  async startCrawling(): Promise<CrawlerResult> {
    if (this.isRunning) {
      throw new Error('Crawler já está em execução');
    }

    this.isRunning = true;
    const startTime = Date.now();
    let materialsFound = 0;
    let materialsProcessed = 0;
    const errors: string[] = [];

    try {
      this.logger.log('🚀 Iniciando processo de crawling...');

      // Processar fontes ativas
      const activeSources = this.sources.filter(s => s.active);
      this.stats.activeSources = activeSources.length;

      for (const source of activeSources) {
        try {
          this.logger.log(`📡 Processando fonte: ${source.name}`);
          
          const sourceResult = await this.processSource(source);
          materialsFound += sourceResult.materialsFound;
          materialsProcessed += sourceResult.materialsProcessed;
          
          // Atualizar estatísticas da fonte
          source.lastCrawl = new Date();
          source.successRate = sourceResult.success ? 100 : 0;
          
        } catch (error) {
          const errorMsg = `Erro ao processar fonte ${source.name}: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
          
          // Marcar fonte como inativa se falhar muito
          if (source.successRate < 20) {
            source.active = false;
            this.logger.warn(`Fonte ${source.name} marcada como inativa`);
          }
        }

        // Delay entre fontes para não sobrecarregar
        await this.delay(this.config.requestDelay);
      }

      const duration = Date.now() - startTime;
      const success = errors.length === 0;

      // Atualizar estatísticas globais
      this.updateStats(success, materialsFound, materialsProcessed, duration);

      const result: CrawlerResult = {
        success,
        materialsFound,
        materialsProcessed,
        errors,
        duration,
        timestamp: new Date()
      };

      this.logger.log(`✅ Crawling concluído: ${materialsProcessed} materiais processados em ${duration}ms`);
      return result;

    } catch (error) {
      this.logger.error(`❌ Erro durante crawling: ${error.message}`);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Processa uma fonte específica
   */
  private async processSource(source: CrawlerSource) {
    const materials: CrawledMaterial[] = [];
    
    try {
      // Fazer request para a fonte
      const response = await axios.get(source.url, {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': this.config.userAgent
        }
      });

      // Parsear HTML com Cheerio
      const $ = cheerio.load(response.data);
      
      // Extrair materiais baseado no tipo de fonte
      if (source.type === 'fornecedor') {
        materials.push(...await this.extractMaterialsFromFornecedor($, source));
      }

      // Processar e classificar materiais
      for (const material of materials) {
        try {
          await this.processMaterial(material);
        } catch (error) {
          this.logger.error(`Erro ao processar material ${material.nome}: ${error.message}`);
        }
      }

      return {
        success: true,
        materialsFound: materials.length,
        materialsProcessed: materials.length
      };

    } catch (error) {
      this.logger.error(`Erro ao processar fonte ${source.name}: ${error.message}`);
      return {
        success: false,
        materialsFound: 0,
        materialsProcessed: 0
      };
    }
  }

  /**
   * Extrai materiais de uma página de fornecedor
   */
  private async extractMaterialsFromFornecedor($: cheerio.CheerioAPI, source: CrawlerSource): Promise<CrawledMaterial[]> {
    const materials: CrawledMaterial[] = [];
    
    // Buscar por elementos que possam conter produtos
    const productElements = $('.product, .produto, .item, [class*="product"], [class*="produto"]');
    
    productElements.each((index, element) => {
      try {
        const $el = $(element);
        
        // Extrair informações básicas
        const nome = $el.find('.name, .nome, .title, h1, h2, h3').first().text().trim();
        const descricao = $el.find('.description, .descricao, .desc, p').first().text().trim();
        
        if (!nome) return; // Pular se não tiver nome
        
        // Classificar automaticamente o material
        const classification = this.segmentClassifier.classifyMaterial(nome, descricao);
        
        // Extrair especificações técnicas
        const especificacoes = this.segmentClassifier.extractSpecifications(`${nome} ${descricao}`);
        
        // Criar objeto do material
        const material: CrawledMaterial = {
          nome,
          descricao,
          categoria: classification.category,
          segment: classification.segment,
          especificacoes,
          fornecedor: source.name,
          fonte: source.url,
          dataColeta: new Date(),
          confiabilidade: classification.confidence
        };
        
        materials.push(material);
        
      } catch (error) {
        this.logger.warn(`Erro ao extrair material do elemento ${index}: ${error.message}`);
      }
    });
    
    return materials;
  }

  /**
   * Processa um material coletado
   */
  private async processMaterial(material: CrawledMaterial) {
    try {
      // Verificar se o material já existe
      const existingMaterial = await this.prisma.catalogoInsumo.findFirst({
        where: {
          nome: material.nome,
          fornecedor: material.fornecedor
        }
      });

      if (existingMaterial) {
        // Atualizar material existente
        await this.prisma.catalogoInsumo.update({
          where: { id: existingMaterial.id },
          data: {
            descricao_tecnica: material.descricao,
            especificacoes: material.especificacoes as any,
            fonte_coleta: material.fonte,
            data_coleta: material.dataColeta,
            data_atualizacao: new Date()
          }
        });
        
        this.logger.log(`🔄 Material atualizado: ${material.nome}`);
      } else {
        // Criar novo material
        await this.prisma.catalogoInsumo.create({
          data: {
            codigo_catalogo: this.generateCatalogCode(material),
            nome: material.nome,
            descricao_tecnica: material.descricao,
            especificacoes: material.especificacoes as any,
            unidade_compra: material.especificacoes.unidadeCompra || 'unidade',
            unidade_uso: material.especificacoes.unidadeUso || 'unidade',
            fator_conversao: material.especificacoes.fatorConversao || 1,
            largura: material.especificacoes.largura,
            altura: material.especificacoes.altura,
            gramatura: material.especificacoes.gramatura,
            unidade_dimensao: material.especificacoes.unidadeDimensao,
            tipo_calculo: material.especificacoes.tipoCalculo,
            logica_consumo: material.especificacoes.logicaConsumo || 'por_unidade',
            fonte_coleta: material.fonte,
            data_coleta: material.dataColeta,
            ativo: true
          }
        });
        
        this.logger.log(`✨ Novo material criado: ${material.nome}`);
      }
      
    } catch (error) {
      this.logger.error(`Erro ao processar material ${material.nome}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gera código único para o catálogo
   */
  private generateCatalogCode(material: CrawledMaterial): string {
    const prefix = material.segment === 'grafica' ? 'GRA' : 'CV';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `${prefix}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Atualiza estatísticas do crawler
   */
  private updateStats(success: boolean, materialsFound: number, materialsProcessed: number, duration: number) {
    this.stats.totalCrawls++;
    this.stats.totalMaterials += materialsProcessed;
    this.stats.lastCrawl = new Date();
    
    // Calcular taxa de sucesso
    const successRate = this.stats.totalCrawls > 0 
      ? (this.stats.totalCrawls - (success ? 0 : 1)) / this.stats.totalCrawls * 100
      : 0;
    this.stats.successRate = Math.round(successRate);
    
    // Calcular tempo médio de processamento
    this.stats.averageProcessingTime = this.stats.totalCrawls > 0
      ? (this.stats.averageProcessingTime * (this.stats.totalCrawls - 1) + duration) / this.stats.totalCrawls
      : duration;
  }

  /**
   * Retorna estatísticas do crawler
   */
  getStats(): CrawlerStats {
    return { ...this.stats };
  }

  /**
   * Verifica se o crawler está rodando
   */
  isCrawlerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Agenda execução automática do crawler
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async scheduledCrawling() {
    try {
      this.logger.log('⏰ Executando crawling agendado...');
      await this.startCrawling();
    } catch (error) {
      this.logger.error(`Erro no crawling agendado: ${error.message}`);
    }
  }

  /**
   * Delay entre requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

