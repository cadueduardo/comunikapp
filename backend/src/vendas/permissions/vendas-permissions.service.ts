import { ForbiddenException, Injectable } from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { funcaoConcede, separarModuloEAcao } from './vendas-permissoes';

type ChaveCache = string;

/**
 * Autorização do domínio comercial (padrão ComprasPermissionsService).
 * `@Roles` é metadata inerte (DV-13). Autenticação = JwtGlobalMiddleware.
 *
 * Cache em memória por (usuario, loja, permissão) com invalidação explícita —
 * mudança de perfil/permissão deve chamar `invalidarCacheUsuario` /
 * `invalidarCacheLoja` (seed e mutações administrativas).
 */
@Injectable()
export class VendasPermissionsService {
  private readonly cache = new Map<ChaveCache, boolean>();

  constructor(private readonly prisma: PrismaService) {}

  private chave(
    usuarioId: string,
    lojaId: string,
    permissao: string,
  ): ChaveCache {
    return `${lojaId}:${usuarioId}:${permissao}`;
  }

  invalidarCacheUsuario(usuarioId: string, lojaId?: string): void {
    const prefixo = lojaId ? `${lojaId}:${usuarioId}:` : null;
    for (const chave of this.cache.keys()) {
      if (prefixo ? chave.startsWith(prefixo) : chave.includes(`:${usuarioId}:`)) {
        this.cache.delete(chave);
      }
    }
  }

  invalidarCacheLoja(lojaId: string): void {
    const prefixo = `${lojaId}:`;
    for (const chave of this.cache.keys()) {
      if (chave.startsWith(prefixo)) {
        this.cache.delete(chave);
      }
    }
  }

  invalidarCacheTudo(): void {
    this.cache.clear();
  }

  async pode(
    usuarioId: string,
    lojaId: string,
    permissao: string,
  ): Promise<boolean> {
    const chave = this.chave(usuarioId, lojaId, permissao);
    if (this.cache.has(chave)) {
      return this.cache.get(chave) as boolean;
    }

    const resultado = await this.avaliar(usuarioId, lojaId, permissao);
    this.cache.set(chave, resultado);
    return resultado;
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

    // Função fora do enum / nula: negar por padrão (só perfil explícito).
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
