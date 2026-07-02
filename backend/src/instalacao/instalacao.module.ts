import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HomeOperacionalModule } from '../home-operacional/home-operacional.module';
import { InstalacaoController } from './controllers/instalacao.controller';
import { InstaladorController } from './controllers/instalador.controller';
import { InstalacaoRelatorioController } from './controllers/instalacao-relatorio.controller';
import {
  InstalacaoAnexoController,
  InstaladorAnexoController,
} from './controllers/instalacao-anexo.controller';
import { InstalacaoAnexoService } from './services/instalacao-anexo.service';
import { ConfiguracaoInstalacaoService } from './services/configuracao-instalacao.service';
import { TaxaOcorrenciaLojaSeeder } from './seeders/taxa-ocorrencia-loja.seeder';
import { PcpBloqueioSinalService } from './services/pcp-bloqueio-sinal.service';
import { ItemOSInstalacaoCriacaoService } from './services/item-os-instalacao-criacao.service';
import { CepIntegrationService } from './services/cep-integration.service';
import { InstalacaoService } from './services/instalacao.service';
import { InstalacaoFechamentoService } from './services/instalacao-fechamento.service';
import { InstalacaoAgendaSyncService } from './services/instalacao-agenda-sync.service';
import { InstalacaoExecucaoSyncService } from './services/instalacao-execucao-sync.service';
import { InstalacaoPosCalculoService } from './services/instalacao-pos-calculo.service';
import { InstalacaoRelatorioPdfService } from './services/instalacao-relatorio-pdf.service';
import { InstalacaoSplitFiscalService } from './services/instalacao-split-fiscal.service';
import { InstalacaoSplitFinanceiroService } from './services/instalacao-split-financeiro.service';
import { StatusRollupService } from '../financeiro/services/status-rollup.service';
import { InstaladorPermissionsGuard } from './guards/instalador-permissions.guard';
import { InstalacaoGestaoPermissionsGuard } from './guards/instalacao-gestao-permissions.guard';
import { FinanceiroPermissionsGuard } from './guards/financeiro-permissions.guard';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => HomeOperacionalModule)],
  controllers: [
    InstaladorController,
    InstalacaoController,
    InstaladorAnexoController,
    InstalacaoAnexoController,
    InstalacaoRelatorioController,
  ],
  providers: [
    ConfiguracaoInstalacaoService,
    TaxaOcorrenciaLojaSeeder,
    PcpBloqueioSinalService,
    ItemOSInstalacaoCriacaoService,
    CepIntegrationService,
    InstalacaoService,
    InstalacaoFechamentoService,
    InstalacaoAgendaSyncService,
    InstalacaoExecucaoSyncService,
    InstalacaoPosCalculoService,
    InstalacaoAnexoService,
    InstalacaoRelatorioPdfService,
    InstalacaoSplitFiscalService,
    InstalacaoSplitFinanceiroService,
    // Provider puro (sem dependências) reutilizado do financeiro para a trava
    // financeira do grid — evita ciclo de módulos Instalacao ↔ Financeiro.
    StatusRollupService,
    InstaladorPermissionsGuard,
    InstalacaoGestaoPermissionsGuard,
    FinanceiroPermissionsGuard,
  ],
  exports: [
    ConfiguracaoInstalacaoService,
    TaxaOcorrenciaLojaSeeder,
    PcpBloqueioSinalService,
    ItemOSInstalacaoCriacaoService,
    InstalacaoPosCalculoService,
    InstalacaoSplitFinanceiroService,
    InstalacaoFechamentoService,
    InstalacaoAgendaSyncService,
    InstalacaoExecucaoSyncService,
    InstalacaoService,
  ],
})
export class InstalacaoModule {}
