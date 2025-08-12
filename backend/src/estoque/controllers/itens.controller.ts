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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EstoqueSimpleService } from '../services/estoque-simple.service';
import { CreateItemEstoqueDto } from '../dto/create-item-estoque.dto';
import { QueryItensEstoqueDto } from '../dto/query-estoque.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetLoja } from '../../auth/decorators';
import { Loja } from '@prisma/client';

@ApiTags('Estoque - Itens')
@ApiBearerAuth()
@Controller('api/estoque/itens')
@UseGuards(JwtAuthGuard)
export class ItensController {
  constructor(private readonly estoqueService: EstoqueSimpleService) {}

  @ApiOperation({
    summary: 'Criar item de estoque',
    description: 'Cria novo item vinculado a insumo e localização',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Item criado com sucesso',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        insumoId: '550e8400-e29b-41d4-a716-446655440000',
        localizacaoId: '550e8400-e29b-41d4-a716-446655440001',
        quantidadeAtual: 100.5,
        quantidadeReservada: 0,
        estoqueMinimo: 10.0,
        estoqueMaximo: 1000.0,
        lojaId: '550e8400-e29b-41d4-a716-446655440003',
        dataUltimaMov: '2025-01-08T10:00:00.000Z',
        createdAt: '2025-01-08T10:00:00.000Z',
        localizacao: {
          codigo: 'A1-01-B-02-03',
          deposito: 'Depósito Central',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou item já existe na localização',
  })
  @Post()
  async criar(
    @Body() createDto: CreateItemEstoqueDto,
    @GetLoja() loja: Loja,
  ) {
    const context = { lojaId: loja.id, usuarioId: loja.id };
    return this.estoqueService.criarItemEstoque(context, createDto);
  }

  @ApiOperation({
    summary: 'Listar itens de estoque',
    description: 'Lista itens com filtros avançados e paginação',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de itens retornada com sucesso',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            insumoId: '550e8400-e29b-41d4-a716-446655440000',
            quantidadeAtual: 50.0,
            estoqueMinimo: 10.0,
            localizacao: {
              codigo: 'A1-01-B-02-03',
              deposito: 'Depósito Central',
            },
            lotes: [
              {
                numeroLote: 'LT001',
                dataValidade: '2025-12-31T00:00:00.000Z',
                quantidadeLote: 30.0,
                status: 'ATIVO',
              },
            ],
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
  async listar(
    @Query() query: QueryItensEstoqueDto,
    @GetLoja() loja: Loja,
  ) {
    const context = { lojaId: loja.id };
    console.log('✅ Context criado:', context);
    
    try {
      const result = await this.estoqueService.listarItensEstoque(context, query);
      console.log('✅ Itens listados com sucesso');
      return result;
    } catch (error) {
      console.error('❌ Erro ao listar itens:', error);
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
  async dashboard(@GetLoja() loja: Loja) {
    const context = { lojaId: loja.id };
    console.log('✅ Context criado:', context);
    
    try {
      const result = await this.estoqueService.obterDashboard(context);
      console.log('✅ Dashboard obtido com sucesso');
      return result;
    } catch (error) {
      console.error('❌ Erro ao obter dashboard:', error);
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
    @GetLoja() loja: Loja,
  ) {
    const context = { lojaId: loja.id, usuarioId: loja.id };
    return this.estoqueService.atualizarItemEstoque(context, id, updateDto);
  }

  @ApiOperation({
    summary: 'Buscar item de estoque por ID',
    description: 'Retorna detalhes completos de um item específico',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item encontrado com sucesso',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        insumoId: '550e8400-e29b-41d4-a716-446655440000',
        insumoNome: 'Bobina Lona Impressão Digital',
        localizacaoId: '550e8400-e29b-41d4-a716-446655440001',
        localizacaoCodigo: 'A1-01-B-02-03',
        quantidadeAtual: 50.0,
        quantidadeReservada: 5.0,
        estoqueMinimo: 10.0,
        estoqueMaximo: 100.0,
        unidadeCompra: 'BOBINA',
        valorUnitario: 870.0,
        codigoBarras: '7891234567890',
        lote: 'LT001',
        dataValidade: '2025-12-31T00:00:00.000Z',
        fornecedor: 'Fornecedor ABC',
        observacoes: 'Observações do item',
        ativo: true,
        createdAt: '2025-01-08T10:00:00.000Z',
        updatedAt: '2025-01-08T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item não encontrado',
  })
  @Get(':id')
  async buscarPorId(
    @Param('id') id: string,
    @GetLoja() loja: Loja,
  ) {
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
  async excluir(
    @Param('id') id: string,
    @GetLoja() loja: Loja,
  ) {
    const context = { lojaId: loja.id, usuarioId: loja.id };
    return this.estoqueService.excluirItemEstoque(context, id);
  }
}
