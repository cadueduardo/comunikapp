import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const INVITE_STATUS = {
  PENDENTE: 'PENDENTE',
  USADO: 'USADO',
} as const;

@Injectable()
export class PendingSignupService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async findUnverifiedUsuario(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        email_verificado: true,
        status: true,
        loja_id: true,
      },
    });

    if (!usuario || usuario.email_verificado) {
      return null;
    }

    return usuario;
  }

  async hasVerifiedAccount(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      select: { email_verificado: true },
    });
    return usuario?.email_verificado === true;
  }

  async purgeUnverifiedSignup(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const usuario = await this.findUnverifiedUsuario(normalizedEmail);
    if (!usuario) {
      await this.reopenUsedInvitesForEmail(normalizedEmail);
      return false;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.loja.delete({ where: { id: usuario.loja_id } });
      await tx.conviteCadastro.updateMany({
        where: { email: normalizedEmail, status: INVITE_STATUS.USADO },
        data: {
          status: INVITE_STATUS.PENDENTE,
          usado_em: null,
          usado_por_loja_id: null,
          usado_por_usuario_id: null,
        },
      });
    });

    return true;
  }

  async reopenUsedInvitesForEmail(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    await this.prisma.conviteCadastro.updateMany({
      where: { email: normalizedEmail, status: INVITE_STATUS.USADO },
      data: {
        status: INVITE_STATUS.PENDENTE,
        usado_em: null,
        usado_por_loja_id: null,
        usado_por_usuario_id: null,
      },
    });
  }

  async canReuseUsedInvite(convite: {
    id: string;
    email: string;
    status: string;
    usado_por_usuario_id: string | null;
  }) {
    if (convite.status !== INVITE_STATUS.USADO) {
      return false;
    }

    if (!convite.usado_por_usuario_id) {
      return true;
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: convite.usado_por_usuario_id },
      select: { email_verificado: true, email: true },
    });

    if (!usuario) {
      return true;
    }

    return (
      !usuario.email_verificado &&
      this.normalizeEmail(usuario.email) === this.normalizeEmail(convite.email)
    );
  }

  async reopenInvite(conviteId: string) {
    return this.prisma.conviteCadastro.update({
      where: { id: conviteId },
      data: {
        status: INVITE_STATUS.PENDENTE,
        usado_em: null,
        usado_por_loja_id: null,
        usado_por_usuario_id: null,
      },
    });
  }
}

export { INVITE_STATUS as PENDING_SIGNUP_INVITE_STATUS };
