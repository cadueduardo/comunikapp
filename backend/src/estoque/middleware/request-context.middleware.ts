import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestContextMiddleware.name);

  use(req: Request & { estoque?: any; correlationId?: string }, res: Response, next: NextFunction) {
    const incomingId = (req.headers['x-correlation-id'] as string) || '';
    const correlationId = incomingId && incomingId.trim().length > 0
      ? incomingId.trim()
      : `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    req.correlationId = correlationId;
    req.estoque = req.estoque || {};
    req.estoque.correlationId = correlationId;

    // Propagar no response para facilitar rastreio em clientes
    res.setHeader('x-correlation-id', correlationId);

    this.logger.debug(`➡️  Request iniciado ${req.method} ${req.url} cid=${correlationId}`);
    res.on('close', () => {
      this.logger.debug(`⬅️  Request finalizado ${req.method} ${req.url} cid=${correlationId} status=${res.statusCode}`);
    });

    next();
  }
}


