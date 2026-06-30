import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LojaId } from '../../auth/loja-id.decorator';
import { PCPRelatoriosService } from '../services/pcp-relatorios.service';

@ApiTags('PCP - Relatórios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pcp/relatorios')
export class PCPRelatoriosController {
  constructor(private readonly relatoriosService: PCPRelatoriosService) {}

  @Get('ocupacao-maquinas')
  @ApiOperation({ summary: 'Relatório de ocupação por máquina' })
  async ocupacaoMaquinas(
    @LojaId() lojaId: string,
    @Query() filtros: Record<string, string>,
  ) {
    return this.relatoriosService.obterOcupacaoMaquinas(lojaId, filtros);
  }

  @Get('previsto-realizado')
  @ApiOperation({
    summary: 'Comparativo tempo previsto × realizado por setor/OS',
  })
  async previstoRealizado(
    @LojaId() lojaId: string,
    @Query() filtros: Record<string, string>,
  ) {
    return this.relatoriosService.obterPrevistoRealizado(lojaId, filtros);
  }
}
