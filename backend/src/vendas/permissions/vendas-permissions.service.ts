import { ForbiddenException, Injectable } from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { funcaoConcede, separarModuloEAcao } from './vendas-permissoes';

/**
 * Autorização do domínio comercial (padrão ComprasPermissionsService).
 * `@Roles` é metadata inerte (DV-13). Autenticação = JwtGlobalMiddleware.
 *
 * Precedência (Fase 2 — revisão):
 * 1. Usuário inexistente / outra loja / inativo → nega (tenant + sessão).
 * 2. `usuario_funcao.ADMINISTRADOR` → bypass (mantém tenant/ativo).
 * 3. Negação explícita `perfil_permissao.permitido=false` em perfil ativo → nega
 *    (prevalece sobre piso funcional).
 * 4. Concessão explícita `permitido=true` em perfil ativo → concede.
 * 5. Sem decisão explícita e **sem** perfil ativo → piso por `usuario_funcao`.
 *    Com perfil ativo, não revisada = nega (o perfil substitui o piso).
 *
 * Sem cache em memória nesta fase: toda avaliação consulta o banco.
 * Bypass por nome textual de perfil foi removido — só `usuario_funcao.ADMINISTRADOR`.
 */
@Injectable()
export class VendasPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async pode(
    usuarioId: string,
    lojaId: string,
    permissao: string,
  ): Promise<boolean> {
    return this.avaliar(usuarioId, lojaId, permissao);
  }

  private async avaliar(
    usuarioId: string,
    lojaId: string,
    permissao: string,
  ): Promise<boolean> {
    const { modulo, acao } = separarModuloEAcao(permissao);

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
                ativo: true,
                permissoes: {
                  where: { modulo, acao },
                  select: { permitido: true },
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

    // Bypass só por função canônica; tenant e ativo já filtrados acima.
    if (usuario.funcao === usuario_funcao.ADMINISTRADOR) {
      return true;
    }

    const perfisAtivos = usuario.perfis.filter((vinculo) => vinculo.perfil.ativo);
    const decisoes = perfisAtivos.flatMap((vinculo) => vinculo.perfil.permissoes);

    // Negação explícita prevalece sobre piso funcional.
    if (decisoes.some((d) => d.permitido === false)) {
      return false;
    }

    // Perfil ativo pode conceder.
    if (decisoes.some((d) => d.permitido === true)) {
      return true;
    }

    if (perfisAtivos.length > 0) {
      return false;
    }

    // Sem perfil: default da função (desconhecida → nega).
    return funcaoConcede(usuario.funcao, permissao);
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
