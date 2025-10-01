import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApontamentoService } from '../services/apontamento.service';
import { CreateApontamentoDto, UpdateApontamentoDto } from '../interfaces/pcp.interfaces';

@Controller('pcp/apontamentos')
@UseGuards(JwtAuthGuard)
export class ApontamentoController {
  constructor(private apontamentoService: ApontamentoService) {}

  @Post()
  async criarApontamento(@Body() dto: CreateApontamentoDto) {
    return this.apontamentoService.criarApontamento(dto);
  }

  @Get('os/:osId')
  async buscarPorOS(@Param('osId') osId: string) {
    return this.apontamentoService.buscarPorOS(osId);
  }

  @Get('etapa/:etapaInstanciaId')
  async buscarPorEtapa(@Param('etapaInstanciaId') etapaInstanciaId: string) {
    return this.apontamentoService.buscarPorEtapa(etapaInstanciaId);
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return this.apontamentoService.buscarPorId(id);
  }

  @Get()
  async listarApontamentos(@Query() filtros: {
    os_id?: string;
    etapa_instancia_id?: string;
    tipo?: string;
    usuario_id?: string;
    data_inicio?: string;
    data_fim?: string;
  }) {
    const filtrosProcessados = {
      ...filtros,
      data_inicio: filtros.data_inicio ? new Date(filtros.data_inicio) : undefined,
      data_fim: filtros.data_fim ? new Date(filtros.data_fim) : undefined
    };

    return this.apontamentoService.listarApontamentos(filtrosProcessados);
  }

  @Put(':id')
  async atualizarApontamento(
    @Param('id') id: string,
    @Body() dto: UpdateApontamentoDto
  ) {
    return this.apontamentoService.atualizarApontamento(id, dto);
  }

  @Delete(':id')
  async deletarApontamento(@Param('id') id: string) {
    await this.apontamentoService.deletarApontamento(id);
    return { message: 'Apontamento removido com sucesso' };
  }

  @Get('os/:osId/resumo')
  async getResumoOS(@Param('osId') osId: string) {
    const apontamentos = await this.apontamentoService.buscarPorOS(osId);
    
    const resumo = {
      total_apontamentos: apontamentos.length,
      por_tipo: this.agruparPorTipo(apontamentos),
      ultimo_apontamento: apontamentos[0] || null,
      tempo_total_gasto: this.calcularTempoTotal(apontamentos),
      quantidade_total_produzida: this.calcularQuantidadeTotal(apontamentos, 'quantidade_produzida'),
      quantidade_total_refugo: this.calcularQuantidadeTotal(apontamentos, 'quantidade_refugo')
    };

    return resumo;
  }

  private agruparPorTipo(apontamentos: any[]): Record<string, number> {
    return apontamentos.reduce((acc, apontamento) => {
      acc[apontamento.tipo] = (acc[apontamento.tipo] || 0) + 1;
      return acc;
    }, {});
  }

  private calcularTempoTotal(apontamentos: any[]): number {
    return apontamentos.reduce((total, apontamento) => {
      return total + (apontamento.tempo_gasto || 0);
    }, 0);
  }

  private calcularQuantidadeTotal(apontamentos: any[], campo: string): number {
    return apontamentos.reduce((total, apontamento) => {
      return total + (apontamento[campo] || 0);
    }, 0);
  }
}
