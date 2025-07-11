import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Loja } from '@prisma/client';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  loja_id: string;
  funcao: string;
  nome_completo: string;
  loja?: Loja;
}

// O tipo AuthenticatedUser agora reflete a estrutura retornada pelo Prisma
// com o `include`. Ele inclui o objeto Loja completo.
export type AuthenticatedUser = Awaited<ReturnType<AuthService['validateUser']>>;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async generateToken(user: { id: string; email: string; loja_id: string; funcao: string; nome_completo: string; loja?: Loja }): Promise<string> {
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

  async validateUser(payload: JwtPayload) { // Removido o tipo de retorno para inferência
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