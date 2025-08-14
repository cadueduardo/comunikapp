import { Module } from '@nestjs/common';
import { FuncoesService } from './funcoes.service';
import { FuncoesController } from './funcoes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FuncoesController],
  providers: [FuncoesService],
})
export class FuncoesModule {}
