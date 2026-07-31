import {
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { IS_PUBLIC_KEY } from './jwt-auth.guard';
import { AuthenticatedUser } from './auth.service';
import { loja, usuario_funcao } from '@prisma/client';

/** Request com user (auth) e opcionalmente estoque (bypass testes). */
interface RequestWithAuth {
  user?: AuthenticatedUser;
  estoque?: { lojaId: string };
}

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Identidade normalizada do chamador autenticado.
 *
 * Existem duas formas de `request.user` no projeto e elas não têm os mesmos
 * campos: o `JwtGlobalMiddleware` grava `{ sub, email, loja_id, funcao, ... }`,
 * enquanto o `JwtAuthGuard` (passport) sobrescreve com o registro completo do
 * Prisma, cujo identificador é `id`. Nenhuma das duas expõe `user_id`.
 */
export interface IdentidadeAutenticada {
  usuarioId: string;
  lojaId: string;
  funcao: usuario_funcao;
}

/**
 * Fonte única da identidade autenticada. Nunca aceita identificador, loja ou
 * função vindos do corpo, query ou cabeçalho da requisição.
 */
export function extrairIdentidadeAutenticada(
  request: unknown,
): IdentidadeAutenticada {
  const user = (request as { user?: Record<string, unknown> } | undefined)?.user;

  const usuarioId = (user?.id ?? user?.sub) as string | undefined;
  const lojaId = user?.loja_id as string | undefined;
  const funcao = user?.funcao as usuario_funcao | undefined;

  if (!usuarioId || !lojaId || !funcao) {
    throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
  }

  return { usuarioId, lojaId, funcao };
}

export const Identidade = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IdentidadeAutenticada =>
    extrairIdentidadeAutenticada(ctx.switchToHttp().getRequest()),
);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const GetLoja = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): loja => {
    const request = ctx.switchToHttp().getRequest();
    if (request.estoque?.lojaId) {
      return { id: request.estoque.lojaId, nome: 'Loja Teste' } as loja;
    }
    return request.user?.loja;
  },
);

export const CurrentLojaId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    if (request.estoque?.lojaId) return request.estoque.lojaId;
    return request.user?.loja_id;
  },
);
