/**
 * Middleware de isolamento multi-tenant para modulo OS
 * Conforme premissas: isolamento obrigatorio por lojaId
 */

import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string; // ID do usuário (conforme JWT global)
    id?: string; // Alias para sub
    loja_id: string;
    funcao: string;
    email: string;
    nome_completo?: string;
  };
  lojaId?: string;
}

@Injectable()
export class OSTenantIsolationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(OSTenantIsolationMiddleware.name);

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // 1. Verificar se usuario esta autenticado (usando a mesma chave do JWT global)
      const user = req['user'] || req.user;
      if (!user) {
        this.logger.warn('Tentativa de acesso sem autenticacao ao modulo OS');
        throw new UnauthorizedException('Usuario nao autenticado');
      }

      // 2. Extrair loja_id do usuario autenticado
      const lojaId = user.loja_id;
      if (!lojaId) {
        const userId = user.sub || user.id;
        this.logger.warn(`Usuario ${userId} sem loja_id definida`);
        throw new UnauthorizedException(
          'Loja ID obrigatorio para acesso ao modulo OS',
        );
      }

      // 3. Adicionar lojaId ao request para uso nos services
      req.lojaId = lojaId;
      req.user = user; // Garantir que req.user esteja populado

      // 4. Log de auditoria (conforme premissas)
      const userId = user.sub || user.id;
      this.logger.log({
        evento: 'ACESSO_MODULO_OS',
        usuario_id: userId,
        loja_id: lojaId,
        funcao: user.funcao,
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
