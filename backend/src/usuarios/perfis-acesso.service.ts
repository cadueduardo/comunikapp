import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LojaAuditService } from '../rbac/auditoria/loja-audit.service';
import {
  CreatePerfilAcessoDto,
  PermissaoPerfilDto,
  UpdatePerfilAcessoDto,
} from './dto/perfil-acesso.dto';
import { ListarPerfisQueryDto } from './dto/paginacao-query.dto';

@Injectable()
export class PerfisAcessoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: LojaAuditService,
  ) {}

  async criar(lojaId: string, dto: CreatePerfilAcessoDto, atorId: string) {
    // Verificar se já existe perfil com mesmo nome na loja
    const exists = await this.prisma.perfil_acesso.findFirst({
      where: { loja_id: lojaId, nome: dto.nome },
    });

    if (exists) {
      throw new BadRequestException(
        'Já existe um perfil com este nome na loja',
      );
    }

    // Criar perfil
    const perfil = await this.prisma.perfil_acesso.create({
      data: {
        loja_id: lojaId,
        nome: dto.nome,
        descricao: dto.descricao,
        ativo: dto.ativo ?? true,
        sistema: false,
      },
    });

    // Criar permissões se fornecidas
    if (dto.permissoes && dto.permissoes.length > 0) {
      await this.criarPermissoes(perfil.id, dto.permissoes);
    }

    await this.audit.registrar({
      lojaId,
      atorId,
      action: 'perfil.criar',
      resourceType: 'perfil_acesso',
      resourceId: perfil.id,
      newState: {
        nome: perfil.nome,
        permissoes: dto.permissoes ?? [],
      },
    });

    return perfil;
  }

  async listar(lojaId: string, query: ListarPerfisQueryDto = {}) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const busca = query.busca?.trim();
    const where: Prisma.perfil_acessoWhereInput = {
      loja_id: lojaId,
      ...(busca ? { nome: { contains: busca } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.perfil_acesso.findMany({
        where,
        include: {
          permissoes: true,
          _count: {
            select: { usuarios: true },
          },
        },
        orderBy: { nome: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.perfil_acesso.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async obter(id: string, lojaId: string) {
    const perfil = await this.prisma.perfil_acesso.findFirst({
      where: { id, loja_id: lojaId },
      include: {
        permissoes: true,
        usuarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nome_completo: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!perfil) {
      throw new NotFoundException('Perfil não encontrado');
    }

    return perfil;
  }

  async atualizar(
    id: string,
    lojaId: string,
    dto: UpdatePerfilAcessoDto,
    atorId: string,
  ) {
    // Verificar se perfil existe
    const perfil = await this.prisma.perfil_acesso.findFirst({
      where: { id, loja_id: lojaId },
    });

    if (!perfil) {
      throw new NotFoundException('Perfil não encontrado');
    }

    if (perfil.sistema) {
      throw new BadRequestException('Não é possível editar perfis do sistema');
    }

    // Verificar nome único se alterado
    if (dto.nome && dto.nome !== perfil.nome) {
      const exists = await this.prisma.perfil_acesso.findFirst({
        where: { loja_id: lojaId, nome: dto.nome, id: { not: id } },
      });

      if (exists) {
        throw new BadRequestException(
          'Já existe um perfil com este nome na loja',
        );
      }
    }

    if (
      dto.versao !== undefined &&
      dto.versao !== (perfil as { versao?: number }).versao
    ) {
      throw new ConflictException(
        'O perfil foi alterado por outro administrador. Recarregue e tente de novo.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.perfil_acesso.updateMany({
        where: {
          id,
          loja_id: lojaId,
          ...((perfil as { versao?: number }).versao !== undefined
            ? { versao: (perfil as { versao?: number }).versao }
            : {}),
        },
        data: {
          nome: dto.nome,
          descricao: dto.descricao,
          ativo: dto.ativo,
          versao: { increment: 1 },
        } as never,
      });

      if (atualizado.count !== 1) {
        throw new ConflictException(
          'O perfil foi alterado por outro administrador. Recarregue e tente de novo.',
        );
      }

      if (dto.permissoes) {
        await tx.perfil_permissao.deleteMany({ where: { perfil_id: id } });
        if (dto.permissoes.length > 0) {
          await tx.perfil_permissao.createMany({
            data: dto.permissoes.map((p) => ({
              perfil_id: id,
              modulo: p.modulo,
              acao: p.acao,
              permitido: p.permitido,
            })),
            skipDuplicates: true,
          });
        }

        const vinculos = await tx.usuario_perfil.findMany({
          where: { perfil_id: id },
          select: { usuario_id: true },
        });
        if (vinculos.length > 0) {
          await tx.usuario.updateMany({
            where: { id: { in: vinculos.map((v) => v.usuario_id) } },
            data: { session_version: { increment: 1 } } as never,
          });
        }
      }

      await this.audit.registrar({
        lojaId,
        atorId,
        action: 'perfil.atualizar',
        resourceType: 'perfil_acesso',
        resourceId: id,
        previousState: {
          nome: perfil.nome,
          ativo: perfil.ativo,
          versao: (perfil as { versao?: number }).versao,
        },
        newState: {
          nome: dto.nome ?? perfil.nome,
          ativo: dto.ativo ?? perfil.ativo,
          permissoes: dto.permissoes,
        },
        tx,
      });

      return tx.perfil_acesso.findFirst({
        where: { id, loja_id: lojaId },
        include: { permissoes: true, _count: { select: { usuarios: true } } },
      });
    });
  }

  async excluir(id: string, lojaId: string, atorId: string) {
    // Verificar se perfil existe
    const perfil = await this.prisma.perfil_acesso.findFirst({
      where: { id, loja_id: lojaId },
      include: { _count: { select: { usuarios: true } } },
    });

    if (!perfil) {
      throw new NotFoundException('Perfil não encontrado');
    }

    if (perfil.sistema) {
      throw new BadRequestException('Não é possível excluir perfis do sistema');
    }

    if (perfil._count.usuarios > 0) {
      throw new BadRequestException(
        'Não é possível excluir perfil com usuários associados',
      );
    }

    // Excluir permissões primeiro
    await this.prisma.perfil_permissao.deleteMany({
      where: { perfil_id: id },
    });

    // Excluir perfil
    await this.prisma.perfil_acesso.delete({
      where: { id },
    });

    await this.audit.registrar({
      lojaId,
      atorId,
      action: 'perfil.excluir',
      resourceType: 'perfil_acesso',
      resourceId: id,
      previousState: { nome: perfil.nome, sistema: perfil.sistema },
    });

    return { message: 'Perfil excluído com sucesso' };
  }

  async associarUsuario(
    perfilId: string,
    usuarioId: string,
    lojaId: string,
    atorId: string,
  ) {
    // Verificar se perfil e usuário existem na mesma loja
    const [perfil, usuario] = await Promise.all([
      this.prisma.perfil_acesso.findFirst({
        where: { id: perfilId, loja_id: lojaId },
      }),
      this.prisma.usuario.findFirst({
        where: { id: usuarioId, loja_id: lojaId },
      }),
    ]);

    if (!perfil) {
      throw new NotFoundException('Perfil não encontrado');
    }

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se associação já existe
    const exists = await this.prisma.usuario_perfil.findFirst({
      where: { usuario_id: usuarioId, perfil_id: perfilId },
    });

    if (exists) {
      throw new BadRequestException('Usuário já possui este perfil');
    }

    // Criar associação
    const vinculo = await this.prisma.$transaction(async (tx) => {
      const criado = await tx.usuario_perfil.create({
        data: {
          usuario_id: usuarioId,
          perfil_id: perfilId,
        },
      });
      await tx.usuario.update({
        where: { id: usuarioId },
        data: { session_version: { increment: 1 } } as never,
      });
      await this.audit.registrar({
        lojaId,
        atorId,
        action: 'perfil.associar_usuario',
        resourceType: 'usuario_perfil',
        resourceId: `${usuarioId}:${perfilId}`,
        newState: { usuarioId, perfilId },
        tx,
      });
      return criado;
    });

    return vinculo;
  }

  async desassociarUsuario(
    perfilId: string,
    usuarioId: string,
    lojaId: string,
    atorId: string,
  ) {
    // Verificar se associação existe
    const associacao = await this.prisma.usuario_perfil.findFirst({
      where: { usuario_id: usuarioId, perfil_id: perfilId },
      include: {
        perfil: { select: { loja_id: true, sistema: true } },
      },
    });

    if (!associacao) {
      throw new NotFoundException('Associação não encontrada');
    }

    if (associacao.perfil.loja_id !== lojaId) {
      throw new NotFoundException('Perfil não encontrado');
    }

    if (associacao.perfil.sistema) {
      throw new BadRequestException(
        'Não é possível desassociar usuário de perfil do sistema',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.usuario_perfil.delete({
        where: {
          usuario_id_perfil_id: {
            usuario_id: usuarioId,
            perfil_id: perfilId,
          },
        },
      });
      await tx.usuario.update({
        where: { id: usuarioId },
        data: { session_version: { increment: 1 } } as never,
      });
      await this.audit.registrar({
        lojaId,
        atorId,
        action: 'perfil.desassociar_usuario',
        resourceType: 'usuario_perfil',
        resourceId: `${usuarioId}:${perfilId}`,
        previousState: { usuarioId, perfilId },
        tx,
      });
    });

    return { message: 'Usuário desassociado do perfil com sucesso' };
  }

  private async criarPermissoes(
    perfilId: string,
    permissoes: PermissaoPerfilDto[],
  ) {
    const data = permissoes.map((p) => ({
      perfil_id: perfilId,
      modulo: p.modulo,
      acao: p.acao,
      permitido: p.permitido,
    }));

    return this.prisma.perfil_permissao.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
