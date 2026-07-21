import { ForbiddenException, Injectable } from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { COMPRAS_PERMISSOES } from '../../../compras/services/compras-permissions.service';

export { COMPRAS_PERMISSOES };

@Injectable()
export class ContasPagarPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parseia "compras.conta_pagar.criar" em modulo=compras, acao=conta_pagar.criar.
   */
  parseAcaoCompleta(acaoCompleta: string): { modulo: string; acao: string } {
    const partes = acaoCompleta.split('.');
    if (partes.length < 2 || !partes[0]) {
      throw new ForbiddenException(
        `Permissão de compras inválida: "${acaoCompleta}"`,
      );
    }
    const modulo = partes[0];
    const acao = partes.slice(1).join('.');
    return { modulo, acao };
  }

  async pode(
    usuarioId: string,
    lojaId: string,
    acaoCompleta: string,
  ): Promise<boolean> {
    const { modulo, acao } = this.parseAcaoCompleta(acaoCompleta);

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        loja_id: lojaId,
        status: 'ATIVO',
        ativo: true,
      },
      include: {
        perfis: {
          include: {
            perfil: {
              include: {
                permissoes: {
                  where: {
                    modulo,
                    acao,
                    permitido: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      return false;
    }

    if (usuario.funcao === usuario_funcao.ADMINISTRADOR) {
      return true;
    }

    const temPerfilAdministrador = usuario.perfis.some(
      (up) =>
        up.perfil.ativo &&
        up.perfil.nome.trim().toUpperCase() === 'ADMINISTRADOR',
    );
    if (temPerfilAdministrador) {
      return true;
    }

    return usuario.perfis.some(
      (up) => up.perfil.ativo && up.perfil.permissoes.length > 0,
    );
  }

  async assertPode(
    usuarioId: string,
    lojaId: string,
    acaoCompleta: string,
  ): Promise<void> {
    const permitido = await this.pode(usuarioId, lojaId, acaoCompleta);
    if (!permitido) {
      throw new ForbiddenException(
        `Você não tem permissão para executar "${acaoCompleta}".`,
      );
    }
  }
}
