import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/** Perfis autorizados na rota mobile de campo. */
const FUNCOES_INSTALADOR = new Set(['ADMINISTRADOR', 'PRODUCAO']);

@Injectable()
export class InstaladorPermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const funcao = String(request.user?.funcao ?? '').toUpperCase();

    if (!FUNCOES_INSTALADOR.has(funcao)) {
      throw new ForbiddenException(
        'Acesso negado. Funções permitidas: ADMINISTRADOR, PRODUCAO.',
      );
    }

    return true;
  }
}
