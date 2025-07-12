import { Controller, Post, Body } from '@nestjs/common';
import { OrcamentosService } from './orcamentos.service';
import { CalcularOrcamentoDto } from './dto/calcular-orcamento.dto';
import { ResultadoCalculoDto } from './dto/resultado-calculo.dto';
import { CurrentLojaId } from '../auth/decorators';

@Controller('orcamentos')
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
}
