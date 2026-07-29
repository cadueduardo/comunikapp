import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { extractJwtFromRequest } from '../../auth/session-cookie';
import {
  extractTenantSlugFromHost,
  extractTenantSlugFromOrigin,
} from '../../lojas/tenant-host';

@Injectable()
export class JwtGlobalMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtGlobalMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
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
      '/api/lojas/public/by-slug',
      '/api/lojas/public/by-host',
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
      '/lojas/public/by-slug',
      '/lojas/public/by-host',
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
      '/conexoes/google/callback',
      '/api/conexoes/google/callback',
      '/public/v1/product-updates',
      '/api/public/v1/product-updates',
    ];

    // A Gestão usa identidade, estratégia JWT, cookie e sessão próprios.
    // Cada rota administrativa é protegida pelos guards do AdminModule.
    if (
      req.path === '/admin/v1' ||
      req.path.startsWith('/admin/v1/') ||
      req.path === '/api/admin/v1' ||
      req.path.startsWith('/api/admin/v1/')
    ) {
      return next();
    }

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
      req.method === 'POST' &&
      (req.path === '/lojas' || req.path === '/api/lojas');

    if (
      isPublicOnboardingCreate ||
      publicRoutes.some(
        (route) => req.path === route || req.path.startsWith(`${route}/`),
      )
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

    if (
      /^\/(?:api\/)?arte-aprovacao\/versoes\/[^/]+\/arquivos\/public\/download\/[^/]+$/.test(
        req.path,
      )
    ) {
      const rawToken = req.query?.token;
      const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
      if (!token || typeof token !== 'string') {
        throw new UnauthorizedException('Token público obrigatório');
      }
      req.query.token = token;
      return next();
    }

    this.logger.debug(`Rota protegida: ${req.path}`);

    const token = extractJwtFromRequest(req);

    if (!token) {
      this.logger.warn(`Token nao fornecido para rota: ${req.path}`);
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    try {
      const payload = this.jwtService.verify(token);

      if (
        !payload?.sub ||
        !payload?.loja_id ||
        payload?.typ === 'admin' ||
        payload?.sid
      ) {
        throw new UnauthorizedException('Token de loja inválido');
      }

      const usuario = await this.prisma.usuario.findFirst({
        where: {
          id: payload.sub,
          loja_id: payload.loja_id,
          status: 'ATIVO',
          ativo: true,
          email_verificado: true,
        },
        select: {
          id: true,
          email: true,
          loja_id: true,
          funcao: true,
          nome_completo: true,
          loja: {
            select: {
              id: true,
              nome: true,
              slug: true,
              status: true,
              session_version: true,
            },
          },
        },
      });

      if (!usuario) {
        throw new UnauthorizedException('Usuário inativo ou sessão inválida');
      }

      if (usuario.loja.status !== 'ATIVO') {
        throw new ForbiddenException(
          'O acesso desta loja está temporariamente indisponível. Entre em contato com o suporte.',
        );
      }

      if (
        (payload.loja_session_version ?? 0) !==
        usuario.loja.session_version
      ) {
        throw new UnauthorizedException(
          'Sessão revogada. Faça login novamente.',
        );
      }

      req['user'] = {
        sub: usuario.id,
        email: usuario.email,
        loja_id: usuario.loja_id,
        funcao: usuario.funcao,
        nome_completo: usuario.nome_completo,
        loja: usuario.loja,
      };

      const headerSlug = req.headers['x-tenant-slug'];
      const fromHeader =
        typeof headerSlug === 'string' ? headerSlug.trim().toLowerCase() : null;
      const tenantSlug =
        fromHeader ||
        extractTenantSlugFromOrigin(req.headers.origin) ||
        extractTenantSlugFromHost(req.headers['x-forwarded-host'] as string) ||
        extractTenantSlugFromHost(req.headers.host);

      if (tenantSlug) {
        if (usuario.loja.slug !== tenantSlug) {
          this.logger.warn(
            `tenant_mismatch path=${req.path} slug=${tenantSlug} jwtLoja=${payload.loja_id}`,
          );
          throw new ForbiddenException(
            'Sessão não pertence a esta loja. Faça login no endereço correto.',
          );
        }
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
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
