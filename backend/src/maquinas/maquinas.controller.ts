import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MaquinasService } from './maquinas.service';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { UpdateMaquinaDto } from './dto/update-maquina.dto';
import { GetLoja } from '../auth/decorators';
import { loja } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('maquinas')
@UseGuards(JwtAuthGuard)
export class MaquinasController {
  constructor(private readonly maquinasService: MaquinasService) {}

  @Post()
  create(@Body() createMaquinaDto: CreateMaquinaDto, @GetLoja() loja: loja) {
    return this.maquinasService.create(createMaquinaDto, loja);
  }

  @Get()
  findAll(@GetLoja() loja: loja) {
    return this.maquinasService.findAll(loja);
  }

  @Get('tipo/:tipo')
  findByTipo(@Param('tipo') tipo: string, @GetLoja() loja: loja) {
    return this.maquinasService.findByTipo(tipo, loja);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.maquinasService.findOne(id, loja);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMaquinaDto: UpdateMaquinaDto,
    @GetLoja() loja: loja,
  ) {
    return this.maquinasService.update(id, updateMaquinaDto, loja);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.maquinasService.remove(id, loja);
  }
}
