/**
 * Controller para Cálculo Inteligente de Materiais
 * Expõe endpoints para calcular materiais por unidade de produção
 */

import { Controller, Get, Post, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CalculoMaterialUnidadeService } from '../services/calculo-material-unidade.service';

@ApiTags('OS - Cálculo de Materiais')
@ApiBearerAuth()
@Controller('os/calculo-material')
@UseGuards(JwtAuthGuard)
export class CalculoMaterialController {
  constructor(private readonly calculoMaterialService: CalculoMaterialUnidadeService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Calcular materiais necessários para uma OS' })
  @ApiParam({ name: 'id', description: 'ID da OS' })
  async calcularMateriais(@Param('id') osId: string) {
    return await this.calculoMaterialService.calcularMateriaisOS(osId);
  }

  @Get('config/desperdicio')
  @ApiOperation({ summary: 'Obter configurações de desperdício padrão' })
  async getDesperdicioPadrao() {
    return await this.calculoMaterialService.getDesperdicioPadrao();
  }

  @Get('config/dimensoes')
  @ApiOperation({ summary: 'Obter dimensões padrão de unidades de compra' })
  async getDimensoesPadrao() {
    return await this.calculoMaterialService.getDimensoesPadrao();
  }
}






