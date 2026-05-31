import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LojaId } from '../../auth/loja-id.decorator';
import { PCPCapacidadeService } from '../services/pcp-capacidade.service';

@ApiTags('PCP - Capacidade')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pcp/capacidade')
export class PCPCapacidadeController {
  constructor(private readonly capacidadeService: PCPCapacidadeService) {}

  @Get('setores')
  @ApiOperation({ summary: 'Consulta carga produtiva por setor' })
  async obterCapacidadeSetores(
    @LojaId() lojaId: string,
    @Query() filtros: Record<string, string>,
  ) {
    return this.capacidadeService.obterCapacidadeSetores(lojaId, filtros);
  }

  @Get('maquinas')
  @ApiOperation({ summary: 'Consulta ocupação por máquina' })
  async obterCapacidadeMaquinas(
    @LojaId() lojaId: string,
    @Query() filtros: Record<string, string>,
  ) {
    return this.capacidadeService.obterCapacidadeMaquinas(lojaId, filtros);
  }

  @Get('setores/:setorId/carga')
  @ApiOperation({ summary: 'Consulta carga detalhada de um setor' })
  async obterCargaSetor(
    @LojaId() lojaId: string,
    @Param('setorId') setorId: string,
    @Query() filtros: Record<string, string>,
  ) {
    return this.capacidadeService.obterCargaSetor(lojaId, setorId, filtros);
  }
}
