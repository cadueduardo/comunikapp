import { Injectable } from '@nestjs/common';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';

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
