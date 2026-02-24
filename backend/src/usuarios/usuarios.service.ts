import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { usuario_status, usuario_funcao } from '@prisma/client';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async listar() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nome_completo: true,
        email: true,
        funcao: true,
        loja_id: true,
        status: true,
      },
    });
  }

  async obter(id: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario nao encontrado');
    return user;
  }

  async criar(dto: CreateUsuarioDto) {
    const exists = await this.prisma.usuario.findFirst({
      where: { email: dto.email, loja_id: dto.loja_id },
    });
    if (exists)
      throw new BadRequestException('E-mail ja cadastrado para esta loja');

    const data: any = { ...dto };
    if (dto.senha) {
      const salt = await bcrypt.genSalt();
      data.senha = await bcrypt.hash(dto.senha, salt);
      data.status = usuario_status.ATIVO;
      data.email_verificado = true;
    } else {
      const temp = Math.random().toString(36).slice(-12);
      const salt = await bcrypt.genSalt();
      data.senha = await bcrypt.hash(temp, salt);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + 15);
      data.status = usuario_status.PENDENTE_VERIFICACAO;
      data.email_verificado = false;
      data.codigo_verificacao_email = code;
      data.codigo_verificacao_email_expiracao = expiration;
    }

    const created = await this.prisma.usuario.create({ data });
    if (!dto.senha) {
      await this.mail.sendVerificationEmail(
        created.email,
        created.codigo_verificacao_email,
      );
    }
    return { id: created.id };
  }

  async atualizar(id: string, dto: UpdateUsuarioDto) {
    return this.prisma.usuario.update({ where: { id }, data: dto as any });
  }

  async reenviarCodigo(email: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (!usuario) throw new NotFoundException('Usuario nao encontrado');
    if (usuario.email_verificado)
      throw new BadRequestException('E-mail ja verificado');

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
    return { message: 'Codigo reenviado' };
  }

  async definirSenhaInicial(email: string, codigo: string, novaSenha: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (!usuario) throw new NotFoundException('Usuario nao encontrado');
    if (usuario.email_verificado)
      throw new BadRequestException('E-mail ja verificado');

    if (
      !usuario.codigo_verificacao_email ||
      !usuario.codigo_verificacao_email_expiracao
    ) {
      throw new BadRequestException('Nao ha codigo pendente');
    }

    if (usuario.codigo_verificacao_email !== codigo) {
      throw new UnauthorizedException('Codigo invalido');
    }

    if (new Date() > usuario.codigo_verificacao_email_expiracao) {
      throw new BadRequestException('Codigo expirado');
    }

    const salt = await bcrypt.genSalt();
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: senhaHash,
        email_verificado: true,
        status: usuario_status.ATIVO,
        codigo_verificacao_email: null,
        codigo_verificacao_email_expiracao: null,
      },
    });

    return { message: 'Senha definida e e-mail verificado' };
  }

  async listarPerfis() {
    const perfisBase = Object.values(usuario_funcao).map((f) => ({
      id: f,
      nome: f,
      sistema: true,
      ativo: true,
    }));

    try {
      const custom: any[] = await this.prisma.$queryRawUnsafe(
        'SELECT id, nome, 0 as sistema, ativo FROM perfil_acesso',
      );
      return [...perfisBase, ...custom];
    } catch {
      return perfisBase;
    }
  }
}
