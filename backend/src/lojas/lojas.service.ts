import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { FuncaoUsuario, StatusConta, StatusLoja } from '@prisma/client';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateConfiguracoesLojaDto } from './dto/update-configuracoes-loja.dto';
import { Loja } from '@prisma/client';

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
        loja: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!usuario.email_verificado) {
      throw new UnauthorizedException(
        'Email não verificado. Verifique sua caixa de entrada.',
      );
    }

    if (usuario.status !== StatusConta.ATIVO) {
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
      loja: usuario.loja,
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

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(senha, salt);

    const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 15);

    return this.prisma.$transaction(async (tx) => {
      const loja = await tx.loja.create({
        data: {
          nome: nome_loja,
          email,
          telefone,
          cpf: cpf || undefined,
          cnpj: cnpj || undefined,
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          nome_completo: nome_responsavel,
          email,
          telefone: telefone,
          senha: hashedPassword,
          funcao: FuncaoUsuario.ADMINISTRADOR,
          loja_id: loja.id,
          codigo_verificacao_email: emailCode,
          codigo_verificacao_email_expiracao: expirationDate,
        },
      });

      await this.mailService.sendVerificationEmail(usuario.email, emailCode);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { senha: _, ...result } = usuario;
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
          status: StatusConta.ATIVO,
          codigo_verificacao_email: null,
          codigo_verificacao_email_expiracao: null,
        },
      });

      // Ativar loja e definir data de início do trial
      await tx.loja.update({
        where: { id: usuario.loja_id },
        data: {
          status: StatusLoja.ATIVO,
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
  ): Promise<Loja> {
    // Converter strings vazias para null e strings numéricas para números
    const data: any = { ...updateConfiguracoesLojaDto };
    
    // Converter campos numéricos
    const numericFields = ['custo_maquinaria_hora', 'custos_indiretos_mensais', 'margem_lucro_padrao', 'impostos_padrao', 'horas_produtivas_mensais'];
    
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

  async updateLogoUrl(lojaId: string, filename: string): Promise<Loja> {
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
