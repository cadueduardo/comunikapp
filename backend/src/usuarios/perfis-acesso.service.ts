import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatePerfilAcessoDto {
  nome: string;
  descricao?: string;
  ativo?: boolean;
  sistema?: boolean;
  permissoes?: CreatePermissaoDto[];
}

export interface CreatePermissaoDto {
  modulo: string;
  acao: string;
  permitido: boolean;
}

export interface UpdatePerfilAcessoDto {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
  permissoes?: CreatePermissaoDto[];
}

@Injectable()
export class PerfisAcessoService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(lojaId: string, dto: CreatePerfilAcessoDto) {
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
        sistema: dto.sistema ?? false,
      },
    });

    // Criar permissões se fornecidas
    if (dto.permissoes && dto.permissoes.length > 0) {
      await this.criarPermissoes(perfil.id, dto.permissoes);
    }

    return perfil;
  }

  async listar(lojaId: string) {
    return this.prisma.perfil_acesso.findMany({
      where: { loja_id: lojaId },
      include: {
        permissoes: true,
        _count: {
          select: { usuarios: true },
        },
      },
      orderBy: { nome: 'asc' },
    });
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

  async atualizar(id: string, lojaId: string, dto: UpdatePerfilAcessoDto) {
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

    // Atualizar perfil
    const updated = await this.prisma.perfil_acesso.update({
      where: { id },
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        ativo: dto.ativo,
      },
    });

    // Atualizar permissões se fornecidas
    if (dto.permissoes) {
      await this.atualizarPermissoes(id, dto.permissoes);
    }

    return updated;
  }

  async excluir(id: string, lojaId: string) {
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

    return { message: 'Perfil excluído com sucesso' };
  }

  async associarUsuario(perfilId: string, usuarioId: string, lojaId: string) {
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
    return this.prisma.usuario_perfil.create({
      data: {
        usuario_id: usuarioId,
        perfil_id: perfilId,
      },
    });
  }

  async desassociarUsuario(
    perfilId: string,
    usuarioId: string,
    lojaId: string,
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

    // Remover associação usando where com ambos os campos
    await this.prisma.usuario_perfil.delete({
      where: {
        usuario_id_perfil_id: {
          usuario_id: usuarioId,
          perfil_id: perfilId,
        },
      },
    });

    return { message: 'Usuário desassociado do perfil com sucesso' };
  }

  private async criarPermissoes(
    perfilId: string,
    permissoes: CreatePermissaoDto[],
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

  private async atualizarPermissoes(
    perfilId: string,
    permissoes: CreatePermissaoDto[],
  ) {
    // Remover permissões existentes
    await this.prisma.perfil_permissao.deleteMany({
      where: { perfil_id: perfilId },
    });

    // Criar novas permissões
    if (permissoes.length > 0) {
      await this.criarPermissoes(perfilId, permissoes);
    }
  }
}
