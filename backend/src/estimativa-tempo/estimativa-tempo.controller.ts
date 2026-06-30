import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentLojaId } from '../auth/decorators';
import { EstimativaTempoService } from './services/estimativa-tempo.service';
import { CompatibilidadeMaterialMaquinaService } from './services/compatibilidade-material-maquina.service';
import { CalcularTempoMaquinaDto } from './dto/calcular-tempo-maquina.dto';
import { VerificarCompatibilidadeDto } from './dto/verificar-compatibilidade.dto';

/**
 * Endpoints leves usados pelo formulário de orçamento para:
 * - estimar tempo de produção em cada máquina selecionada;
 * - verificar compatibilidade material × máquina antes de salvar.
 *
 * Não escreve no banco; apenas cálculo a partir de cadastros existentes.
 */
@Controller('estimativa-tempo')
@UseGuards(JwtAuthGuard)
export class EstimativaTempoController {
  constructor(
    private readonly estimativaService: EstimativaTempoService,
    private readonly compatibilidadeService: CompatibilidadeMaterialMaquinaService,
  ) {}

  @Post('maquina')
  async estimarMaquina(
    @CurrentLojaId() lojaId: string,
    @Body() dto: CalcularTempoMaquinaDto,
  ) {
    const data = await this.estimativaService.estimarMaquina(lojaId, dto);
    return { data };
  }

  @Post('compatibilidade-material-maquina')
  async verificarCompatibilidade(
    @CurrentLojaId() lojaId: string,
    @Body() dto: VerificarCompatibilidadeDto,
  ) {
    const data = await this.compatibilidadeService.verificar(
      lojaId,
      dto.insumo_id,
      dto.maquina_id,
    );
    return { data };
  }
}
