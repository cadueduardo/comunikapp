/**
 * Controller principal para Ordens de Serviço
 * Limite: ≤ 200 linhas conforme premissas
 * Endpoints: CRUD básico, avanço de etapas, estatísticas
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
import { OSService } from '../services/os.service';
import { OSPermissionsGuard } from '../guards/os-permissions.guard';
import { CreateOSDto } from '../dto/create-os.dto';
import { UpdateOSDto, AvancarEtapaDto } from '../dto/update-os.dto';
import { StatusOS, ApiResponse as OSApiResponse } from '../interfaces/os.interfaces';

interface AuthenticatedRequest {
  user: {
    id: string;
    loja_id: string;
    funcao: string;
  };
  lojaId: string;
}

@ApiTags('OS - Ordens de Serviço')
@ApiBearerAuth()
@Controller('os')
@UseGuards(JwtAuthGuard, OSPermissionsGuard)
export class OSController {
  constructor(private readonly osService: OSService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova OS' })
  @ApiResponse({ status: 201, description: 'OS criada com sucesso' })
  async create(
    @Body() createOSDto: CreateOSDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const os = await this.osService.create(req.lojaId, createOSDto);
    return {
      success: true,
      data: os,
      message: 'OS criada com sucesso',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as OS da loja' })
  @ApiResponse({ status: 200, description: 'Lista de OS retornada com sucesso' })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('responsavel') responsavel?: string,
  ) {
    const result = await this.osService.findAll(
      req.lojaId,
      parseInt(page),
      parseInt(limit),
      status,
      responsavel,
    );

    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas das OS' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  async getEstatisticas(@Request() req: AuthenticatedRequest) {
    const estatisticas = await this.osService.getEstatisticas(req.lojaId);
    return {
      success: true,
      data: estatisticas,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Buscar OS por status' })
  @ApiResponse({ status: 200, description: 'OS filtradas por status' })
  async findByStatus(
    @Param('status') status: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const ordens = await this.osService.buscarPorStatus(req.lojaId, status as StatusOS);
    return {
      success: true,
      data: ordens,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('responsavel/:responsavelId')
  @ApiOperation({ summary: 'Buscar OS por responsável' })
  @ApiResponse({ status: 200, description: 'OS do responsável retornadas' })
  async findByResponsavel(
    @Param('responsavelId') responsavelId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const ordens = await this.osService.buscarPorResponsavel(req.lojaId, responsavelId);
    return {
      success: true,
      data: ordens,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter OS por ID' })
  @ApiResponse({ status: 200, description: 'OS retornada com sucesso' })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const os = await this.osService.findOne(id, req.lojaId);
    return {
      success: true,
      data: os,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar OS' })
  @ApiResponse({ status: 200, description: 'OS atualizada com sucesso' })
  async update(
    @Param('id') id: string,
    @Body() updateOSDto: UpdateOSDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const os = await this.osService.update(id, req.lojaId, updateOSDto, req.user.id);
    return {
      success: true,
      data: os,
      message: 'OS atualizada com sucesso',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/avancar-etapa')
  @ApiOperation({ summary: 'Avançar etapa da OS' })
  @ApiResponse({ status: 200, description: 'Etapa avançada com sucesso' })
  async avancarEtapa(
    @Param('id') id: string,
    @Body() avancarDto: AvancarEtapaDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const os = await this.osService.avancarEtapa(
      id,
      req.lojaId,
      { ...avancarDto, usuario_id: req.user.id },
      req.user.id,
    );

    return {
      success: true,
      data: os,
      message: `Etapa avançada para ${avancarDto.nova_etapa}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir OS' })
  @ApiResponse({ status: 200, description: 'OS excluída com sucesso' })
  async remove(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.osService.remove(id, req.lojaId, req.user.id);
    return {
      success: true,
      message: 'OS excluída com sucesso',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/check')
  @ApiOperation({ summary: 'Health check do módulo OS' })
  @ApiResponse({ status: 200, description: 'Status do módulo' })
  async healthCheck() {
    const health = await this.osService.healthCheck();
    return {
      success: health.status === 'OK',
      data: health,
      timestamp: new Date().toISOString(),
    };
  }
}
