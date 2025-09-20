/**
 * Controller para gestão de Workflows
 * Limite: ≤ 200 linhas conforme premissas
 * Endpoints: CRUD workflows, validação de etapas
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WorkflowService } from '../services/workflow.service';
import { OSPermissionsGuard } from '../guards/os-permissions.guard';
import { CreateWorkflowDto, UpdateWorkflowDto } from '../dto/workflow.dto';

interface AuthenticatedRequest {
  user: {
    id: string;
    loja_id: string;
    funcao: string;
  };
  lojaId: string;
}

@ApiTags('OS - Workflows')
@ApiBearerAuth()
@Controller('os/workflows')
@UseGuards(JwtAuthGuard, OSPermissionsGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo workflow' })
  @ApiResponse({ status: 201, description: 'Workflow criado com sucesso' })
  async create(
    @Body() createWorkflowDto: CreateWorkflowDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const workflow = await this.workflowService.create(req.lojaId, createWorkflowDto);
    return {
      success: true,
      data: workflow,
      message: 'Workflow criado com sucesso',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('padrao')
  @ApiOperation({ summary: 'Criar workflow padrão para a loja' })
  @ApiResponse({ status: 201, description: 'Workflow padrão criado com sucesso' })
  async criarPadrao(@Request() req: AuthenticatedRequest) {
    const workflow = await this.workflowService.criarWorkflowPadrao(req.lojaId);
    return {
      success: true,
      data: workflow,
      message: 'Workflow padrão criado com sucesso',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar workflows da loja' })
  @ApiResponse({ status: 200, description: 'Lista de workflows retornada' })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('ativos') ativos = 'true',
  ) {
    const workflows = await this.workflowService.findAll(
      req.lojaId,
      ativos === 'true',
    );
    
    return {
      success: true,
      data: workflows,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter workflow por ID' })
  @ApiResponse({ status: 200, description: 'Workflow retornado com sucesso' })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const workflow = await this.workflowService.findOne(id, req.lojaId);
    return {
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/etapas')
  @ApiOperation({ summary: 'Obter etapas do workflow' })
  @ApiResponse({ status: 200, description: 'Etapas retornadas com sucesso' })
  async getEtapas(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const etapas = await this.workflowService.obterEtapasWorkflow(id, req.lojaId);
    return {
      success: true,
      data: etapas,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/validar-transicao')
  @ApiOperation({ summary: 'Validar transição entre etapas' })
  @ApiResponse({ status: 200, description: 'Validação realizada' })
  async validarTransicao(
    @Param('id') id: string,
    @Body() body: { etapa_atual: string; proxima_etapa: string },
    @Request() req: AuthenticatedRequest,
  ) {
    const validacao = await this.workflowService.validarTransicaoWorkflow(
      id,
      req.lojaId,
      body.etapa_atual,
      body.proxima_etapa,
    );

    return {
      success: validacao.valida,
      data: validacao,
      message: validacao.valida ? 'Transição válida' : validacao.motivo,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar workflow' })
  @ApiResponse({ status: 200, description: 'Workflow atualizado com sucesso' })
  async update(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const workflow = await this.workflowService.update(id, req.lojaId, updateWorkflowDto);
    return {
      success: true,
      data: workflow,
      message: 'Workflow atualizado com sucesso',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar workflow' })
  @ApiResponse({ status: 200, description: 'Workflow desativado com sucesso' })
  async remove(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.workflowService.remove(id, req.lojaId);
    return {
      success: true,
      message: 'Workflow desativado com sucesso',
      timestamp: new Date().toISOString(),
    };
  }
}
