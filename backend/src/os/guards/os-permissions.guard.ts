/**
 * Guard de permissões específicas para módulo OS
 * Validação granular por etapa e ação
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface AuthenticatedRequest {
  user: {
    id: string;
    loja_id: string;
    funcao: string;
    email: string;
  };
  lojaId: string;
  body?: any;
  params?: any;
}

@Injectable()
export class OSPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(OSPermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
      const { user, body, params } = request;

      if (!user) {
        throw new ForbiddenException('Usuário não autenticado');
      }

      // Extrair ação e etapa do request
      const acao = this.extrairAcao(context);
      const etapa = body?.nova_etapa || body?.etapa || params?.etapa;

      // Validar permissão baseada na função do usuário
      const permissao = await this.validarPermissaoOS(
        user.funcao,
        acao,
        etapa,
        user.id,
      );

      if (!permissao.permitido) {
        this.logger.warn({
          evento: 'ACESSO_NEGADO_OS',
          usuario_id: user.id,
          funcao: user.funcao,
          acao: acao,
          etapa: etapa,
          motivo: permissao.motivo,
          timestamp: new Date().toISOString(),
        });

        throw new ForbiddenException(permissao.motivo);
      }

      // Log de acesso autorizado
      this.logger.log({
        evento: 'ACESSO_AUTORIZADO_OS',
        usuario_id: user.id,
        funcao: user.funcao,
        acao: acao,
        etapa: etapa,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      this.logger.error('Erro no guard de permissões OS:', error);
      throw error;
    }
  }

  private extrairAcao(context: ExecutionContext): string {
    const handler = context.getHandler().name;
    const controller = context.getClass().name;
    
    // Mapear métodos para ações
    const acoes = {
      'create': 'CRIAR',
      'findAll': 'VISUALIZAR',
      'findOne': 'VISUALIZAR',
      'update': 'EDITAR',
      'remove': 'EXCLUIR',
      'avancarEtapa': 'AVANCAR_ETAPA',
      'criarWorkflow': 'GERENCIAR_WORKFLOWS',
      'updateWorkflow': 'GERENCIAR_WORKFLOWS',
    };

    return acoes[handler] || 'VISUALIZAR';
  }

  private async validarPermissaoOS(
    funcao: string,
    acao: string,
    etapa?: string,
    userId?: string,
  ): Promise<{ permitido: boolean; motivo?: string }> {
    
    // Regras básicas por função (conforme enum usuario_funcao)
    const permissoesPorFuncao = {
      'ADMINISTRADOR': ['*'], // Todas as permissões
      'PRODUCAO': [
        'VISUALIZAR',
        'CRIAR',
        'EDITAR',
        'AVANCAR_ETAPA',
        'FINALIZAR_OS',
      ],
      'VENDAS': [
        'VISUALIZAR',
        'CRIAR',
      ],
      'FINANCEIRO': [
        'VISUALIZAR',
      ],
      'ESTOQUE': [
        'VISUALIZAR',
        'AVANCAR_ETAPA', // Para etapas relacionadas ao estoque
      ],
    };

    const permissoesUsuario = permissoesPorFuncao[funcao] || [];

    // Verificar permissão geral
    if (permissoesUsuario.includes('*') || permissoesUsuario.includes(acao)) {
      return { permitido: true };
    }

    // Validação específica por etapa
    if (acao === 'AVANCAR_ETAPA' && etapa) {
      const podeAvancarEtapa = await this.validarPermissaoEtapa(funcao, etapa);
      if (!podeAvancarEtapa.permitido) {
        return podeAvancarEtapa;
      }
    }

    return {
      permitido: false,
      motivo: `Usuário com função ${funcao} não tem permissão para ${acao}`,
    };
  }

  private async validarPermissaoEtapa(
    funcao: string,
    etapa: string,
  ): Promise<{ permitido: boolean; motivo?: string }> {
    
    // Regras específicas por etapa
    const regrasEtapa = {
      'FILA': ['ADMINISTRADOR', 'PRODUCAO', 'VENDAS'],
      'PRODUCAO': ['ADMINISTRADOR', 'PRODUCAO'],
      'ACABAMENTO': ['ADMINISTRADOR', 'PRODUCAO'],
      'FINALIZADA': ['ADMINISTRADOR', 'PRODUCAO'],
      'CANCELADA': ['ADMINISTRADOR'],
      'AGUARDANDO_MATERIAL': ['ADMINISTRADOR', 'PRODUCAO', 'ESTOQUE'],
      'PAUSADA': ['ADMINISTRADOR', 'PRODUCAO'],
    };

    const funcoesPermitidas = regrasEtapa[etapa] || [];
    const podeAvancar = funcoesPermitidas.includes(funcao);

    return {
      permitido: podeAvancar,
      motivo: podeAvancar 
        ? undefined 
        : `Função ${funcao} não pode avançar para etapa ${etapa}`,
    };
  }
}
