import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class LojasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

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

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        email_verificado: true,
        codigo_verificacao_email: null,
        codigo_verificacao_email_expiracao: null,
      },
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
