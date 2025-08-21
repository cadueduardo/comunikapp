/**
 * Controller de Itens de Estoque
 * APIs segregadas com autenticação padrão (JwtAuthGuard)
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ItensEstoqueService } from '../services/itens-estoque.service';
import { DashboardEstoqueService } from '../services/dashboard-estoque.service';
import { CreateItemEstoqueDto } from '../dto/create-item-estoque.dto';
import { QueryItensEstoqueDto } from '../dto/query-estoque.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetLoja } from '../../auth/decorators';
import { loja } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { itemCriadoExample, listarItensExample, itemDetalheExample } from '../swagger/itens.examples';

@ApiTags('Estoque - Itens')
@ApiBearerAuth()
@Controller('api/estoque/itens')
@UseGuards(JwtAuthGuard)
export class ItensController {
  private readonly logger = new Logger(ItensController.name);
  constructor(
    private readonly estoqueService: ItensEstoqueService,
    private readonly dashboardService: DashboardEstoqueService,
  ) {}

  @ApiOperation({
    summary: 'Criar item de estoque',
    description: 'Cria novo item vinculado a insumo e localização',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Item criado com sucesso', schema: { example: itemCriadoExample } })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou item já existe na localização',
  })
  @Post()
  async criar(@Body() createDto: CreateItemEstoqueDto, @GetLoja() loja: loja) {
    const context = { lojaId: loja.id, usuarioId: loja.id };
    return this.estoqueService.criarItemEstoque(context, createDto);
  }

  @ApiOperation({
    summary: 'Listar itens de estoque',
    description: 'Lista itens com filtros avançados e paginação',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de itens retornada com sucesso', schema: { example: listarItensExample } })
  @Get()
  async listar(@Query() query: QueryItensEstoqueDto, @GetLoja() loja: loja) {
    const context = { lojaId: loja.id };
    this.logger.debug(`Context criado: ${JSON.stringify(context)}`);

    try {
      const result = await this.estoqueService.listarItensEstoque(
        context,
        query,
      );
      this.logger.debug('Itens listados com sucesso');
      return result;
    } catch (error) {
      this.logger.warn(`Erro ao listar itens: ${(error as any)?.message}`);
      throw error;
    }
  }

  @ApiOperation({
    summary: 'Dashboard de estoque',
    description: 'Retorna estatísticas e resumo do estoque',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard retornado com sucesso',
  })
  @Get('dashboard')
  async dashboard(@GetLoja() loja: loja) {
    const context = { lojaId: loja.id };
    this.logger.debug(`Context criado: ${JSON.stringify(context)}`);

    try {
      const result = await this.dashboardService.obterDashboard(context);
      this.logger.debug('Dashboard obtido com sucesso');
      return result;
    } catch (error) {
      this.logger.warn(`Erro ao obter dashboard: ${(error as any)?.message}`);
      throw error;
    }
  }

  @ApiOperation({
    summary: 'Atualizar item de estoque',
    description: 'Atualiza dados de um item específico',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item atualizado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item não encontrado',
  })
  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() updateDto: any,
    @GetLoja() loja: loja,
  ) {
    const context = { lojaId: loja.id, usuarioId: loja.id };
    return this.estoqueService.atualizarItemEstoque(context, id, updateDto);
  }

  @ApiOperation({
    summary: 'Buscar item de estoque por ID',
    description: 'Retorna detalhes completos de um item específico',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item encontrado com sucesso', schema: { example: itemDetalheExample } })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item não encontrado',
  })
  @Get(':id')
  async buscarPorId(@Param('id') id: string, @GetLoja() loja: loja) {
    const context = { lojaId: loja.id };
    return this.estoqueService.buscarItemEstoquePorId(context, id);
  }

  @ApiOperation({
    summary: 'Excluir item de estoque',
    description: 'Remove um item de estoque específico',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item excluído com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item não encontrado',
  })
  @Delete(':id')
  async excluir(@Param('id') id: string, @GetLoja() loja: loja) {
    const context = { lojaId: loja.id, usuarioId: loja.id };
    return this.estoqueService.excluirItemEstoque(context, id);
  }
}
