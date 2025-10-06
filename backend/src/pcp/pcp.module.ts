import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowTemplateController } from './controllers/workflow-template.controller';
import { EtapaController } from './controllers/etapa.controller';
import { ApontamentoController } from './controllers/apontamento.controller';
import { NotificacoesController } from './controllers/notificacoes.controller';
import { WorkflowService } from './services/workflow.service';
import { EtapaService } from './services/etapa.service';
import { ApontamentoService } from './services/apontamento.service';
import { OSPCPIntegrationService } from './services/os-pcp-integration.service';
import { NotificacoesPCPService } from './services/notificacoes-pcp.service';
import { ValidacaoEstoqueService } from '../orcamentos-v2/services/validacao-estoque.service';

@Module({
  imports: [PrismaModule, WebsocketsModule],
  controllers: [
    WorkflowController,
    WorkflowTemplateController,
    EtapaController,
    ApontamentoController,
    NotificacoesController
  ],
  providers: [
    WorkflowService,
    EtapaService,
    ApontamentoService,
    OSPCPIntegrationService,
    NotificacoesPCPService,
    ValidacaoEstoqueService
  ],
  exports: [
    WorkflowService,
    EtapaService,
    ApontamentoService,
    OSPCPIntegrationService,
    NotificacoesPCPService,
    ValidacaoEstoqueService
  ]
})
export class PCPModule {}
