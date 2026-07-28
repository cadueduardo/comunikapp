import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, timingSafeEqual } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { usuario_funcao, usuario_status, loja_status, loja, Prisma } from '@prisma/client';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyTwoFactorLoginDto } from './dto/verify-two-factor-login.dto';
import { UpdateConfiguracoesLojaDto } from './dto/update-configuracoes-loja.dto';
import { UpdateCadastroLojaDto } from './dto/update-cadastro-loja.dto';
import { TwoFactorService } from '../auth/two-factor.service';
import { PendingSignupService } from './pending-signup.service';
import {
  formatCnpj,
  formatCpf,
  isValidCnpj,
  isValidCpf,
  normalizeCnpj,
  normalizeCpf,
} from '../common/utils/cpf-cnpj.util';
import {
  buildCanonicalLojaUrl,
  isValidLojaSlug,
  nextSlugOnCollision,
  normalizeLojaSlugCandidate,
  suggestLojaSlugFromNome,
} from './loja-slug';
import { CloudflareSaaSService } from './cloudflare-saas.service';
import { isLikelyApexHostname } from './dominio-custom-host';

type LoginAttemptState = {
  failedAttempts: number;
  firstFailureAt: number;
  lockUntil?: number;
};

const SIGNUP_INVITE_STATUS = {
  PENDENTE: 'PENDENTE',
  USADO: 'USADO',
  EXPIRADO: 'EXPIRADO',
} as const;

