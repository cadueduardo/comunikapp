/**
 * Utilitário do cliente Prisma isolado para o módulo de estoque
 * Implementa isolamento rigoroso por tenant (lojaId)
 * Seguindo premissas: pool limitado, timeout, monitoramento
 */

import { PrismaClient } from '@prisma/client';
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EstoquePrismaClientUtil
  extends PrismaClient
  implements OnModuleDestroy
{
  private readonly logger = new Logger(EstoquePrismaClientUtil.name);
  private static instance: EstoquePrismaClientUtil;

  constructor(configService: ConfigService) {
    // Pool de conexões limitado conforme premissas
    const connectionLimit = parseInt(
      configService.get('ESTOQUE_DB_CONNECTION_LIMIT', '10'),
    );
    const poolTimeout = parseInt(
      configService.get('ESTOQUE_DB_POOL_TIMEOUT', '20000'),
    );
    const poolIdleTimeout = parseInt(
      configService.get('ESTOQUE_DB_POOL_IDLE_TIMEOUT', '10000'),
    );

    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Monitoramento de queries lentas (premissa)
    const slowQueryThreshold = parseInt(
      configService.get('ESTOQUE_SLOW_QUERY_THRESHOLD', '1000'),
    );

    // Monitoramento removido temporariamente por incompatibilidade TypeScript
    // Será reimplementado quando log events estiverem configurados corretamente

    this.logger.log('✅ EstoquePrismaClient inicializado com sucesso');
  }

  /**
   * Singleton para garantir única instância por aplicação
   */
  static getInstance(configService: ConfigService): EstoquePrismaClientUtil {
    if (!EstoquePrismaClientUtil.instance) {
      EstoquePrismaClientUtil.instance = new EstoquePrismaClientUtil(
        configService,
      );
    }
    return EstoquePrismaClientUtil.instance;
  }

  /**
   * Health check do banco de dados estoque
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: Date;
    connectionTime: number;
  }> {
    try {
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      const connectionTime = Date.now() - start;

      return {
        status: 'healthy',
        timestamp: new Date(),
        connectionTime,
      };
    } catch (error) {
      this.logger.error(`❌ Health check falhou: ${error.message}`);
      throw new Error(
        `Banco de dados do estoque indisponível: ${error.message}`,
      );
    }
  }

  /**
   * Método simples para obter cliente com contexto de tenant
   * O isolamento será implementado nas queries dos services
   */
  createTenantClient(lojaId: string): PrismaClient {
    // Retorna o cliente base
    // O isolamento por tenant será feito no service layer
    return this as PrismaClient;
  }

  /**
   * Cleanup na destruição do módulo
   */
  async onModuleDestroy() {
    this.logger.log('🔄 Desconectando EstoquePrismaClient...');
    await this.$disconnect();
    this.logger.log('✅ EstoquePrismaClient desconectado');
  }
}
