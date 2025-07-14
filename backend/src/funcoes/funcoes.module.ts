import { Module } from '@nestjs/common';
import { FuncoesService } from './funcoes.service';
import { FuncoesController } from './funcoes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FuncoesController],
  providers: [FuncoesService],
})
export class FuncoesModule {} 