import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceiroModule } from '../financeiro/financeiro.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { ProdutosModule } from '../produtos/produtos.module';
import { HomeOperacionalModule } from '../home-operacional/home-operacional.module';
import { ExpedicaoController } from './controllers/expedicao.controller';
import { ExpedicaoAssinaturaController } from './controllers/expedicao-assinatura.controller';
import { ExpedicaoFinanceiroService } from './services/expedicao-financeiro.service';
import { ExpedicaoCriacaoService } from './services/expedicao-criacao.service';
import { ExpedicaoDevolucaoService } from './services/expedicao-devolucao.service';
import { ExpedicaoKanbanService } from './services/expedicao-kanban.service';
import { ExpedicaoService } from './services/expedicao.service';
import { ExpedicaoNotificacaoService } from './services/expedicao-notificacao.service';
import { ExpedicaoModalidadeMapper } from './services/expedicao-modalidade.mapper';
import { ExpedicaoPermissionsGuard } from './guards/expedicao-permissions.guard';
import { ExpedicaoAssinaturaService } from './services/expedicao-assinatura.service';
import { ExpedicaoTemplateService } from './services/expedicao-template.service';

/**
 * Módulo de Expedição e Pós-Produção (Fase 2).
 */
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FinanceiroModule,
    WebsocketsModule,
    ProdutosModule,
    HomeOperacionalModule,
  ],
  controllers: [ExpedicaoController, ExpedicaoAssinaturaController],
  providers: [
    ExpedicaoFinanceiroService,
    ExpedicaoCriacaoService,
    ExpedicaoDevolucaoService,
    ExpedicaoKanbanService,
    ExpedicaoService,
    ExpedicaoNotificacaoService,
    ExpedicaoModalidadeMapper,
    ExpedicaoAssinaturaService,
    ExpedicaoTemplateService,
    ExpedicaoPermissionsGuard,
  ],
  exports: [
    ExpedicaoFinanceiroService,
    ExpedicaoCriacaoService,
    ExpedicaoDevolucaoService,
    ExpedicaoKanbanService,
    ExpedicaoService,
    ExpedicaoPermissionsGuard,
  ],
})
export class ExpedicaoModule {}
