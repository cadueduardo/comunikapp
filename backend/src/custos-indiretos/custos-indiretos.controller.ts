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
import { CurrentLojaId } from '../auth/decorators';

@Controller('custos-indiretos')
@UseGuards(JwtAuthGuard)
export class CustosIndiretosController {
  constructor(private readonly custosIndiretosService: CustosIndiretosService) {}

  @Post()
  create(
    @Body() createCustoIndiretoDto: CreateCustoIndiretoDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.custosIndiretosService.create(createCustoIndiretoDto, lojaId);
  }

  @Get()
  findAll(@CurrentLojaId() lojaId: string) {
    return this.custosIndiretosService.findAll(lojaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.custosIndiretosService.findOne(id, lojaId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustoIndiretoDto: UpdateCustoIndiretoDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.custosIndiretosService.update(id, updateCustoIndiretoDto, lojaId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.custosIndiretosService.remove(id, lojaId);
  }
} 