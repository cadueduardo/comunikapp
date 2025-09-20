/**
 * Módulo principal de OS (Ordens de Serviço)
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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers (≤ 200 linhas cada)
import { OSController } from './controllers/os.controller';
import { WorkflowController } from './controllers/workflow.controller';
import { HistoricoController } from './controllers/historico.controller';

// Services (≤ 400 linhas cada)
import { OSService } from './services/os.service';
import { WorkflowService } from './services/workflow.service';
import { NotificacoesOSService } from './services/notificacoes-os.service';
import { IntegracaoService } from './services/integracao.service';

// Guards e Middleware
import { OSPermissionsGuard } from './guards/os-permissions.guard';
import { OSTenantIsolationMiddleware } from './middleware/os-tenant-isolation.middleware';

@Global()
@Module({
  imports: [
    ConfigModule, // Para acessar variáveis de ambiente
    PrismaModule, // Para acessar banco de dados
    // ✅ JWT Module próprio (conforme premissas de autenticação)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          process.env.NODE_ENV === 'production'
            ? (config.get<string>('JWT_SECRET') as string)
            : config.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [
    OSController,
    WorkflowController,
    HistoricoController,
  ],
  providers: [
    // Services principais
    OSService,
    WorkflowService,
    NotificacoesOSService,
    IntegracaoService,
    
    // Guards e segurança
    OSPermissionsGuard,
    
    // Configuração do módulo
    {
      provide: 'OS_MODULE_CONFIG',
      useFactory: () => ({
        moduleName: 'os',
        version: '1.0.0',
        isolated: true,
        multiTenant: true,
        description: 'Módulo de Ordens de Serviço com workflows configuráveis',
        features: [
          'workflows-configuráveis',
          'multi-tenant',
          'auditoria-completa',
          'integração-estoque',
          'notificações-tempo-real',
        ],
      }),
    },
  ],
  exports: [
    OSService,
    WorkflowService,
    NotificacoesOSService,
    IntegracaoService,
    OSPermissionsGuard,
    'OS_MODULE_CONFIG',
  ],
})
export class OSModule implements NestModule {
  constructor() {
    console.log(
      '✅ OSModule carregado - APIs REST ativas com isolamento total',
    );
  }

  configure(consumer: MiddlewareConsumer) {
    // Aplica middleware de isolamento tenant para todas as rotas do módulo
    consumer
      .apply(OSTenantIsolationMiddleware)
      .forRoutes(
        // Rotas com prefixo explícito 'api/os/*'
        { path: 'api/os/*', method: RequestMethod.ALL },
        // Rotas sem prefixo global (ex.: 'os/workflows')
        { path: 'os/*', method: RequestMethod.ALL },
      );
  }
}
