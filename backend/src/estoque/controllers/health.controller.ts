/**
 * Controller de Health Check para Estoque
 * Endpoints para monitoramento e testes
 */

import { Controller, Get, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetLoja } from '../../auth/decorators';
import { Loja } from '@prisma/client';

@ApiTags('Estoque - Health Check')
@Controller('api/estoque/health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

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
      // ping simples ao banco via SELECT 1
      const ping: any = await this.prisma.$queryRawUnsafe('SELECT 1 as ok');
      return {
        status: 'ok',
        module: 'estoque',
        version: '1.0.0',
        database: 'connected',
        timestamp: new Date().toISOString(),
        db: ping?.[0] || { ok: 1 },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        module: 'estoque',
        version: '1.0.0',
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
      // Verificar acesso ao banco com o contexto (consulta simples por loja)
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        'SELECT COUNT(*) as total FROM localizacoes WHERE loja_id = ? LIMIT 1',
        context.lojaId,
      );

      return {
        status: 'ok',
        context: {
          lojaId: context.lojaId,
          lojaNome: loja.nome,
        },
        databaseAccess: 'ok',
        localizacoesCount: Number(rows?.[0]?.total ?? 0),
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
      const ping: any = await this.prisma.$queryRawUnsafe('SELECT 1 as ok');

      return {
        status: 'ok',
        message: 'APIs básicas funcionando',
        database: 'connected',
        timestamp: new Date().toISOString(),
        db: ping?.[0] || { ok: 1 },
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

  @ApiOperation({
    summary: 'Links rápidos do módulo',
    description: 'Retorna links úteis para diagnóstico/monitoramento',
  })
  @Get('links')
  async links(@Req() req: any) {
    const base = '/api/estoque/health';
    const cid = req?.correlationId || req?.estoque?.correlationId;
    return {
      status: 'ok',
      links: {
        health: `${base}`,
        db: `${base}/db`,
        auth: `${base}/auth`,
        context: `${base}/context`,
        testApis: `${base}/test-apis`,
      },
      correlationId: cid || null,
      timestamp: new Date().toISOString(),
    };
  }
}
