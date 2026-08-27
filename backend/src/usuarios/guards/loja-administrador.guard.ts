import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { extrairIdentidadeAutenticada } from '../../auth/decorators';

/**
 * Contenção Fase 0: gestão de usuários/perfis só por função canônica.
 * Substituído na Fase 2 pelo PermissionsGuard sobre o catálogo.
 */
@Injectable()
export class LojaAdministradorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { funcao } = extrairIdentidadeAutenticada(
      context.switchToHttp().getRequest(),
    );
    if (funcao !== usuario_funcao.ADMINISTRADOR) {
      throw new ForbiddenException(
        'Somente administradores podem gerenciar usuários e perfis',
      );
    }
    return true;
  }
}
