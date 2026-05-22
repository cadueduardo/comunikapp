import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { loja } from '@prisma/client';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  loja_id: string;
  funcao: string;
  nome_completo: string;
  loja?: loja;
}

// O tipo AuthenticatedUser agora reflete a estrutura retornada pelo Prisma
// com o `include`. Ele inclui o objeto Loja completo.
export type AuthenticatedUser = Awaited<
  ReturnType<AuthService['validateUser']>
>;

/** Request com user autenticado (para uso em controllers). */
export interface RequestWithUser {
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  generateToken(user: {
    id: string;
    email: string;
    loja_id: string;
    funcao: string;
    nome_completo: string;
    loja?: loja;
  }): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      loja_id: user.loja_id,
      funcao: user.funcao,
      nome_completo: user.nome_completo,
      loja: user.loja,
    };

    return this.jwtService.sign(payload);
  }

  generateTwoFactorChallengeToken(user: { id: string; email: string }): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        purpose: '2fa',
      },
      { expiresIn: '5m' },
    );
  }

  verifyTwoFactorChallengeToken(token: string): { sub: string; email: string } {
    const payload = this.jwtService.verify<{ sub: string; email: string; purpose?: string }>(token);
    if (payload.purpose !== '2fa') {
      throw new Error('Token de segundo fator invalido');
    }
    return { sub: payload.sub, email: payload.email };
  }

  async validateUser(payload: JwtPayload) {
    // Removido o tipo de retorno para inferência
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub, loja_id: payload.loja_id },
      include: {
        loja: true,
      },
    });

    if (!user || user.status !== 'ATIVO' || !user.email_verificado) {
      return null;
    }

    return user;
  }
}
