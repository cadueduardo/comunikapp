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
import { encontrarRotaPublica } from '../security/rotas-publicas';

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

    // Fronteira pública: decidida exclusivamente pelo catálogo em
    // `common/security/rotas-publicas.ts`, por método e caminho exatos.
    const rotaPublica = encontrarRotaPublica(
      req.method,
      req.path,
      process.env.NODE_ENV === 'production',
    );

    if (rotaPublica) {
      if (rotaPublica.exigeTokenNaQuery) {
        const rawToken = req.query?.token;
        const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
        if (!token || typeof token !== 'string') {
          throw new UnauthorizedException('Token público obrigatório');
        }
        req.query.token = token;
      }
      this.logger.debug(`Rota publica: ${req.method} ${req.path}`);
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

      const usuario = (await this.prisma.usuario.findFirst({
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
          session_version: true,
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
      } as never)) as unknown as {
        id: string;
        email: string;
        loja_id: string;
        funcao: string;
        nome_completo: string;
        session_version: number;
        loja: {
          id: string;
          nome: string;
          slug: string;
          status: string;
          session_version: number;
        };
      } | null;

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

      if (
        (payload.usuario_session_version ?? 0) !== usuario.session_version
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
        session_version: usuario.session_version,
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
