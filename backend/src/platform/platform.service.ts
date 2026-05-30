import {
  BadRequestException,
  Injectable,
  Logger,
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
import { InteresseBetaDto } from './dto/interesse-beta.dto';
import { BetaFeedbackDto } from './dto/beta-feedback.dto';
import { PendingSignupService } from '../lojas/pending-signup.service';
import { AuthenticatedUser } from '../auth/auth.service';

export const INVITE_ORIGEM = {
  ADMIN: 'admin_manual',
  LANDING: 'landing_interesse',
} as const;

const INVITE_STATUS = {
  PENDENTE: 'PENDENTE',
  USADO: 'USADO',
  REVOGADO: 'REVOGADO',
  EXPIRADO: 'EXPIRADO',
} as const;

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly pendingSignupService: PendingSignupService,
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

  async createInvite(
    dto: CreateConviteCadastroDto,
    createdByEmail?: string,
    options?: {
      origem?: string;
      telefone?: string;
      nome_loja?: string;
      inviteEmailMode?: 'default' | 'beta';
      notifyAdmin?: boolean;
    },
  ) {
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

    const origem =
      options?.origem ||
      (createdByEmail ? INVITE_ORIGEM.ADMIN : INVITE_ORIGEM.LANDING);

    const convite = await this.prisma.conviteCadastro.create({
      data: {
        email,
        nome,
        nome_loja: options?.nome_loja?.trim() || null,
        telefone: options?.telefone?.trim() || null,
        origem,
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
        mode: options?.inviteEmailMode || 'default',
      });
    } catch (error) {
      emailSent = false;
      emailError =
        error instanceof Error ? error.message : 'Falha ao enviar e-mail.';
    }

    if (options?.notifyAdmin) {
      try {
        await this.mailService.sendBetaLeadNotificationEmail({
          nome,
          email,
          telefone: options.telefone,
          nome_loja: options.nome_loja,
          origem,
        });
      } catch (error) {
        this.logger.warn(
          `Falha ao notificar admin sobre novo lead beta: ${
            error instanceof Error ? error.message : 'erro desconhecido'
          }`,
        );
      }
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
        nome_loja: true,
        telefone: true,
        origem: true,
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

    const tokenHash = this.hashToken(token.trim());
    let convite = await this.prisma.conviteCadastro.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!convite) {
      throw new BadRequestException('Convite invalido.');
    }

    if (convite.status === INVITE_STATUS.USADO) {
      const canReuse = await this.pendingSignupService.canReuseUsedInvite(convite);
      if (!canReuse) {
        throw new BadRequestException('Convite nao esta mais disponivel.');
      }
      convite = await this.pendingSignupService.reopenInvite(convite.id);
    }

    if (convite.status !== INVITE_STATUS.PENDENTE) {
      throw new BadRequestException('Convite nao esta mais disponivel.');
    }

    if (convite.expira_em <= new Date()) {
      await this.prisma.conviteCadastro.updateMany({
        where: {
          token_hash: tokenHash,
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

  private isTurnstileEnabled() {
    return !!process.env.TURNSTILE_SECRET_KEY;
  }

  private async validateTurnstileToken(captchaToken: string, ip: string) {
    if (!this.isTurnstileEnabled()) return true;

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY || '',
          response: captchaToken,
          remoteip: ip,
        }),
      },
    );

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  }

  private getBetaInterestSuccessMessage() {
    return {
      success: true,
      message:
        'Recebemos seu interesse. Enviamos um e-mail com o link para continuar seu cadastro. Verifique sua caixa de entrada e o spam.',
    };
  }

  async registerBetaInterest(dto: InteresseBetaDto, ip = 'unknown') {
    if (this.isTurnstileEnabled()) {
      if (!dto.captchaToken?.trim()) {
        throw new BadRequestException('Confirme que voce nao e um robo.');
      }
      const isCaptchaValid = await this.validateTurnstileToken(
        dto.captchaToken,
        ip,
      );
      if (!isCaptchaValid) {
        throw new BadRequestException('Validacao de seguranca falhou. Tente novamente.');
      }
    }

    const email = this.normalizeEmail(dto.email);
    const nome = this.normalizeNome(dto.nome);
    const telefone = dto.telefone.trim();
    const nome_loja = dto.nome_loja.trim();

    const existingLoja = await this.prisma.loja.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingLoja && (await this.pendingSignupService.hasVerifiedAccount(email))) {
      return this.getBetaInterestSuccessMessage();
    }

    await this.pendingSignupService.purgeUnverifiedSignup(email);

    const activeInvite = await this.prisma.conviteCadastro.findFirst({
      where: {
        email,
        status: INVITE_STATUS.PENDENTE,
        expira_em: { gt: new Date() },
      },
      orderBy: { criado_em: 'desc' },
    });

    if (activeInvite) {
      const inviteUrl = this.getSignupInviteUrl(
        await this.regenerateInviteToken(activeInvite.id),
      );
      try {
        await this.mailService.sendSignupInviteEmail(email, inviteUrl, {
          nome: activeInvite.nome || nome,
          expiresAt: activeInvite.expira_em,
          mode: 'beta',
        });
      } catch (error) {
        this.logger.warn(
          `Falha ao reenviar convite beta para ${email}: ${
            error instanceof Error ? error.message : 'erro desconhecido'
          }`,
        );
      }
      return this.getBetaInterestSuccessMessage();
    }

    await this.createInvite(
      {
        nome,
        email,
        validade_dias: Number(process.env.BETA_INVITE_VALIDADE_DIAS || 7),
      },
      undefined,
      {
        origem: INVITE_ORIGEM.LANDING,
        telefone,
        nome_loja,
        inviteEmailMode: 'beta',
        notifyAdmin: true,
      },
    );

    return this.getBetaInterestSuccessMessage();
  }

  private async regenerateInviteToken(conviteId: string) {
    const token = randomBytes(32).toString('base64url');
    await this.prisma.conviteCadastro.update({
      where: { id: conviteId },
      data: { token_hash: this.hashToken(token) },
    });
    return token;
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

  isBetaFeedbackEnabled(): boolean {
    return process.env.BETA_FEEDBACK_ENABLED !== 'false';
  }

  private getBetaFeedbackRecipientEmail(): string {
    return (
      process.env.BETA_FEEDBACK_EMAIL?.trim() || 'cadu.eduardo@gmail.com'
    );
  }

  async submitBetaFeedback(dto: BetaFeedbackDto, user: AuthenticatedUser) {
    if (!this.isBetaFeedbackEnabled()) {
      throw new BadRequestException(
        'O canal de feedback beta esta temporariamente indisponivel.',
      );
    }

    const usuarioEmail = user.email?.trim();
    const usuarioNome = user.nome_completo?.trim() || 'Usuario';

    if (!usuarioEmail) {
      throw new BadRequestException('Usuario autenticado sem e-mail valido.');
    }

    await this.mailService.sendBetaFeedbackEmail({
      to: this.getBetaFeedbackRecipientEmail(),
      replyTo: usuarioEmail,
      usuarioNome,
      usuarioEmail,
      lojaNome: user.loja?.nome || 'Loja nao identificada',
      lojaId: user.loja_id,
      funcao: user.funcao || 'N/A',
      descricao: dto.descricao.trim(),
      expectativa: dto.expectativa?.trim(),
      paginaUrl: dto.pagina_url.trim(),
      paginaPath: dto.pagina_path.trim(),
      paginaTitulo: dto.pagina_titulo?.trim(),
      versaoPlataforma: dto.versao_plataforma?.trim(),
      userAgent: dto.user_agent?.trim(),
    });

    this.logger.log(
      `Feedback beta recebido de ${usuarioEmail} na pagina ${dto.pagina_path}`,
    );

    return {
      message:
        'Feedback enviado com sucesso. Obrigado por ajudar a melhorar o Comunikapp.',
    };
  }
}

export { INVITE_STATUS };
