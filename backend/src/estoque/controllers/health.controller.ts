/**
 * Controller de Health Check para Estoque
 * Endpoints para monitoramento e testes
 */

import { Controller, Get, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EstoqueSimpleService } from '../services/estoque-simple.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetLoja } from '../../auth/decorators';
import { Loja } from '@prisma/client';

@ApiTags('Estoque - Health Check')
@Controller('api/estoque/health')
export class HealthController {
  constructor(private readonly estoqueService: EstoqueSimpleService) {}

  @ApiOperation({
    summary: 'Health check básico',
    description: 'Verifica se o módulo está funcionando',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Módulo funcionando normalmente',
  })
  @Get()
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      module: 'estoque',
      version: '1.0.0',
    };
  }

  @ApiOperation({
    summary: 'Teste de banco de dados',
    description: 'Verifica conectividade com banco de dados',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banco de dados acessível',
  })
  @Get('db')
  async dbCheck() {
    try {
      const result = await this.estoqueService.healthCheck();
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
        ...result,
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @ApiOperation({
    summary: 'Teste de autenticação',
    description: 'Verifica se a autenticação está funcionando',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Autenticação funcionando',
  })
  @UseGuards(JwtAuthGuard)
  @Get('auth')
  async authTest(@GetLoja() loja: Loja) {
    return {
      status: 'ok',
      authenticated: true,
      loja: {
        id: loja.id,
        nome: loja.nome,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({
    summary: 'Teste de contexto de estoque',
    description: 'Verifica se o contexto de estoque está funcionando',
  })
  @UseGuards(JwtAuthGuard)
  @Get('context')
  async contextTest(@GetLoja() loja: Loja) {
    const context = { lojaId: loja.id };

    try {
      // Testar se consegue acessar o banco com o contexto
      const localizacoes = await this.estoqueService.listarLocalizacoes(
        context,
        { limit: 1 },
      );

      return {
        status: 'ok',
        context: {
          lojaId: context.lojaId,
          lojaNome: loja.nome,
        },
        databaseAccess: 'ok',
        localizacoesCount: localizacoes.total || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        context: {
          lojaId: context.lojaId,
          lojaNome: loja.nome,
        },
        databaseAccess: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @ApiOperation({
    summary: 'Teste de APIs públicas',
    description: 'Verifica se as APIs básicas estão funcionando',
  })
  @Get('test-apis')
  async testApis() {
    try {
      // Testar se consegue acessar o banco diretamente
      const result = await this.estoqueService.healthCheck();

      return {
        status: 'ok',
        message: 'APIs básicas funcionando',
        database: 'connected',
        timestamp: new Date().toISOString(),
        ...result,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro nas APIs básicas',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
