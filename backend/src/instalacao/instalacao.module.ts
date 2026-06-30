import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InstalacaoController } from './controllers/instalacao.controller';
import { InstaladorController } from './controllers/instalador.controller';
import { ConfiguracaoInstalacaoService } from './services/configuracao-instalacao.service';
import { TaxaOcorrenciaLojaSeeder } from './seeders/taxa-ocorrencia-loja.seeder';
import { PcpBloqueioSinalService } from './services/pcp-bloqueio-sinal.service';
import { ItemOSInstalacaoCriacaoService } from './services/item-os-instalacao-criacao.service';
import { CepIntegrationService } from './services/cep-integration.service';
import { InstalacaoService } from './services/instalacao.service';
import { InstalacaoPosCalculoService } from './services/instalacao-pos-calculo.service';
import { InstaladorPermissionsGuard } from './guards/instalador-permissions.guard';
import { InstalacaoGestaoPermissionsGuard } from './guards/instalacao-gestao-permissions.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InstaladorController, InstalacaoController],
  providers: [
    ConfiguracaoInstalacaoService,
    TaxaOcorrenciaLojaSeeder,
    PcpBloqueioSinalService,
    ItemOSInstalacaoCriacaoService,
    CepIntegrationService,
    InstalacaoService,
    InstalacaoPosCalculoService,
    InstaladorPermissionsGuard,
    InstalacaoGestaoPermissionsGuard,
  ],
  exports: [
    ConfiguracaoInstalacaoService,
    TaxaOcorrenciaLojaSeeder,
    PcpBloqueioSinalService,
    ItemOSInstalacaoCriacaoService,
    InstalacaoPosCalculoService,
  ],
})
export class InstalacaoModule {}
