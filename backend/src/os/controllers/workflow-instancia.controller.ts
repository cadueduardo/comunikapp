/**
 * Controller para gestão de instâncias de workflow PCP
 * Limite: <= 200 linhas conforme premissas
 * Endpoints: CRUD instâncias, controle de etapas, apontamentos
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { WorkflowInstanciaService } from '../services/workflow-instancia.service';
import { OSPermissionsGuard } from '../guards/os-permissions.guard';
import {
  CreateWorkflowInstanciaDto,
  CreateApontamentoDto,
  UpdateWorkflowInstanciaDto,
  UpdateEtapaInstanciaDto,
  UpdateChecklistInstanciaDto,
  WorkflowInstanciaResponse,
  EtapaInstanciaResponse,
  ChecklistInstanciaResponse,
  ApontamentoResponse,
  EstatisticasWorkflow,
  EstatisticasApontamento,
} from '../interfaces/workflow-pcp.interfaces';

@ApiTags('Workflow PCP - Instâncias')
@ApiBearerAuth()
@Controller('os/workflow')
@UseGuards(OSPermissionsGuard)
export class WorkflowInstanciaController {
  constructor(
    private readonly workflowInstanciaService: WorkflowInstanciaService,
  ) {}

  @Post('instancia')
  @ApiOperation({ summary: 'Criar instância de workflow para OS' })
  @ApiResponse({
    status: 201,
    description: 'Instância de workflow criada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou OS já possui workflow',
  })
  @ApiResponse({ status: 404, description: 'OS ou workflow não encontrado' })
  async criarInstancia(
    @Body() createDto: CreateWorkflowInstanciaDto,
    @Request() req: any,
  ): Promise<WorkflowInstanciaResponse> {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;
    const usuarioId = user.id;

    const instancia = await this.workflowInstanciaService.criarInstancia(
      lojaId,
      createDto,
      usuarioId,
    );

    return this.formatarWorkflowInstanciaResponse(instancia);
  }

  @Get('instancia/os/:osId')
  @ApiOperation({ summary: 'Buscar instância de workflow por OS' })
  @ApiResponse({ status: 200, description: 'Instância de workflow encontrada' })
  @ApiResponse({ status: 404, description: 'Instância não encontrada' })
  @ApiParam({ name: 'osId', description: 'ID da OS' })
  async buscarInstanciaPorOS(
    @Param('osId') osId: string,
    @Request() req: any,
  ): Promise<WorkflowInstanciaResponse> {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const instancia = await this.workflowInstanciaService.buscarInstanciaPorOS(
      osId,
      lojaId,
    );
    return this.formatarWorkflowInstanciaResponse(instancia);
  }

  @Patch('instancia/:instanciaId')
  @ApiOperation({ summary: 'Atualizar instância de workflow' })
  @ApiResponse({ status: 200, description: 'Instância atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Instância não encontrada' })
  @ApiParam({ name: 'instanciaId', description: 'ID da instância de workflow' })
  async atualizarInstancia(
    @Param('instanciaId') instanciaId: string,
    @Body() updateDto: UpdateWorkflowInstanciaDto,
    @Request() req: any,
  ): Promise<WorkflowInstanciaResponse> {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    const instancia = await this.workflowInstanciaService.atualizarInstancia(
      instanciaId,
      updateDto,
      usuarioId,
    );

    return this.formatarWorkflowInstanciaResponse(instancia);
  }

  @Patch('etapa/:etapaId/avancar')
  @ApiOperation({ summary: 'Avançar para próxima etapa do workflow' })
  @ApiResponse({ status: 200, description: 'Etapa avançada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Checklists obrigatórios pendentes',
  })
  @ApiResponse({ status: 404, description: 'Etapa não encontrada' })
  @ApiParam({ name: 'etapaId', description: 'ID da etapa' })
  async avancarEtapa(
    @Param('etapaId') etapaId: string,
    @Body() body: { instanciaId: string; observacoes?: string },
    @Request() req: any,
  ): Promise<EtapaInstanciaResponse> {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    const etapa = await this.workflowInstanciaService.avancarEtapa(
      body.instanciaId,
      etapaId,
      usuarioId,
      body.observacoes,
    );

    return this.formatarEtapaInstanciaResponse(etapa);
  }

  @Get('etapa/:etapaId')
  @ApiOperation({ summary: 'Buscar detalhes de etapa' })
  @ApiResponse({ status: 200, description: 'Etapa encontrada' })
  @ApiResponse({ status: 404, description: 'Etapa não encontrada' })
  @ApiParam({ name: 'etapaId', description: 'ID da etapa' })
  async buscarEtapa(
    @Param('etapaId') etapaId: string,
  ): Promise<EtapaInstanciaResponse> {
    const etapa = await this.workflowInstanciaService.buscarEtapa(etapaId);
    return this.formatarEtapaInstanciaResponse(etapa);
  }

  @Post('apontamento')
  @ApiOperation({ summary: 'Criar apontamento de produção' })
  @ApiResponse({ status: 201, description: 'Apontamento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async criarApontamento(
    @Body() createDto: CreateApontamentoDto,
    @Request() req: any,
  ): Promise<ApontamentoResponse> {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;
    const usuarioId = user.id;

    // Adicionar informações do usuário
    createDto.ip_origem = req.ip;
    createDto.user_agent = req.headers['user-agent'];

    const apontamento = await this.workflowInstanciaService.criarApontamento(
      lojaId,
      createDto,
      usuarioId,
    );

    return this.formatarApontamentoResponse(apontamento);
  }

  @Get('apontamento/os/:osId')
  @ApiOperation({ summary: 'Listar apontamentos de OS' })
  @ApiResponse({ status: 200, description: 'Lista de apontamentos' })
  @ApiParam({ name: 'osId', description: 'ID da OS' })
  async listarApontamentosOS(
    @Param('osId') osId: string,
    @Request() req: any,
  ): Promise<ApontamentoResponse[]> {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const apontamentos =
      await this.workflowInstanciaService.listarApontamentosOS(osId, lojaId);
    return apontamentos.map((ap) => this.formatarApontamentoResponse(ap));
  }

  @Patch('checklist/:checklistId')
  @ApiOperation({ summary: 'Atualizar checklist' })
  @ApiResponse({ status: 200, description: 'Checklist atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Checklist não encontrado' })
  @ApiParam({ name: 'checklistId', description: 'ID do checklist' })
  async atualizarChecklist(
    @Param('checklistId') checklistId: string,
    @Body() updateDto: UpdateChecklistInstanciaDto,
    @Request() req: any,
  ): Promise<ChecklistInstanciaResponse> {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    const checklist = await this.workflowInstanciaService.atualizarChecklist(
      checklistId,
      updateDto,
      usuarioId,
    );

    return this.formatarChecklistInstanciaResponse(checklist);
  }

  @Get('estatisticas/workflow')
  @ApiOperation({ summary: 'Obter estatísticas de workflow' })
  @ApiResponse({ status: 200, description: 'Estatísticas de workflow' })
  async obterEstatisticasWorkflow(
    @Request() req: any,
  ): Promise<EstatisticasWorkflow> {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    return await this.workflowInstanciaService.obterEstatisticasWorkflow(
      lojaId,
    );
  }

  @Get('estatisticas/apontamento')
  @ApiOperation({ summary: 'Obter estatísticas de apontamento' })
  @ApiResponse({ status: 200, description: 'Estatísticas de apontamento' })
  async obterEstatisticasApontamento(
    @Request() req: any,
  ): Promise<EstatisticasApontamento> {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    return await this.workflowInstanciaService.obterEstatisticasApontamento(
      lojaId,
    );
  }

  // ===== MÉTODOS AUXILIARES =====

  private formatarWorkflowInstanciaResponse(
    instancia: any,
  ): WorkflowInstanciaResponse {
    return {
      id: instancia.id,
      os_id: instancia.os_id,
      workflow_id: instancia.workflow_id,
      status: instancia.status,
      etapa_atual: instancia.etapa_atual,
      data_inicio: instancia.data_inicio.toISOString(),
      data_fim: instancia.data_fim?.toISOString(),
      criado_em: instancia.criado_em.toISOString(),
      atualizado_em: instancia.atualizado_em.toISOString(),
      workflow: instancia.workflow
        ? {
            id: instancia.workflow.id,
            nome: instancia.workflow.nome,
            descricao: instancia.workflow.descricao,
          }
        : undefined,
      etapas: instancia.etapas?.map((etapa) =>
        this.formatarEtapaInstanciaResponse(etapa),
      ),
    };
  }

  private formatarEtapaInstanciaResponse(etapa: any): EtapaInstanciaResponse {
    return {
      id: etapa.id,
      workflow_instancia_id: etapa.workflow_instancia_id,
      etapa_nome: etapa.etapa_nome,
      ordem: etapa.ordem,
      status: etapa.status,
      data_inicio: etapa.data_inicio?.toISOString(),
      data_fim: etapa.data_fim?.toISOString(),
      responsavel_id: etapa.responsavel_id,
      tempo_estimado: etapa.tempo_estimado,
      tempo_real: etapa.tempo_real,
      observacoes: etapa.observacoes,
      criado_em: etapa.criado_em.toISOString(),
      atualizado_em: etapa.atualizado_em.toISOString(),
      checklists: etapa.checklists?.map((checklist) =>
        this.formatarChecklistInstanciaResponse(checklist),
      ),
      apontamentos: etapa.apontamentos?.map((apontamento) =>
        this.formatarApontamentoResponse(apontamento),
      ),
    };
  }

  private formatarChecklistInstanciaResponse(
    checklist: any,
  ): ChecklistInstanciaResponse {
    return {
      id: checklist.id,
      etapa_instancia_id: checklist.etapa_instancia_id,
      item_descricao: checklist.item_descricao,
      obrigatorio: checklist.obrigatorio,
      concluido: checklist.concluido,
      concluido_por: checklist.concluido_por,
      data_conclusao: checklist.data_conclusao?.toISOString(),
      observacoes: checklist.observacoes,
      ordem: checklist.ordem,
      criado_em: checklist.criado_em.toISOString(),
      atualizado_em: checklist.atualizado_em.toISOString(),
    };
  }

  private formatarApontamentoResponse(apontamento: any): ApontamentoResponse {
    return {
      id: apontamento.id,
      os_id: apontamento.os_id,
      etapa_instancia_id: apontamento.etapa_instancia_id,
      tipo: apontamento.tipo,
      data_apontamento: apontamento.data_apontamento.toISOString(),
      usuario_id: apontamento.usuario_id,
      observacoes: apontamento.observacoes,
      quantidade_produzida: apontamento.quantidade_produzida
        ? Number(apontamento.quantidade_produzida)
        : undefined,
      quantidade_refugo: apontamento.quantidade_refugo
        ? Number(apontamento.quantidade_refugo)
        : undefined,
      tempo_gasto: apontamento.tempo_gasto,
      ip_origem: apontamento.ip_origem,
      user_agent: apontamento.user_agent,
      criado_em: apontamento.criado_em.toISOString(),
    };
  }
}
