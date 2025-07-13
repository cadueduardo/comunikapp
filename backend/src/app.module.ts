import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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
import { JwtAuthGuard } from './auth/jwt-auth.guard';

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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
