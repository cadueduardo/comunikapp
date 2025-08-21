import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CustosIndiretosService } from './custos-indiretos.service';
import { CreateCustoIndiretoDto } from './dto/create-custo-indireto.dto';
import { UpdateCustoIndiretoDto } from './dto/update-custo-indireto.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetLoja } from '../auth/decorators';
import { loja } from '@prisma/client';

@Controller('custos-indiretos')
@UseGuards(JwtAuthGuard)
export class CustosIndiretosController {
  constructor(
    private readonly custosIndiretosService: CustosIndiretosService,
  ) {}

  @Post()
  create(
    @Body() createCustoIndiretoDto: CreateCustoIndiretoDto,
    @GetLoja() loja: loja,
  ) {
    return this.custosIndiretosService.create(createCustoIndiretoDto, loja);
  }

  @Get()
  findAll(@GetLoja() loja: loja) {
    return this.custosIndiretosService.findAll(loja);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.custosIndiretosService.findOne(id, loja);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustoIndiretoDto: UpdateCustoIndiretoDto,
    @GetLoja() loja: loja,
  ) {
    return this.custosIndiretosService.update(
      id,
      updateCustoIndiretoDto,
      loja,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.custosIndiretosService.remove(id, loja);
  }
}
