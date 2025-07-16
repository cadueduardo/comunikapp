import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class PublicAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar se a rota está marcada como pública
    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    
    if (isPublic) {
      return true; // Permitir acesso sem autenticação
    }

    // Para rotas protegidas, usar o guard JWT padrão
    return super.canActivate(context) as Promise<boolean>;
  }
} 