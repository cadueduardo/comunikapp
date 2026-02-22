import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../auth/auth.service';

@Injectable()
export class JwtAuthInterceptor implements NestInterceptor {
  constructor(private readonly jwtService: JwtService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Lista de rotas que não precisam de autenticação
    const publicRoutes = [
      '/lojas/login',
      '/lojas/health',
      '/api/estoque/health',
      '/favicon.ico',
    ];

    // Verificar se a rota é pública
    if (publicRoutes.some((route) => request.path.startsWith(route))) {
      return next.handle();
    }

    // Extrair token do header Authorization
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    const token = authHeader.substring(7);

    try {
      // Validar token JWT
      const payload = this.jwtService.verify<JwtPayload>(token);

      // Adicionar informações do usuário ao request
      request.user = {
        sub: payload.sub,
        email: payload.email,
        loja_id: payload.loja_id,
        funcao: payload.funcao,
        nome_completo: payload.nome_completo,
        loja: {
          id: payload.loja_id,
        },
      };

      return next.handle();
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
