import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './insumos/dto/create-insumo.dto';
import { UpdateInsumoDto } from './insumos/dto/update-insumo.dto';
import { CurrentLojaId } from './auth/decorators';

@Controller('insumos')
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  @Post()
  create(@Body() createInsumoDto: CreateInsumoDto, @CurrentLojaId() lojaId: string) {
    return this.insumosService.create(createInsumoDto, lojaId);
  }

  @Get()
  findAll(@CurrentLojaId() lojaId: string) {
    return this.insumosService.findAll(lojaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.insumosService.findOne(id, lojaId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateInsumoDto: UpdateInsumoDto, @CurrentLojaId() lojaId: string) {
    return this.insumosService.update(id, updateInsumoDto, lojaId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.insumosService.remove(id, lojaId);
  }
}
