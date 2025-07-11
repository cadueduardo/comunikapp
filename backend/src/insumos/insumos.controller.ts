import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { GetLoja } from '../auth/decorators';
import { Loja } from '@prisma/client';

@Controller('insumos')
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  @Post()
  create(@Body() createInsumoDto: CreateInsumoDto, @GetLoja() loja: Loja) {
    return this.insumosService.create(createInsumoDto, loja);
  }

  @Get()
  findAll(@GetLoja() loja: Loja) {
    return this.insumosService.findAll(loja);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() loja: Loja) {
    return this.insumosService.findOne(id, loja);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInsumoDto: UpdateInsumoDto, @GetLoja() loja: Loja) {
    return this.insumosService.update(id, updateInsumoDto, loja);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetLoja() loja: Loja) {
    return this.insumosService.remove(id, loja);
  }
} 