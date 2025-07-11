import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './jwt-auth.guard';
import { AuthenticatedUser } from './auth.service';
import { Loja } from '@prisma/client';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const GetLoja = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Loja => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.loja;
  },
);

export const CurrentLojaId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.loja_id;
  },
); 