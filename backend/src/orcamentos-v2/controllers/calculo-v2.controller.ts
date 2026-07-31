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
  NotFoundException,
  NotImplementedException,
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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Identidade, IdentidadeAutenticada } from '../../auth/decorators';
import { VendasPermissionsGuard } from '../../vendas/permissions/vendas-permissions.guard';
import { RequerPermissaoVendas } from '../../vendas/permissions/requer-permissao-vendas.decorator';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';

import { IntegracaoMotorService } from '../services/integracao-motor.service';
import { OrcamentosV2Service } from '../services/orcamentos-v2.service';

/**
 * Controller de Cálculo V2 para Orçamentos
 * Endpoints para cálculos e integração com Motor de Cálculo V2
 *
 * ✅ ENDPOINTS DE CÁLCULO COMPLETOS
 * ✅ INTEGRAÇÃO COM MOTOR V2
 *
 * Autorização (Gate 0S): todo endpoint declara sua permissão e recebe a loja
 * da identidade autenticada.
 */
@ApiTags('Orçamentos V2 - Cálculos')
@Controller('orcamentos-v2/calculo')
@UseGuards(JwtAuthGuard, VendasPermissionsGuard)
@ApiBearerAuth()
export class CalculoV2Controller {
  constructor(
    private readonly integracaoMotorService: IntegracaoMotorService,
    private readonly orcamentosV2Service: OrcamentosV2Service,
  ) {}

