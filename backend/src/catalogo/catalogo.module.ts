import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConjuntosCamposController } from './conjuntos-campos/conjuntos-campos.controller';
import { ConjuntosCamposService } from './conjuntos-campos/conjuntos-campos.service';
import { EstampaArteMestraService } from './estampas/estampa-arte-mestra.service';
import { EstampasController } from './estampas/estampas.controller';
import { EstampasService } from './estampas/estampas.service';
import { ProcessoDecoracaoController } from './personalizacao/processo-decoracao.controller';
import { ProcessoDecoracaoService } from './personalizacao/processo-decoracao.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProcessoDecoracaoController,
    ConjuntosCamposController,
    EstampasController,
  ],
  providers: [
    ProcessoDecoracaoService,
    ConjuntosCamposService,
    EstampasService,
    EstampaArteMestraService,
  ],
  exports: [
    ProcessoDecoracaoService,
    ConjuntosCamposService,
    EstampasService,
    EstampaArteMestraService,
  ],
})
export class CatalogoModule {}
