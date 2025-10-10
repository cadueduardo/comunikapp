import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ArteVersaoController } from './controllers/arte-versao.controller';
import { ArteArquivoController } from './controllers/arte-arquivo.controller';
import { ArteLinkAprovacaoController } from './controllers/arte-link-aprovacao.controller';
import { ArteComentarioController } from './controllers/arte-comentario.controller';
import { ArteVersaoService } from './services/arte-versao.service';
import { ArteArquivoService } from './services/arte-arquivo.service';
import { ArteThumbnailService } from './services/arte-thumbnail.service';
import { ArteLinkAprovacaoService } from './services/arte-link-aprovacao.service';
import { ArteComentarioService } from './services/arte-comentario.service';

@Module({
  imports: [
    PrismaModule
  ],
  controllers: [
    ArteVersaoController,
    ArteArquivoController,
    ArteLinkAprovacaoController,
    ArteComentarioController
  ],
  providers: [
    ArteVersaoService,
    ArteArquivoService,
    ArteThumbnailService,
    ArteLinkAprovacaoService,
    ArteComentarioService
  ],
  exports: [
    ArteVersaoService,
    ArteArquivoService,
    ArteThumbnailService,
    ArteLinkAprovacaoService,
    ArteComentarioService
  ]
})
export class ArteAprovacaoModule {}
