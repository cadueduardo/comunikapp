import { Controller, Get, Post, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CrawlerService } from '../services/crawler.service';
import { CrawlerResult, CrawlerStats } from '../interfaces/crawler.interface';

@Controller('api/crawler')
@ApiTags('Crawler de Insumos')
@ApiBearerAuth()
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Iniciar processo de crawling',
    description: 'Inicia a coleta automática de dados de insumos de múltiplas fontes'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Crawling iniciado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        startedAt: { type: 'string', format: 'date-time' },
        totalSources: { type: 'number' },
        processedSources: { type: 'number' },
        totalMaterials: { type: 'number' },
        successRate: { type: 'number' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Crawler já está em execução'
  })
  async startCrawling(): Promise<CrawlerResult> {
    return this.crawlerService.startCrawling();
  }

  @Get('status')
  @ApiOperation({ 
    summary: 'Verificar status do crawler',
    description: 'Retorna se o crawler está rodando e estatísticas básicas'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status do crawler',
    schema: {
      type: 'object',
      properties: {
        isRunning: { type: 'boolean' },
        stats: { type: 'object' }
      }
    }
  })
  async getStatus() {
    return {
      isRunning: this.crawlerService.isCrawlerRunning(),
      stats: this.crawlerService.getStats()
    };
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Obter estatísticas do crawler',
    description: 'Retorna estatísticas detalhadas de execução do crawler'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estatísticas do crawler',
    schema: {
      type: 'object',
      properties: {
        totalExecutions: { type: 'number' },
        totalSources: { type: 'number' },
        totalMaterials: { type: 'number' },
        successRate: { type: 'number' },
        averageExecutionTime: { type: 'number' },
        lastExecution: { type: 'string', format: 'date-time' },
        lastSuccess: { type: 'string', format: 'date-time' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  async getStats(): Promise<CrawlerStats> {
    return this.crawlerService.getStats();
  }

  @Delete('stop')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Parar crawler em execução',
    description: 'Para o processo de crawling se estiver rodando'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Crawler parado com sucesso'
  })
  async stopCrawler() {
    // Por enquanto, o crawler para automaticamente ao concluir
    // Esta funcionalidade pode ser implementada no futuro
    return { message: 'Crawler será parado automaticamente ao concluir' };
  }

  @Get('sources')
  @ApiOperation({ 
    summary: 'Listar fontes de dados',
    description: 'Retorna lista de fontes configuradas para crawling'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de fontes',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          url: { type: 'string' },
          type: { type: 'string' },
          segment: { type: 'string' },
          active: { type: 'boolean' },
          lastCrawl: { type: 'string' },
          successRate: { type: 'number' }
        }
      }
    }
  })
  async getSources() {
    // Por enquanto retorna fontes hardcoded
    // No futuro pode vir de configuração
    return [
      {
        id: 'acrilex',
        name: 'Acrilex',
        url: 'https://www.acrilex.com.br',
        type: 'fornecedor',
        segment: 'comunicacao_visual',
        active: true,
        lastCrawl: new Date().toISOString(),
        successRate: 0
      },
      {
        id: 'policarbonatos',
        name: 'Policarbonatos',
        url: 'https://www.policarbonatos.com.br',
        type: 'fornecedor',
        segment: 'comunicacao_visual',
        active: true,
        lastCrawl: new Date().toISOString(),
        successRate: 0
      },
      {
        id: 'metalurgica',
        name: 'Metalúrgica',
        url: 'https://www.metalurgica.com.br',
        type: 'fornecedor',
        segment: 'comunicacao_visual',
        active: true,
        lastCrawl: new Date().toISOString(),
        successRate: 0
      },
      {
        id: 'papelaria',
        name: 'Papelaria Gráfica',
        url: 'https://www.papelariagrafica.com.br',
        type: 'fornecedor',
        segment: 'grafica',
        active: true,
        lastCrawl: new Date().toISOString(),
        successRate: 0
      }
    ];
  }
}
