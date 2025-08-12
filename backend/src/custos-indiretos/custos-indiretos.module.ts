import { Module } from '@nestjs/common';
import { CustosIndiretosController } from './custos-indiretos.controller';
import { CustosIndiretosService } from './custos-indiretos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CustosIndiretosController],
  providers: [CustosIndiretosService],
  exports: [CustosIndiretosService],
})
export class CustosIndiretosModule {} 