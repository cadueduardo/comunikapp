import { Module } from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { ProdutosController } from './produtos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MotorCalculoV2Module } from '../motor-calculo-v2/motor-calculo-v2.module';

@Module({
  imports: [PrismaModule, MotorCalculoV2Module],
  controllers: [ProdutosController],
  providers: [ProdutosService],
  exports: [ProdutosService],
})
export class ProdutosModule {}
