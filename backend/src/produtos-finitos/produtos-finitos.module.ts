import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProdutoFinitoImagemService } from './produto-finito-imagem.service';
import { ProdutosFinitosController } from './produtos-finitos.controller';
import { ProdutosFinitosService } from './produtos-finitos.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProdutosFinitosController],
  providers: [ProdutosFinitosService, ProdutoFinitoImagemService],
  exports: [ProdutosFinitosService, ProdutoFinitoImagemService],
})
export class ProdutosFinitosModule {}
