import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { StatusConta } from '@prisma/client';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService, private readonly mail: MailService) {}

  async listar() {
    return this.prisma.usuario.findMany({
      select: { id: true, nome_completo: true, email: true, funcao: true, loja_id: true, status: true },
    });
  }

  async obter(id: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async criar(dto: CreateUsuarioDto) {
    // Placeholder mínimo: garantir unicidade de email por loja
    const exists = await this.prisma.usuario.findFirst({ where: { email: dto.email, loja_id: dto.loja_id } });
    if (exists) throw new BadRequestException('E-mail já cadastrado para esta loja');
    // Se senha foi informada, criptografa; se não, cria convite (senha será definida no primeiro acesso)
    const data: any = { ...dto };
    if (dto.senha) {
      const salt = await bcrypt.genSalt();
      data.senha = await bcrypt.hash(dto.senha, salt);
      data.status = StatusConta.ATIVO;
      data.email_verificado = true;
    } else {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + 15);
      data.status = StatusConta.INATIVO;
      data.email_verificado = false;
      data.codigo_verificacao_email = code;
      data.codigo_verificacao_email_expiracao = expiration;
    }
    const created = await this.prisma.usuario.create({ data });
    if (!dto.senha) {
      await this.mail.sendVerificationEmail(created.email, created.codigo_verificacao_email!);
    }
    return { id: created.id };
  }

  async atualizar(id: string, dto: UpdateUsuarioDto) {
    return this.prisma.usuario.update({ where: { id }, data: dto as any });
  }

  async reenviarCodigo(email: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    if (usuario.email_verificado) throw new BadRequestException('E-mail já verificado');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 15);
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        codigo_verificacao_email: code,
        codigo_verificacao_email_expiracao: expiration,
      },
    });
    await this.mail.sendVerificationEmail(email, code);
    return { message: 'Código reenviado' };
  }

  async definirSenhaInicial(email: string, codigo: string, novaSenha: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    if (usuario.email_verificado) throw new BadRequestException('E-mail já verificado');
    if (!usuario.codigo_verificacao_email || !usuario.codigo_verificacao_email_expiracao) {
      throw new BadRequestException('Não há código pendente');
    }
    if (usuario.codigo_verificacao_email !== codigo) {
      throw new UnauthorizedException('Código inválido');
    }
    if (new Date() > usuario.codigo_verificacao_email_expiracao) {
      throw new BadRequestException('Código expirado');
    }
    const salt = await bcrypt.genSalt();
    const senhaHash = await bcrypt.hash(novaSenha, salt);
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: senhaHash,
        email_verificado: true,
        status: StatusConta.ATIVO,
        codigo_verificacao_email: null,
        codigo_verificacao_email_expiracao: null,
      },
    });
    return { message: 'Senha definida e e-mail verificado' };
  }
}


