import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../auth/jwt-auth.guard';
import { extrairIdentidadeAutenticada } from '../../auth/decorators';
import { PREFIXOS_API_AUTOATENDIMENTO_USUARIO } from '../catalogo/tipos';
import { resolverModuloPorPath } from '../catalogo/agregador';
import { PermissaoEfetivaService } from './permissao-efetiva.service';

@Injectable()
export class ModuloAcessoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissaoEfetiva: PermissaoEfetivaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      path?: string;
      url?: string;
      user?: unknown;
    }>();
    const path = (request.path || request.url || '').split('?')[0];

    if (
      path.startsWith('/admin/v1') ||
      path.startsWith('/api/admin/v1') ||
      path.startsWith('/public/v1')
    ) {
      return true;
    }

    if (
      PREFIXOS_API_AUTOATENDIMENTO_USUARIO.some(
        (prefixo) => path === prefixo || path.startsWith(`${prefixo}/`),
      )
    ) {
      return true;
    }

    const modulo = resolverModuloPorPath(path);
    if (!modulo) {
      return true;
    }

    if (!request.user) {
      return true;
    }

    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(request);
    await this.permissaoEfetiva.assertPode(
      usuarioId,
      lojaId,
      modulo.permissaoAcesso,
    );
    return true;
  }
}
