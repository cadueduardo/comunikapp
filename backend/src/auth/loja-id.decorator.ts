import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const LojaId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.loja_id;
  },
);

