import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import {
  AtualizarUsuarioPreferenciasDto,
  UsuarioPreferenciasJson,
} from './dto/usuario-preferencias.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { LojaAuditService } from '../rbac/auditoria/loja-audit.service';
import { incrementoSessionVersion } from '../rbac/sessao-usuario';
import { usuario_status, usuario_funcao, Prisma } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { ListarUsuariosQueryDto } from './dto/paginacao-query.dto';

type PasswordResetAttemptState = {
  attempts: number;
  firstAttemptAt: number;
};

const USUARIO_PUBLICO_SELECT = {
  id: true,
  nome_completo: true,
  email: true,
  telefone: true,
  funcao: true,
  loja_id: true,
  status: true,
  ativo: true,
  email_verificado: true,
  criado_em: true,
  atualizado_em: true,
} as const;

@Injectable()
export class UsuariosService {
  private readonly passwordResetAttempts = new Map<
    string,
    PasswordResetAttemptState
  >();
  private readonly passwordResetWindowMs = 15 * 60 * 1000;
  private readonly passwordResetMaxAttempts = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly audit: LojaAuditService,
  ) {}

  private normalizeEmail(email: string) {
    return String(email || '')
      .trim()
      .toLowerCase();
  }

  private hashPasswordResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private canRequestPasswordReset(email: string) {
    const key = this.normalizeEmail(email);
    const now = Date.now();
    const existing = this.passwordResetAttempts.get(key);

    if (
      !existing ||
      now - existing.firstAttemptAt > this.passwordResetWindowMs
    ) {
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

  async listar(lojaId: string, query: ListarUsuariosQueryDto = {}) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const busca = query.busca?.trim();
    const where: Prisma.usuarioWhereInput = {
      loja_id: lojaId,
      ...(query.status ? { status: query.status } : {}),
      ...(busca
        ? {
            OR: [
              { nome_completo: { contains: busca } },
              { email: { contains: busca } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: USUARIO_PUBLICO_SELECT,
        orderBy: { nome_completo: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async obter(id: string, lojaId: string) {
    const user = await this.prisma.usuario.findFirst({
      where: { id, loja_id: lojaId },
      select: {
        ...USUARIO_PUBLICO_SELECT,
        perfis: {
          select: {
            perfil_id: true,
            perfil: {
              select: {
                id: true,
                nome: true,
                sistema: true,
                ativo: true,
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async criar(lojaId: string, dto: CreateUsuarioDto, atorId: string) {
    if (!dto.senha?.trim()) {
      throw new BadRequestException(
        'O convite por e-mail sem senha foi desativado nesta área. Use a Gestão ComunikApp para convidar usuários, ou informe uma senha para criar o usuário já ativo.',
      );
    }

    const email = this.normalizeEmail(dto.email);
    const exists = await this.prisma.usuario.findUnique({
      where: { email },
      select: { id: true, loja_id: true },
    });
    if (exists) {
      throw new BadRequestException(
        exists.loja_id === lojaId
          ? 'E-mail já cadastrado para esta loja.'
          : 'Este e-mail já está vinculado a outra loja.',
      );
    }

    const salt = await bcrypt.genSalt();
    const senhaHash = await bcrypt.hash(dto.senha, salt);

    const created = await this.prisma.$transaction(async (tx) => {
      if (dto.funcao === usuario_funcao.ADMINISTRADOR) {
        await this.assertAtorPodeConcederAdministrador(tx, lojaId, atorId);
      }
      const usuario = await tx.usuario.create({
        data: {
          loja_id: lojaId,
          email,
          nome_completo: dto.nome_completo.trim(),
          telefone: dto.telefone?.trim() || null,
          funcao: dto.funcao,
          senha: senhaHash,
          status: usuario_status.ATIVO,
          email_verificado: true,
          ativo: true,
        },
        select: { id: true, email: true, funcao: true },
      });
      if (dto.perfilIds?.length) {
        await this.substituirPerfis(tx, usuario.id, lojaId, dto.perfilIds);
      }
      await this.audit.registrar({
        lojaId,
        atorId,
        action: 'usuario.criar',
        resourceType: 'usuario',
        resourceId: usuario.id,
        newState: {
          id: usuario.id,
          email: usuario.email,
          funcao: usuario.funcao,
          perfilIds: dto.perfilIds ?? [],
        },
        tx,
      });
      return usuario;
    });

    return { id: created.id };
  }

  async atualizar(
    id: string,
    lojaId: string,
    dto: UpdateUsuarioDto,
    atorId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.usuario.findFirst({
        where: { id, loja_id: lojaId },
        select: { id: true, funcao: true, status: true },
      });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      this.assertNaoAlteraProprioPrivilegio(id, atorId, dto, user);

      if (
        dto.funcao === usuario_funcao.ADMINISTRADOR &&
        user.funcao !== usuario_funcao.ADMINISTRADOR
      ) {
        await this.assertAtorPodeConcederAdministrador(tx, lojaId, atorId);
      }

      const proximaFuncao = dto.funcao ?? user.funcao;
      const proximoStatus = dto.status ?? user.status;
      const deixaDeSerAdminAtivo =
        user.funcao === usuario_funcao.ADMINISTRADOR &&
        user.status === usuario_status.ATIVO &&
        (proximaFuncao !== usuario_funcao.ADMINISTRADOR ||
          proximoStatus !== usuario_status.ATIVO);

      if (deixaDeSerAdminAtivo) {
        await this.assertNaoEUltimoAdmin(tx, lojaId, id);
      }

      const data: Prisma.usuarioUpdateInput = {};
      if (dto.nome_completo !== undefined) {
        data.nome_completo = dto.nome_completo.trim();
      }
      if (dto.email !== undefined) {
        data.email = this.normalizeEmail(dto.email);
      }
      if (dto.telefone !== undefined) {
        data.telefone = dto.telefone.trim() || null;
      }
      if (dto.funcao !== undefined) {
        data.funcao = dto.funcao;
      }
      if (dto.status !== undefined) {
        data.status = dto.status;
        data.ativo = dto.status === usuario_status.ATIVO;
      }
      if (
        deixaDeSerAdminAtivo ||
        dto.status !== undefined ||
        dto.funcao !== undefined
      ) {
        Object.assign(data, incrementoSessionVersion());
      }

      const atualizado = await tx.usuario.update({
        where: { id },
        data: data as Prisma.usuarioUpdateInput,
        select: USUARIO_PUBLICO_SELECT,
      });
      if (dto.perfilIds) {
        await this.substituirPerfis(tx, id, lojaId, dto.perfilIds);
        await tx.usuario.update({
          where: { id },
          data: incrementoSessionVersion() as Prisma.usuarioUpdateInput,
        });
      }
      await this.audit.registrar({
        lojaId,
        atorId,
        action: 'usuario.atualizar',
        resourceType: 'usuario',
        resourceId: id,
        previousState: {
          funcao: user.funcao,
          status: user.status,
        },
        newState: {
          funcao: atualizado.funcao,
          status: atualizado.status,
          perfilIds: dto.perfilIds,
        },
        tx,
      });
      return atualizado;
    });
  }

  async desativar(id: string, lojaId: string, atorId: string) {
    if (id === atorId) {
      throw new ForbiddenException(
        'Não é permitido desativar o próprio usuário',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findFirst({
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
        await this.assertNaoEUltimoAdmin(tx, lojaId, id);
      }

      const updated = await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          status: usuario_status.INATIVO,
          ativo: false,
          ...incrementoSessionVersion(),
        } as Prisma.usuarioUpdateInput,
        select: {
          id: true,
          status: true,
          ativo: true,
        },
      });

      await this.audit.registrar({
        lojaId,
        atorId,
        action: 'usuario.desativar',
        resourceType: 'usuario',
        resourceId: id,
        previousState: { status: usuario.status },
        newState: { status: updated.status },
        tx,
      });

      return updated;
    });
  }

  async reativar(id: string, lojaId: string, atorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findFirst({
        where: { id, loja_id: lojaId },
        select: { id: true, status: true },
      });
      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }
      const atualizado = await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          status: usuario_status.ATIVO,
          ativo: true,
          ...incrementoSessionVersion(),
        } as Prisma.usuarioUpdateInput,
        select: USUARIO_PUBLICO_SELECT,
      });
      await this.audit.registrar({
        lojaId,
        atorId,
        action: 'usuario.reativar',
        resourceType: 'usuario',
        resourceId: id,
        previousState: { status: usuario.status },
        newState: { status: atualizado.status },
        tx,
      });
      return atualizado;
    });
  }

  async reenviarCodigo(email: string) {
    const genericResponse = {
      message:
        'Se o e-mail existir e ainda não estiver verificado, enviaremos um novo código.',
    };
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      return genericResponse;
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        email_verificado: true,
      },
    });

    if (!usuario || usuario.email_verificado) {
      return genericResponse;
    }

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
    }/primeiro-acesso?email=${encodeURIComponent(normalizedEmail)}`;
    await this.mail.sendVerificationEmail(normalizedEmail, code, {
      mode: 'convite',
      activationLink,
    });
    return genericResponse;
  }

  async definirSenhaInicial(email: string, codigo: string, novaSenha: string) {
    if (!novaSenha || novaSenha.length < 8) {
      throw new BadRequestException('A senha deve ter no mínimo 8 caracteres');
    }
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
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

    const queimado = await this.prisma.usuario.updateMany({
      where: {
        id: usuario.id,
        codigo_verificacao_email: codigo,
        email_verificado: false,
      },
      data: {
        senha: senhaHash,
        email_verificado: true,
        status: usuario_status.ATIVO,
        codigo_verificacao_email: null,
        codigo_verificacao_email_expiracao: null,
        ...incrementoSessionVersion(),
      } as Prisma.usuarioUpdateManyMutationInput,
    });
    if (queimado.count !== 1) {
      throw new UnauthorizedException('Codigo invalido');
    }

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

    await this.prisma.$transaction(async (tx) => {
      const queimado = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          used_at: null,
          expires_at: { gt: new Date() },
        },
        data: { used_at: new Date() },
      });
      if (queimado.count !== 1) {
        throw new BadRequestException(
          'Link de redefinicao invalido ou expirado',
        );
      }
      await tx.usuario.update({
        where: { id: resetToken.usuario_id },
        data: {
          senha: senhaHash,
          ...incrementoSessionVersion(),
        } as Prisma.usuarioUpdateInput,
      });
    });

    return { message: 'Senha redefinida com sucesso' };
  }

  async listarPerfis() {
    return Object.values(usuario_funcao).map((f) => ({
      id: f,
      nome: f,
      sistema: true,
      ativo: true,
    }));
  }

  async obterPreferencias(
    usuarioId: string,
    lojaId: string,
  ): Promise<UsuarioPreferenciasJson> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, loja_id: lojaId },
      select: { preferencias: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.parsePreferencias(usuario.preferencias);
  }

  async atualizarPreferencias(
    usuarioId: string,
    lojaId: string,
    patch: AtualizarUsuarioPreferenciasDto,
  ): Promise<UsuarioPreferenciasJson> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, loja_id: lojaId },
      select: { id: true, preferencias: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const atual = this.parsePreferencias(usuario.preferencias);
    const proximo: UsuarioPreferenciasJson = { ...atual };

    if (patch.sidebar_menu_order !== undefined) {
      proximo.sidebar_menu_order = patch.sidebar_menu_order;
    }

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        preferencias: proximo as Prisma.InputJsonValue,
      },
    });

    return proximo;
  }

  /**
   * `usuarios.usuarios.gerenciar` não autoriza o bypass do núcleo.
   * A função ADMINISTRADOR só pode ser concedida por um administrador
   * já existente, ativo e da mesma loja (lido no banco, não no JWT).
   */
  private async assertAtorPodeConcederAdministrador(
    tx: Prisma.TransactionClient,
    lojaId: string,
    atorId: string,
  ) {
    const ator = await tx.usuario.findFirst({
      where: {
        id: atorId,
        loja_id: lojaId,
        status: usuario_status.ATIVO,
        ativo: true,
      },
      select: { funcao: true },
    });
    if (ator?.funcao !== usuario_funcao.ADMINISTRADOR) {
      throw new ForbiddenException(
        'Somente um administrador da loja pode conceder a função de administrador.',
      );
    }
  }

  private assertNaoAlteraProprioPrivilegio(
    id: string,
    atorId: string,
    dto: UpdateUsuarioDto,
    atual: { funcao: usuario_funcao; status: usuario_status },
  ) {
    if (id !== atorId) {
      return;
    }
    if (dto.funcao !== undefined && dto.funcao !== atual.funcao) {
      throw new ForbiddenException('Não é permitido alterar a própria função.');
    }
    if (dto.perfilIds !== undefined) {
      throw new ForbiddenException(
        'Não é permitido alterar os próprios perfis.',
      );
    }
    if (dto.status !== undefined && dto.status !== atual.status) {
      throw new ForbiddenException('Não é permitido alterar o próprio status.');
    }
  }

  private async assertNaoEUltimoAdmin(
    tx: Prisma.TransactionClient,
    lojaId: string,
    usuarioId: string,
  ) {
    await tx.$queryRaw`
      SELECT id FROM usuario
      WHERE loja_id = ${lojaId}
        AND funcao = 'ADMINISTRADOR'
        AND status = 'ATIVO'
      FOR UPDATE
    `;
    const totalAdminsAtivos = await tx.usuario.count({
      where: {
        loja_id: lojaId,
        funcao: usuario_funcao.ADMINISTRADOR,
        status: usuario_status.ATIVO,
        id: { not: usuarioId },
      },
    });

    if (totalAdminsAtivos < 1) {
      throw new BadRequestException(
        'Não é permitido remover ou rebaixar o último administrador ativo da loja',
      );
    }
  }

  private async substituirPerfis(
    tx: Prisma.TransactionClient,
    usuarioId: string,
    lojaId: string,
    perfilIds: string[],
  ) {
    const unicos = [...new Set(perfilIds)];
    if (unicos.length === 0) {
      await tx.usuario_perfil.deleteMany({ where: { usuario_id: usuarioId } });
      return;
    }
    const encontrados = await tx.perfil_acesso.findMany({
      where: { loja_id: lojaId, id: { in: unicos } },
      select: { id: true },
    });
    if (encontrados.length !== unicos.length) {
      throw new BadRequestException(
        'Um ou mais perfis não pertencem a esta loja',
      );
    }
    await tx.usuario_perfil.deleteMany({ where: { usuario_id: usuarioId } });
    await tx.usuario_perfil.createMany({
      data: unicos.map((perfil_id) => ({
        usuario_id: usuarioId,
        perfil_id,
      })),
    });
  }

  private parsePreferencias(
    raw: Prisma.JsonValue | null,
  ): UsuarioPreferenciasJson {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {};
    }

    const obj = raw as Record<string, unknown>;
    const order = obj.sidebar_menu_order;

    return {
      sidebar_menu_order: Array.isArray(order)
        ? order.filter((id): id is string => typeof id === 'string')
        : undefined,
    };
  }
}
