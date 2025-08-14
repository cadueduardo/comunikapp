import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SobrasService } from '../services/sobras.service';
import { EstoqueAccessGuard } from '../guards/estoque-access.guard';
import { withLog, withLogReturn } from './controller-utils';
import { EstoqueRequest } from '../middleware/tenant-isolation.middleware';

@ApiTags('Gestão de Sobras e Retalhos')
@Controller('api/estoque/sobras')
@UseGuards(EstoqueAccessGuard)
export class SobrasController {
  private readonly logger = new Logger(SobrasController.name);

  constructor(private readonly sobrasService: SobrasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova sobra' })
  @ApiResponse({ status: 201, description: 'Sobra criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async criarSobra(@Req() req: EstoqueRequest, @Body() data: any) {
    const context = { lojaId: req.estoque.lojaId, usuarioId: req.estoque.usuarioId };
    return withLogReturn(this.logger, 'Erro ao criar sobra', () => this.sobrasService.criarSobra(context, data));
  }

  @Get()
  @ApiOperation({ summary: 'Listar sobras' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sobras retornada com sucesso',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'material',
    required: false,
    description: 'Filtrar por material',
  })
  @ApiQuery({ name: 'cor', required: false, description: 'Filtrar por cor' })
  async listarSobras(@Req() req: EstoqueRequest, @Query() query: any) {
    const context = { lojaId: req.estoque.lojaId, usuarioId: req.estoque.usuarioId };
    return withLogReturn(this.logger, 'Erro ao listar sobras', () => this.sobrasService.listarSobras(context, query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar sobra por ID' })
  @ApiResponse({ status: 200, description: 'Sobra encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Sobra não encontrada' })
  @ApiParam({ name: 'id', description: 'ID da sobra' })
  async buscarSobra(@Req() req: EstoqueRequest, @Param('id') id: string) {
    const context = { lojaId: req.estoque.lojaId, usuarioId: req.estoque.usuarioId };
    return withLogReturn(this.logger, 'Erro ao buscar sobra', async () => {
      const sobra = await this.sobrasService.buscarSobraPorId(context, id);
      return sobra;
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar sobra' })
  @ApiResponse({ status: 200, description: 'Sobra atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Sobra não encontrada' })
  @ApiParam({ name: 'id', description: 'ID da sobra' })
  async atualizarSobra(
    @Req() req: EstoqueRequest,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const context = { lojaId: req.estoque.lojaId, usuarioId: req.estoque.usuarioId };
    return withLogReturn(this.logger, 'Erro ao atualizar sobra', () => this.sobrasService.atualizarSobra(context, id, data));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir sobra' })
  @ApiResponse({ status: 200, description: 'Sobra excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Sobra não encontrada' })
  @ApiParam({ name: 'id', description: 'ID da sobra' })
  async excluirSobra(@Req() req: EstoqueRequest, @Param('id') id: string) {
    const context = { lojaId: req.estoque.lojaId, usuarioId: req.estoque.usuarioId };
    return withLogReturn(this.logger, 'Erro ao excluir sobra', () => this.sobrasService.excluirSobra(context, id));
  }

  @Post(':id/aproveitamento')
  @ApiOperation({ summary: 'Registrar aproveitamento de sobra' })
  @ApiResponse({
    status: 201,
    description: 'Aproveitamento registrado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiParam({ name: 'id', description: 'ID da sobra' })
  async registrarAproveitamento(
    @Req() req: EstoqueRequest,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const context = { lojaId: req.estoque.lojaId, usuarioId: req.estoque.usuarioId };
    return withLogReturn(this.logger, 'Erro ao registrar aproveitamento', () => this.sobrasService.registrarAproveitamento(context, id, data));
  }

  @Get('sugestoes/buscar')
  @ApiOperation({ summary: 'Buscar sugestões de sobras' })
  @ApiResponse({ status: 200, description: 'Sugestões retornadas com sucesso' })
  @ApiQuery({
    name: 'material',
    required: false,
    description: 'Filtrar por material',
  })
  @ApiQuery({ name: 'cor', required: false, description: 'Filtrar por cor' })
  @ApiQuery({
    name: 'areaMinima',
    required: false,
    description: 'Área mínima em m²',
  })
  @ApiQuery({
    name: 'areaMaxima',
    required: false,
    description: 'Área máxima em m²',
  })
  async buscarSugestoes(@Req() req: EstoqueRequest, @Query() query: any) {
    const context = { lojaId: req.estoque.lojaId, usuarioId: req.estoque.usuarioId };
    return withLogReturn(this.logger, 'Erro ao buscar sugestões', () => this.sobrasService.buscarSugestoesSobras(context, query));
  }

  @Get('metricas/economia')
  @ApiOperation({ summary: 'Calcular métricas de economia' })
  @ApiResponse({ status: 200, description: 'Métricas calculadas com sucesso' })
  async calcularMetricas(@Req() req: EstoqueRequest) {
    const context = { lojaId: req.estoque.lojaId, usuarioId: req.estoque.usuarioId };
    return withLogReturn(this.logger, 'Erro ao calcular métricas', () => this.sobrasService.calcularMetricasEconomia(context));
  }
}
