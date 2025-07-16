import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CustosIndiretosService } from './custos-indiretos.service';
import { CreateCustoIndiretoDto } from './dto/create-custo-indireto.dto';
import { UpdateCustoIndiretoDto } from './dto/update-custo-indireto.dto';
import { GetLoja } from '../auth/decorators';
import { Loja } from '@prisma/client';

@Controller('custos-indiretos')
export class CustosIndiretosController {
  constructor(private readonly custosIndiretosService: CustosIndiretosService) {}

  @Post()
  create(@Body() createCustoIndiretoDto: CreateCustoIndiretoDto, @GetLoja() loja: Loja) {
    return this.custosIndiretosService.create(createCustoIndiretoDto, loja);
  }

  @Get()
  findAll(@GetLoja() loja: Loja) {
    return this.custosIndiretosService.findAll(loja);
  }

  @Get('categoria/:categoria')
  findByCategoria(@Param('categoria') categoria: string, @GetLoja() loja: Loja) {
    return this.custosIndiretosService.getByCategoria(categoria, loja);
  }

  @Get('total-mensal')
  getTotalMensal(@GetLoja() loja: Loja) {
    return this.custosIndiretosService.getTotalMensal(loja);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() loja: Loja) {
    return this.custosIndiretosService.findOne(id, loja);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustoIndiretoDto: UpdateCustoIndiretoDto, @GetLoja() loja: Loja) {
    return this.custosIndiretosService.update(id, updateCustoIndiretoDto, loja);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetLoja() loja: Loja) {
    return this.custosIndiretosService.remove(id, loja);
  }
} 