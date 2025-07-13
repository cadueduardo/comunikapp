import { Module } from '@nestjs/common';
import { MaquinasService } from './maquinas.service';
import { MaquinasController } from './maquinas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MaquinasController],
  providers: [MaquinasService],
  exports: [MaquinasService],
})
export class MaquinasModule {} 