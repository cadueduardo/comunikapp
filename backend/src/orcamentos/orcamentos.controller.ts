import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { OrcamentosService } from './orcamentos.service';
import { CalcularOrcamentoDto } from './dto/calcular-orcamento.dto';
import { ResultadoCalculoDto } from './dto/resultado-calculo.dto';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';
import { CurrentLojaId } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orcamentos')
@UseGuards(JwtAuthGuard)
export class OrcamentosController {
  constructor(private readonly orcamentosService: OrcamentosService) {}

  /**
   * Endpoint para calcular um orçamento
   * Implementa a Tarefa 2.5 - Motor de Cálculo de Orçamento
   */
  @Post('calcular')
  async calcularOrcamento(
    @Body() dto: CalcularOrcamentoDto,
    @CurrentLojaId() lojaId: string
  ): Promise<ResultadoCalculoDto> {
    return this.orcamentosService.calcularOrcamento(dto, lojaId);
  }

  /**
   * CRUD Operations para Orçamentos
   * Implementa a Tarefa 2.6 - Módulo de Orçamento Rápido
   */

  @Post()
  async create(
    @Body() createOrcamentoDto: CreateOrcamentoDto,
    @CurrentLojaId() lojaId: string
  ) {
    return this.orcamentosService.create(createOrcamentoDto, lojaId);
  }

  @Get()
  async findAll(@CurrentLojaId() lojaId: string) {
    return this.orcamentosService.findAll(lojaId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentLojaId() lojaId: string
  ) {
    return this.orcamentosService.findOne(id, lojaId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrcamentoDto: UpdateOrcamentoDto,
    @CurrentLojaId() lojaId: string
  ) {
    return this.orcamentosService.update(id, updateOrcamentoDto, lojaId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentLojaId() lojaId: string
  ) {
    return this.orcamentosService.remove(id, lojaId);
  }
}
