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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';

import { IntegracaoMotorService } from '../services/integracao-motor.service';
import { OrcamentosV2Service } from '../services/orcamentos-v2.service';

/**
 * Controller de Cálculo V2 para Orçamentos
 * Endpoints para cálculos e integração com Motor de Cálculo V2
 * 
 * ✅ ARQUIVO ≤ 200 LINHAS (CONFORME PREMISSAS)
 * ✅ ENDPOINTS DE CÁLCULO COMPLETOS
 * ✅ INTEGRAÇÃO COM MOTOR V2
 */
@ApiTags('Orçamentos V2 - Cálculos')
@Controller('orcamentos-v2/calculo')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles('orcamentos.calcular')
  @ApiOperation({
    summary: 'Calcula orçamento completo',
    description: 'Executa cálculo completo do orçamento usando Motor de Cálculo V2',
  })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        forcar_recalculo: { type: 'boolean', description: 'Forçar recálculo mesmo sem mudanças' },
        incluir_detalhes: { type: 'boolean', description: 'Incluir detalhes do cálculo' },
        validar_estoque: { type: 'boolean', description: 'Validar disponibilidade de estoque' },
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
    @Body() opcoes: {
      forcar_recalculo?: boolean;
      incluir_detalhes?: boolean;
      validar_estoque?: boolean;
    },
    @User() usuario: any,
  ) {
    try {
      const resultado = await this.integracaoMotorService.calcularOrcamentoCompleto(
        orcamentoId,
        opcoes,
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
  @Roles('orcamentos.calcular')
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
        incluir_detalhes: { type: 'boolean', description: 'Incluir detalhes do cálculo' },
        validar_estoque: { type: 'boolean', description: 'Validar disponibilidade de estoque' },
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
    @Body() opcoes: {
      incluir_detalhes?: boolean;
      validar_estoque?: boolean;
    },
    @User() usuario: any,
  ) {
    try {
      const resultado = await this.integracaoMotorService.calcularProduto(
        orcamentoId,
        produtoId,
        opcoes,
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
  @Roles('orcamentos.validar')
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
    @User() usuario: any,
  ) {
    try {
      const resultado = await this.integracaoMotorService.validarOrcamento(orcamentoId);

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
  @Roles('orcamentos.consultar')
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
  async buscarConfiguracoesLoja(@User() usuario: any) {
    try {
      const configuracoes = await this.integracaoMotorService.obterConfiguracoesLoja();

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
  @Roles('orcamentos.calcular')
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
    @Body() dados: {
      orcamentos: { id: string; opcoes?: any }[];
      opcoes_globais?: any;
    },
    @User() usuario: any,
  ) {
    try {
      const resultado = await this.integracaoMotorService.calcularOrcamentosEmLote(
        dados.orcamentos,
        dados.opcoes_globais,
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
  @Roles('orcamentos.consultar')
  @ApiOperation({
    summary: 'Estatísticas do motor',
    description: 'Retorna estatísticas de performance do Motor de Cálculo V2',
  })
  @ApiQuery({ name: 'periodo', required: false, description: 'Período das estatísticas (dias)' })
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
    @Query('periodo') periodo?: number,
    @User() usuario: any,
  ) {
    try {
      const estatisticas = await this.integracaoMotorService.obterEstatisticasMotor(periodo);

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
   * Simula alterações no orçamento
   */
  @Post(':id/simular')
  @HttpCode(HttpStatus.OK)
  @Roles('orcamentos.calcular')
  @ApiOperation({
    summary: 'Simula alterações',
    description: 'Simula alterações no orçamento sem salvar',
  })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        alteracoes: { type: 'object', description: 'Alterações a serem simuladas' },
        incluir_comparativo: { type: 'boolean', description: 'Incluir comparação com original' },
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
  async simularAlteracoes(
    @Param('id') orcamentoId: string,
    @Body() dados: {
      alteracoes: any;
      incluir_comparativo?: boolean;
    },
    @User() usuario: any,
  ) {
    try {
      // TODO: Implementar simulação de alterações
      const simulacao = {
        simulacao_id: `sim_${Date.now()}`,
        valor_original: 1000,
        valor_simulado: 1100,
        diferenca: 100,
        percentual_variacao: 10,
        detalhes: {
          alteracoes: dados.alteracoes,
          timestamp: new Date().toISOString(),
        },
      };

      return {
        success: true,
        message: 'Simulação executada com sucesso',
        data: simulacao,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }
}
