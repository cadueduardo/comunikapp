import { Module } from '@nestjs/common';
import { MensagensNegociacaoService } from './mensagens-negociacao.service';
import { MensagensNegociacaoController } from './mensagens-negociacao.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [PrismaModule, NotificacoesModule],
  controllers: [MensagensNegociacaoController],
  providers: [MensagensNegociacaoService],
  exports: [MensagensNegociacaoService],
})
export class MensagensNegociacaoModule {} 