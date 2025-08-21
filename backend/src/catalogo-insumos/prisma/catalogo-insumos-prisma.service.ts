import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Injectable()
export class CatalogoInsumosPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(CatalogoInsumosPrismaService.name);

  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('CATALOGO_INSUMOS_DATABASE_URL'),
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Configurar listeners de log
    this.setupLogListeners();
  }

  private setupLogListeners() {
    // Temporariamente comentado devido a problemas de tipos
    // TODO: Implementar quando os tipos do Prisma estiverem corretos
    
    /*
    // Listener para queries
    this.$on('query' as any, (e: any) => {
      this.logger.debug(`Query: ${e.query}`);
      this.logger.debug(`Params: ${e.params}`);
      this.logger.debug(`Duration: ${e.duration}ms`);
    });

    // Listener para erros
    this.$on('error' as any, (e: any) => {
      this.logger.error(`Prisma Error: ${e.message}`);
      this.logger.error(`Target: ${e.target}`);
    });

    // Listener para informações
    this.$on('info' as any, (e: any) => {
      this.logger.log(`Prisma Info: ${e.message}`);
    });

    // Listener para warnings
    this.$on('warn' as any, (e: any) => {
      this.logger.warn(`Prisma Warning: ${e.message}`);
    });
    */
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conexão com banco de dados estabelecida com sucesso');
    } catch (error) {
      this.logger.error('Erro ao conectar com banco de dados:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Conexão com banco de dados encerrada com sucesso');
    } catch (error) {
      this.logger.error('Erro ao encerrar conexão com banco de dados:', error);
    }
  }

  // Método para verificar saúde da conexão
  async checkHealth(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Health check falhou:', error);
      return false;
    }
  }

  // Método para obter informações da conexão
  async getConnectionInfo() {
    try {
      const result = await this.$queryRaw`SELECT VERSION() as version, NOW() as current_time`;
      return result[0];
    } catch (error) {
      this.logger.error('Erro ao obter informações da conexão:', error);
      return null;
    }
  }
}
