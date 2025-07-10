import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  loja_id: string;
  funcao: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  loja_id: string;
  funcao: string;
  nome_completo: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async generateToken(user: AuthenticatedUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      loja_id: user.loja_id,
      funcao: user.funcao,
    };

    return this.jwtService.sign(payload);
  }

  async validateUser(payload: JwtPayload): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        nome_completo: true,
        funcao: true,
        loja_id: true,
        status: true,
        email_verificado: true,
      },
    });

    if (!user || user.status !== 'ATIVO' || !user.email_verificado) {
      return null;
    }

    return user;
  }
} 