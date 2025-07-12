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
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { OrcamentosModule } from './orcamentos/orcamentos.module';

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
    OrcamentosModule,
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
