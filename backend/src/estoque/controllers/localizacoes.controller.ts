/**
 * Controller de Localizações de Estoque
 * Limitado a 200 linhas conforme premissas de arquitetura
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EstoqueSimpleService } from '../services/estoque-simple.service';
import { CreateLocalizacaoDto } from '../dto/create-localizacao.dto';
import { QueryLocalizacoesDto } from '../dto/query-estoque.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetLoja } from '../../auth/decorators';
import { Loja } from '@prisma/client';

@ApiTags('Estoque - Localizações')
@ApiBearerAuth()
@Controller('api/estoque/localizacoes')
@UseGuards(JwtAuthGuard)
export class LocalizacoesController {
  constructor(private readonly estoqueService: EstoqueSimpleService) {}

  @ApiOperation({
    summary: 'Criar nova localização',
    description:
      'Cria uma nova localização de estoque com endereçamento hierárquico',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Localização criada com sucesso',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        codigo: 'A1-01-B-02-03',
        deposito: 'Depósito Central',
        corredor: 'Corredor A',
        prateleira: 'Prateleira 01',
        nivel: 'Nível B',
        posicao: 'Posição 02',
        descricao: 'Área refrigerada',
        capacidade: 1000.5,
        ativo: true,
        lojaId: '550e8400-e29b-41d4-a716-446655440001',
        createdAt: '2025-01-08T10:00:00.000Z',
        updatedAt: '2025-01-08T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou código já existe',
  })
  @Post()
  async criar(@Body() createDto: CreateLocalizacaoDto, @GetLoja() loja: Loja) {
    const context = { lojaId: loja.id, usuarioId: loja.id };
    return this.estoqueService.criarLocalizacao(context, createDto);
  }

  @ApiOperation({
    summary: 'Listar localizações',
    description: 'Lista localizações com filtros e paginação otimizada',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de localizações retornada com sucesso',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            codigo: 'A1-01-B-02-03',
            deposito: 'Depósito Central',
            ativo: true,
            createdAt: '2025-01-08T10:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      },
    },
  })
  @Get()
  async listar(@Query() query: QueryLocalizacoesDto, @GetLoja() loja: Loja) {
    const context = { lojaId: loja.id };
    return this.estoqueService.listarLocalizacoes(context, query);
  }

  @ApiOperation({
    summary: 'Buscar localização por ID',
    description: 'Retorna detalhes de uma localização específica',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Localização encontrada com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Localização não encontrada',
  })
  @ApiParam({ name: 'id', description: 'ID da localização' })
  @Get(':id')
  async buscarPorId(@Param('id') id: string, @GetLoja() loja: Loja) {
    const context = { lojaId: loja.id };
    return this.estoqueService.buscarLocalizacaoPorId(context, id);
  }

  @ApiOperation({
    summary: 'Atualizar localização',
    description: 'Atualiza dados de uma localização existente',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Localização atualizada com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Localização não encontrada',
  })
  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateLocalizacaoDto>,
    @GetLoja() loja: Loja,
  ) {
    const context = { lojaId: loja.id, usuarioId: loja.id };
    return this.estoqueService.atualizarLocalizacao(context, id, updateDto);
  }

  @ApiOperation({
    summary: 'Verificar se localização pode ser excluída',
    description: 'Verifica se há itens vinculados antes da exclusão',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verificação realizada com sucesso',
  })
  @Get(':id/verificar-exclusao')
  async verificarExclusao(@Param('id') id: string, @GetLoja() loja: Loja) {
    const context = { lojaId: loja.id };
    return this.estoqueService.verificarLocalizacaoExclusao(context, id);
  }

  @ApiOperation({
    summary: 'Excluir localização',
    description: 'Remove uma localização (soft delete)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Localização excluída com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Localização não pode ser excluída',
  })
  @Delete(':id')
  async excluir(@Param('id') id: string, @GetLoja() loja: Loja) {
    const context = { lojaId: loja.id, usuarioId: loja.id };
    return this.estoqueService.excluirLocalizacao(context, id);
  }

  @ApiOperation({
    summary: 'Desativar localização',
    description: 'Desativa uma localização sem excluí-la',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Localização desativada com sucesso',
  })
  @Put(':id/desativar')
  async desativar(@Param('id') id: string, @GetLoja() loja: Loja) {
    const context = { lojaId: loja.id, usuarioId: loja.id };
    return this.estoqueService.atualizarLocalizacao(context, id, {
      ativo: false,
    });
  }
}
