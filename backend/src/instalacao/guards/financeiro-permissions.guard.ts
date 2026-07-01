import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

const FUNCOES_FINANCEIRO = new Set(['ADMINISTRADOR', 'FINANCEIRO']);

/**
 * Escopo financeiro (DEC-04 / Passo 1f): liberação comercial pós-instalação.
 * Mais restritivo que InstalacaoGestaoPermissionsGuard (sem VENDAS).
 */
@Injectable()
export class FinanceiroPermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const funcao = String(request.user?.funcao ?? '').toUpperCase();

    if (!FUNCOES_FINANCEIRO.has(funcao)) {
      throw new ForbiddenException(
        'Acesso negado. Funções permitidas: ADMINISTRADOR, FINANCEIRO.',
      );
    }

    return true;
  }
}
