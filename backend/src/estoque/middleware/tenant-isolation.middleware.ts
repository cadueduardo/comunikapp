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
import { timingSafeEqual } from 'crypto';

export interface EstoqueRequest extends Request {
  estoque?: {
    lojaId: string;
    usuarioId?: string;
    roles?: string[];
  };
}

@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantIsolationMiddleware.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  use(req: EstoqueRequest, res: Response, next: NextFunction) {
    this.logger.debug(`Estoque tenant isolation: ${req.method} ${req.url}`);

    try {
      // 1. VALIDAÇÃO DE TOKEN INTERNO (comunicação entre módulos)
      const internalToken = this.headerAsString(
        req.headers['x-internal-token'],
      );
      const expectedToken = this.configService.get<string>(
        'ESTOQUE_INTERNAL_API_TOKEN',
      );

      if (internalToken) {
        if (!this.isInternalTokenConfigured(expectedToken)) {
          throw new UnauthorizedException(
            'Token interno do estoque não configurado com segurança',
          );
        }

        if (!this.secureCompare(internalToken, expectedToken)) {
          throw new UnauthorizedException('Token interno inválido');
        }

        const lojaId = this.headerAsString(req.headers['x-loja-id']);
        if (!lojaId) {
          throw new BadRequestException(
            'x-loja-id é obrigatório para chamadas internas do estoque',
          );
        }

        // Token interno válido - bypass para comunicação entre módulos
        req.estoque = {
          lojaId,
          usuarioId: this.headerAsString(req.headers['x-usuario-id']),
          roles: ['INTERNO'],
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
        const secret = getRequiredJwtSecret(this.configService);

        const payload = this.jwtService.verify(token, {
          secret: secret,
        });

        // 4. EXTRAÇÃO DE DADOS DO PAYLOAD JWT
        const headerLojaId = this.headerAsString(req.headers['x-loja-id']);
        const headerRoles = this.headerAsString(req.headers['x-user-roles']);
        const payloadLojaId = payload?.loja_id || payload?.lojaId;
        const lojaId = payloadLojaId;

        if (!lojaId) {
          this.logger.warn('Estoque JWT sem loja_id no payload');
          throw new BadRequestException(
            'lojaId é obrigatório para operações de estoque',
          );
        }

        const usuarioId = payload.sub; // user id
        const funcao = payload.funcao; // função do usuário

        if (headerLojaId && headerLojaId !== lojaId) {
          this.logger.warn(
            `Tentativa de troca de loja via header no estoque: user=${usuarioId} payloadLoja=${lojaId} headerLoja=${headerLojaId} rota=${req.method} ${req.path}`,
          );
        }

        if (headerRoles) {
          this.logger.warn(
            `Header x-user-roles ignorado no estoque: user=${usuarioId} loja=${lojaId} funcao=${funcao} rota=${req.method} ${req.path}`,
          );
        }

        // 6. MAPEAMENTO DE FUNÇÃO PARA ROLES E VALIDAÇÃO DE PERMISSÕES
        const rolesSource = this.mapearFuncaoParaRoles(funcao);
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
        this.logger.log(
          `Acesso ao estoque: user=${usuarioId} loja=${lojaId} funcao=${funcao} roles=${rolesSource.join(',')}`,
        );

        next();
      } catch (jwtError) {
        this.logger.warn(`JWT inválido no estoque: ${jwtError.message}`);
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
      this.logger.warn(`Erro de isolamento de tenant: ${error.message}`);
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

  private headerAsString(
    value: string | string[] | undefined,
  ): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
  }

  private isInternalTokenConfigured(token?: string): boolean {
    return typeof token === 'string' && token.trim().length >= 32;
  }

  private secureCompare(received: string, expected: string): boolean {
    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);
    if (receivedBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(receivedBuffer, expectedBuffer);
  }
}
