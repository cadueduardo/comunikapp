import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowTemplateController } from './controllers/workflow-template.controller';
import { EtapaController } from './controllers/etapa.controller';
import { ApontamentoController } from './controllers/apontamento.controller';
import { NotificacoesController } from './controllers/notificacoes.controller';
import { SetorProdutivoController } from './controllers/setor-produtivo.controller';
import { PCPKanbanController } from './controllers/pcp-kanban.controller';
import { WorkflowService } from './services/workflow.service';
import { EtapaService } from './services/etapa.service';
import { ApontamentoService } from './services/apontamento.service';
import { OSPCPIntegrationService } from './services/os-pcp-integration.service';
import { NotificacoesPCPService } from './services/notificacoes-pcp.service';
import { SetorProdutivoService } from './services/setor-produtivo.service';
import { PCPKanbanService } from './services/pcp-kanban.service';
import { ValidacaoEstoqueService } from '../orcamentos-v2/services/validacao-estoque.service';

@Module({
  imports: [PrismaModule, WebsocketsModule],
  controllers: [
    WorkflowController,
    WorkflowTemplateController,
    EtapaController,
    ApontamentoController,
    NotificacoesController,
    SetorProdutivoController,
    PCPKanbanController
  ],
  providers: [
    WorkflowService,
    EtapaService,
    ApontamentoService,
    OSPCPIntegrationService,
    NotificacoesPCPService,
    SetorProdutivoService,
    PCPKanbanService,
    ValidacaoEstoqueService
  ],
  exports: [
    WorkflowService,
    EtapaService,
    ApontamentoService,
    OSPCPIntegrationService,
    NotificacoesPCPService,
    SetorProdutivoService,
    PCPKanbanService,
    ValidacaoEstoqueService
  ]
})
export class PCPModule {}
