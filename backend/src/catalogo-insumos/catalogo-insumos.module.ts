import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CatalogoInsumosController } from './controllers/catalogo-insumos.controller';
import { CrawlerController } from './controllers/crawler.controller';
import { CatalogoInsumosService } from './services/catalogo-insumos.service';
import { CrawlerService } from './services/crawler.service';
import { SegmentClassifierService } from './services/segment-classifier.service';
import { CatalogoInsumosPrismaService } from './prisma/catalogo-insumos-prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env-catalogo-insumos',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    CatalogoInsumosController,
    CrawlerController,
  ],
  providers: [
    CatalogoInsumosService,
    CrawlerService,
    SegmentClassifierService,
    CatalogoInsumosPrismaService,
  ],
  exports: [
    CatalogoInsumosService,
    CrawlerService,
    SegmentClassifierService,
    CatalogoInsumosPrismaService,
  ],
})
export class CatalogoInsumosModule {}
