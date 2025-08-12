/**
 * Módulo principal do Estoque
 * Implementa arquitetura modular plugável conforme premissas
 * Isolamento total com outros módulos, multi-tenant
 */

import {
  Module,
  Global,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { EstoqueSimpleService } from './services/estoque-simple.service';
import { SobrasService } from './services/sobras.service';
import { MovimentacoesService } from './services/movimentacoes.service';
import { LocalizacoesController } from './controllers/localizacoes.controller';
import { ItensController } from './controllers/itens.controller';
import { MovimentacoesController } from './controllers/movimentacoes.controller';
import { RelatoriosController } from './controllers/relatorios.controller';
import { LotesController } from './controllers/lotes.controller';
import { TransferenciasController } from './controllers/transferencias.controller';
import { SobrasController } from './controllers/sobras.controller';
import { HealthController } from './controllers/health.controller';
import { EstoqueAccessGuard } from './guards/estoque-access.guard';
import { TenantIsolationMiddleware } from './middleware/tenant-isolation.middleware';

@Global()
@Module({
  imports: [
    ConfigModule, // Para acessar variáveis de ambiente
    PrismaModule, // Para acessar banco de dados
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [
    LocalizacoesController,
    ItensController,
    MovimentacoesController,
    RelatoriosController,
    LotesController,
    TransferenciasController,
    SobrasController,
    HealthController,
  ],
  providers: [
    EstoqueSimpleService,
    SobrasService,
    MovimentacoesService,
    EstoqueAccessGuard,
    {
      provide: 'ESTOQUE_MODULE_CONFIG',
      useFactory: () => ({
        moduleName: 'estoque',
        version: '1.0.0',
        isolated: true,
        multiTenant: true,
        description:
          'Módulo de controle de estoque com endereçamento hierárquico',
        features: [
          'localizacao-hierarquica',
          'controle-lotes',
          'auditoria-completa',
        ],
      }),
    },
  ],
  exports: [EstoqueSimpleService, EstoqueAccessGuard, 'ESTOQUE_MODULE_CONFIG'],
})
export class EstoqueModule implements NestModule {
  constructor() {
    console.log(
      '✅ EstoqueModule carregado - APIs REST ativas com JwtAuthGuard padrão',
    );
  }

  configure(consumer: MiddlewareConsumer) {
    // Aplica o middleware de isolamento de tenant para todas as rotas do módulo de estoque
    consumer.apply(TenantIsolationMiddleware).forRoutes(
      // Rotas com prefixo explícito 'api/estoque/*'
      { path: 'api/estoque/(.*)', method: RequestMethod.ALL },
      // Rotas sem prefixo global (ex.: 'estoque/sobras')
      { path: 'estoque/(.*)', method: RequestMethod.ALL },
    );
  }
}
