import { Module } from '@nestjs/common';
import { CustosIndiretosService } from './custos-indiretos.service';
import { CustosIndiretosController } from './custos-indiretos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustosIndiretosController],
  providers: [CustosIndiretosService],
  exports: [CustosIndiretosService],
})
export class CustosIndiretosModule {} 