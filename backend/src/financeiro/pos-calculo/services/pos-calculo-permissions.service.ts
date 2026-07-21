import { ForbiddenException, Injectable } from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  COMPRAS_PERMISSOES,
  ContasPagarPermissionsService,
} from '../../contas-pagar/services/contas-pagar-permissions.service';

const FUNCOES_FINANCEIRO = new Set<string>([
  usuario_funcao.ADMINISTRADOR,
  usuario_funcao.FINANCEIRO,
]);

/**
 * Leitura analítica do pós-cálculo: ADMIN bypass, FINANCEIRO ou
 * `compras.auditoria.visualizar`.
 */
@Injectable()
export class PosCalculoPermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contasPagarPermissions: ContasPagarPermissionsService,
  ) {}

  async assertPodeVisualizar(
    usuarioId: string,
    lojaId: string,
  ): Promise<void> {
    const permitido = await this.podeVisualizar(usuarioId, lojaId);
    if (!permitido) {
      throw new ForbiddenException(
        'Você não tem permissão para consultar o pós-cálculo da OS. ' +
          'Funções permitidas: ADMINISTRADOR, FINANCEIRO, ou perfil com ' +
          `"${COMPRAS_PERMISSOES.AUDITORIA_VISUALIZAR}".`,
      );
    }
  }

  async podeVisualizar(usuarioId: string, lojaId: string): Promise<boolean> {
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
            perfil: true,
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

    if (FUNCOES_FINANCEIRO.has(usuario.funcao)) {
      return true;
    }

    return this.contasPagarPermissions.pode(
      usuarioId,
      lojaId,
      COMPRAS_PERMISSOES.AUDITORIA_VISUALIZAR,
    );
  }
}
