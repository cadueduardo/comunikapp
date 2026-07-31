import { ForbiddenException, Injectable } from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { funcaoConcede, separarModuloEAcao } from './vendas-permissoes';

/**
 * Autorização do domínio comercial, no padrão de
 * `ComprasPermissionsService` — o único mecanismo de permissão granular que
 * funciona no projeto. O decorator `@Roles` é metadata inerte e não pode ser
 * usado como autorização (DV-13).
 *
 * A autenticação já é responsabilidade do `JwtGlobalMiddleware`. Aqui só se
 * decide **o que** a identidade autenticada pode fazer.
 */
@Injectable()
export class VendasPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async pode(
    usuarioId: string,
    lojaId: string,
    permissao: string,
  ): Promise<boolean> {
    const { modulo, acao } = separarModuloEAcao(permissao);

    // A função e os perfis vêm do banco, nunca do token, para que bloqueio de
    // usuário e alteração de perfil tenham efeito imediato.
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        loja_id: lojaId,
        status: 'ATIVO',
        ativo: true,
      },
      select: {
        funcao: true,
        perfis: {
          select: {
            perfil: {
              select: {
                nome: true,
                ativo: true,
                permissoes: {
                  where: { modulo, acao, permitido: true },
                  select: { id: true },
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
      (vinculo) =>
        vinculo.perfil.ativo &&
        vinculo.perfil.nome.trim().toUpperCase() === 'ADMINISTRADOR',
    );
    if (temPerfilAdministrador) {
      return true;
    }

    if (funcaoConcede(usuario.funcao, permissao)) {
      return true;
    }

    return usuario.perfis.some(
      (vinculo) => vinculo.perfil.ativo && vinculo.perfil.permissoes.length > 0,
    );
  }

  async assertPode(
    usuarioId: string,
    lojaId: string,
    permissao: string,
  ): Promise<void> {
    const permitido = await this.pode(usuarioId, lojaId, permissao);
    if (!permitido) {
      throw new ForbiddenException(
        'Você não tem permissão para executar esta ação.',
      );
    }
  }

  /** Exige pelo menos uma das permissões informadas. */
  async assertPodeQualquer(
    usuarioId: string,
    lojaId: string,
    permissoes: readonly string[],
  ): Promise<void> {
    for (const permissao of permissoes) {
      if (await this.pode(usuarioId, lojaId, permissao)) {
        return;
      }
    }
    throw new ForbiddenException(
      'Você não tem permissão para executar esta ação.',
    );
  }
}
