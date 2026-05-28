import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LojaId } from '../../auth/loja-id.decorator';
import { ApontamentoService } from '../services/apontamento.service';
import {
  ApontamentoData,
  CreateApontamentoDto,
  UpdateApontamentoDto,
} from '../interfaces/pcp.interfaces';

@Controller('pcp/apontamentos')
@UseGuards(JwtAuthGuard)
export class ApontamentoController {
  constructor(private apontamentoService: ApontamentoService) {}

  @Post()
  async criarApontamento(
    @LojaId() lojaId: string,
    @Body() dto: CreateApontamentoDto,
  ) {
    return this.apontamentoService.criarApontamento(lojaId, dto);
  }

  @Get('os/:osId/resumo')
  async getResumoOS(@LojaId() lojaId: string, @Param('osId') osId: string) {
    const apontamentos = await this.apontamentoService.buscarPorOS(lojaId, osId);

    return {
      total_apontamentos: apontamentos.length,
      por_tipo: this.agruparPorTipo(apontamentos),
      ultimo_apontamento: apontamentos[0] || null,
      tempo_total_gasto: this.calcularTempoTotal(apontamentos),
      quantidade_total_produzida: this.calcularQuantidadeTotal(
        apontamentos,
        'quantidade_produzida',
      ),
      quantidade_total_refugo: this.calcularQuantidadeTotal(
        apontamentos,
        'quantidade_refugo',
      ),
    };
  }

  @Get('os/:osId')
  async buscarPorOS(@LojaId() lojaId: string, @Param('osId') osId: string) {
    return this.apontamentoService.buscarPorOS(lojaId, osId);
  }

  @Get('etapa/:etapaInstanciaId')
  async buscarPorEtapa(
    @LojaId() lojaId: string,
    @Param('etapaInstanciaId') etapaInstanciaId: string,
  ) {
    return this.apontamentoService.buscarPorEtapa(lojaId, etapaInstanciaId);
  }

  @Get(':id')
  async buscarPorId(@LojaId() lojaId: string, @Param('id') id: string) {
    return this.apontamentoService.buscarPorId(lojaId, id);
  }

  @Get()
  async listarApontamentos(
    @LojaId() lojaId: string,
    @Query()
    filtros: {
      os_id?: string;
      etapa_instancia_id?: string;
      tipo?: string;
      usuario_id?: string;
      data_inicio?: string;
      data_fim?: string;
    },
  ) {
    const filtrosProcessados = {
      ...filtros,
      data_inicio: filtros.data_inicio
        ? new Date(filtros.data_inicio)
        : undefined,
      data_fim: filtros.data_fim ? new Date(filtros.data_fim) : undefined,
    };

    return this.apontamentoService.listarApontamentos(
      lojaId,
      filtrosProcessados,
    );
  }

  @Put(':id')
  async atualizarApontamento(
    @LojaId() lojaId: string,
    @Param('id') id: string,
    @Body() dto: UpdateApontamentoDto,
  ) {
    return this.apontamentoService.atualizarApontamento(lojaId, id, dto);
  }

  @Delete(':id')
  async deletarApontamento(@LojaId() lojaId: string, @Param('id') id: string) {
    await this.apontamentoService.deletarApontamento(lojaId, id);
    return { message: 'Apontamento removido com sucesso' };
  }

  private agruparPorTipo(
    apontamentos: ApontamentoData[],
  ): Record<string, number> {
    return apontamentos.reduce<Record<string, number>>((acc, apontamento) => {
      acc[apontamento.tipo] = (acc[apontamento.tipo] || 0) + 1;
      return acc;
    }, {});
  }

  private calcularTempoTotal(apontamentos: ApontamentoData[]): number {
    return apontamentos.reduce(
      (total, apontamento) => total + (apontamento.tempo_gasto || 0),
      0,
    );
  }

  private calcularQuantidadeTotal(
    apontamentos: ApontamentoData[],
    campo: 'quantidade_produzida' | 'quantidade_refugo',
  ): number {
    return apontamentos.reduce(
      (total, apontamento) => total + (apontamento[campo] || 0),
      0,
    );
  }
}
