import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WorkflowService } from '../services/workflow.service';
import { CreateWorkflowInstanciaDto, UpdateWorkflowInstanciaDto } from '../interfaces/pcp.interfaces';

@Controller('pcp/workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Post('instanciar')
  async criarInstancia(@Body() dto: CreateWorkflowInstanciaDto) {
    return this.workflowService.criarInstancia(dto);
  }

  @Get('os/:osId')
  async buscarPorOS(@Param('osId') osId: string) {
    return this.workflowService.buscarPorOS(osId);
  }

  @Get()
  async listarInstancias(@Query() filtros: {
    status?: string;
    workflow_id?: string;
    data_inicio?: string;
    data_fim?: string;
  }) {
    const filtrosProcessados = {
      ...filtros,
      data_inicio: filtros.data_inicio ? new Date(filtros.data_inicio) : undefined,
      data_fim: filtros.data_fim ? new Date(filtros.data_fim) : undefined
    };

    return this.workflowService.listarInstancias(filtrosProcessados);
  }

  @Put(':id')
  async atualizarStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowInstanciaDto
  ) {
    return this.workflowService.atualizarStatus(id, dto);
  }

  @Delete(':id')
  async deletarInstancia(@Param('id') id: string) {
    await this.workflowService.deletarInstancia(id);
    return { message: 'Instância de workflow removida com sucesso' };
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    const instancia = await this.workflowService.buscarPorOS(id);
    return {
      status: instancia?.status || 'NAO_INICIADO',
      etapa_atual: instancia?.etapa_atual,
      progresso: this.calcularProgresso(instancia)
    };
  }

  private calcularProgresso(instancia: any): number {
    if (!instancia?.etapas) return 0;
    
    const totalEtapas = instancia.etapas.length;
    const etapasConcluidas = instancia.etapas.filter(etapa => etapa.status === 'CONCLUIDA').length;
    
    return totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;
  }
}
