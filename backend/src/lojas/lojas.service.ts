import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class LojasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
  ) {}

  async login({ email, password }: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        loja: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!usuario.email_verificado) {
      throw new UnauthorizedException('Email não verificado. Verifique sua caixa de entrada.');
    }

    if (usuario.status !== 'ATIVO') {
      throw new UnauthorizedException('Conta não está ativa.');
    }

    const isPasswordValid = await bcrypt.compare(password, usuario.senha);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Gerar token JWT
    const token = await this.authService.generateToken({
      id: usuario.id,
      email: usuario.email,
      loja_id: usuario.loja_id,
      funcao: usuario.funcao,
      nome_completo: usuario.nome_completo,
    });

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
      select: {
        id: true,
        nome_completo: true,
        email: true,
        telefone: true,
        funcao: true,
        loja_id: true,
        email_verificado: true,
        status: true,
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
      select: {
        id: true,
        name: true,
        status: true,
        trial_ends_at: true,
        subscription_status: true,
        createdAt: true,
      },
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada.');
    }

    // Calcular dias restantes do trial
    let trialDaysLeft: number | null = null;
    let trialStatus = 'active';

    if (loja.trial_ends_at) {
      const now = new Date();
      const trialEnd = new Date(loja.trial_ends_at);
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      trialDaysLeft = Math.max(0, diffDays);
      trialStatus = diffDays > 0 ? 'active' : 'expired';
    }

    return {
      ...loja,
      trial_days_left: trialDaysLeft,
      trial_status: trialStatus,
    };
  }

  async create(createOnboardingDto: CreateOnboardingDto) {
    const {
      storeName,
      name,
      email,
      phone,
      tipoPessoa,
      documento,
      password,
    } = createOnboardingDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 15);

    return this.prisma.$transaction(async (tx) => {
      const loja = await tx.loja.create({
        data: {
          name: storeName,
          email,
          phone,
          tipo_pessoa: tipoPessoa,
          documento,
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          nome_completo: name,
          email,
          telefone: phone,
          senha: hashedPassword,
          funcao: 'ADMINISTRADOR',
          loja_id: loja.id,
          codigo_verificacao_email: emailCode,
          codigo_verificacao_email_expiracao: expirationDate,
        },
      });

      await this.mailService.sendVerificationEmail(usuario.email, emailCode);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { senha, ...result } = usuario;
      return result;
    });
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
          status: 'ATIVO',
          codigo_verificacao_email: null,
          codigo_verificacao_email_expiracao: null,
        },
      });

      // Ativar loja e definir trial de 30 dias
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);

      await tx.loja.update({
        where: { id: usuario.loja_id },
        data: {
          status: 'ATIVO',
          trial_ends_at: trialEndDate,
        },
      });
    });

    return { message: 'E-mail verificado com sucesso!' };
  }

  async ativarTrialTemp(lojaId: string) {
    const loja = await this.prisma.loja.findUnique({
      where: { id: lojaId },
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada.');
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    await this.prisma.loja.update({
      where: { id: lojaId },
      data: {
        trial_ends_at: trialEndDate,
      },
    });

    return { 
      message: 'Trial ativado com sucesso!',
      trial_ends_at: trialEndDate,
    };
  }

  findAll() {
    return this.prisma.loja.findMany();
  }

  findOne(id: string) {
    return this.prisma.loja.findUnique({
      where: { id },
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
}
