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
    this.logger.debug(
      `Middleware JWT executado para: ${req.method} ${req.path}`,
    );

    // Lista de rotas que nao precisam de autenticacao
    const publicRoutes = [
      '/api/lojas/login',
      '/api/lojas/login/2fa',
      '/api/lojas/health',
      '/api/lojas/verificar-email',
      '/api/lojas/reenviar-verificacao',
      '/api/platform/convites/validar',
      '/api/platform/interesse-beta',
      '/api/usuarios/reenviar-codigo',
      '/api/usuarios/definir-senha',
      '/api/usuarios/solicitar-redefinicao-senha',
      '/api/usuarios/redefinir-senha',
      '/lojas/login',
      '/lojas/login/2fa',
      '/lojas/health',
      '/lojas/verificar-email',
      '/lojas/reenviar-verificacao',
      '/platform/convites/validar',
      '/platform/interesse-beta',
      '/usuarios/reenviar-codigo',
      '/usuarios/definir-senha',
      '/usuarios/solicitar-redefinicao-senha',
      '/usuarios/redefinir-senha',
      '/api/estoque/health',
      '/favicon.ico',
      '/arte-aprovacao/links/public',
      '/api/arte-aprovacao/links/public',
      '/arte-aprovacao/comentarios/public',
      '/api/arte-aprovacao/comentarios/public',
      '/arte-aprovacao/mensagens/publico',
      '/api/arte-aprovacao/mensagens/publico',
    ];

    if (process.env.NODE_ENV !== 'production') {
      publicRoutes.push(
        '/test-validacoes',
        '/test-campos-validacao',
        '/test-os-validacoes',
        '/debug',
        '/debug/validacao-detalhada',
      );
    }

    const isPublicOnboardingCreate =
      req.method === 'POST' && (req.path === '/lojas' || req.path === '/api/lojas');

    if (
      isPublicOnboardingCreate ||
      publicRoutes.some((route) => req.path === route || req.path.startsWith(`${route}/`))
    ) {
      this.logger.debug(`Rota publica: ${req.path}`);
      return next();
    }

    const isPublicOrcamento =
      /^\/(?:api\/)?orcamentos-v2\/[^/]+\/publico(?:\/acao)?$/.test(req.path) ||
      /^\/(?:api\/)?orcamentos-v2\/[^/]+\/reenviar-codigo$/.test(req.path);
    if (isPublicOrcamento) {
      this.logger.debug(`Rota publica do orcamento V2: ${req.path}`);
      return next();
    }

    if (/^\/(?:api\/)?arte-aprovacao\/versoes\/[^/]+\/arquivos\/public\/download\/[^/]+$/.test(req.path)) {
      if (!req.query?.token || typeof req.query.token !== 'string') {
        throw new UnauthorizedException('Token público obrigatório');
      }
      return next();
    }

    this.logger.debug(`Rota protegida: ${req.path}`);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn(`Token nao fornecido para rota: ${req.path}`);
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    const token = authHeader.substring(7);

    try {
      const payload = this.jwtService.verify(token);

      req['user'] = {
        sub: payload.sub,
        email: payload.email,
        loja_id: payload.loja_id,
        funcao: payload.funcao,
        nome_completo: payload.nome_completo,
        loja: {
          id: payload.loja_id,
        },
      };

      next();
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn(`JWT invalido: ${req.method} ${req.path}`);
      } else {
        this.logger.error(`Erro na validacao JWT: ${error.message}`);
        this.logger.error(`Debug trace: ${error.stack}`);
      }
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
