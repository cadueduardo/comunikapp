/**
 * Controller de Validações Automáticas
 * Endpoints para execução e dashboard de validações
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequestWithUser } from '../../auth/auth.service';
import { ValidacoesAutomaticasService } from '../services/validacoes-automaticas.service';
import { ExecutarValidacaoDto } from '../dto/regra-validacao.dto';

@ApiTags('Configurações - Validações Automáticas')
@ApiBearerAuth()
@Controller('configuracoes/validacoes-automaticas')
@UseGuards(JwtAuthGuard)
export class ValidacoesAutomaticasController {
  constructor(
    private readonly validacaoService: ValidacoesAutomaticasService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter dashboard de validações' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard de validações obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        totalRegras: { type: 'number' },
        regrasAtivas: { type: 'number' },
        execucoesHoje: { type: 'number' },
        taxaSucesso: { type: 'number' },
        regrasPorCategoria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoria: { type: 'string' },
              total: { type: 'number' },
              ativas: { type: 'number' },
            },
          },
        },
        execucoesRecentes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              regra_id: { type: 'string' },
              os_id: { type: 'string' },
              resultado: { type: 'string' },
              mensagem: { type: 'string' },
              tempo_execucao: { type: 'number' },
              criado_em: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async dashboard(@Request() req: RequestWithUser) {
    const lojaId = req.user.loja_id;
    return await this.validacaoService.obterDashboard(lojaId);
  }

  @Post('executar')
  @ApiOperation({ summary: 'Executar validações em uma OS' })
  @ApiResponse({
    status: 200,
    description: 'Validações executadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        valida: { type: 'boolean' },
        pode_aprovar_automaticamente: { type: 'boolean' },
        correcoes_necessarias: {
          type: 'array',
          items: { type: 'string' },
        },
        alertas: {
          type: 'array',
          items: { type: 'string' },
        },
        acoes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tipo: { type: 'string' },
              status_os: { type: 'string' },
              notificar: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
        execucoes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              regra_id: { type: 'string' },
              regra_nome: { type: 'string' },
              resultado: { type: 'string' },
              mensagem: { type: 'string' },
              tempo_execucao: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async executarValidacoes(
    @Body() dto: ExecutarValidacaoDto,
    @Request() req: RequestWithUser,
  ) {
    const lojaId = req.user.loja_id;
    return await this.validacaoService.validarOS(
      dto.os_id,
      lojaId,
      dto.regra_ids,
      dto.modo_teste,
    );
  }

  @Post('testar')
  @ApiOperation({ summary: 'Testar validações sem aplicar ações' })
  @ApiResponse({
    status: 200,
    description: 'Teste de validações executado com sucesso',
  })
  async testarValidacoes(
    @Body() dto: ExecutarValidacaoDto,
    @Request() req: RequestWithUser,
  ) {
    const lojaId = req.user.loja_id;
    return await this.validacaoService.validarOS(
      dto.os_id,
      lojaId,
      dto.regra_ids,
      true, // modo teste
    );
  }
}
