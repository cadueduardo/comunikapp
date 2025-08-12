import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGlobalMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Lista de rotas que não precisam de autenticação
    const publicRoutes = [
      '/lojas/login',
      '/lojas/health',
      '/api/estoque/health',
      '/favicon.ico',
    ];

    // Verificar se a rota é pública
    if (publicRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    const token = authHeader.substring(7);

    try {
      // Validar token JWT
      const payload = this.jwtService.verify(token);
      
      // Adicionar informações do usuário ao request
      req['user'] = {
        sub: payload.sub,
        email: payload.email,
        loja_id: payload.loja_id,
        funcao: payload.funcao,
        nome_completo: payload.nome_completo,
        loja: {
          id: payload.loja_id,
          // Outras propriedades da loja podem ser adicionadas aqui
        }
      };

      next();
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}

