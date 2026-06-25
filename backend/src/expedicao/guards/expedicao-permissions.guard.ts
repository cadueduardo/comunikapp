import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

const FUNCOES_EXPEDICAO = new Set(['ADMINISTRADOR', 'PRODUCAO', 'ESTOQUE']);

@Injectable()
export class ExpedicaoPermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const funcao = String(request.user?.funcao ?? '').toUpperCase();

    if (!FUNCOES_EXPEDICAO.has(funcao)) {
      throw new ForbiddenException(
        'Acesso negado. Funções permitidas: ADMINISTRADOR, PRODUCAO, ESTOQUE.',
      );
    }

    return true;
  }
}
