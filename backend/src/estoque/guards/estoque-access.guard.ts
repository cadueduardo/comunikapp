/**
 * Guard de acesso ao módulo de estoque
 * Implementa controle rigoroso de permissões (premissa)
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EstoqueRequest } from '../middleware/tenant-isolation.middleware';

@Injectable()
export class EstoqueAccessGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<EstoqueRequest>();

    // 1. VERIFICAÇÃO DE CONTEXTO DE ESTOQUE
    if (!request.estoque) {
      throw new UnauthorizedException(
        'Contexto de estoque não encontrado - middleware necessário',
      );
    }

    // 2. VERIFICAÇÃO DE LOJA (MULTI-TENANT)
    if (!request.estoque.lojaId) {
      throw new UnauthorizedException(
        'lojaId é obrigatório para acesso ao estoque',
      );
    }

    // 3. VERIFICAÇÃO DE USUÁRIO AUTENTICADO
    if (!request.estoque.usuarioId) {
      throw new UnauthorizedException(
        'usuarioId é obrigatório para operações de estoque',
      );
    }

    // 4. VERIFICAÇÃO DE MÓDULO ATIVO
    const moduleEnabled =
      this.configService.get('ESTOQUE_MODULE_ENABLED', 'true') === 'true';
    if (!moduleEnabled) {
      throw new ForbiddenException('Módulo de estoque está desabilitado');
    }

    // 5. VERIFICAÇÃO DE PERMISSÕES POR ROLE
    const allowedRoles = this.configService
      .get('ESTOQUE_ALLOWED_ROLES', 'ADMINISTRADOR,FINANCEIRO,ESTOQUE')
      .split(',')
      .map((r) => r.trim().toLowerCase());
    const userRoles = request.estoque.roles || [];

    const normalizedUserRoles = userRoles.map((r) => r.trim().toLowerCase());
    const hasPermission = normalizedUserRoles.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        `Acesso negado. Roles necessárias: ${allowedRoles.join(',')}. ` +
          `Suas roles: ${normalizedUserRoles.join(', ')}`,
      );
    }

    return true;
  }
}
