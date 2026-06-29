import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificacoesModule } from '../../notificacoes/notificacoes.module';
import { getRequiredJwtSecret } from '../../auth/jwt-secret';
import { ArteVersaoController } from './controllers/arte-versao.controller';
import { ArteArquivoController } from './controllers/arte-arquivo.controller';
import { ArteLinkAprovacaoController } from './controllers/arte-link-aprovacao.controller';
import { ArteNotificacaoController } from './controllers/arte-notificacao.controller';
import { ArteMensagemController } from './controllers/arte-mensagem.controller';
import { ArteMensagemPublicController } from './controllers/arte-mensagem-public.controller';
import { ArteConfiguracaoController } from './controllers/arte-configuracao.controller';
import { ArteFilaController } from './controllers/arte-fila.controller';
import { ArteOsContextoController } from './controllers/arte-os-contexto.controller';
import { ArteOrcamentoController } from './controllers/arte-orcamento.controller';
import { ArteVersaoService } from './services/arte-versao.service';
import { ArteArquivoService } from './services/arte-arquivo.service';
import { ArteThumbnailService } from './services/arte-thumbnail.service';
import { ArteLinkAprovacaoService } from './services/arte-link-aprovacao.service';
import { ArteNotificacaoService } from './services/arte-notificacao.service';
import { ArteMensagemService } from './services/arte-mensagem.service';
import { ArteWebSocketGateway } from './gateways/arte-websocket.gateway';
import { ConfiguracaoArteService } from './services/configuracao-arte.service';
import { ArteOrcamentoInjecaoService } from './services/arte-orcamento-injecao.service';
import { ArteFilaService } from './services/arte-fila.service';
import { ArteFilaTransicaoService } from './services/arte-fila-transicao.service';

@Module({
  imports: [
    PrismaModule,
    NotificacoesModule,
    // JwtModule próprio para o módulo (seguindo premissas)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: getRequiredJwtSecret(configService),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [
    ArteVersaoController,
    ArteArquivoController,
    ArteLinkAprovacaoController,
    ArteNotificacaoController,
    ArteMensagemController,
    ArteMensagemPublicController,
    ArteConfiguracaoController,
    ArteFilaController,
    ArteOsContextoController,
    ArteOrcamentoController,
  ],
  providers: [
    ArteVersaoService,
    ArteArquivoService,
    ArteThumbnailService,
    ArteLinkAprovacaoService,
    ArteNotificacaoService,
    ArteMensagemService,
    ArteWebSocketGateway,
    ConfiguracaoArteService,
    ArteOrcamentoInjecaoService,
    ArteFilaService,
    ArteFilaTransicaoService,
  ],
  exports: [
    ArteVersaoService,
    ArteArquivoService,
    ArteThumbnailService,
    ArteLinkAprovacaoService,
    ArteNotificacaoService,
    ArteMensagemService,
    ArteWebSocketGateway,
    ConfiguracaoArteService,
    ArteOrcamentoInjecaoService,
    ArteFilaService,
    ArteFilaTransicaoService,
  ],
})
export class ArteAprovacaoModule {}
