import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGlobalMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtGlobalMiddleware.name);

  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // this.logger.debug(`🔒 Middleware JWT executado para: ${req.method} ${req.path}`);
    
    // Lista de rotas que não precisam de autenticação
    const publicRoutes = [
      '/lojas/login',
      '/lojas', // permitir cadastro (POST /lojas)
      '/lojas/health',
      '/api/estoque/health',
      '/favicon.ico',
    ];

    // Verificar se a rota é pública
    if (publicRoutes.some((route) => req.path.startsWith(route))) {
      // this.logger.debug(`✅ Rota pública: ${req.path}`);
      return next();
    }

    // Verificar rotas públicas específicas do orçamento V2
    if (req.path.includes('/orcamentos-v2/') && (
      req.path.includes('/publico') || 
      req.path.includes('/reenviar-codigo')
    )) {
      // this.logger.debug(`✅ Rota pública do orçamento V2: ${req.path}`);
      return next();
    }

    // this.logger.debug(`🔐 Rota protegida: ${req.path}`);

    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    // this.logger.debug(`📋 Header Authorization: ${authHeader ? 'Presente' : 'Ausente'}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn(`❌ Token não fornecido para rota: ${req.path}`);
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    const token = authHeader.substring(7);
    // this.logger.debug(`🔑 Token extraído: ${token.substring(0, 20)}...`);

    try {
      // Validar token JWT
      // this.logger.debug('🔍 Validando token JWT...');
      const payload = this.jwtService.verify(token);
              // this.logger.debug(`✅ Token válido para usuário: ${payload.sub} (${payload.email})`);

      // Adicionar informações do usuário ao request
      req['user'] = {
        sub: payload.sub,
        email: payload.email,
        loja_id: payload.loja_id,
        funcao: payload.funcao,
        nome_completo: payload.nome_completo,
        loja: {
          id: payload.loja_id,
          // Outras propriedades da loja podem ser adicionadas aqui
        },
      };

              // this.logger.debug(`👤 Usuário autenticado: ${payload.nome_completo} (Loja: ${payload.loja_id})`);
      next();
    } catch (error) {
      this.logger.error(`❌ Erro na validação JWT: ${error.message}`);
      this.logger.error(`🔍 Stack trace: ${error.stack}`);
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
