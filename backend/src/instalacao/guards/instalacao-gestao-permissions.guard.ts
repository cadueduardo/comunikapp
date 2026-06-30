import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

const FUNCOES_GESTAO = new Set(['ADMINISTRADOR', 'FINANCEIRO', 'VENDAS']);

@Injectable()
export class InstalacaoGestaoPermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const funcao = String(request.user?.funcao ?? '').toUpperCase();

    if (!FUNCOES_GESTAO.has(funcao)) {
      throw new ForbiddenException(
        'Acesso negado. Funções permitidas: ADMINISTRADOR, FINANCEIRO, VENDAS.',
      );
    }

    return true;
  }
}
