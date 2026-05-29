import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateConviteCadastroDto } from './dto/create-convite-cadastro.dto';
import {
  CONVITE_INDIVIDUAL_WHATSAPP,
  renderConviteIndividualWhatsapp,
} from './convite-templates';
import { isPlatformAdminEmail } from './platform-admin.guard';

const INVITE_STATUS = {
  PENDENTE: 'PENDENTE',
  USADO: 'USADO',
  REVOGADO: 'REVOGADO',
  EXPIRADO: 'EXPIRADO',
} as const;

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  getPlatformAccess(email?: string | null) {
    return {
      isPlatformAdmin: isPlatformAdminEmail(email),
      email,
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getSignupInviteUrl(token: string) {
    const frontendUrl =
      process.env.FRONTEND_URL || 'https://comunikapp.com.br';
    return `${frontendUrl.replace(/\/$/, '')}/cadastro?convite=${encodeURIComponent(token)}`;
  }

  private toInviteResponse<T extends { token_hash?: string }>(invite: T) {
    const { token_hash: _tokenHash, ...safeInvite } = invite;
    return safeInvite;
  }

  private normalizeNome(nome: string) {
    return nome.trim().replace(/\s+/g, ' ');
  }

  async createInvite(dto: CreateConviteCadastroDto, createdByEmail?: string) {
    const email = this.normalizeEmail(dto.email);
    const nome = this.normalizeNome(dto.nome);
    const activeInvite = await this.prisma.conviteCadastro.findFirst({
      where: {
        email,
        status: INVITE_STATUS.PENDENTE,
        expira_em: { gt: new Date() },
      },
    });

    if (activeInvite) {
      throw new BadRequestException(
        'Ja existe um convite pendente e valido para este e-mail.',
      );
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (dto.validade_dias || 7));

    const convite = await this.prisma.conviteCadastro.create({
      data: {
        email,
        nome,
        token_hash: this.hashToken(token),
        mensagem: dto.mensagem?.trim() || null,
        criado_por_email: createdByEmail?.trim().toLowerCase() || null,
        expira_em: expiresAt,
      },
    });

    const inviteUrl = this.getSignupInviteUrl(token);
    const mensagemWhatsapp = renderConviteIndividualWhatsapp(
      CONVITE_INDIVIDUAL_WHATSAPP,
      { nome, link: inviteUrl },
    );
    let emailSent = true;
    let emailError: string | null = null;
    try {
      await this.mailService.sendSignupInviteEmail(email, inviteUrl, {
        nome,
        expiresAt,
      });
    } catch (error) {
      emailSent = false;
      emailError =
        error instanceof Error ? error.message : 'Falha ao enviar e-mail.';
    }

    return {
      ...this.toInviteResponse(convite),
      invite_url: inviteUrl,
      mensagem_whatsapp: mensagemWhatsapp,
      email_enviado: emailSent,
      email_erro: emailError,
    };
  }

  async listInvites() {
    await this.expireOldInvites();
    return this.prisma.conviteCadastro.findMany({
      orderBy: { criado_em: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        nome: true,
        status: true,
        mensagem: true,
        criado_por_email: true,
        expira_em: true,
        usado_em: true,
        revogado_em: true,
        usado_por_loja_id: true,
        usado_por_usuario_id: true,
        criado_em: true,
        atualizado_em: true,
      },
    });
  }

  async revokeInvite(id: string) {
    const convite = await this.prisma.conviteCadastro.findUnique({
      where: { id },
    });

    if (!convite) {
      throw new NotFoundException('Convite nao encontrado.');
    }

    if (convite.status !== INVITE_STATUS.PENDENTE) {
      throw new BadRequestException('Apenas convites pendentes podem ser revogados.');
    }

    const updated = await this.prisma.conviteCadastro.update({
      where: { id },
      data: {
        status: INVITE_STATUS.REVOGADO,
        revogado_em: new Date(),
      },
    });
    return this.toInviteResponse(updated);
  }

  async validateInviteToken(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Token de convite obrigatorio.');
    }

    const convite = await this.prisma.conviteCadastro.findUnique({
      where: { token_hash: this.hashToken(token.trim()) },
      select: {
        email: true,
        nome: true,
        status: true,
        expira_em: true,
      },
    });

    if (!convite) {
      throw new BadRequestException('Convite invalido.');
    }

    if (convite.status !== INVITE_STATUS.PENDENTE) {
      throw new BadRequestException('Convite nao esta mais disponivel.');
    }

    if (convite.expira_em <= new Date()) {
      await this.prisma.conviteCadastro.updateMany({
        where: {
          token_hash: this.hashToken(token.trim()),
          status: INVITE_STATUS.PENDENTE,
        },
        data: { status: INVITE_STATUS.EXPIRADO },
      });
      throw new BadRequestException('Convite expirado.');
    }

    return {
      valid: true,
      email: convite.email,
      nome: convite.nome,
      expira_em: convite.expira_em,
    };
  }

  private async expireOldInvites() {
    await this.prisma.conviteCadastro.updateMany({
      where: {
        status: INVITE_STATUS.PENDENTE,
        expira_em: { lte: new Date() },
      },
      data: { status: INVITE_STATUS.EXPIRADO },
    });
  }
}

export { INVITE_STATUS };
