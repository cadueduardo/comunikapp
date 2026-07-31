import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../auth/jwt-auth.guard';
import { extrairIdentidadeAutenticada } from '../../auth/decorators';
import { REQUER_PERMISSAO_VENDAS } from './requer-permissao-vendas.decorator';
import { VendasPermissionsService } from './vendas-permissions.service';
import { VendasPermissao } from './vendas-permissoes';

/**
 * Aplica autorização comercial no limite HTTP, com negação por padrão: dentro
 * de um controller protegido por este guard, endpoint sem
 * `@RequerPermissaoVendas` e sem `@Public()` é recusado.
 *
 * O guard garante cobertura completa da superfície HTTP. As mutações mais
 * sensíveis também chamam `assertPode` dentro do service, para que chamadas
 * internas não contornem a autorização.
 */
@Injectable()
export class VendasPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissoes: VendasPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const alvos = [context.getHandler(), context.getClass()];

    const publico = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      alvos,
    );
    if (publico) {
      return true;
    }

    const exigidas = this.reflector.getAllAndOverride<VendasPermissao[]>(
      REQUER_PERMISSAO_VENDAS,
      alvos,
    );

    if (!exigidas?.length) {
      throw new ForbiddenException(
        'Você não tem permissão para executar esta ação.',
      );
    }

    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(
      context.switchToHttp().getRequest(),
    );

    await this.permissoes.assertPodeQualquer(usuarioId, lojaId, exigidas);
    return true;
  }
}
