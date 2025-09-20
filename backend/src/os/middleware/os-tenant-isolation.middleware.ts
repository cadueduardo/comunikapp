/**
 * Middleware de isolamento multi-tenant para módulo OS
 * Conforme premissas: isolamento obrigatório por lojaId
 */

import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    loja_id: string;
    funcao: string;
    email: string;
  };
  lojaId?: string;
}

@Injectable()
export class OSTenantIsolationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(OSTenantIsolationMiddleware.name);

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // 1. Verificar se usuário está autenticado
      if (!req.user) {
        this.logger.warn('Tentativa de acesso sem autenticação ao módulo OS');
        throw new UnauthorizedException('Usuário não autenticado');
      }

      // 2. Extrair loja_id do usuário autenticado
      const lojaId = req.user.loja_id;
      if (!lojaId) {
        this.logger.warn(`Usuário ${req.user.id} sem loja_id definida`);
        throw new UnauthorizedException('Loja ID obrigatório para acesso ao módulo OS');
      }

      // 3. Adicionar lojaId ao request para uso nos services
      req.lojaId = lojaId;

      // 4. Log de auditoria (conforme premissas)
      this.logger.log({
        evento: 'ACESSO_MODULO_OS',
        usuario_id: req.user.id,
        loja_id: lojaId,
        funcao: req.user.funcao,
        rota: req.originalUrl,
        metodo: req.method,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });

      next();
    } catch (error) {
      this.logger.error('Erro no middleware de isolamento OS:', error);
      throw error;
    }
  }
}
