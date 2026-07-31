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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Identidade, IdentidadeAutenticada } from '../../auth/decorators';
import { VendasPermissionsGuard } from '../../vendas/permissions/vendas-permissions.guard';
import { RequerPermissaoVendas } from '../../vendas/permissions/requer-permissao-vendas.decorator';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';

import { ChatV2Service } from '../services/chat-v2.service';

/**
 * Controller de Chat V2 para Orçamentos
 * Endpoints para sistema de chat e negociação
 *
 * ✅ ENDPOINTS DE CHAT COMPLETOS
 * ✅ SISTEMA DE NEGOCIAÇÃO
 *
 * Autorização (Gate 0S): todo endpoint declara sua permissão e recebe a loja
 * da identidade autenticada, que é propagada até as consultas do service.
 */
@ApiTags('Orçamentos V2 - Chat')
@Controller('orcamentos-v2/chat')
@UseGuards(JwtAuthGuard, VendasPermissionsGuard)
@ApiBearerAuth()
export class ChatV2Controller {
  constructor(private readonly chatV2Service: ChatV2Service) {}

  /**
   * Envia mensagem no chat do orçamento
   */
  @Post(':orcamentoId/mensagens')
  @HttpCode(HttpStatus.CREATED)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @ApiOperation({
    summary: 'Envia mensagem',
    description: 'Envia mensagem no chat do orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['conteudo'],
      properties: {
        conteudo: { type: 'string', description: 'Conteúdo da mensagem' },
        tipo: {
          type: 'string',
          enum: ['texto', 'sistema', 'notificacao', 'arquivo'],
        },
        anexos: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs dos anexos',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Mensagem enviada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        usuario_id: { type: 'string' },
        tipo: { type: 'string' },
        conteudo: { type: 'string' },
        data_envio: { type: 'string' },
        anexos: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async enviarMensagem(
    @Param('orcamentoId') orcamentoId: string,
    @Body()
    dados: {
      conteudo: string;
      tipo?: string;
      anexos?: string[];
    },
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    try {
      const mensagem = await this.chatV2Service.enviarMensagem(
        orcamentoId,
        identidade.usuarioId,
        identidade.lojaId,
        dados.conteudo,
        dados.tipo as any,
        dados.anexos,
      );

      return {
        success: true,
        message: 'Mensagem enviada com sucesso',
        data: mensagem,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca mensagens do chat
   */
  @Get(':orcamentoId/mensagens')
  @HttpCode(HttpStatus.OK)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({
    summary: 'Busca mensagens',
    description: 'Busca mensagens do chat do orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiQuery({
    name: 'pagina',
    required: false,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'por_pagina',
    required: false,
    description: 'Itens por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagens encontradas',
    schema: {
      type: 'object',
      properties: {
        mensagens: { type: 'array', items: { type: 'object' } },
        total: { type: 'number' },
        pagina: { type: 'number' },
        por_pagina: { type: 'number' },
        nao_lidas: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async buscarMensagens(
    @Param('orcamentoId') orcamentoId: string,
    @Query('pagina') pagina: number = 1,
    @Query('por_pagina') porPagina: number = 50,
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    try {
      const resultado = await this.chatV2Service.buscarMensagens(
        orcamentoId,
        identidade.usuarioId,
        identidade.lojaId,
        pagina,
        porPagina,
      );

      return {
        success: true,
        message: 'Mensagens encontradas',
        data: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca mensagens como lidas
   */
  @Put(':orcamentoId/mensagens/marcar-lidas')
  @HttpCode(HttpStatus.OK)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({
    summary: 'Marca mensagens como lidas',
    description: 'Marca todas as mensagens não lidas como lidas',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Mensagens marcadas como lidas',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        orcamento_id: { type: 'string' },
        usuario_id: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async marcarMensagensComoLidas(
    @Param('orcamentoId') orcamentoId: string,
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    try {
      await this.chatV2Service.marcarMensagensComoLidas(
        orcamentoId,
        identidade.usuarioId,
        identidade.lojaId,
      );

      return {
        success: true,
        message: 'Mensagens marcadas como lidas',
        data: {
          orcamento_id: orcamentoId,
          usuario_id: identidade.usuarioId,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Envia arquivo no chat
   */
  @Post(':orcamentoId/arquivos')
  @HttpCode(HttpStatus.CREATED)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @ApiOperation({
    summary: 'Envia arquivo',
    description: 'Envia arquivo no chat do orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nome_arquivo', 'url_arquivo', 'tamanho', 'tipo_arquivo'],
      properties: {
        nome_arquivo: { type: 'string', description: 'Nome do arquivo' },
        url_arquivo: { type: 'string', description: 'URL do arquivo' },
        tamanho: { type: 'number', description: 'Tamanho em bytes' },
        tipo_arquivo: { type: 'string', description: 'Tipo MIME do arquivo' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Arquivo enviado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        tipo: { type: 'string' },
        conteudo: { type: 'string' },
        anexos: { type: 'array', items: { type: 'string' } },
        dados_extras: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async enviarArquivo(
    @Param('orcamentoId') orcamentoId: string,
    @Body()
    dados: {
      nome_arquivo: string;
      url_arquivo: string;
      tamanho: number;
      tipo_arquivo: string;
    },
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    try {
      const mensagem = await this.chatV2Service.enviarArquivo(
        orcamentoId,
        identidade.usuarioId,
        identidade.lojaId,
        dados.nome_arquivo,
        dados.url_arquivo,
        dados.tamanho,
        dados.tipo_arquivo,
      );

      return {
        success: true,
        message: 'Arquivo enviado com sucesso',
        data: mensagem,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca estatísticas do chat
   */
  @Get(':orcamentoId/estatisticas')
  @HttpCode(HttpStatus.OK)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({
    summary: 'Estatísticas do chat',
    description: 'Retorna estatísticas do chat do orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas encontradas',
    schema: {
      type: 'object',
      properties: {
        total_mensagens: { type: 'number' },
        mensagens_por_tipo: { type: 'object' },
        usuarios_ativos: { type: 'array', items: { type: 'string' } },
        ultima_atividade: { type: 'string' },
        tempo_medio_resposta: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async buscarEstatisticasChat(
    @Param('orcamentoId') orcamentoId: string,
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    try {
      const estatisticas = await this.chatV2Service.buscarEstatisticasChat(
        orcamentoId,
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
   * Busca histórico de negociação
   */
  @Get(':orcamentoId/negociacao/historico')
  @HttpCode(HttpStatus.OK)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({
    summary: 'Histórico de negociação',
    description: 'Retorna histórico de negociação do orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiQuery({
    name: 'data_inicio',
    required: false,
    description: 'Data de início (ISO)',
  })
  @ApiQuery({
    name: 'data_fim',
    required: false,
    description: 'Data de fim (ISO)',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico encontrado',
    schema: {
      type: 'object',
      properties: {
        mensagens: { type: 'array', items: { type: 'object' } },
        resumo: {
          type: 'object',
          properties: {
            total_propostas: { type: 'number' },
            total_contra_propostas: { type: 'number' },
            valor_inicial: { type: 'number' },
            valor_final: { type: 'number' },
            status_negociacao: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async buscarHistoricoNegociacao(
    @Param('orcamentoId') orcamentoId: string,
    @Identidade() identidade: IdentidadeAutenticada,
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
  ) {
    try {
      const historico = await this.chatV2Service.buscarHistoricoNegociacao(
        orcamentoId,
        identidade.lojaId,
        dataInicio ? new Date(dataInicio) : undefined,
        dataFim ? new Date(dataFim) : undefined,
      );

      return {
        success: true,
        message: 'Histórico encontrado',
        data: historico,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }
}
