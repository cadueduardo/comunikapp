import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConjuntosCamposController } from './conjuntos-campos/conjuntos-campos.controller';
import { ConjuntosCamposService } from './conjuntos-campos/conjuntos-campos.service';
import { EstampaArteMestraService } from './estampas/estampa-arte-mestra.service';
import { EstampasController } from './estampas/estampas.controller';
import { EstampasService } from './estampas/estampas.service';
import { ArteProducaoController } from './producao/arte-producao.controller';
import { ArteProducaoService } from './producao/arte-producao.service';
import { VdpPdfMergeProvider } from './producao/vdp-pdf-merge.provider';
import { ProcessoDecoracaoController } from './personalizacao/processo-decoracao.controller';
import { ProcessoDecoracaoService } from './personalizacao/processo-decoracao.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProcessoDecoracaoController,
    ConjuntosCamposController,
    EstampasController,
    ArteProducaoController,
  ],
  providers: [
    ProcessoDecoracaoService,
    ConjuntosCamposService,
    EstampasService,
    EstampaArteMestraService,
    ArteProducaoService,
    VdpPdfMergeProvider,
  ],
  exports: [
    ProcessoDecoracaoService,
    ConjuntosCamposService,
    EstampasService,
    EstampaArteMestraService,
    ArteProducaoService,
  ],
})
export class CatalogoModule {}
