import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpStatus,
  HttpCode,
  Res,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery, 
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';

import { ImpressaoV2Service } from '../services/impressao-v2.service';

/**
 * Controller de Impressão V2 para Orçamentos
 * Endpoints para geração de PDFs e relatórios
 * 
 * ✅ ARQUIVO ≤ 200 LINHAS (CONFORME PREMISSAS)
 * ✅ ENDPOINTS DE IMPRESSÃO COMPLETOS
 * ✅ MÚLTIPLOS FORMATOS
 */
@ApiTags('Orçamentos V2 - Impressão')
@Controller('orcamentos-v2/impressao')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ImpressaoV2Controller {
  constructor(
    private readonly impressaoV2Service: ImpressaoV2Service,
  ) {}

  /**
   * Gera PDF do orçamento
   */
  @Post(':orcamentoId/pdf')
  @HttpCode(HttpStatus.OK)
  @Roles('orcamentos.impressao.gerar')
  @ApiOperation({
    summary: 'Gera PDF',
    description: 'Gera PDF do orçamento com template personalizado',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        template: { 
          type: 'string', 
          enum: ['padrao', 'executivo', 'detalhado'],
          description: 'Template do PDF' 
        },
        incluir_detalhes: { type: 'boolean', description: 'Incluir detalhes completos' },
        incluir_imagens: { type: 'boolean', description: 'Incluir imagens' },
        incluir_assinaturas: { type: 'boolean', description: 'Incluir assinaturas' },
        idioma: { 
          type: 'string', 
          enum: ['pt-BR', 'en', 'es'],
          description: 'Idioma do PDF' 
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async gerarPDF(
    @Param('orcamentoId') orcamentoId: string,
    @Body() opcoes: {
      template?: 'padrao' | 'executivo' | 'detalhado';
      incluirDetalhes?: boolean;
      incluirImagens?: boolean;
      incluirAssinaturas?: boolean;
      idioma?: 'pt-BR' | 'en' | 'es';
    },
    @Res() res: Response,
    @User() usuario: any,
  ) {
    try {
      const resultado = await this.impressaoV2Service.gerarPDF(
        orcamentoId,
        opcoes.template || 'padrao',
        {
          incluirDetalhes: opcoes.incluirDetalhes,
          incluirImagens: opcoes.incluirImagens,
          incluirAssinaturas: opcoes.incluirAssinaturas,
          idioma: opcoes.idioma,
        },
      );

      res.set({
        'Content-Type': resultado.mimeType,
        'Content-Disposition': `attachment; filename="${resultado.nomeArquivo}"`,
        'Content-Length': resultado.tamanho.toString(),
      });

      res.send(resultado.buffer);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gera relatório executivo
   */
  @Post(':orcamentoId/relatorio-executivo')
  @HttpCode(HttpStatus.OK)
  @Roles('orcamentos.impressao.gerar')
  @ApiOperation({
    summary: 'Relatório executivo',
    description: 'Gera relatório executivo do orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        formato: { 
          type: 'string', 
          enum: ['pdf', 'excel', 'html'],
          description: 'Formato do relatório' 
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório gerado com sucesso',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } },
      'text/html': { schema: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async gerarRelatorioExecutivo(
    @Param('orcamentoId') orcamentoId: string,
    @Body() dados: { formato: 'pdf' | 'excel' | 'html' },
    @Res() res: Response,
    @User() usuario: any,
  ) {
    try {
      const resultado = await this.impressaoV2Service.gerarRelatorioExecutivo(
        orcamentoId,
        dados.formato,
      );

      res.set({
        'Content-Type': resultado.mimeType,
        'Content-Disposition': `attachment; filename="${resultado.nomeArquivo}"`,
        'Content-Length': resultado.tamanho.toString(),
      });

      res.send(resultado.buffer);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gera relatório de custos
   */
  @Post(':orcamentoId/relatorio-custos')
  @HttpCode(HttpStatus.OK)
  @Roles('orcamentos.impressao.gerar')
  @ApiOperation({
    summary: 'Relatório de custos',
    description: 'Gera relatório detalhado de custos do orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        formato: { 
          type: 'string', 
          enum: ['pdf', 'excel', 'csv'],
          description: 'Formato do relatório' 
        },
        nivel_detalhamento: { 
          type: 'string', 
          enum: ['resumido', 'detalhado', 'completo'],
          description: 'Nível de detalhamento' 
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório gerado com sucesso',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } },
      'text/csv': { schema: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async gerarRelatorioCustos(
    @Param('orcamentoId') orcamentoId: string,
    @Body() dados: {
      formato: 'pdf' | 'excel' | 'csv';
      nivelDetalhamento?: 'resumido' | 'detalhado' | 'completo';
    },
    @Res() res: Response,
    @User() usuario: any,
  ) {
    try {
      const resultado = await this.impressaoV2Service.gerarRelatorioCustos(
        orcamentoId,
        dados.formato,
        dados.nivelDetalhamento || 'detalhado',
      );

      res.set({
        'Content-Type': resultado.mimeType,
        'Content-Disposition': `attachment; filename="${resultado.nomeArquivo}"`,
        'Content-Length': resultado.tamanho.toString(),
      });

      res.send(resultado.buffer);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gera proposta comercial
   */
  @Post(':orcamentoId/proposta-comercial')
  @HttpCode(HttpStatus.OK)
  @Roles('orcamentos.impressao.gerar')
  @ApiOperation({
    summary: 'Proposta comercial',
    description: 'Gera proposta comercial do orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        template: { 
          type: 'string', 
          enum: ['padrao', 'premium', 'personalizado'],
          description: 'Template da proposta' 
        },
        incluir_termos: { type: 'boolean', description: 'Incluir termos e condições' },
        incluir_condicoes: { type: 'boolean', description: 'Incluir condições comerciais' },
        incluir_garantias: { type: 'boolean', description: 'Incluir garantias' },
        idioma: { 
          type: 'string', 
          enum: ['pt-BR', 'en', 'es'],
          description: 'Idioma da proposta' 
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Proposta gerada com sucesso',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async gerarPropostaComercial(
    @Param('orcamentoId') orcamentoId: string,
    @Body() opcoes: {
      template?: 'padrao' | 'premium' | 'personalizado';
      incluirTermos?: boolean;
      incluirCondicoes?: boolean;
      incluirGarantias?: boolean;
      idioma?: 'pt-BR' | 'en' | 'es';
    },
    @Res() res: Response,
    @User() usuario: any,
  ) {
    try {
      const resultado = await this.impressaoV2Service.gerarPropostaComercial(
        orcamentoId,
        opcoes.template || 'padrao',
        {
          incluirTermos: opcoes.incluirTermos,
          incluirCondicoes: opcoes.incluirCondicoes,
          incluirGarantias: opcoes.incluirGarantias,
          idioma: opcoes.idioma,
        },
      );

      res.set({
        'Content-Type': resultado.mimeType,
        'Content-Disposition': `attachment; filename="${resultado.nomeArquivo}"`,
        'Content-Length': resultado.tamanho.toString(),
      });

      res.send(resultado.buffer);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gera etiquetas
   */
  @Post(':orcamentoId/etiquetas')
  @HttpCode(HttpStatus.OK)
  @Roles('orcamentos.impressao.gerar')
  @ApiOperation({
    summary: 'Gera etiquetas',
    description: 'Gera etiquetas para produtos, insumos ou máquinas',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['tipo'],
      properties: {
        tipo: { 
          type: 'string', 
          enum: ['produtos', 'insumos', 'maquinas'],
          description: 'Tipo de etiquetas' 
        },
        formato: { 
          type: 'string', 
          enum: ['pdf', 'zpl'],
          description: 'Formato das etiquetas' 
        },
        tamanho: { 
          type: 'string', 
          enum: ['pequeno', 'medio', 'grande'],
          description: 'Tamanho das etiquetas' 
        },
        quantidade: { type: 'number', description: 'Quantidade de etiquetas' },
        incluir_codigo_barras: { type: 'boolean', description: 'Incluir código de barras' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Etiquetas geradas com sucesso',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
      'application/x-zpl': { schema: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async gerarEtiquetas(
    @Param('orcamentoId') orcamentoId: string,
    @Body() dados: {
      tipo: 'produtos' | 'insumos' | 'maquinas';
      formato?: 'pdf' | 'zpl';
      tamanho?: 'pequeno' | 'medio' | 'grande';
      quantidade?: number;
      incluirCodigoBarras?: boolean;
    },
    @Res() res: Response,
    @User() usuario: any,
  ) {
    try {
      const resultado = await this.impressaoV2Service.gerarEtiquetas(
        orcamentoId,
        dados.tipo,
        dados.formato || 'pdf',
        {
          tamanho: dados.tamanho,
          quantidade: dados.quantidade,
          incluirCodigoBarras: dados.incluirCodigoBarras,
        },
      );

      res.set({
        'Content-Type': resultado.mimeType,
        'Content-Disposition': `attachment; filename="${resultado.nomeArquivo}"`,
        'Content-Length': resultado.tamanho.toString(),
      });

      res.send(resultado.buffer);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gera relatório de análise de preços
   */
  @Post(':orcamentoId/analise-precos')
  @HttpCode(HttpStatus.OK)
  @Roles('orcamentos.impressao.gerar')
  @ApiOperation({
    summary: 'Análise de preços',
    description: 'Gera relatório de análise de preços do orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        formato: { 
          type: 'string', 
          enum: ['pdf', 'excel', 'html'],
          description: 'Formato do relatório' 
        },
        incluir_comparativo: { type: 'boolean', description: 'Incluir análise comparativa' },
        incluir_tendencias: { type: 'boolean', description: 'Incluir análise de tendências' },
        incluir_recomendacoes: { type: 'boolean', description: 'Incluir recomendações' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório gerado com sucesso',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } },
      'text/html': { schema: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async gerarRelatorioAnalisePrecos(
    @Param('orcamentoId') orcamentoId: string,
    @Body() opcoes: {
      formato: 'pdf' | 'excel' | 'html';
      incluirComparativo?: boolean;
      incluirTendencias?: boolean;
      incluirRecomendacoes?: boolean;
    },
    @Res() res: Response,
    @User() usuario: any,
  ) {
    try {
      const resultado = await this.impressaoV2Service.gerarRelatorioAnalisePrecos(
        orcamentoId,
        opcoes.formato,
        {
          incluirComparativo: opcoes.incluirComparativo,
          incluirTendencias: opcoes.incluirTendencias,
          incluirRecomendacoes: opcoes.incluirRecomendacoes,
        },
      );

      res.set({
        'Content-Type': resultado.mimeType,
        'Content-Disposition': `attachment; filename="${resultado.nomeArquivo}"`,
        'Content-Length': resultado.tamanho.toString(),
      });

      res.send(resultado.buffer);
    } catch (error) {
      throw error;
    }
  }
}
