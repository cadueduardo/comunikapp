import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TiposMaterialService } from './tipos-material.service';
import { CreateTipoMaterialDto } from './dto/create-tipo-material.dto';
import { UpdateTipoMaterialDto } from './dto/update-tipo-material.dto';
import { GetLoja } from '../auth/decorators';
import { Loja } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tipos-material')
@UseGuards(JwtAuthGuard)
export class TiposMaterialController {
  constructor(private readonly tiposMaterialService: TiposMaterialService) {}

  @Post()
  create(@Body() createTipoMaterialDto: CreateTipoMaterialDto, @GetLoja() loja: Loja) {
    return this.tiposMaterialService.create(createTipoMaterialDto, loja);
  }

  @Get()
  findAll(@GetLoja() loja: Loja) {
    return this.tiposMaterialService.findAll(loja);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() loja: Loja) {
    return this.tiposMaterialService.findOne(id, loja);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTipoMaterialDto: UpdateTipoMaterialDto, @GetLoja() loja: Loja) {
    return this.tiposMaterialService.update(id, updateTipoMaterialDto, loja);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetLoja() loja: Loja) {
    return this.tiposMaterialService.remove(id, loja);
  }
}