@Injectable()
export class LojasService {
  private readonly logger = new Logger(LojasService.name);
  private readonly loginAttempts = new Map<string, LoginAttemptState>();
  private readonly loginAttemptWindowMs = 15 * 60 * 1000;
  private readonly loginCaptchaThreshold = 5;
  private readonly lockoutThreshold = 8;
  private readonly lockoutBaseMs = 5 * 60 * 1000;
  private readonly lockoutMaxMs = 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
    private readonly pendingSignupService: PendingSignupService,
    private readonly cloudflareSaaS: CloudflareSaaSService,
  ) {}

  private getLoginAttemptKey(email: string, ip: string) {
    return `${email.trim().toLowerCase()}|${ip}`;
  }

  private getLoginAttemptState(key: string): LoginAttemptState {
    const now = Date.now();
    const existing = this.loginAttempts.get(key);

    if (
      !existing ||
      now - existing.firstFailureAt > this.loginAttemptWindowMs
    ) {
      const freshState: LoginAttemptState = {
        failedAttempts: 0,
        firstFailureAt: now,
      };
      this.loginAttempts.set(key, freshState);
      return freshState;
    }

    return existing;
  }

  private registerLoginFailure(key: string) {
    const state = this.getLoginAttemptState(key);
    state.failedAttempts += 1;

    if (state.failedAttempts >= this.lockoutThreshold) {
      const lockoutLevel = state.failedAttempts - this.lockoutThreshold + 1;
      const lockoutMs = Math.min(
        this.lockoutBaseMs * lockoutLevel,
        this.lockoutMaxMs,
      );
      state.lockUntil = Date.now() + lockoutMs;
    }

    this.loginAttempts.set(key, state);
    return state;
  }

  private clearLoginFailure(key: string) {
    this.loginAttempts.delete(key);
  }

  private requiresCaptcha(state: LoginAttemptState) {
    return state.failedAttempts >= this.loginCaptchaThreshold;
  }

  private isTurnstileEnabled() {
    return !!process.env.TURNSTILE_SECRET_KEY;
  }

  private getRemainingLockSeconds(state: LoginAttemptState) {
    if (!state.lockUntil) return 0;
    return Math.max(0, Math.ceil((state.lockUntil - Date.now()) / 1000));
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

  private validateSignupInviteCode(inviteCode?: string) {
    const configuredCode = process.env.SIGNUP_INVITE_CODE?.trim();

    if (!configuredCode) {
      throw new BadRequestException('Cadastro disponivel apenas por convite.');
    }

    if (!inviteCode?.trim()) {
      throw new BadRequestException('Informe o codigo de convite.');
    }

    const providedCode = inviteCode.trim();
    const configuredBuffer = Buffer.from(configuredCode);
    const providedBuffer = Buffer.from(providedCode);

    if (
      configuredBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(configuredBuffer, providedBuffer)
    ) {
      throw new BadRequestException('Codigo de convite invalido.');
    }
  }

  private hashInviteToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async validateSignupInviteToken(token: string, email: string) {
    const tokenHash = this.hashInviteToken(token.trim());
    let convite = await this.prisma.conviteCadastro.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!convite) {
      throw new BadRequestException('Convite invalido.');
    }

    if (convite.status === SIGNUP_INVITE_STATUS.USADO) {
      const canReuse =
        await this.pendingSignupService.canReuseUsedInvite(convite);
      if (!canReuse) {
        throw new BadRequestException('Convite nao esta mais disponivel.');
      }
      convite = await this.pendingSignupService.reopenInvite(convite.id);
    }

    if (convite.status !== SIGNUP_INVITE_STATUS.PENDENTE) {
      throw new BadRequestException('Convite nao esta mais disponivel.');
    }

    if (convite.expira_em <= new Date()) {
      await this.prisma.conviteCadastro.updateMany({
        where: { id: convite.id, status: SIGNUP_INVITE_STATUS.PENDENTE },
        data: { status: SIGNUP_INVITE_STATUS.EXPIRADO },
      });
      throw new BadRequestException('Convite expirado.');
    }

    if (convite.email.toLowerCase() !== email.trim().toLowerCase()) {
      throw new BadRequestException(
        'Este convite foi emitido para outro e-mail.',
      );
    }

    return convite;
  }

  private sanitizeUserAgent(userAgent: string) {
    return userAgent.length > 240 ? `${userAgent.slice(0, 240)}...` : userAgent;
  }

  private validateSignupDocuments(cpf?: string, cnpj?: string) {
    if (cpf?.trim()) {
      if (!isValidCpf(cpf)) {
        throw new BadRequestException('CPF invalido.');
      }
      return {
        cpf: formatCpf(normalizeCpf(cpf)),
        cnpj: undefined as string | undefined,
      };
    }

    if (cnpj?.trim()) {
      if (!isValidCnpj(cnpj)) {
        throw new BadRequestException('CNPJ invalido.');
      }
      return {
        cpf: undefined as string | undefined,
        cnpj: formatCnpj(normalizeCnpj(cnpj)),
      };
    }

    throw new BadRequestException('Informe um CPF ou CNPJ valido.');
  }

  async login(
    { email, password, captchaToken, slug }: LoginDto,
    ip = 'unknown',
    userAgent = 'unknown',
  ) {
    const loginKey = this.getLoginAttemptKey(email, ip);
    const attemptState = this.getLoginAttemptState(loginKey);
    const turnstileEnabled = this.isTurnstileEnabled();
    const ua = this.sanitizeUserAgent(userAgent);
    const normalizedEmail = email.trim().toLowerCase();

    if (attemptState.lockUntil && attemptState.lockUntil > Date.now()) {
      const retryAfterSeconds = this.getRemainingLockSeconds(attemptState);
      this.logger.warn(
        `login_blocked lockout email=${normalizedEmail} ip=${ip} ua="${ua}" retryAfterSeconds=${retryAfterSeconds}`,
      );
      throw new UnauthorizedException({
        message:
          'Muitas tentativas inválidas. Aguarde alguns minutos e tente novamente.',
        code: 'LOCKED_TEMPORARILY',
        retryAfterSeconds,
      });
    }

    if (turnstileEnabled && this.requiresCaptcha(attemptState)) {
      if (!captchaToken) {
        this.logger.warn(
          `login_blocked captcha_required email=${normalizedEmail} ip=${ip} ua="${ua}" attempts=${attemptState.failedAttempts}`,
        );
        throw new UnauthorizedException({
          message: 'Validação adicional obrigatória para continuar o login.',
          code: 'CAPTCHA_REQUIRED',
        });
      }

      const isCaptchaValid = await this.validateTurnstileToken(
        captchaToken,
        ip,
      );
      if (!isCaptchaValid) {
        this.logger.warn(
          `login_blocked captcha_invalid email=${normalizedEmail} ip=${ip} ua="${ua}" attempts=${attemptState.failedAttempts}`,
        );
        throw new UnauthorizedException({
          message: 'Falha na validação do CAPTCHA. Tente novamente.',
          code: 'CAPTCHA_INVALID',
        });
      }
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        loja: true,
      },
    });

    if (!usuario) {
      const state = this.registerLoginFailure(loginKey);
      this.logger.warn(
        `login_failed user_not_found email=${normalizedEmail} ip=${ip} ua="${ua}" attempts=${state.failedAttempts}`,
      );
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!usuario.email_verificado) {
      const state = this.registerLoginFailure(loginKey);
      this.logger.warn(
        `login_failed email_not_verified email=${normalizedEmail} ip=${ip} ua="${ua}" attempts=${state.failedAttempts} userId=${usuario.id}`,
      );
      throw new UnauthorizedException(
        'Email não verificado. Verifique sua caixa de entrada.',
      );
    }

    if (usuario.status !== usuario_status.ATIVO) {
      const state = this.registerLoginFailure(loginKey);
      this.logger.warn(
        `login_failed user_inactive email=${normalizedEmail} ip=${ip} ua="${ua}" attempts=${state.failedAttempts} userId=${usuario.id}`,
      );
      throw new UnauthorizedException('Conta não está ativa.');
    }

    const isPasswordValid = await bcrypt.compare(password, usuario.senha);
    if (!isPasswordValid) {
      const state = this.registerLoginFailure(loginKey);
      this.logger.warn(
        `login_failed invalid_password email=${normalizedEmail} ip=${ip} ua="${ua}" attempts=${state.failedAttempts} userId=${usuario.id}`,
      );
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    this.assertLoginSlugMatchesLoja(slug, usuario.loja, normalizedEmail, ip, ua);

    if (usuario.two_factor_enabled && usuario.two_factor_secret) {
      this.clearLoginFailure(loginKey);
      this.logger.log(
        `login_2fa_required email=${normalizedEmail} ip=${ip} ua="${ua}" userId=${usuario.id}`,
      );
      return {
        requiresTwoFactor: true,
        temporaryToken: this.authService.generateTwoFactorChallengeToken({
          id: usuario.id,
          email: usuario.email,
        }),
        message: 'Informe o codigo do autenticador para concluir o login.',
      };
    }

    // Gerar token JWT
    const token = await this.authService.generateToken({
      id: usuario.id,
      email: usuario.email,
      loja_id: usuario.loja_id,
      loja: usuario.loja,
      funcao: usuario.funcao,
      nome_completo: usuario.nome_completo,
    });

    this.clearLoginFailure(loginKey);
    this.logger.log(
      `login_success email=${normalizedEmail} ip=${ip} ua="${ua}" userId=${usuario.id} lojaId=${usuario.loja_id}`,
    );

    return {
      access_token: token,
      user: {
        id: usuario.id,
        nome_completo: usuario.nome_completo,
        email: usuario.email,
        funcao: usuario.funcao,
        loja_id: usuario.loja_id,
        loja: usuario.loja
          ? {
              id: usuario.loja.id,
              nome: usuario.loja.nome,
              slug: usuario.loja.slug,
              url_canonica: buildCanonicalLojaUrl(usuario.loja.slug),
            }
          : undefined,
      },
      message: 'Login realizado com sucesso!',
    };
  }

  async verifyTwoFactorLogin(
    { temporaryToken, code, slug }: VerifyTwoFactorLoginDto,
    ip = 'unknown',
    userAgent = 'unknown',
  ) {
    const ua = this.sanitizeUserAgent(userAgent);
    let challenge: { sub: string; email: string };
    try {
      challenge =
        this.authService.verifyTwoFactorChallengeToken(temporaryToken);
    } catch {
      this.logger.warn(
        `login_2fa_failed invalid_temporary_token ip=${ip} ua="${ua}"`,
      );
      throw new UnauthorizedException('Sessao 2FA expirada ou invalida.');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: challenge.sub },
      include: { loja: true },
    });

    if (
      !usuario ||
      usuario.email !== challenge.email ||
      usuario.status !== usuario_status.ATIVO ||
      !usuario.email_verificado ||
      !usuario.two_factor_enabled ||
      !usuario.two_factor_secret
    ) {
      this.logger.warn(
        `login_2fa_failed invalid_user email=${challenge.email} ip=${ip} ua="${ua}"`,
      );
      throw new UnauthorizedException('Sessao 2FA invalida.');
    }

    if (!this.twoFactorService.verifyCode(usuario.two_factor_secret, code)) {
      this.logger.warn(
        `login_2fa_failed invalid_code email=${usuario.email} ip=${ip} ua="${ua}" userId=${usuario.id}`,
      );
      throw new UnauthorizedException('Codigo 2FA invalido.');
    }

    this.assertLoginSlugMatchesLoja(slug, usuario.loja, usuario.email, ip, ua);

    const token = await this.authService.generateToken({
      id: usuario.id,
      email: usuario.email,
      loja_id: usuario.loja_id,
      loja: usuario.loja,
      funcao: usuario.funcao,
      nome_completo: usuario.nome_completo,
    });

    this.logger.log(
      `login_success_2fa email=${usuario.email} ip=${ip} ua="${ua}" userId=${usuario.id} lojaId=${usuario.loja_id}`,
    );

    return {
      access_token: token,
      user: {
        id: usuario.id,
        nome_completo: usuario.nome_completo,
        email: usuario.email,
        funcao: usuario.funcao,
        loja_id: usuario.loja_id,
        loja: usuario.loja
          ? {
              id: usuario.loja.id,
              nome: usuario.loja.nome,
              slug: usuario.loja.slug,
              url_canonica: buildCanonicalLojaUrl(usuario.loja.slug),
            }
          : undefined,
      },
      message: 'Login realizado com sucesso!',
    };
  }

  async findUserByEmail(email: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        loja: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return usuario;
  }

  /** Branding leve para login no subdomain (sem dados sensíveis). */
  async findPublicBySlug(slugRaw: string) {
    const slug = normalizeLojaSlugCandidate(slugRaw);
    if (!isValidLojaSlug(slug)) {
      throw new NotFoundException('Loja não encontrada.');
    }

    const loja = await this.prisma.loja.findUnique({
      where: { slug },
      select: {
        id: true,
        nome: true,
        slug: true,
        logo_url: true,
        status: true,
      },
    });

    if (loja && loja.status !== loja_status.INATIVO) {
      return {
        id: loja.id,
        nome: loja.nome,
        slug: loja.slug,
        logo_url: loja.logo_url,
        url_canonica: buildCanonicalLojaUrl(loja.slug),
        redirect_to: null as string | null,
      };
    }

    const byAnterior = await this.prisma.loja.findFirst({
      where: { slug_anterior: slug, NOT: { status: loja_status.INATIVO } },
      select: {
        id: true,
        nome: true,
        slug: true,
        logo_url: true,
      },
    });

    if (!byAnterior) {
      throw new NotFoundException('Loja não encontrada.');
    }

    return {
      id: byAnterior.id,
      nome: byAnterior.nome,
      slug: byAnterior.slug,
      logo_url: byAnterior.logo_url,
      url_canonica: buildCanonicalLojaUrl(byAnterior.slug),
      redirect_to: byAnterior.slug,
    };
  }

  /** Resolve loja por hostname de domínio custom verificado. */
  async findPublicByHost(hostRaw: string) {
    const host = hostRaw
      .split(':')[0]
      ?.trim()
      .toLowerCase()
      .replace(/\.$/, '');
    if (!host || host.length < 3 || host.length > 253) {
      throw new NotFoundException('Loja não encontrada.');
    }
    if (
      host === 'comunikapp.com.br' ||
      host === 'www.comunikapp.com.br' ||
      host.endsWith('.comunikapp.com.br')
    ) {
      throw new NotFoundException('Loja não encontrada.');
    }

    const loja = await this.prisma.loja.findFirst({
      where: {
        dominio_custom: host,
        dominio_custom_status: 'VERIFICADO',
        NOT: { status: loja_status.INATIVO },
      },
      select: {
        id: true,
        nome: true,
        slug: true,
        logo_url: true,
        dominio_custom: true,
      },
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada.');
    }

    return {
      id: loja.id,
      nome: loja.nome,
      slug: loja.slug,
      logo_url: loja.logo_url,
      dominio_custom: loja.dominio_custom,
      url_canonica: buildCanonicalLojaUrl(loja.slug),
      redirect_to: null as string | null,
    };
  }

  async setDominioCustom(lojaId: string, dominioRaw: string) {
    const dominio = this.normalizeDominioCustom(dominioRaw);
    this.assertDominioCustomAllowed(dominio);
    if (isLikelyApexHostname(dominio)) {
      throw new BadRequestException(
        'Use um endereço com prefixo, por exemplo sistema.minhaloja.com.br. O domínio sozinho (ex.: minhaloja.com.br) ainda não é aceito.',
      );
    }

    const taken = await this.prisma.loja.findFirst({
      where: { dominio_custom: dominio, NOT: { id: lojaId } },
      select: { id: true },
    });
    if (taken) {
      throw new ConflictException('Este domínio já está em uso por outra loja.');
    }

    this.cloudflareSaaS.requireConfigured();

    const atual = await this.prisma.loja.findUnique({
      where: { id: lojaId },
      select: {
        dominio_custom: true,
        dominio_custom_cf_id: true,
      },
    });

    // Troca de domínio: remove hostname antigo na CF.
    if (
      atual?.dominio_custom_cf_id &&
      atual.dominio_custom &&
      atual.dominio_custom !== dominio
    ) {
      try {
        await this.cloudflareSaaS.deleteHostname(atual.dominio_custom_cf_id);
      } catch (error) {
        this.logger.warn(
          `cf_saas delete previous failed loja=${lojaId}: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    }

    let cf =
      atual?.dominio_custom === dominio && atual.dominio_custom_cf_id
        ? await this.cloudflareSaaS.getHostname(atual.dominio_custom_cf_id)
        : null;

    if (!cf) {
      const existing = await this.cloudflareSaaS.findByHostname(dominio);
      if (existing) {
        cf = existing;
      } else {
        cf = await this.cloudflareSaaS.createHostname(dominio);
      }
    }

    const token = `cmk-verify-${createHash('sha256')
      .update(`${lojaId}:${dominio}:${cf.id}`)
      .digest('hex')
      .slice(0, 24)}`;

    const loja = await this.prisma.loja.update({
      where: { id: lojaId },
      data: {
        dominio_custom: dominio,
        dominio_custom_status: 'PENDENTE',
        dominio_custom_token: token,
        dominio_custom_verificado_em: null,
        dominio_custom_cf_id: cf.id,
        dominio_custom_cf_status: cf.status || null,
        dominio_custom_cf_ssl_status: cf.ssl?.status || null,
        dominio_custom_cf_validation: this.serializeCfValidation(cf),
        atualizado_em: new Date(),
      },
    });

    return this.formatDominioCustomResponse(loja);
  }

  async clearDominioCustom(lojaId: string) {
    const atual = await this.prisma.loja.findUnique({
      where: { id: lojaId },
      select: { dominio_custom_cf_id: true },
    });

    if (atual?.dominio_custom_cf_id && this.cloudflareSaaS.isConfigured()) {
      try {
        await this.cloudflareSaaS.deleteHostname(atual.dominio_custom_cf_id);
      } catch (error) {
        this.logger.warn(
          `cf_saas delete on clear failed loja=${lojaId}: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    }

    const loja = await this.prisma.loja.update({
      where: { id: lojaId },
      data: {
        dominio_custom: null,
        dominio_custom_status: 'NONE',
        dominio_custom_token: null,
        dominio_custom_verificado_em: null,
        dominio_custom_cf_id: null,
        dominio_custom_cf_status: null,
        dominio_custom_cf_ssl_status: null,
        dominio_custom_cf_validation: null,
        atualizado_em: new Date(),
      },
    });
    return this.formatDominioCustomResponse(loja);
  }

  async verificarDominioCustom(lojaId: string) {
    const loja = await this.prisma.loja.findUnique({ where: { id: lojaId } });
    if (!loja?.dominio_custom || !loja.dominio_custom_cf_id) {
      throw new BadRequestException(
        'Configure um domínio próprio antes de verificar.',
      );
    }

    this.cloudflareSaaS.requireConfigured();
    const cf = await this.cloudflareSaaS.getHostname(loja.dominio_custom_cf_id);
    const ok = this.cloudflareSaaS.isFullyActive(cf);
    const detalhes: string[] = [];
    if (ok) {
      detalhes.push('DNS e certificado confirmados. Endereço pronto para uso.');
    } else {
      detalhes.push(
        `Ainda processando (status: ${cf.status}, certificado: ${cf.ssl?.status || 'pendente'}).`,
      );
      detalhes.push(
        'Confira o CNAME no painel de DNS da empresa e aguarde alguns minutos antes de verificar de novo.',
      );
    }

    const updated = await this.prisma.loja.update({
      where: { id: lojaId },
      data: {
        dominio_custom_status: ok ? 'VERIFICADO' : 'ERRO',
        dominio_custom_verificado_em: ok ? new Date() : null,
        dominio_custom_cf_status: cf.status || null,
        dominio_custom_cf_ssl_status: cf.ssl?.status || null,
        dominio_custom_cf_validation: this.serializeCfValidation(cf),
        atualizado_em: new Date(),
      },
    });

    return {
      ...this.formatDominioCustomResponse(updated),
      verificacao: {
        cf_ok: ok,
        cf_status: cf.status,
        cf_ssl_status: cf.ssl?.status,
        detalhes,
      },
    };
  }

  private serializeCfValidation(cf: {
    ownership_verification?: {
      type?: string;
      name?: string;
      value?: string;
    };
    ssl?: { validation_records?: Array<Record<string, string | undefined>> };
  }): Prisma.InputJsonValue {
    return {
      ownership_verification: cf.ownership_verification || null,
      ssl_validation_records: cf.ssl?.validation_records || [],
    };
  }

  private normalizeDominioCustom(raw: string): string {
    let host = raw.trim().toLowerCase();
    host = host.replace(/^https?:\/\//, '');
    host = host.split('/')[0] ?? '';
    host = host.split(':')[0] ?? '';
    host = host.replace(/\.$/, '');
    return host;
  }

  private assertDominioCustomAllowed(host: string) {
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) {
      throw new BadRequestException('Domínio inválido.');
    }
    if (host === 'comunikapp.com.br' || host.endsWith('.comunikapp.com.br')) {
      throw new BadRequestException(
        'Use um domínio próprio (não *.comunikapp.com.br).',
      );
    }
    if (host.length > 253) {
      throw new BadRequestException('Domínio muito longo.');
    }
  }

  private formatDominioCustomResponse(loja: {
    dominio_custom: string | null;
    dominio_custom_status: string | null;
    dominio_custom_token: string | null;
    dominio_custom_verificado_em: Date | null;
    dominio_custom_cf_id?: string | null;
    dominio_custom_cf_status?: string | null;
    dominio_custom_cf_ssl_status?: string | null;
    dominio_custom_cf_validation?: unknown;
    slug: string;
  }) {
    const dominio = loja.dominio_custom;
    const token = loja.dominio_custom_token;
    const cnameAlvo = this.cloudflareSaaS.cnameTarget();
    const validation = (loja.dominio_custom_cf_validation || null) as {
      ownership_verification?: {
        type?: string;
        name?: string;
        value?: string;
      } | null;
      ssl_validation_records?: Array<{
        txt_name?: string;
        txt_value?: string;
      }>;
    } | null;

    const ownership = validation?.ownership_verification;
    const sslTxt = validation?.ssl_validation_records?.find(
      (r) => r.txt_name && r.txt_value,
    );

    return {
      dominio_custom: dominio,
      dominio_custom_status: loja.dominio_custom_status || 'NONE',
      dominio_custom_token: token,
      dominio_custom_verificado_em: loja.dominio_custom_verificado_em,
      dominio_custom_cf_id: loja.dominio_custom_cf_id ?? null,
      dominio_custom_cf_status: loja.dominio_custom_cf_status ?? null,
      dominio_custom_cf_ssl_status: loja.dominio_custom_cf_ssl_status ?? null,
      instrucoes: dominio
        ? {
            cname_host: dominio,
            cname_alvo: cnameAlvo,
            txt_host: ownership?.name || sslTxt?.txt_name || null,
            txt_valor: ownership?.value || sslTxt?.txt_value || token,
            ownership_txt_host: ownership?.name || null,
            ownership_txt_valor: ownership?.value || null,
            ssl_txt_host: sslTxt?.txt_name || null,
            ssl_txt_valor: sslTxt?.txt_value || null,
            nota_apex:
              'Use um endereço com prefixo (ex.: sistema.minhaloja.com.br), não o domínio sozinho.',
            nota_trafego:
              'Depois de apontar o DNS e clicar em Verificar, o endereço fica disponível em HTTPS.',
          }
        : null,
    };
  }

  private assertLoginSlugMatchesLoja(
    slug: string | undefined,
    loja: { id: string; slug: string } | null | undefined,
    email: string,
    ip: string,
    ua: string,
  ) {
    const expected = slug?.trim().toLowerCase();
    if (!expected) return;

    if (!loja?.slug || loja.slug !== expected) {
      this.logger.warn(
        `login_blocked tenant_mismatch email=${email} ip=${ip} ua="${ua}" expectedSlug=${expected} lojaSlug=${loja?.slug ?? 'none'}`,
      );
      throw new ForbiddenException(
        'Estas credenciais não pertencem a esta loja. Use o endereço correto ou o login em comunikapp.com.br.',
      );
    }
  }

  async findLojaWithTrial(lojaId: string) {
    const loja = await this.prisma.loja.findUnique({
      where: { id: lojaId },
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada.');
    }

    // Calcular dias restantes do trial
    let trialDaysLeft: number | null = null;
    let trialStatus = 'active';

    if (loja.data_inicio_trial) {
      const trialEndDate = new Date(loja.data_inicio_trial);
      trialEndDate.setDate(trialEndDate.getDate() + 30); // O trial dura 30 dias

      const now = new Date();

      // Normaliza as datas para comparar apenas os dias, ignorando as horas
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const startOfTrialEndDay = new Date(
        trialEndDate.getFullYear(),
        trialEndDate.getMonth(),
        trialEndDate.getDate(),
      );

      const diffTime = startOfTrialEndDay.getTime() - startOfToday.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      trialDaysLeft = Math.max(0, diffDays);

      trialStatus = diffDays < 0 ? 'expired' : 'active';

      // Atualiza o campo no banco de dados se for diferente
      if (loja.trial_restante_dias !== trialDaysLeft) {
        await this.prisma.loja.update({
          where: { id: lojaId },
          data: { trial_restante_dias: trialDaysLeft },
        });
      }
    }

    return {
      ...loja,
      trial_restante_dias: trialDaysLeft,
      trial_status: trialStatus,
      url_canonica: buildCanonicalLojaUrl(loja.slug),
    };
  }

  async create(createOnboardingDto: CreateOnboardingDto) {
    const {
      nome_loja,
      nome_responsavel,
      email,
      telefone,
      cnpj,
      cpf,
      senha,
      codigo_convite,
      token_convite,
    } = createOnboardingDto;

    const normalizedEmail = email.trim().toLowerCase();
    const convite = token_convite?.trim()
      ? await this.validateSignupInviteToken(token_convite, normalizedEmail)
      : null;

    if (!convite) {
      this.validateSignupInviteCode(codigo_convite);
    }

    const documentos = this.validateSignupDocuments(cpf, cnpj);

    if (await this.pendingSignupService.hasVerifiedAccount(normalizedEmail)) {
      throw new BadRequestException(
        'Este e-mail ja possui conta ativa. Faca login ou recupere sua senha.',
      );
    }

    await this.pendingSignupService.purgeUnverifiedSignup(normalizedEmail);

    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(senha, salt);

      const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + 15);

      return await this.prisma.$transaction(async (tx) => {
        const lojaId = Math.random().toString(36).substr(2, 9);
        let slug = suggestLojaSlugFromNome(nome_loja, lojaId);
        for (let attempt = 1; attempt < 30; attempt += 1) {
          const candidate = nextSlugOnCollision(slug, attempt);
          if (!isValidLojaSlug(candidate)) continue;
          const taken = await tx.loja.findFirst({
            where: { slug: candidate },
            select: { id: true },
          });
          if (!taken) {
            slug = candidate;
            break;
          }
        }

        const loja = await tx.loja.create({
          data: {
            id: lojaId,
            nome: nome_loja,
            slug,
            nome_fantasia: nome_loja,
            email: normalizedEmail,
            telefone,
            cpf: documentos.cpf,
            cnpj: documentos.cnpj,
            atualizado_em: new Date(),
          },
        });

        const usuario = await tx.usuario.create({
          data: {
            id: Math.random().toString(36).substr(2, 9), // Gerar ID único
            nome_completo: nome_responsavel,
            email: normalizedEmail,
            telefone: telefone,
            senha: hashedPassword,
            funcao: usuario_funcao.ADMINISTRADOR,
            loja_id: loja.id,
            codigo_verificacao_email: emailCode,
            codigo_verificacao_email_expiracao: expirationDate,
            atualizado_em: new Date(),
          },
        });

        await this.mailService.sendVerificationEmail(usuario.email, emailCode);

        if (convite) {
          await tx.conviteCadastro.update({
            where: { id: convite.id },
            data: {
              status: SIGNUP_INVITE_STATUS.USADO,
              usado_em: new Date(),
              usado_por_loja_id: loja.id,
              usado_por_usuario_id: usuario.id,
            },
          });
        }

        // SEGURANÇA: NUNCA retornar o código de verificação nem hash da senha na resposta.
        // O código fica apenas no e-mail enviado e gravado no banco para conferência posterior.
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          senha: _senha,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          codigo_verificacao_email: _codigo,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          codigo_verificacao_email_expiracao: _codigoExp,
          ...result
        } = usuario;
        return result;
      });
    } catch (err: unknown) {
      // Sempre loga o erro original ANTES de mascarar para o cliente.
      // Isto facilita o diagnóstico em produção (PM2 logs / journalctl).
      console.error(
        '[LojasService.create] Erro ao criar conta. Detalhes do erro original:',
        {
          name: (err as { name?: string })?.name,
          code: (err as { code?: string })?.code,
          message: (err as { message?: string })?.message,
          meta: (err as { meta?: unknown })?.meta,
          stack:
            process.env.NODE_ENV === 'production'
              ? undefined
              : (err as { stack?: string })?.stack,
        },
      );

      // Prisma: violação de unique (ex.: e-mail já cadastrado)
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Nao foi possivel concluir o cadastro com este e-mail. Se voce ja tentou antes, solicite um novo convite ou reenvie o codigo de verificacao.',
        );
      }
      // Prisma: outros erros de validação/banco
      if (err && typeof err === 'object' && 'code' in err) {
        throw new BadRequestException(
          'Não foi possível criar a conta. Verifique os dados (nome, e-mail, telefone, documento e senha) e tente novamente.',
        );
      }
      // Erro lançado de dentro do fluxo (já com mensagem amigável)
      if (err instanceof BadRequestException) {
        throw err;
      }
      // Mensagem amigável para qualquer outro erro (ex.: senha com caractere que quebra fluxo)
      throw new BadRequestException(
        'Não foi possível criar a conta. Verifique a senha (mínimo 6 caracteres; evite aspas ou caracteres que possam causar erro). Se o problema continuar, tente outra senha.',
      );
    }
  }

  async verifyEmail({ email, codigo }: VerifyEmailDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        loja: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (usuario.email_verificado) {
      throw new BadRequestException('Este e-mail já foi verificado.');
    }

    if (
      !usuario.codigo_verificacao_email ||
      !usuario.codigo_verificacao_email_expiracao
    ) {
      throw new BadRequestException(
        'Não há código de verificação pendente para este usuário.',
      );
    }

    if (usuario.codigo_verificacao_email !== codigo) {
      throw new BadRequestException('Código de verificação inválido.');
    }

    if (new Date() > usuario.codigo_verificacao_email_expiracao) {
      throw new BadRequestException(
        'O codigo de verificacao expirou. Clique em "Reenviar codigo" para receber um novo.',
      );
    }

    // Usar transação para ativar tanto o usuário quanto a loja
    await this.prisma.$transaction(async (tx) => {
      // Ativar usuário
      await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          email_verificado: true,
          status: usuario_status.ATIVO,
          codigo_verificacao_email: null,
          codigo_verificacao_email_expiracao: null,
        },
      });

      // Ativar loja e definir data de início do trial
      await tx.loja.update({
        where: { id: usuario.loja_id },
        data: {
          status: loja_status.ATIVO,
          data_inicio_trial: new Date(),
          trial_restante_dias: 30, // Inicia com 30 dias
        },
      });
    });

    return { message: 'E-mail verificado com sucesso!' };
  }

  async resendVerificationEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (!usuario) {
      throw new NotFoundException(
        'Nenhum cadastro pendente encontrado para este e-mail.',
      );
    }

    if (usuario.email_verificado) {
      throw new BadRequestException(
        'Este e-mail ja foi verificado. Faca login.',
      );
    }

    const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 15);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        codigo_verificacao_email: emailCode,
        codigo_verificacao_email_expiracao: expirationDate,
      },
    });

    await this.mailService.sendVerificationEmail(normalizedEmail, emailCode);

    return {
      message: 'Enviamos um novo codigo de verificacao para seu e-mail.',
    };
  }

  findAll() {
    return this.prisma.loja.findMany();
  }

  findOne(id: string) {
    return this.prisma.loja.findUnique({ where: { id } });
  }

  async updateConfiguracoes(
    lojaId: string,
    updateConfiguracoesLojaDto: UpdateConfiguracoesLojaDto,
  ): Promise<loja> {
    // Converter strings vazias para null e strings numéricas para números
    const data: any = { ...updateConfiguracoesLojaDto };

    // Converter campos numéricos
    const numericFields = [
      'custo_maquinaria_hora',
      'custos_indiretos_mensais',
      'margem_lucro_padrao',
      'impostos_padrao',
      'comissao_padrao',
      'horas_produtivas_mensais',
    ];
    // tipo_margem_lucro é string ('markup' | 'margem_por_dentro'), não numérico
    if (data.tipo_margem_lucro !== undefined) {
      const v = data.tipo_margem_lucro;
      if (v !== 'markup' && v !== 'margem_por_dentro') {
        data.tipo_margem_lucro = 'margem_por_dentro';
      }
    }

    for (const field of numericFields) {
      if (data[field] !== undefined) {
        if (data[field] === '' || data[field] === null) {
          data[field] = null;
        } else {
          const numValue = parseFloat(data[field]);
          if (!isNaN(numValue)) {
            data[field] = numValue;
          } else {
            data[field] = null;
          }
        }
      }
    }

    return this.prisma.loja.update({
      where: { id: lojaId },
      data,
    });
  }

  async updateCadastro(
    lojaId: string,
    dto: UpdateCadastroLojaDto,
  ): Promise<loja & { url_canonica: string }> {
    const data: Record<string, unknown> = { atualizado_em: new Date() };

    if (dto.nome !== undefined) data.nome = dto.nome.trim();
    if (dto.razao_social !== undefined) {
      data.razao_social = dto.razao_social?.trim() || null;
    }
    if (dto.nome_fantasia !== undefined) {
      data.nome_fantasia = dto.nome_fantasia?.trim() || null;
    }
    if (dto.email !== undefined) {
      data.email = dto.email.trim().toLowerCase();
    }
    if (dto.telefone !== undefined) data.telefone = dto.telefone.trim();

    if (dto.cnpj !== undefined || dto.cpf !== undefined) {
      const cnpjRaw = dto.cnpj === undefined ? undefined : dto.cnpj;
      const cpfRaw = dto.cpf === undefined ? undefined : dto.cpf;
      if (cnpjRaw !== undefined) {
        if (!cnpjRaw || !String(cnpjRaw).trim()) {
          data.cnpj = null;
        } else {
          const n = normalizeCnpj(cnpjRaw);
          if (!isValidCnpj(n)) {
            throw new BadRequestException('CNPJ inválido.');
          }
          data.cnpj = formatCnpj(n);
          data.cpf = null;
        }
      }
      if (cpfRaw !== undefined && data.cnpj === undefined) {
        if (!cpfRaw || !String(cpfRaw).trim()) {
          data.cpf = null;
        } else {
          const n = normalizeCpf(cpfRaw);
          if (!isValidCpf(n)) {
            throw new BadRequestException('CPF inválido.');
          }
          data.cpf = formatCpf(n);
          data.cnpj = null;
        }
      }
    }

    if (dto.inscricao_estadual !== undefined) {
      data.inscricao_estadual = dto.inscricao_estadual?.trim() || null;
    }
    if (dto.inscricao_municipal !== undefined) {
      data.inscricao_municipal = dto.inscricao_municipal?.trim() || null;
    }

    if (dto.slug !== undefined) {
      const slug = normalizeLojaSlugCandidate(dto.slug);
      if (!isValidLojaSlug(slug)) {
        throw new BadRequestException(
          'Slug inválido ou reservado. Use 3–48 caracteres (a-z, 0-9, hífen).',
        );
      }
      const atual = await this.prisma.loja.findUnique({
        where: { id: lojaId },
        select: { slug: true, slug_anterior: true },
      });
      if (!atual) {
        throw new NotFoundException('Loja não encontrada.');
      }
      if (slug !== atual.slug) {
        const taken = await this.prisma.loja.findFirst({
          where: {
            OR: [{ slug }, { slug_anterior: slug }],
            NOT: { id: lojaId },
          },
          select: { id: true },
        });
        if (taken) {
          throw new ConflictException('Este endereço de URL já está em uso.');
        }
        data.slug = slug;
        data.slug_anterior = atual.slug;
        data.slug_atualizado_em = new Date();
      }
    }

    const addressFields = [
      'cep',
      'logradouro',
      'numero',
      'complemento',
      'bairro',
      'cidade',
      'uf',
    ] as const;
    for (const field of addressFields) {
      if (dto[field] !== undefined) {
        const value = dto[field];
        if (field === 'uf' && value) {
          data.uf = String(value).trim().toUpperCase().slice(0, 2) || null;
        } else {
          data[field] = value?.toString().trim() || null;
        }
      }
    }

    const loja = await this.prisma.loja.update({
      where: { id: lojaId },
      data,
    });

    return {
      ...loja,
      url_canonica: buildCanonicalLojaUrl(loja.slug),
    };
  }

  update(id: string, updateLojaDto: UpdateLojaDto) {
    return this.prisma.loja.update({
      where: { id },
      data: updateLojaDto,
    });
  }

  remove(id: string) {
    return this.prisma.loja.delete({
      where: { id },
    });
  }

  async updateLogoUrl(lojaId: string, filename: string): Promise<loja> {
    if (!filename) {
      throw new Error('Nome do arquivo inválido para o logo.');
    }
    const logo_url = `/uploads/${filename}`;
    return this.prisma.loja.update({
      where: { id: lojaId },
      data: { logo_url: logo_url },
    });
  }
}
