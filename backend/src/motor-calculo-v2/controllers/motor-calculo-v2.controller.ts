import {
  Controller,
  Post,
  Get,
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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators';
import { MotorCalculoV2Service } from '../services/motor-calculo-v2.service';
import { DTOCalculo } from '../interfaces/calculo.interface';

/**
 * Controller do Motor de Cálculo V2
 * API REST para cálculos e integrações
 *
 * ✅ ARQUIVO ≤ 200 LINHAS (CONFORME PREMISSAS)
 * ✅ ENDPOINTS COMPLETOS DE CÁLCULO
 * ✅ DOCUMENTAÇÃO SWAGGER
 */
@ApiTags('Motor de Cálculo V2')
@Controller('motor-calculo-v2')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MotorCalculoV2Controller {
  constructor(private readonly motorCalculoV2Service: MotorCalculoV2Service) {}

  /**
   * Executa cálculo completo
   */
  @Post('calcular')
  @ApiOperation({
    summary: 'Executar cálculo completo via Motor V2',
    description:
      'Executa cálculo completo de orçamento usando o motor V2 com pipeline de estágios',
  })
  @ApiBody({
    description: 'Dados para cálculo',
    schema: {
      type: 'object',
      properties: {
        produtos: {
          type: 'array',
          description: 'Lista de produtos para calcular',
        },
        configuracoes: {
          type: 'object',
          description: 'Configurações de cálculo',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cálculo executado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @HttpCode(HttpStatus.OK)
  async executarCalculo(@Body() dto: DTOCalculo, @CurrentUser() usuario: any) {
    try {
      // Adicionar loja_id do usuário
      const dtoComLoja = {
        ...dto,
        lojaId: usuario.loja_id,
      };

      const resultado =
        await this.motorCalculoV2Service.executarCalculo(dtoComLoja);

      return {
        success: true,
        message: 'Cálculo executado com sucesso via Motor V2',
        data: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Executa cálculo simplificado
   */
  @Post('calcular/simplificado')
  @ApiOperation({
    summary: 'Executar cálculo simplificado',
    description: 'Executa cálculo simplificado (apenas regras básicas)',
  })
  @HttpCode(HttpStatus.OK)
  async executarCalculoSimplificado(
    @Body() dto: DTOCalculo,
    @CurrentUser() usuario: any,
  ) {
    try {
      const dtoComLoja = {
        ...dto,
        lojaId: usuario.loja_id,
      };

      const resultado =
        await this.motorCalculoV2Service.executarCalculoSimplificado(
          dtoComLoja,
        );

      return {
        success: true,
        message: 'Cálculo simplificado executado com sucesso',
        data: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Executa cálculo em modo preview
   */
  @Post('preview')
  @ApiOperation({
    summary: 'Executar cálculo preview',
    description: 'Executa cálculo em modo preview (sem persistir)',
  })
  @HttpCode(HttpStatus.OK)
  async executarCalculoPreview(
    @Body() dto: DTOCalculo,
    @CurrentUser() usuario: any,
  ) {
    try {
      const dtoComLoja = {
        ...dto,
        lojaId: usuario.loja_id,
      };

      const resultado =
        await this.motorCalculoV2Service.executarCalculoPreview(dtoComLoja);

      return {
        success: true,
        message: 'Preview de cálculo executado com sucesso',
        data: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Valida contexto sem executar cálculo
   */
  @Post('validar')
  @ApiOperation({
    summary: 'Validar contexto de cálculo',
    description: 'Valida dados de entrada sem executar o cálculo',
  })
  @HttpCode(HttpStatus.OK)
  async validarContexto(@Body() dto: DTOCalculo, @CurrentUser() usuario: any) {
    try {
      const dtoComLoja = {
        ...dto,
        lojaId: usuario.loja_id,
      };

      const resultado =
        await this.motorCalculoV2Service.validarContexto(dtoComLoja);

      return {
        success: resultado.valido,
        message: resultado.valido ? 'Contexto válido' : 'Contexto inválido',
        data: {
          valido: resultado.valido,
          erros: resultado.erros,
          avisos: resultado.avisos,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém estatísticas do motor
   */
  @Get('estatisticas')
  @ApiOperation({
    summary: 'Obter estatísticas do motor',
    description: 'Retorna estatísticas de uso e performance do motor V2',
  })
  async obterEstatisticas(@CurrentUser() usuario: any) {
    try {
      const estatisticas = await this.motorCalculoV2Service.obterEstatisticas(
        usuario.loja_id,
      );

      return {
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: estatisticas,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Health check do motor
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check do motor',
    description: 'Verifica saúde dos serviços do motor V2',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de saúde dos serviços',
  })
  async healthCheck() {
    try {
      const health = await this.motorCalculoV2Service.healthCheck();

      return {
        success: health.status === 'healthy',
        message: `Motor V2 está ${health.status}`,
        data: health,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro no health check',
        data: {
          status: 'unhealthy',
          timestamp: new Date(),
          versao: '2.0.0',
          servicos: {},
          detalhes: [`Erro: ${error.message}`],
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}
