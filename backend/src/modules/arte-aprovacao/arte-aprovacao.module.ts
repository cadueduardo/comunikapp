import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificacoesModule } from '../../notificacoes/notificacoes.module';
import { ArteVersaoController } from './controllers/arte-versao.controller';
import { ArteArquivoController } from './controllers/arte-arquivo.controller';
import { ArteLinkAprovacaoController } from './controllers/arte-link-aprovacao.controller';
import { ArteNotificacaoController } from './controllers/arte-notificacao.controller';
import { ArteMensagemController } from './controllers/arte-mensagem.controller';
import { ArteMensagemPublicController } from './controllers/arte-mensagem-public.controller';
import { ArteVersaoService } from './services/arte-versao.service';
import { ArteArquivoService } from './services/arte-arquivo.service';
import { ArteThumbnailService } from './services/arte-thumbnail.service';
import { ArteLinkAprovacaoService } from './services/arte-link-aprovacao.service';
import { ArteNotificacaoService } from './services/arte-notificacao.service';
import { ArteMensagemService } from './services/arte-mensagem.service';
import { ArteWebSocketGateway } from './gateways/arte-websocket.gateway';

@Module({
  imports: [
    PrismaModule,
    NotificacoesModule,
    // JwtModule próprio para o módulo (seguindo premissas)
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'arte-aprovacao-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [
    ArteVersaoController,
    ArteArquivoController,
    ArteLinkAprovacaoController,
    ArteNotificacaoController,
    ArteMensagemController,
    ArteMensagemPublicController,
  ],
  providers: [
    ArteVersaoService,
    ArteArquivoService,
    ArteThumbnailService,
    ArteLinkAprovacaoService,
    ArteNotificacaoService,
    ArteMensagemService,
    ArteWebSocketGateway,
  ],
  exports: [
    ArteVersaoService,
    ArteArquivoService,
    ArteThumbnailService,
    ArteLinkAprovacaoService,
    ArteNotificacaoService,
    ArteMensagemService,
    ArteWebSocketGateway,
  ],
})
export class ArteAprovacaoModule {}
