import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CatalogoInsumosPrismaService } from '../prisma/catalogo-insumos-prisma.service';
import { HealthStatus } from '../interfaces';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: CatalogoInsumosPrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verificar saúde do sistema' })
  @ApiResponse({
    status: 200,
    description: 'Status do sistema',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        module: { type: 'string', example: 'catalogo-insumos' },
        timestamp: { type: 'string', example: '2025-08-20T16:30:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        database: { type: 'boolean', example: true },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  async checkHealth(): Promise<HealthStatus> {
    const startTime = process.hrtime();
    
    try {
      // Verificar conexão com banco
      const isDbHealthy = await this.prisma.checkHealth();
      
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = seconds * 1000 + nanoseconds / 1000000;
      
      return {
        status: isDbHealthy ? 'ok' : 'error',
        module: 'catalogo-insumos',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        database: isDbHealthy,
        version: '1.0.0',
        responseTime: `${responseTime.toFixed(2)}ms`,
      };
    } catch (error) {
      return {
        status: 'error',
        module: 'catalogo-insumos',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        database: false,
        version: '1.0.0',
        error: error.message,
      };
    }
  }
}

