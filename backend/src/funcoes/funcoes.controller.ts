import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FuncoesService } from './funcoes.service';
import { CreateFuncaoDto } from './dto/create-funcao.dto';
import { UpdateFuncaoDto } from './dto/update-funcao.dto';
import { GetLoja } from '../auth/decorators';
import { loja } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('funcoes')
export class FuncoesController {
  constructor(private readonly funcoesService: FuncoesService) {}

  @Post()
  create(@Body() createFuncaoDto: CreateFuncaoDto, @GetLoja() loja: loja) {
    return this.funcoesService.create(createFuncaoDto, loja);
  }

  @Get()
  findAll(@GetLoja() loja: loja) {
    return this.funcoesService.findAll(loja);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.funcoesService.findOne(id, loja);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFuncaoDto: UpdateFuncaoDto,
    @GetLoja() loja: loja,
  ) {
    return this.funcoesService.update(id, updateFuncaoDto, loja);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.funcoesService.remove(id, loja);
  }
}
