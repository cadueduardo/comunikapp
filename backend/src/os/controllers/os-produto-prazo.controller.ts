/**
 * Controller para gerenciamento de prazo de produtos da OS
 * Expõe endpoints para definir, consultar e liberar produtos para PCP
 */

import { Controller, Post, Put, Get, Param, Body, Request, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OSProdutoPrazoService } from '../services/os-produto-prazo.service';
import { DefinirPrazoProdutoDTO, LiberarProdutoPCPDTO } from '../dto/os-produto-prazo.dto';

@ApiTags('OS - Gerenciamento de Prazo de Produtos')
@ApiBearerAuth()
@Controller('os/produtos')
@UseGuards(JwtAuthGuard)
export class OSProdutoPrazoController {
  constructor(private readonly osProdutoPrazoService: OSProdutoPrazoService) {}

  @Post(':osId/item/:itemId/definir-prazo')
  @ApiOperation({ summary: 'Definir prazo para um produto específico' })
  @ApiParam({ name: 'osId', description: 'ID da OS' })
  @ApiParam({ name: 'itemId', description: 'ID do produto/item' })
  @ApiBody({ type: DefinirPrazoProdutoDTO })
  @ApiResponse({ status: 200, description: 'Prazo definido com sucesso' })
  @ApiResponse({ status: 400, description: 'Prazo inválido ou excede prazo final da OS' })
  async definirPrazoProduto(
    @Param('osId') osId: string,
    @Param('itemId') itemId: string,
    @Body() definirPrazoDTO: DefinirPrazoProdutoDTO,
    @Request() req: any
  ) {
    try {
      const lojaId = req.user.loja_id;
      const usuarioId = req.user.id;
      const ipOrigem = req.ip;
      const userAgent = req.get('User-Agent');

      const resultado = await this.osProdutoPrazoService.definirPrazoProduto({
        itemId,
        osId,
        lojaId,
        usuarioId,
        dataPrazo: new Date(definirPrazoDTO.data_prazo_produto),
        dataInicio: definirPrazoDTO.data_inicio_producao ? new Date(definirPrazoDTO.data_inicio_producao) : undefined,
        prioridade: definirPrazoDTO.prioridade_produto,
        ordemProducao: definirPrazoDTO.ordem_producao,
        motivo: definirPrazoDTO.motivo,
        ipOrigem,
        userAgent,
        confirmarRetroativa: definirPrazoDTO.confirmar_retroativa || false
      });

      return {
        success: true,
        message: 'Prazo do produto definido com sucesso',
        data: resultado
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao definir prazo do produto',
          error: error.name || 'InternalServerError'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':osId/item/:itemId/status-prazo')
  @ApiOperation({ summary: 'Consultar status do prazo de um produto' })
  @ApiParam({ name: 'osId', description: 'ID da OS' })
  @ApiParam({ name: 'itemId', description: 'ID do produto/item' })
  @ApiResponse({ status: 200, description: 'Status consultado com sucesso' })
  async consultarStatusPrazoProduto(
    @Param('osId') osId: string,
    @Param('itemId') itemId: string,
    @Request() req: any
  ) {
    try {
      const lojaId = req.user.loja_id;
      const status = await this.osProdutoPrazoService.consultarStatusPrazoProduto(itemId, osId, lojaId);
      
      return {
        success: true,
        data: status
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao consultar status do prazo',
          error: error.name || 'InternalServerError'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':osId/item/:itemId/validar-prazo')
  @ApiOperation({ summary: 'Validar prazo de um produto' })
  @ApiParam({ name: 'osId', description: 'ID da OS' })
  @ApiParam({ name: 'itemId', description: 'ID do produto/item' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        data_prazo: { type: 'string', format: 'date-time' } 
      } 
    } 
  })
  @ApiResponse({ status: 200, description: 'Validação realizada' })
  async validarPrazoProduto(
    @Param('osId') osId: string,
    @Param('itemId') itemId: string,
    @Body() body: { data_prazo: string },
    @Request() req: any
  ) {
    try {
      const lojaId = req.user.loja_id;
      const validacao = await this.osProdutoPrazoService.validarPrazoProduto(
        itemId, 
        osId, 
        lojaId, 
        new Date(body.data_prazo)
      );
      
      return {
        success: true,
        data: validacao
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao validar prazo',
          error: error.name || 'InternalServerError'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':osId/item/:itemId/liberar-pcp')
  @ApiOperation({ summary: 'Liberar produto específico para PCP' })
  @ApiParam({ name: 'osId', description: 'ID da OS' })
  @ApiParam({ name: 'itemId', description: 'ID do produto/item' })
  @ApiBody({ type: LiberarProdutoPCPDTO })
  @ApiResponse({ status: 200, description: 'Produto liberado com sucesso' })
  @ApiResponse({ status: 400, description: 'Produto sem prazo definido' })
  async liberarProdutoPCP(
    @Param('osId') osId: string,
    @Param('itemId') itemId: string,
    @Body() liberarDTO: LiberarProdutoPCPDTO,
    @Request() req: any
  ) {
    try {
      const lojaId = req.user.loja_id;
      const usuarioId = req.user.id;

      const resultado = await this.osProdutoPrazoService.liberarProdutoPCP(
        itemId,
        osId,
        lojaId,
        usuarioId,
        liberarDTO.motivo
      );

      return {
        success: true,
        message: 'Produto liberado para PCP com sucesso',
        data: resultado
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao liberar produto para PCP',
          error: error.name || 'InternalServerError'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':osId/status-produtos')
  @ApiOperation({ summary: 'Consultar status de todos os produtos de uma OS' })
  @ApiParam({ name: 'osId', description: 'ID da OS' })
  @ApiResponse({ status: 200, description: 'Status de todos os produtos consultado' })
  async consultarStatusProdutosOS(
    @Param('osId') osId: string,
    @Request() req: any
  ) {
    try {
      const lojaId = req.user.loja_id;
      const status = await this.osProdutoPrazoService.consultarStatusProdutosOS(osId, lojaId);
      
      return {
        success: true,
        data: status
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao consultar status dos produtos',
          error: error.name || 'InternalServerError'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}


