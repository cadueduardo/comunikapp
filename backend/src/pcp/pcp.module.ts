import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowTemplateController } from './controllers/workflow-template.controller';
import { EtapaController } from './controllers/etapa.controller';
import { ApontamentoController } from './controllers/apontamento.controller';
import { NotificacoesController } from './controllers/notificacoes.controller';
import { PCPKanbanController } from './controllers/pcp-kanban.controller';
import { PCPConfiguracaoController } from './controllers/pcp-configuracao.controller';
import { PCPDashboardController } from './controllers/pcp-dashboard.controller';
import { PCPCapacidadeController } from './controllers/pcp-capacidade.controller';
import { PCPRelatoriosController } from './controllers/pcp-relatorios.controller';
import { WorkflowService } from './services/workflow.service';
import { WorkflowAssignmentService } from './services/workflow-assignment.service';
import { EtapaService } from './services/etapa.service';
import { ApontamentoService } from './services/apontamento.service';
import { OSPCPIntegrationService } from './services/os-pcp-integration.service';
import { NotificacoesPCPService } from './services/notificacoes-pcp.service';
import { PCPKanbanService } from './services/pcp-kanban.service';
import { PCPConfiguracaoService } from './services/pcp-configuracao.service';
import { PCPDashboardService } from './services/pcp-dashboard.service';
import { PCPCapacidadeService } from './services/pcp-capacidade.service';
import { PCPRelatoriosService } from './services/pcp-relatorios.service';
import { ValidacaoEstoqueService } from '../orcamentos-v2/services/validacao-estoque.service';
import { ExpedicaoModule } from '../expedicao/expedicao.module';
import { InstalacaoModule } from '../instalacao/instalacao.module';
import { HomeOperacionalModule } from '../home-operacional/home-operacional.module';

@Module({
  imports: [
    PrismaModule,
    WebsocketsModule,
    ConfiguracoesModule,
    ExpedicaoModule,
    InstalacaoModule,
    HomeOperacionalModule,
  ],
  controllers: [
    WorkflowController,
    WorkflowTemplateController,
    EtapaController,
    ApontamentoController,
    NotificacoesController,
    PCPKanbanController,
    PCPConfiguracaoController,
    PCPDashboardController,
    PCPCapacidadeController,
    PCPRelatoriosController,
  ],
  providers: [
    WorkflowService,
    WorkflowAssignmentService,
    EtapaService,
    ApontamentoService,
    OSPCPIntegrationService,
    NotificacoesPCPService,
    PCPKanbanService,
    PCPConfiguracaoService,
    PCPDashboardService,
    PCPCapacidadeService,
    PCPRelatoriosService,
    ValidacaoEstoqueService,
  ],
  exports: [
    WorkflowService,
    WorkflowAssignmentService,
    EtapaService,
    ApontamentoService,
    OSPCPIntegrationService,
    NotificacoesPCPService,
    PCPKanbanService,
    PCPConfiguracaoService,
    PCPDashboardService,
    PCPCapacidadeService,
    PCPRelatoriosService,
    ValidacaoEstoqueService,
  ],
})
export class PCPModule {}
