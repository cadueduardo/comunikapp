import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LojasModule } from './lojas/lojas.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { ClientesModule } from './clientes/clientes.module';
import { CategoriasModule } from './categorias/categorias.module';
import { FornecedoresModule } from './fornecedores/fornecedores.module';
import { InsumosModule } from './insumos/insumos.module';
import { OrcamentosModule } from './orcamentos/orcamentos.module';
import { MaquinasModule } from './maquinas/maquinas.module';
import { FuncoesModule } from './funcoes/funcoes.module';
import { CustosIndiretosModule } from './custos-indiretos/custos-indiretos.module';
import { MensagensNegociacaoModule } from './mensagens-negociacao/mensagens-negociacao.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TiposMaterialModule } from './tipos-material/tipos-material.module';
import { ProdutosModule } from './produtos/produtos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    LojasModule,
    AuthModule,
    MailModule,
    ClientesModule,
    CategoriasModule,
    FornecedoresModule,
    InsumosModule,
    OrcamentosModule,
    MaquinasModule,
    FuncoesModule,
    CustosIndiretosModule,
    MensagensNegociacaoModule,
    NotificacoesModule,
    WebsocketsModule,
    TiposMaterialModule,
    ProdutosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
