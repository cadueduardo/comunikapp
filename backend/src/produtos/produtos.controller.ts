import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { CalcularProdutoDto } from './dto/calcular-produto.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentLojaId } from '../auth/decorators';

@Controller('produtos')
@UseGuards(JwtAuthGuard)
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Post()
  create(
    @Body() createProdutoDto: CreateProdutoDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.produtosService.create(createProdutoDto, lojaId);
  }

  @Get()
  findAll(@CurrentLojaId() lojaId: string) {
    return this.produtosService.findAll(lojaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.produtosService.findOne(id, lojaId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProdutoDto: UpdateProdutoDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.produtosService.update(id, updateProdutoDto, lojaId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.produtosService.remove(id, lojaId);
  }

  @Post('calcular')
  calcular(
    @Body() calcularProdutoDto: CalcularProdutoDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.produtosService.calcularProduto(calcularProdutoDto, lojaId);
  }

  @Get(':id/carregar-para-orcamento')
  carregarParaOrcamento(
    @Param('id') id: string,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.produtosService.carregarTemplateParaOrcamento(id, lojaId);
  }
}
