import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class LojasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
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

    // Remove senha do retorno
    const { senha, codigo_verificacao_email, codigo_verificacao_email_expiracao, ...result } = usuario;
    
    return {
      user: result,
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
          status: 'ATIVO', // ← AQUI estava faltando!
          codigo_verificacao_email: null,
          codigo_verificacao_email_expiracao: null,
        },
      });

      // Ativar loja também
      await tx.loja.update({
        where: { id: usuario.loja_id },
        data: {
          status: 'ATIVO', // ← E AQUI também!
        },
      });
    });

    return { message: 'E-mail verificado com sucesso!' };
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
