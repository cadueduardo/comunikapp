import { Module } from '@nestjs/common';
import { CustosIndiretosController } from './custos-indiretos.controller';
import { CustosIndiretosService } from './custos-indiretos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustosIndiretosController],
  providers: [CustosIndiretosService],
  exports: [CustosIndiretosService],
})
export class CustosIndiretosModule {} 