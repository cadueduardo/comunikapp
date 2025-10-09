import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ArteVersaoController } from './controllers/arte-versao.controller';
import { ArteArquivoController } from './controllers/arte-arquivo.controller';
import { ArteVersaoService } from './services/arte-versao.service';
import { ArteArquivoService } from './services/arte-arquivo.service';

@Module({
  imports: [
    PrismaModule
  ],
  controllers: [
    ArteVersaoController,
    ArteArquivoController
  ],
  providers: [
    ArteVersaoService,
    ArteArquivoService
  ],
  exports: [
    ArteVersaoService,
    ArteArquivoService
  ]
})
export class ArteAprovacaoModule {}
