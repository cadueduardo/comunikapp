import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { usuario_funcao, usuario_status, loja_status } from '@prisma/client';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateConfiguracoesLojaDto } from './dto/update-configuracoes-loja.dto';
import { loja } from '@prisma/client';

type LoginAttemptState = {
  failedAttempts: number;
  firstFailureAt: number;
  lockUntil?: number;
};

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
  ) {}

  private getLoginAttemptKey(email: string, ip: string) {
    return `${email.trim().toLowerCase()}|${ip}`;
  }

  private getLoginAttemptState(key: string): LoginAttemptState {
    const now = Date.now();
    const existing = this.loginAttempts.get(key);

    if (!existing || now - existing.firstFailureAt > this.loginAttemptWindowMs) {
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

  private sanitizeUserAgent(userAgent: string) {
    return userAgent.length > 240
      ? `${userAgent.slice(0, 240)}...`
      : userAgent;
  }

  async login(
    { email, password, captchaToken }: LoginDto,
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

      const isCaptchaValid = await this.validateTurnstileToken(captchaToken, ip);
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
    };
  }

  async create(createOnboardingDto: CreateOnboardingDto) {
    const { nome_loja, nome_responsavel, email, telefone, cnpj, cpf, senha } =
      createOnboardingDto;

    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(senha, salt);

      const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + 15);

      return await this.prisma.$transaction(async (tx) => {
        const loja = await tx.loja.create({
          data: {
            id: Math.random().toString(36).substr(2, 9), // Gerar ID único
            nome: nome_loja,
            email,
            telefone,
            cpf: cpf || undefined,
            cnpj: cnpj || undefined,
            atualizado_em: new Date(),
          },
        });

        const usuario = await tx.usuario.create({
          data: {
            id: Math.random().toString(36).substr(2, 9), // Gerar ID único
            nome_completo: nome_responsavel,
            email,
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { senha: _, ...result } = usuario;
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
      if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
        throw new BadRequestException(
          'Este e-mail já está cadastrado. Use outro e-mail ou faça login.',
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
      // TODO: Implementar lógica de reenviar código
      throw new BadRequestException('O código de verificação expirou.');
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
