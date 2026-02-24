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
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser as User } from '../../auth/decorators';

import { LinksV2Service } from '../services/links-v2.service';

/**
 * Controller de Links V2 para Orçamentos
 * Endpoints para links públicos e compartilhamento
 *
 * ✅ ARQUIVO ≤ 200 LINHAS (CONFORME PREMISSAS)
 * ✅ ENDPOINTS DE LINKS COMPLETOS
 * ✅ SISTEMA DE COMPARTILHAMENTO
 */
@ApiTags('Orçamentos V2 - Links')
@Controller('orcamentos-v2/links')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LinksV2Controller {
  constructor(private readonly linksV2Service: LinksV2Service) {}

  /**
   * Cria link público para orçamento
   */
  @Post(':orcamentoId')
  @HttpCode(HttpStatus.CREATED)
  @Roles('orcamentos.links.criar')
  @ApiOperation({
    summary: 'Cria link público',
    description: 'Cria link público para compartilhamento do orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['permissoes'],
      properties: {
        permissoes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Permissões do link',
        },
        data_expiracao: {
          type: 'string',
          description: 'Data de expiração (ISO)',
        },
        max_visualizacoes: {
          type: 'number',
          description: 'Máximo de visualizações',
        },
        senha: { type: 'string', description: 'Senha de acesso (opcional)' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Link público criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        token: { type: 'string' },
        url_publica: { type: 'string' },
        permissoes: { type: 'array', items: { type: 'string' } },
        data_expiracao: { type: 'string' },
        max_visualizacoes: { type: 'number' },
        senha: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async criarLinkPublico(
    @Param('orcamentoId') orcamentoId: string,
    @Body()
    dados: {
      permissoes: string[];
      data_expiracao?: string;
      max_visualizacoes?: number;
      senha?: string;
    },
    @User() usuario: any,
  ) {
    try {
      const link = await this.linksV2Service.criarLinkPublico(
        orcamentoId,
        usuario.id,
        dados.permissoes as any,
        dados.data_expiracao ? new Date(dados.data_expiracao) : undefined,
        dados.max_visualizacoes,
        dados.senha,
      );

      return {
        success: true,
        message: 'Link público criado com sucesso',
        data: {
          ...link,
          url_publica: `/orcamento-v2/publico/${link.token}`,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lista links públicos de um orçamento
   */
  @Get(':orcamentoId')
  @HttpCode(HttpStatus.OK)
  @Roles('orcamentos.links.consultar')
  @ApiOperation({
    summary: 'Lista links públicos',
    description: 'Lista todos os links públicos de um orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Links encontrados',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          token: { type: 'string' },
          permissoes: { type: 'array', items: { type: 'string' } },
          data_expiracao: { type: 'string' },
          max_visualizacoes: { type: 'number' },
          visualizacoes: { type: 'number' },
          ativo: { type: 'boolean' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async listarLinksPublicos(
    @Param('orcamentoId') orcamentoId: string,
    @User() usuario: any,
  ) {
    try {
      const links = await this.linksV2Service.listarLinksPublicos(
        orcamentoId,
        usuario.id,
      );

      return {
        success: true,
        message: 'Links encontrados',
        data: links,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza link público
   */
  @Put(':linkId')
  @HttpCode(HttpStatus.OK)
  @Roles('orcamentos.links.editar')
  @ApiOperation({
    summary: 'Atualiza link público',
    description: 'Atualiza configurações de um link público',
  })
  @ApiParam({ name: 'linkId', description: 'ID do link público' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        permissoes: { type: 'array', items: { type: 'string' } },
        data_expiracao: { type: 'string' },
        max_visualizacoes: { type: 'number' },
        senha: { type: 'string' },
        ativo: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Link atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        token: { type: 'string' },
        permissoes: { type: 'array', items: { type: 'string' } },
        data_expiracao: { type: 'string' },
        max_visualizacoes: { type: 'number' },
        ativo: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Link não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async atualizarLinkPublico(
    @Param('linkId') linkId: string,
    @Body()
    dados: {
      permissoes?: string[];
      data_expiracao?: string;
      max_visualizacoes?: number;
      senha?: string;
      ativo?: boolean;
    },
    @User() usuario: any,
  ) {
    try {
      const link = await this.linksV2Service.atualizarLinkPublico(
        linkId,
        usuario.id,
        {
          permissoes: dados.permissoes as any,
          dataExpiracao: dados.data_expiracao
            ? new Date(dados.data_expiracao)
            : undefined,
          maxVisualizacoes: dados.max_visualizacoes,
          senha: dados.senha,
          ativo: dados.ativo,
        },
      );

      return {
        success: true,
        message: 'Link atualizado com sucesso',
        data: link,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove link público
   */
  @Delete(':linkId')
  @HttpCode(HttpStatus.OK)
  @Roles('orcamentos.links.remover')
  @ApiOperation({
    summary: 'Remove link público',
    description: 'Remove (desativa) um link público',
  })
  @ApiParam({ name: 'linkId', description: 'ID do link público' })
  @ApiResponse({
    status: 200,
    description: 'Link removido com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        link_id: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Link não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async removerLinkPublico(
    @Param('linkId') linkId: string,
    @User() usuario: any,
  ) {
    try {
      await this.linksV2Service.removerLinkPublico(linkId, usuario.id);

      return {
        success: true,
        message: 'Link removido com sucesso',
        data: {
          link_id: linkId,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca estatísticas dos links
   */
  @Get(':orcamentoId/estatisticas')
  @HttpCode(HttpStatus.OK)
  @Roles('orcamentos.links.consultar')
  @ApiOperation({
    summary: 'Estatísticas dos links',
    description: 'Retorna estatísticas dos links públicos de um orçamento',
  })
  @ApiParam({ name: 'orcamentoId', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas encontradas',
    schema: {
      type: 'object',
      properties: {
        total_links: { type: 'number' },
        links_ativos: { type: 'number' },
        total_visualizacoes: { type: 'number' },
        links_por_permissao: { type: 'object' },
        links_expirados: { type: 'number' },
        links_com_senha: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async buscarEstatisticasLinks(
    @Param('orcamentoId') orcamentoId: string,
    @User() usuario: any,
  ) {
    try {
      const estatisticas = await this.linksV2Service.buscarEstatisticasLinks(
        orcamentoId,
        usuario.id,
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
   * Busca histórico de acessos de um link
   */
  @Get(':linkId/acessos')
  @HttpCode(HttpStatus.OK)
  @Roles('orcamentos.links.consultar')
  @ApiOperation({
    summary: 'Histórico de acessos',
    description: 'Retorna histórico de acessos de um link público',
  })
  @ApiParam({ name: 'linkId', description: 'ID do link público' })
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
    description: 'Histórico encontrado',
    schema: {
      type: 'object',
      properties: {
        acessos: { type: 'array', items: { type: 'object' } },
        total: { type: 'number' },
        pagina: { type: 'number' },
        por_pagina: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Link não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async buscarHistoricoAcessos(
    @Param('linkId') linkId: string,
    @Query('pagina') pagina: number = 1,
    @Query('por_pagina') porPagina: number = 50,
    @User() usuario: any,
  ) {
    try {
      const historico = await this.linksV2Service.buscarHistoricoAcessos(
        linkId,
        usuario.id,
        pagina,
        porPagina,
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

  /**
   * Acessa link público (sem autenticação)
   */
  @Get('publico/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Acessa link público',
    description: 'Acessa orçamento através de link público',
  })
  @ApiParam({ name: 'token', description: 'Token do link público' })
  @ApiQuery({
    name: 'senha',
    required: false,
    description: 'Senha do link (se aplicável)',
  })
  @ApiResponse({
    status: 200,
    description: 'Orçamento acessado com sucesso',
    schema: {
      type: 'object',
      properties: {
        link: { type: 'object' },
        orcamento: { type: 'object' },
        permissoes: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Senha obrigatória' })
  @ApiResponse({ status: 403, description: 'Senha incorreta' })
  @ApiResponse({ status: 404, description: 'Link não encontrado' })
  @ApiResponse({ status: 410, description: 'Link expirado' })
  @ApiResponse({ status: 429, description: 'Limite de visualizações atingido' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async acessarLinkPublico(
    @Param('token') token: string,
    @Query('senha') senha?: string,
    @Query('ip') ip?: string,
    @Query('user_agent') userAgent?: string,
  ) {
    try {
      const resultado = await this.linksV2Service.acessarLinkPublico(
        token,
        senha,
        ip,
        userAgent,
      );

      return {
        success: true,
        message: 'Orçamento acessado com sucesso',
        data: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }
}
