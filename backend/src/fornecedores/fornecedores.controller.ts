import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FornecedoresService } from './fornecedores.service';
import { CreateFornecedoreDto } from './dto/create-fornecedore.dto';
import { UpdateFornecedoreDto } from './dto/update-fornecedore.dto';
import { GetLoja } from '../auth/decorators';
import { Loja } from '@prisma/client';

@Controller('fornecedores')
export class FornecedoresController {
  constructor(private readonly fornecedoresService: FornecedoresService) {}

  @Post()
  create(@Body() createFornecedoreDto: CreateFornecedoreDto, @GetLoja() loja: Loja) {
    return this.fornecedoresService.create(createFornecedoreDto, loja);
  }

  @Get()
  findAll(@GetLoja() loja: Loja) {
    return this.fornecedoresService.findAll(loja);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() loja: Loja) {
    return this.fornecedoresService.findOne(id, loja);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFornecedoreDto: UpdateFornecedoreDto, @GetLoja() loja: Loja) {
    return this.fornecedoresService.update(id, updateFornecedoreDto, loja);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetLoja() loja: Loja) {
    return this.fornecedoresService.remove(id, loja);
  }
} 