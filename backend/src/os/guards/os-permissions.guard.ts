/**
 * Guard de permissoes especificas para modulo OS
 * Validacao granular por etapa e acao
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface AuthenticatedRequest {
  user: {
    sub: string; // ID do usuário (conforme JWT global)
    id?: string; // Alias para sub
    loja_id: string;
    funcao: string;
    email: string;
    nome_completo?: string;
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
        throw new ForbiddenException('Usuario nao autenticado');
      }

      // Extrair acao e etapa do request
      const acao = this.extrairAcao(context);
      const etapa = body?.nova_etapa || body?.etapa || params?.etapa;

      // Validar permissao baseada na funcao do usuario
      const userId = user.sub || user.id;
      const permissao = await this.validarPermissaoOS(
        user.funcao,
        acao,
        etapa,
        userId,
      );

      if (!permissao.permitido) {
        this.logger.warn({
          evento: 'ACESSO_NEGADO_OS',
          usuario_id: userId,
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
        usuario_id: userId,
        funcao: user.funcao,
        acao: acao,
        etapa: etapa,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      this.logger.error('Erro no guard de permissoes OS:', error);
      throw error;
    }
  }

  private extrairAcao(context: ExecutionContext): string {
    const handler = context.getHandler().name;
    const controller = context.getClass().name;

    // Mapear metodos para acoes
    const acoes = {
      create: 'CRIAR',
      findAll: 'VISUALIZAR',
      findOne: 'VISUALIZAR',
      update: 'EDITAR',
      remove: 'EXCLUIR',
      avancarEtapa: 'AVANCAR_ETAPA',
      criarWorkflow: 'GERENCIAR_WORKFLOWS',
      updateWorkflow: 'GERENCIAR_WORKFLOWS',
    };

    return acoes[handler] || 'VISUALIZAR';
  }

  private async validarPermissaoOS(
    funcao: string,
    acao: string,
    etapa?: string,
    userId?: string,
  ): Promise<{ permitido: boolean; motivo?: string }> {
    // Regras basicas por funcao (conforme enum usuario_funcao)
    const permissoesPorFuncao = {
      ADMINISTRADOR: ['*'], // Todas as permissoes
      PRODUCAO: [
        'VISUALIZAR',
        'CRIAR',
        'EDITAR',
        'AVANCAR_ETAPA',
        'FINALIZAR_OS',
      ],
      VENDAS: ['VISUALIZAR', 'CRIAR'],
      FINANCEIRO: ['VISUALIZAR'],
      ESTOQUE: [
        'VISUALIZAR',
        'AVANCAR_ETAPA', // Para etapas relacionadas ao estoque
      ],
    };

    const permissoesUsuario = permissoesPorFuncao[funcao] || [];

    // Verificar permissao geral
    if (permissoesUsuario.includes('*') || permissoesUsuario.includes(acao)) {
      return { permitido: true };
    }

    // Validacao especifica por etapa
    if (acao === 'AVANCAR_ETAPA' && etapa) {
      const podeAvancarEtapa = await this.validarPermissaoEtapa(funcao, etapa);
      if (!podeAvancarEtapa.permitido) {
        return podeAvancarEtapa;
      }
    }

    return {
      permitido: false,
      motivo: `Usuario com funcao ${funcao} nao tem permissao para ${acao}`,
    };
  }

  private async validarPermissaoEtapa(
    funcao: string,
    etapa: string,
  ): Promise<{ permitido: boolean; motivo?: string }> {
    // Regras especificas por etapa
    const regrasEtapa = {
      FILA: ['ADMINISTRADOR', 'PRODUCAO', 'VENDAS'],
      PRODUCAO: ['ADMINISTRADOR', 'PRODUCAO'],
      ACABAMENTO: ['ADMINISTRADOR', 'PRODUCAO'],
      FINALIZADA: ['ADMINISTRADOR', 'PRODUCAO'],
      CANCELADA: ['ADMINISTRADOR'],
      AGUARDANDO_MATERIAL: ['ADMINISTRADOR', 'PRODUCAO', 'ESTOQUE'],
      PAUSADA: ['ADMINISTRADOR', 'PRODUCAO'],
    };

    const funcoesPermitidas = regrasEtapa[etapa] || [];
    const podeAvancar = funcoesPermitidas.includes(funcao);

    return {
      permitido: podeAvancar,
      motivo: podeAvancar
        ? undefined
        : `Funcao ${funcao} nao pode avancar para etapa ${etapa}`,
    };
  }
}
