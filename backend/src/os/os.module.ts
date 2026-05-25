/**
 * Modulo principal de OS (Ordens de Servico)
 * Implementa arquitetura modular plugavel conforme premissas
 * Isolamento total com outros modulos, multi-tenant
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
import { DocumentosModule } from '../documentos/documentos.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { PCPModule } from '../pcp/pcp.module';
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module';
import { ValidacaoEstoqueService } from '../orcamentos-v2/services/validacao-estoque.service';
import { getRequiredJwtSecret } from '../auth/jwt-secret';

// Controllers (<= 200 linhas cada)
import { OSController } from './controllers/os.controller';
import { ImpressaoOSController } from './controllers/impressao-os.controller';
import { WorkflowController } from './controllers/workflow.controller';
import { OSDiretaInternaController } from './controllers/os-direta-interna.controller';
import { AprovacaoAlcadaController } from './controllers/aprovacao-alcada.controller';
import { WorkflowInstanciaController } from './controllers/workflow-instancia.controller';
import { AprovacaoTecnicaController } from './controllers/aprovacao-tecnica.controller';
import { WorkflowComercialController } from './controllers/workflow-comercial.controller';
import { WorkflowInternoController } from './controllers/workflow-interno.controller';
import { LiberacaoPCPController } from './controllers/liberacao-pcp.controller';
import { AlcadasOrcamentoController } from './controllers/alcadas-orcamento.controller';
import { CentroCustoController } from './controllers/centro-custo.controller';
import { OSValidacoesController } from './controllers/os-validacoes.controller';
import { CalculoMaterialController } from './controllers/calculo-material.controller';
import { DebugValidacoesController } from './controllers/debug-validacoes.controller';
import { TestOSValidacoesController } from './controllers/test-os-validacoes.controller';
import { OSPrazoController } from './controllers/os-prazo.controller';
import { OSProdutoPrazoController } from './controllers/os-produto-prazo.controller';
import { OSAdminController } from './controllers/os-admin.controller';
// import { HistoricoController } from './controllers/historico.controller'; // TODO: Implementar

// Services (<= 400 linhas cada)
import { OSService } from './services/os.service';
import { ImpressaoOSService } from './services/impressao-os.service';
import { WorkflowService } from './services/workflow.service';
import { AprovacaoAlcadaService } from './services/aprovacao-alcada.service';
import { WorkflowInstanciaService } from './services/workflow-instancia.service';
import { EstoqueApontamentoService } from './services/estoque-apontamento.service';
import { AprovacaoTecnicaService } from './services/aprovacao-tecnica.service';
import { AlcadasOrcamentoService } from './services/alcadas-orcamento.service';
import { CentroCustoService } from './services/centro-custo.service';
import { EventosAutomaticosService } from './services/eventos-automaticos.service';
import { OSApprovalPermissionsService } from './services/os-approval-permissions.service';
import { OSValidacoesService } from './services/os-validacoes.service';
import { CalculoMaterialUnidadeService } from './services/calculo-material-unidade.service';
import { OSPrazoService } from './services/os-prazo.service';
import { OSProdutoPrazoService } from './services/os-produto-prazo.service';
import { OSAdminService } from './services/os-admin.service';
import { CorrecaoMateriaisHelper } from './helpers/correcao-materiais.helper';
// import { NotificacoesOSService } from './services/notificacoes-os.service'; // TODO: Implementar
// import { IntegracaoService } from './services/integracao.service'; // TODO: Implementar

// Guards e Middleware
import { OSPermissionsGuard } from './guards/os-permissions.guard';
import { OSTenantIsolationMiddleware } from './middleware/os-tenant-isolation.middleware';

@Global()
@Module({
  imports: [
    ConfigModule, // Para acessar variaveis de ambiente
    DocumentosModule, // Fornece DocumentCodeService compartilhado
    PrismaModule, // Para acessar banco de dados
    WebsocketsModule, // Para eventos automáticos
    PCPModule, // Para integração OS ↔ PCP
    ConfiguracoesModule, // Para validações automáticas
    // JWT Module proprio (conforme premissas de autenticacao)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: getRequiredJwtSecret(config),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [
    OSController,
    ImpressaoOSController,
    WorkflowController,
    OSDiretaInternaController,
    AprovacaoAlcadaController,
    WorkflowInstanciaController,
    AprovacaoTecnicaController,
    WorkflowComercialController,
    WorkflowInternoController,
    LiberacaoPCPController,
    AlcadasOrcamentoController,
    CentroCustoController,
    OSValidacoesController,
    CalculoMaterialController,
    DebugValidacoesController,
    TestOSValidacoesController,
    OSPrazoController,
    OSProdutoPrazoController,
    OSAdminController,
    // HistoricoController, // TODO: Implementar
  ],
  providers: [
    // Services principais
    OSService,
    ImpressaoOSService,
    WorkflowService,
    AprovacaoAlcadaService,
    WorkflowInstanciaService,
    EstoqueApontamentoService,
    AprovacaoTecnicaService,
    AlcadasOrcamentoService,
    CentroCustoService,
    ValidacaoEstoqueService,
    EventosAutomaticosService,
    OSApprovalPermissionsService,
    OSValidacoesService,
    CalculoMaterialUnidadeService,
    OSPrazoService,
    OSProdutoPrazoService,
    OSAdminService,
    CorrecaoMateriaisHelper,
    // NotificacoesOSService, // TODO: Implementar
    // IntegracaoService, // TODO: Implementar

    // Guards e seguranca
    OSPermissionsGuard,

    // Configuracao do modulo
    {
      provide: 'OS_MODULE_CONFIG',
      useFactory: () => ({
        moduleName: 'os',
        version: '1.0.0',
        isolated: true,
        multiTenant: true,
        description: 'Modulo de Ordens de Servico com workflows configuraveis',
        features: [
          'workflows-configuraveis',
          'multi-tenant',
          'auditoria-completa',
          'integracao-estoque',
          'notificacoes-tempo-real',
        ],
      }),
    },
  ],
  exports: [
    OSService,
    ImpressaoOSService,
    WorkflowService,
    AprovacaoAlcadaService,
    WorkflowInstanciaService,
    EstoqueApontamentoService,
    AprovacaoTecnicaService,
    AlcadasOrcamentoService,
    CentroCustoService,
    ValidacaoEstoqueService,
    EventosAutomaticosService,
    OSValidacoesService,
    CalculoMaterialUnidadeService,
    OSPrazoService,
    OSProdutoPrazoService,
    // NotificacoesOSService, // TODO: Implementar
    // IntegracaoService, // TODO: Implementar
    OSPermissionsGuard,
    'OS_MODULE_CONFIG',
  ],
})
export class OSModule implements NestModule {
  constructor() {
    console.log(
      '[OK] OSModule carregado - APIs REST ativas com isolamento total',
    );
  }

  configure(consumer: MiddlewareConsumer) {
    // Middleware de isolamento tenant removido - usando apenas JWT global + guards
    // O JWT global ja aplica autenticacao para todas as rotas
    // Os guards especificos do OS (OSPermissionsGuard) fazem a validacao granular
  }
}
