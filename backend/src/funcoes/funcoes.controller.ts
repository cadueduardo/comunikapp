import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { FuncoesService } from './funcoes.service';
import { CreateFuncaoDto } from './dto/create-funcao.dto';
import { UpdateFuncaoDto } from './dto/update-funcao.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('funcoes')
export class FuncoesController {
  constructor(private readonly funcoesService: FuncoesService) {}

  @Post()
  create(@Body() createFuncaoDto: CreateFuncaoDto, @Request() req) {
    return this.funcoesService.create(createFuncaoDto, req.user.loja_id);
  }

  @Get()
  findAll(@Request() req) {
    return this.funcoesService.findAll(req.user.loja_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.funcoesService.findOne(id, req.user.loja_id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFuncaoDto: UpdateFuncaoDto, @Request() req) {
    return this.funcoesService.update(id, updateFuncaoDto, req.user.loja_id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.funcoesService.remove(id, req.user.loja_id);
  }
} 