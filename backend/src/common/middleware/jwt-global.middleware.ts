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
      `ðŸ”’ Middleware JWT executado para: ${req.method} ${req.path}`,
    );

    // Lista de rotas que nÃ£o precisam de autenticaÃ§Ã£o
    const publicRoutes = [
      '/api/lojas/login',
      '/api/lojas/login/2fa',
      '/api/lojas/health',
      '/api/lojas/verificar-email',
      '/api/platform/convites/validar',
      '/api/usuarios/reenviar-codigo',
      '/api/usuarios/definir-senha',
      '/api/usuarios/solicitar-redefinicao-senha',
      '/api/usuarios/redefinir-senha',
      '/lojas/login',
      '/lojas/login/2fa',
      '/lojas/health',
      '/lojas/verificar-email',
      '/platform/convites/validar',
      '/usuarios/reenviar-codigo',
      '/usuarios/definir-senha',
      '/usuarios/solicitar-redefinicao-senha',
      '/usuarios/redefinir-senha',
      '/api/estoque/health',
      '/favicon.ico',
      '/arte-aprovacao/links/public', // Rotas pÃºblicas de aprovaÃ§Ã£o de arte
      '/api/arte-aprovacao/links/public',
      '/arte-aprovacao/comentarios/public', // Rotas pÃºblicas de comentÃ¡rios
      '/api/arte-aprovacao/comentarios/public',
      '/arte-aprovacao/mensagens/publico', // Rotas pÃºblicas de mensagens
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

    // Verificar se a rota Ã© pÃºblica
    if (
      isPublicOnboardingCreate ||
      publicRoutes.some((route) => req.path === route || req.path.startsWith(`${route}/`))
    ) {
      this.logger.debug(`âœ… Rota pÃºblica: ${req.path}`);
      return next();
    }

    // Verificar rotas pÃºblicas especÃ­ficas do orÃ§amento V2
    // Suporta tanto /orcamentos-v2 quanto /api/orcamentos-v2
    const isPublicOrcamento =
      /^\/(?:api\/)?orcamentos-v2\/[^/]+\/publico(?:\/acao)?$/.test(req.path) ||
      /^\/(?:api\/)?orcamentos-v2\/[^/]+\/reenviar-codigo$/.test(req.path);
    if (isPublicOrcamento) {
      this.logger.debug(`âœ… Rota pÃºblica do orÃ§amento V2: ${req.path}`);
      return next();
    }

    // Download pÃºblico de arte exige token no prÃ³prio endpoint.
    if (/^\/(?:api\/)?arte-aprovacao\/versoes\/[^/]+\/arquivos\/public\/download\/[^/]+$/.test(req.path)) {
      if (!req.query?.token || typeof req.query.token !== 'string') {
        throw new UnauthorizedException('Token pÃºblico obrigatÃ³rio');
      }
      return next();
    }

    this.logger.debug(`ðŸ” Rota protegida: ${req.path}`);

    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    // this.logger.debug(`ðŸ“‹ Header Authorization: ${authHeader ? 'Presente' : 'Ausente'}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn(`âŒ Token nÃ£o fornecido para rota: ${req.path}`);
      throw new UnauthorizedException('Token de autenticaÃ§Ã£o nÃ£o fornecido');
    }

    const token = authHeader.substring(7);
    // this.logger.debug(`ðŸ”‘ Token extraÃ­do: ${token.substring(0, 20)}...`);

    try {
      // Validar token JWT
      // this.logger.debug('ðŸ” Validando token JWT...');
      const payload = this.jwtService.verify(token);
      // this.logger.debug(`âœ… Token vÃ¡lido para usuÃ¡rio: ${payload.sub} (${payload.email})`);

      // Adicionar informaÃ§Ãµes do usuÃ¡rio ao request
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

      // this.logger.debug(`ðŸ‘¤ UsuÃ¡rio autenticado: ${payload.nome_completo} (Loja: ${payload.loja_id})`);
      next();
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn(`JWT invÃ¡lido: ${req.method} ${req.path}`);
      } else {
        this.logger.error(`âŒ Erro na validaÃ§Ã£o JWT: ${error.message}`);
        this.logger.error(`ðŸ” Debug trace: ${error.stack}`);
      }
      throw new UnauthorizedException('Token invÃ¡lido ou expirado');
    }
  }
}
