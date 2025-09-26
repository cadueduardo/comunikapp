import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ServicosManuaisService } from './servicos-manuais.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetLoja } from '../auth/decorators';
import { loja } from '@prisma/client';

@Controller('servicos-manuais')
@UseGuards(JwtAuthGuard)
export class ServicosManuaisController {
  constructor(private readonly service: ServicosManuaisService) {}

  @Post()
  create(@Body() dto: any, @GetLoja() loja: loja) {
    return this.service.create(dto, loja);
  }

  @Get()
  findAll(@GetLoja() loja: loja) {
    return this.service.findAll(loja);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.service.findOne(id, loja);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @GetLoja() loja: loja) {
    return this.service.update(id, dto, loja);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.service.remove(id, loja);
  }
}