  /**
   * Calcula orçamento completo usando Motor V2
   */
  @Post(':id/calcular')
  @HttpCode(HttpStatus.OK)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @ApiOperation({
    summary: 'Calcula orçamento completo',
    description:
      'Executa cálculo completo do orçamento usando Motor de Cálculo V2',
  })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        forcar_recalculo: {
          type: 'boolean',
          description: 'Forçar recálculo mesmo sem mudanças',
        },
        incluir_detalhes: {
          type: 'boolean',
          description: 'Incluir detalhes do cálculo',
        },
        validar_estoque: {
          type: 'boolean',
          description: 'Validar disponibilidade de estoque',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Orçamento calculado com sucesso',
    schema: {
      type: 'object',
      properties: {
        orcamento_id: { type: 'string' },
        valor_total: { type: 'number' },
        custo_total: { type: 'number' },
        margem_lucro: { type: 'number' },
        tempo_calculo: { type: 'number' },
        detalhes: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async calcularOrcamento(
    @Param('id') orcamentoId: string,
    @Body()
    opcoes: {
      forcar_recalculo?: boolean;
      incluir_detalhes?: boolean;
      validar_estoque?: boolean;
    },
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    try {
      const orcamento = await this.orcamentosV2Service.buscarOrcamento(
        orcamentoId,
        identidade.lojaId,
      );
      const resultado =
        await this.integracaoMotorService.calcularOrcamentoCompleto(
          orcamento,
          identidade.lojaId,
        );

      return {
        success: true,
        message: 'Orçamento calculado com sucesso',
        data: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calcula produto específico
   */
  @Post(':orcamentoId/produtos/:produtoId/calcular')
  @HttpCode(HttpStatus.OK)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @ApiOperation({
    summary: 'Calcula produto específico',
    description: 'Executa cálculo de um produto específico do orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiParam({ name: 'produtoId', description: 'ID do produto' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        incluir_detalhes: {
          type: 'boolean',
          description: 'Incluir detalhes do cálculo',
        },
        validar_estoque: {
          type: 'boolean',
          description: 'Validar disponibilidade de estoque',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Produto calculado com sucesso',
    schema: {
      type: 'object',
      properties: {
        produto_id: { type: 'string' },
        valor_total: { type: 'number' },
        custo_total: { type: 'number' },
        margem_lucro: { type: 'number' },
        tempo_calculo: { type: 'number' },
        detalhes: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async calcularProduto(
    @Param('orcamentoId') orcamentoId: string,
    @Param('produtoId') produtoId: string,
    @Body()
    opcoes: {
      incluir_detalhes?: boolean;
      validar_estoque?: boolean;
    },
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    try {
      const orcamento = await this.orcamentosV2Service.buscarOrcamento(
        orcamentoId,
        identidade.lojaId,
      );
      const produto = (orcamento.produtos || []).find(
        (p: any) => p.id === produtoId,
      );
      if (!produto) {
        throw new NotFoundException('Produto não encontrado');
      }
      const resultado = await this.integracaoMotorService.calcularProduto(
        produto,
        identidade.lojaId,
      );

      return {
        success: true,
        message: 'Produto calculado com sucesso',
        data: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Valida orçamento sem calcular
   */
  @Post(':id/validar')
  @HttpCode(HttpStatus.OK)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({
    summary: 'Valida orçamento',
    description: 'Valida orçamento sem executar cálculos',
  })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento validado com sucesso',
    schema: {
      type: 'object',
      properties: {
        valido: { type: 'boolean' },
        erros: { type: 'array', items: { type: 'string' } },
        avisos: { type: 'array', items: { type: 'string' } },
        recomendacoes: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async validarOrcamento(
    @Param('id') orcamentoId: string,
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    try {
      const orcamento = await this.orcamentosV2Service.buscarOrcamento(
        orcamentoId,
        identidade.lojaId,
      );
      const resultado = await this.integracaoMotorService.validarOrcamento(
        orcamento,
        identidade.lojaId,
      );

      return {
        success: true,
        message: 'Orçamento validado com sucesso',
        data: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca configurações de cálculo da loja
   */
  @Get('configuracoes-loja')
  @HttpCode(HttpStatus.OK)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({
    summary: 'Busca configurações de cálculo',
    description: 'Retorna configurações de cálculo da loja atual',
  })
  @ApiResponse({
    status: 200,
    description: 'Configurações encontradas',
    schema: {
      type: 'object',
      properties: {
        margem_padrao: { type: 'number' },
        custos_indiretos: { type: 'number' },
        impostos: { type: 'number' },
        desconto_maximo: { type: 'number' },
        regras_calculo: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async buscarConfiguracoesLoja(
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    try {
      const configuracoes =
        await this.integracaoMotorService.obterConfiguracoesLoja(
          identidade.lojaId,
        );

      return {
        success: true,
        message: 'Configurações encontradas',
        data: configuracoes,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calcula múltiplos orçamentos em lote
   */
  @Post('calcular-lote')
  @HttpCode(HttpStatus.OK)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @ApiOperation({
    summary: 'Calcula orçamentos em lote',
    description: 'Executa cálculo de múltiplos orçamentos simultaneamente',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orcamentos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              opcoes: { type: 'object' },
            },
          },
        },
        opcoes_globais: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Orçamentos calculados em lote',
    schema: {
      type: 'object',
      properties: {
        total_processados: { type: 'number' },
        sucessos: { type: 'number' },
        erros: { type: 'number' },
        resultados: { type: 'array' },
        tempo_total: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async calcularOrcamentosLote(
    @Body()
    dados: {
      orcamentos: { id: string; opcoes?: any }[];
      opcoes_globais?: any;
    },
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    try {
      // O corpo traz apenas identificadores. Cada orçamento é recarregado
      // dentro da loja autenticada: antes o objeto enviado pelo cliente ia
      // direto para o motor, sem nunca ser lido do banco.
      const orcamentos = await Promise.all(
        (dados.orcamentos ?? []).map((item) =>
          this.orcamentosV2Service.buscarOrcamento(item.id, identidade.lojaId),
        ),
      );

      const resultado =
        await this.integracaoMotorService.calcularOrcamentosEmLote(
          orcamentos,
          identidade.lojaId,
        );

      return {
        success: true,
        message: 'Orçamentos calculados em lote com sucesso',
        data: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca estatísticas do motor de cálculo
   */
  @Get('motor/estatisticas')
  @HttpCode(HttpStatus.OK)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({
    summary: 'Estatísticas do motor',
    description: 'Retorna estatísticas de performance do Motor de Cálculo V2',
  })
  @ApiQuery({
    name: 'periodo',
    required: false,
    description: 'Período das estatísticas (dias)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas encontradas',
    schema: {
      type: 'object',
      properties: {
        total_calculos: { type: 'number' },
        tempo_medio: { type: 'number' },
        sucessos: { type: 'number' },
        erros: { type: 'number' },
        performance: { type: 'object' },
        cache_hits: { type: 'number' },
        cache_misses: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async buscarEstatisticasMotor(
    @Identidade() identidade: IdentidadeAutenticada,
    @Query('periodo') periodo?: number,
  ) {
    try {
      const estatisticas =
        await this.integracaoMotorService.obterEstatisticasMotor(
          identidade.lojaId,
        );

      return {
        success: true,
        message: 'Estatísticas encontradas',
        data: estatisticas,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simula alterações no orçamento.
   *
   * Gate 0S: o corpo devolvia números fixos (`valor_original: 1000`) sem sequer
   * resolver o orçamento na loja autenticada. Um endpoint que responde `200`
   * com valor inventado é pior que um que não existe, porque o consumidor não
   * tem como distinguir. Fica fechado até a Fase 2 definir o contrato.
   */
  @Post(':id/simular')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @ApiOperation({
    summary: 'Simula alterações',
    description: 'Não implementado. Contrato pendente da Fase 2.',
  })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        alteracoes: {
          type: 'object',
          description: 'Alterações a serem simuladas',
        },
        incluir_comparativo: {
          type: 'boolean',
          description: 'Incluir comparação com original',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Simulação executada com sucesso',
    schema: {
      type: 'object',
      properties: {
        simulacao_id: { type: 'string' },
        valor_original: { type: 'number' },
        valor_simulado: { type: 'number' },
        diferenca: { type: 'number' },
        percentual_variacao: { type: 'number' },
        detalhes: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  simularAlteracoes(): never {
    throw new NotImplementedException(
      'Simulação de alterações ainda não está disponível.',
    );
  }
}
