import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WorkflowService } from '../services/workflow.service';
import {
  CreateWorkflowInstanciaDto,
  UpdateWorkflowInstanciaDto,
} from '../interfaces/pcp.interfaces';
import {
  WorkflowAssignmentService,
  ItemWorkflowSuggestion,
  WorkflowSuggestion,
} from '../services/workflow-assignment.service';
import { AssignWorkflowDto } from '../dto/workflow-assignment.dto';

@Controller('pcp/workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly workflowAssignmentService: WorkflowAssignmentService,
  ) {}

  @Post('instanciar')
  async criarInstancia(@Body() dto: CreateWorkflowInstanciaDto) {
    return this.workflowService.criarInstancia(dto);
  }

  @Post('atribuir')
  async atribuirWorkflow(@Req() req: any, @Body() dto: AssignWorkflowDto) {
    const lojaId = req.user?.loja_id;
    if (!lojaId) {
      throw new BadRequestException('Loja não identificada no token.');
    }
    return this.workflowAssignmentService.atribuirWorkflow(lojaId, dto);
  }

  @Get('sugestao/:osId')
  async sugerirWorkflow(
    @Req() req: any,
    @Param('osId') osId: string,
  ): Promise<WorkflowSuggestion | null> {
    const lojaId = req.user?.loja_id;
    if (!lojaId) {
      throw new BadRequestException('Loja não identificada no token.');
    }
    return this.workflowAssignmentService.sugerirWorkflow(osId, lojaId);
  }

  @Get('sugestoes-itens/:osId')
  async sugerirWorkflowsPorItem(
    @Req() req: any,
    @Param('osId') osId: string,
  ): Promise<ItemWorkflowSuggestion[]> {
    const lojaId = req.user?.loja_id;
    if (!lojaId) {
      throw new BadRequestException('Loja não identificada no token.');
    }
    return this.workflowAssignmentService.sugerirWorkflowsPorItem(
      osId,
      lojaId,
    );
  }

  @Get('os/:osId')
  async buscarPorOS(@Param('osId') osId: string) {
    return this.workflowService.buscarPorOS(osId);
  }

  @Get()
  async listarInstancias(
    @Query()
    filtros: {
      status?: string;
      workflow_id?: string;
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

    return this.workflowService.listarInstancias(filtrosProcessados);
  }

  @Put(':id')
  async atualizarStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowInstanciaDto,
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
      progresso: this.calcularProgresso(instancia),
    };
  }

  private calcularProgresso(instancia: any): number {
    if (!instancia?.etapas) return 0;

    const totalEtapas = instancia.etapas.length;
    const etapasConcluidas = instancia.etapas.filter(
      (etapa) => etapa.status === 'CONCLUIDA',
    ).length;

    return totalEtapas > 0
      ? Math.round((etapasConcluidas / totalEtapas) * 100)
      : 0;
  }
}
