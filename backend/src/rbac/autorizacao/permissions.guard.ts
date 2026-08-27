import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { extrairIdentidadeAutenticada } from '../../auth/decorators';
import { PermissaoEfetivaService } from './permissao-efetiva.service';
import { REQUER_PERMISSAO_KEY } from './requer-permissao.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissaoEfetiva: PermissaoEfetivaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissoes = this.reflector.getAllAndOverride<string[]>(
      REQUER_PERMISSAO_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permissoes?.length) {
      return true;
    }

    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(
      context.switchToHttp().getRequest(),
    );

    for (const permissao of permissoes) {
      if (await this.permissaoEfetiva.pode(usuarioId, lojaId, permissao)) {
        return true;
      }
    }

    throw new ForbiddenException(
      'Você não tem permissão para executar esta ação.',
    );
  }
}
