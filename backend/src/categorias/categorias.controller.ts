import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { GetLoja } from '../auth/decorators';
import { Loja } from '@prisma/client';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  create(@Body() createCategoriaDto: CreateCategoriaDto, @GetLoja() loja: Loja) {
    return this.categoriasService.create(createCategoriaDto, loja);
  }

  @Get()
  findAll(@GetLoja() loja: Loja) {
    return this.categoriasService.findAll(loja);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() loja: Loja) {
    return this.categoriasService.findOne(id, loja);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoriaDto: UpdateCategoriaDto, @GetLoja() loja: Loja) {
    return this.categoriasService.update(id, updateCategoriaDto, loja);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetLoja() loja: Loja) {
    return this.categoriasService.remove(id, loja);
  }
} 