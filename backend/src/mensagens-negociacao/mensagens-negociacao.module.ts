import { Module } from '@nestjs/common';
import { MensagensNegociacaoService } from './mensagens-negociacao.service';
import { MensagensNegociacaoController } from './mensagens-negociacao.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, NotificacoesModule, WebsocketsModule, AuthModule],
  controllers: [MensagensNegociacaoController],
  providers: [MensagensNegociacaoService],
  exports: [MensagensNegociacaoService],
})
export class MensagensNegociacaoModule {} 