import { Module } from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { ProdutosController } from './produtos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OrcamentosModule } from '../orcamentos/orcamentos.module';
// import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, OrcamentosModule], // Temporariamente removido AuthModule
  controllers: [ProdutosController],
  providers: [ProdutosService],
  exports: [ProdutosService],
})
export class ProdutosModule {}
