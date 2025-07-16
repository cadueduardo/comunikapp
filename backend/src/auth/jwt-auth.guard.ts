import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    console.log('🔐 JWT Guard: Verificando rota pública:', isPublic);
    
    if (isPublic) {
      console.log('🔓 JWT Guard: Rota pública, permitindo acesso');
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    console.log('🔐 JWT Guard: Token presente:', !!token);
    
    return super.canActivate(context);
  }
} 