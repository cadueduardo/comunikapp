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
import { randomBytes, createHash } from 'crypto';

type PasswordResetAttemptState = {
  attempts: number;
  firstAttemptAt: number;
};

@Injectable()
export class UsuariosService {
  private readonly passwordResetAttempts = new Map<string, PasswordResetAttemptState>();
  private readonly passwordResetWindowMs = 15 * 60 * 1000;
  private readonly passwordResetMaxAttempts = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private normalizeEmail(email: string) {
    return String(email || '').trim().toLowerCase();
  }

  private hashPasswordResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private canRequestPasswordReset(email: string) {
    const key = this.normalizeEmail(email);
    const now = Date.now();
    const existing = this.passwordResetAttempts.get(key);

    if (!existing || now - existing.firstAttemptAt > this.passwordResetWindowMs) {
      this.passwordResetAttempts.set(key, {
        attempts: 1,
        firstAttemptAt: now,
      });
      return true;
    }

    existing.attempts += 1;
    this.passwordResetAttempts.set(key, existing);
    return existing.attempts <= this.passwordResetMaxAttempts;
  }

  async listar(lojaId: string) {
    return this.prisma.usuario.findMany({
      where: { loja_id: lojaId },
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

  async obter(id: string, lojaId: string) {
    const user = await this.prisma.usuario.findFirst({
      where: { id, loja_id: lojaId },
    });
    if (!user) throw new NotFoundException('Usuario nao encontrado');
    return user;
  }

  async criar(lojaId: string, dto: CreateUsuarioDto) {
    const exists = await this.prisma.usuario.findFirst({
      where: { email: dto.email, loja_id: lojaId },
    });
    if (exists)
      throw new BadRequestException('E-mail ja cadastrado para esta loja');

    const data: any = { ...dto, loja_id: lojaId };
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
      const loja = await this.prisma.loja.findUnique({
        where: { id: lojaId },
        select: { nome: true },
      });
      const activationLink = `${
        process.env.FRONTEND_URL || 'https://comunikapp.com.br'
      }/primeiro-acesso?email=${encodeURIComponent(created.email)}`;
      await this.mail.sendVerificationEmail(
        created.email,
        created.codigo_verificacao_email,
        {
          mode: 'convite',
          activationLink,
          lojaNome: loja?.nome || undefined,
        },
      );
    }
    return { id: created.id };
  }

  async atualizar(id: string, lojaId: string, dto: UpdateUsuarioDto) {
    const user = await this.prisma.usuario.findFirst({
      where: { id, loja_id: lojaId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    return this.prisma.usuario.update({ where: { id }, data: dto as any });
  }

  async desativar(id: string, lojaId: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, loja_id: lojaId },
      select: { id: true, funcao: true, status: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    if (usuario.status === usuario_status.INATIVO) {
      return { id: usuario.id, status: usuario_status.INATIVO };
    }

    if (usuario.funcao === usuario_funcao.ADMINISTRADOR) {
      const totalAdminsAtivos = await this.prisma.usuario.count({
        where: {
          loja_id: lojaId,
          funcao: usuario_funcao.ADMINISTRADOR,
          status: usuario_status.ATIVO,
        },
      });

      if (totalAdminsAtivos <= 1) {
        throw new BadRequestException(
          'Nao e permitido desativar o ultimo administrador ativo da loja',
        );
      }
    }

    const updated = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        status: usuario_status.INATIVO,
        ativo: false,
      },
      select: {
        id: true,
        status: true,
        ativo: true,
      },
    });

    return updated;
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

    const activationLink = `${
      process.env.FRONTEND_URL || 'https://comunikapp.com.br'
    }/primeiro-acesso?email=${encodeURIComponent(email)}`;
    await this.mail.sendVerificationEmail(email, code, {
      mode: 'convite',
      activationLink,
    });
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

  async solicitarRedefinicaoSenha(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const genericResponse = {
      message:
        'Se o e-mail existir, enviaremos instrucoes para redefinir a senha.',
    };

    if (!normalizedEmail || !this.canRequestPasswordReset(normalizedEmail)) {
      return genericResponse;
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        status: true,
        email_verificado: true,
      },
    });

    if (
      !usuario ||
      usuario.status !== usuario_status.ATIVO ||
      !usuario.email_verificado
    ) {
      return genericResponse;
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashPasswordResetToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: {
          usuario_id: usuario.id,
          used_at: null,
        },
        data: {
          used_at: new Date(),
        },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          usuario_id: usuario.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        },
      }),
    ]);

    const resetLink = `${
      process.env.FRONTEND_URL || 'https://comunikapp.com.br'
    }/redefinir-senha?token=${encodeURIComponent(token)}`;

    await this.mail.sendPasswordResetEmail(usuario.email, resetLink);

    return genericResponse;
  }

  async redefinirSenha(token: string, novaSenha: string) {
    if (!token || !novaSenha) {
      throw new BadRequestException('Token e senha sao obrigatorios');
    }

    if (novaSenha.length < 8) {
      throw new BadRequestException('A senha deve ter no minimo 8 caracteres');
    }

    const tokenHash = this.hashPasswordResetToken(token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
      include: {
        usuario: {
          select: {
            id: true,
            status: true,
            email_verificado: true,
          },
        },
      },
    });

    if (
      !resetToken ||
      resetToken.used_at ||
      resetToken.expires_at < new Date() ||
      resetToken.usuario.status !== usuario_status.ATIVO ||
      !resetToken.usuario.email_verificado
    ) {
      throw new BadRequestException('Link de redefinicao invalido ou expirado');
    }

    const salt = await bcrypt.genSalt();
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: resetToken.usuario_id },
        data: { senha: senhaHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used_at: new Date() },
      }),
    ]);

    return { message: 'Senha redefinida com sucesso' };
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
