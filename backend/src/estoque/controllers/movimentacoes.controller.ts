/**
 * Controller de Movimentações de Estoque
 * APIs para controle de entrada, saída e transferências
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EstoqueSimpleService } from '../services/estoque-simple.service';
import { CreateMovimentacaoDto } from '../dto/create-movimentacao.dto';
import { QueryMovimentacoesDto } from '../dto/query-estoque.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetLoja } from '../../auth/decorators';
import { Loja } from '@prisma/client';

@ApiTags('Estoque - Movimentações')
@ApiBearerAuth()
@Controller('api/estoque/movimentacoes')
@UseGuards(JwtAuthGuard)
export class MovimentacoesController {
  constructor(private readonly estoqueService: EstoqueSimpleService) {}

  @ApiOperation({
    summary: 'Criar movimentação',
    description: 'Registra entrada, saída ou transferência de estoque',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Movimentação criada com sucesso',
  })
  @Post()
  async criar(
    @Body() createDto: CreateMovimentacaoDto,
    @GetLoja() loja: Loja,
  ) {
    const context = { lojaId: loja.id, usuarioId: loja.id };
    return this.estoqueService.criarMovimentacao(context, createDto);
  }

  @ApiOperation({
    summary: 'Listar movimentações',
    description: 'Lista movimentações com filtros e paginação',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de movimentações retornada com sucesso',
  })
  @Get()
  async listar(
    @Query() query: QueryMovimentacoesDto,
    @GetLoja() loja: Loja,
  ) {
    const context = { lojaId: loja.id };
    return this.estoqueService.listarMovimentacoes(context, query);
  }

  @ApiOperation({
    summary: 'Buscar movimentação por ID',
    description: 'Retorna detalhes de uma movimentação específica',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Movimentação encontrada com sucesso',
  })
  @Get(':id')
  async buscarPorId(
    @Param('id') id: string,
    @GetLoja() loja: Loja,
  ) {
    const context = { lojaId: loja.id };
    return this.estoqueService.buscarMovimentacaoPorId(context, id);
  }

  @ApiOperation({
    summary: 'Excluir movimentação',
    description: 'Remove uma movimentação específica',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Movimentação excluída com sucesso',
  })
  @Delete(':id')
  async excluir(
    @Param('id') id: string,
    @GetLoja() loja: Loja,
  ) {
    const context = { lojaId: loja.id, usuarioId: loja.id };
    return this.estoqueService.excluirMovimentacao(context, id);
  }
}
