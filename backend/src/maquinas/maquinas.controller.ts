import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MaquinasService } from './maquinas.service';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { UpdateMaquinaDto } from './dto/update-maquina.dto';
import { GetLoja } from '../auth/decorators';
import { Loja } from '@prisma/client';

@Controller('maquinas')
export class MaquinasController {
  constructor(private readonly maquinasService: MaquinasService) {}

  @Post()
  create(@Body() createMaquinaDto: CreateMaquinaDto, @GetLoja() loja: Loja) {
    console.log('Dados recebidos no controller:', createMaquinaDto);
    console.log('Tipo de custo_hora:', typeof createMaquinaDto.custo_hora);
    return this.maquinasService.create(createMaquinaDto, loja);
  }

  @Get()
  findAll(@GetLoja() loja: Loja) {
    return this.maquinasService.findAll(loja);
  }

  @Get('tipo/:tipo')
  findByTipo(@Param('tipo') tipo: string, @GetLoja() loja: Loja) {
    return this.maquinasService.findByTipo(tipo, loja);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() loja: Loja) {
    return this.maquinasService.findOne(id, loja);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMaquinaDto: UpdateMaquinaDto, @GetLoja() loja: Loja) {
    return this.maquinasService.update(id, updateMaquinaDto, loja);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetLoja() loja: Loja) {
    return this.maquinasService.remove(id, loja);
  }
} 