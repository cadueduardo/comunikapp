import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { IS_PUBLIC_KEY } from './jwt-auth.guard';
import { AuthenticatedUser } from './auth.service';
import { loja } from '@prisma/client';

/** Request com user (auth) e opcionalmente estoque (bypass testes). */
interface RequestWithAuth {
  user?: AuthenticatedUser;
  estoque?: { lojaId: string };
}

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

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
