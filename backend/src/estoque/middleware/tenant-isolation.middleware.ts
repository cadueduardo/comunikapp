/**
 * Middleware de isolamento de tenant para módulo de estoque
 * Garante que todas as operações sejam filtradas por lojaId
 * Implementa segurança obrigatória conforme premissas
 */

import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRequiredJwtSecret } from '../../auth/jwt-secret';

export interface EstoqueRequest extends Request {
  estoque?: {
    lojaId: string;
    usuarioId?: string;
    roles?: string[];
  };
}

@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  use(req: EstoqueRequest, res: Response, next: NextFunction) {
    const logger = new Logger(TenantIsolationMiddleware.name);
    logger.debug('🔒 Middleware de isolamento de tenant executado');
    logger.debug(`📍 URL: ${req.url}`);
    logger.debug(`🔑 Headers: ${JSON.stringify(req.headers)}`);

    try {
      // 1. VALIDAÇÃO DE TOKEN INTERNO (comunicação entre módulos)
      const internalToken = req.headers['x-internal-token'];
      const expectedToken = this.configService.get(
        'ESTOQUE_INTERNAL_API_TOKEN',
      );

      if (internalToken && internalToken === expectedToken) {
        // Token interno válido - bypass para comunicação entre módulos
        req.estoque = {
          lojaId: req.headers['x-loja-id'] as string,
          usuarioId: req.headers['x-usuario-id'] as string,
        };
        return next();
      }

      // 2. VALIDAÇÃO DE AUTENTICAÇÃO JWT (usuários normais)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException(
          'Token de autenticação requerido para acesso ao estoque',
        );
      }

      // 3. EXTRAÇÃO E VALIDAÇÃO DO TOKEN JWT
      const token = authHeader.substring(7); // Remove 'Bearer '

      try {
        logger.debug('🔍 Validando token JWT...');
        logger.debug(`🔑 Token recebido: ${token.substring(0, 50)}...`);

        const secret = getRequiredJwtSecret(this.configService);

        const payload = this.jwtService.verify(token, {
          secret: secret,
        });

        logger.debug(`📋 Payload JWT: ${JSON.stringify(payload)}`);

        // 4. EXTRAÇÃO DE DADOS DO PAYLOAD JWT
        const headerLojaId = req.headers['x-loja-id'] as string | undefined;
        const headerRoles = (req.headers['x-user-roles'] as string | undefined)
          ?.split(',')
          .map((r) => r.trim())
          .filter(Boolean);

        // Fallback seguro: usar loja do payload quando header não vier (evita 400 no dev)
        const payloadLojaId = payload?.loja_id || payload?.lojaId;
        const lojaId = headerLojaId || payloadLojaId;
        if (!lojaId) {
          logger.error('❌ LojaId ausente (header e payload)');
          throw new BadRequestException(
            'lojaId é obrigatório para operações de estoque',
          );
        }

        const usuarioId = payload.sub; // user id
        const funcao = payload.funcao; // função do usuário

        logger.debug(`🏪 LojaId: ${lojaId}`);
        logger.debug(`👤 UsuarioId: ${usuarioId}`);
        logger.debug(`🔧 Função: ${funcao}`);

        // 5. VALIDAÇÃO DE TENANT (lojaId obrigatório) – já garantido via header

        // 6. MAPEAMENTO DE FUNÇÃO PARA ROLES E VALIDAÇÃO DE PERMISSÕES
        // Fallback: mapear função quando header de roles não vier
        const rolesSource =
          headerRoles && headerRoles.length > 0
            ? headerRoles
            : this.mapearFuncaoParaRoles(funcao);
        const normalizedUserRoles = rolesSource.map((r) =>
          r.trim().toLowerCase(),
        );
        const allowedRoles = this.configService
          .get('ESTOQUE_ALLOWED_ROLES', 'ADMINISTRADOR,FINANCEIRO,ESTOQUE')
          .split(',')
          .map((r) => r.trim().toLowerCase());
        const hasPermission = normalizedUserRoles.some((role) =>
          allowedRoles.includes(role),
        );

        if (!hasPermission) {
          throw new UnauthorizedException(
            `Permissão insuficiente. Funções necessárias: ${allowedRoles.join(',')}`,
          );
        }

        // 7. CONFIGURAÇÃO DO CONTEXTO DE ESTOQUE
        req.estoque = {
          lojaId,
          usuarioId,
          roles: rolesSource,
        };

        // 8. LOG DE AUDITORIA (logs completos e rastreáveis)
        logger.log(
          `🔒 Acesso ao estoque: Usuário ${usuarioId} | Loja ${lojaId} | Função ${funcao} | Roles ${rolesSource.join(',')}`,
        );

        next();
      } catch (jwtError) {
        logger.error(`❌ Erro na validação do JWT: ${jwtError.message}`);
        if (
          jwtError instanceof UnauthorizedException ||
          jwtError instanceof BadRequestException
        ) {
          throw jwtError;
        }
        throw new UnauthorizedException('Token JWT inválido ou expirado');
      }
    } catch (error) {
      // 9. TRATAMENTO DE ERROS DE SEGURANÇA
      const logger = new Logger(TenantIsolationMiddleware.name);
      logger.error(`❌ Erro de isolamento de tenant: ${error.message}`);
      res.status(error.status || 500).json({
        message: error.message,
        module: 'estoque',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Mapeia a função do usuário para roles de acesso
   * ADMINISTRADOR tem acesso total
   * FINANCEIRO tem acesso administrativo
   * ESTOQUE tem acesso específico ao módulo
   * PRODUCAO e VENDAS podem ter acesso limitado
   */
  private mapearFuncaoParaRoles(funcao: string): string[] {
    const mapeamento: Record<string, string[]> = {
      ADMINISTRADOR: [
        'ADMINISTRADOR',
        'FINANCEIRO',
        'ESTOQUE',
        'PRODUCAO',
        'VENDAS',
      ],
      FINANCEIRO: ['FINANCEIRO', 'ESTOQUE'],
      ESTOQUE: ['ESTOQUE'],
      PRODUCAO: ['PRODUCAO', 'ESTOQUE'], // Produção pode acessar estoque para verificar materiais
      VENDAS: ['VENDAS'], // Vendas tem acesso limitado
    };

    return mapeamento[funcao] || [funcao];
  }
}
