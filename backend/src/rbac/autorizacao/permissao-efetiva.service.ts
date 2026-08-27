import { ForbiddenException, Injectable } from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  listarManifestos,
  obterModuloDaPermissao,
  permissaoNoCatalogo,
} from '../catalogo/agregador';
import { separarModuloEAcao } from '../catalogo/parser-chave';

type DecisaoPerfil = {
  modulo: string;
  acao: string;
  permitido: boolean;
};

type ContextoAutorizacao = {
  funcao: usuario_funcao;
  perfis: Array<{
    perfil: {
      ativo: boolean;
      permissoes: DecisaoPerfil[];
    };
  }>;
};

@Injectable()
export class PermissaoEfetivaService {
  constructor(private readonly prisma: PrismaService) {}

  async pode(
    usuarioId: string,
    lojaId: string,
    permissao: string,
  ): Promise<boolean> {
    if (!permissaoNoCatalogo(permissao)) {
      return false;
    }
    const contexto = await this.carregarContexto(usuarioId, lojaId);
    if (!contexto) {
      return false;
    }
    return this.avaliarNoContexto(contexto, permissao);
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

  /**
   * Flags `.acessar` para o menu. Uma carga do usuário; o layout autenticado
   * não depende de `usuarios.acessar`.
   */
  async listarAcessoModulos(
    usuarioId: string,
    lojaId: string,
  ): Promise<Record<string, boolean>> {
    const contexto = await this.carregarContexto(usuarioId, lojaId);
    const resultado: Record<string, boolean> = {};
    for (const modulo of listarManifestos()) {
      resultado[modulo.chave] = contexto
        ? this.avaliarNoContexto(contexto, modulo.permissaoAcesso)
        : false;
    }
    return resultado;
  }

  private async carregarContexto(
    usuarioId: string,
    lojaId: string,
  ): Promise<ContextoAutorizacao | null> {
    return this.prisma.usuario.findFirst({
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
                  select: { modulo: true, acao: true, permitido: true },
                },
              },
            },
          },
        },
      },
    });
  }

  private avaliarNoContexto(
    usuario: ContextoAutorizacao,
    permissao: string,
  ): boolean {
    if (!permissaoNoCatalogo(permissao)) {
      return false;
    }

    if (usuario.funcao === usuario_funcao.ADMINISTRADOR) {
      return true;
    }

    const { modulo, acao } = separarModuloEAcao(permissao);
    const decisoes = usuario.perfis
      .filter((vinculo) => vinculo.perfil.ativo)
      .flatMap((vinculo) => vinculo.perfil.permissoes)
      .filter((decisao) => decisao.modulo === modulo && decisao.acao === acao);

    if (decisoes.some((d) => d.permitido === false)) {
      return false;
    }

    if (decisoes.some((d) => d.permitido === true)) {
      return true;
    }

    const manifesto = obterModuloDaPermissao(permissao);
    if (!manifesto) {
      return false;
    }
    const piso = manifesto.pisoPorFuncao[usuario.funcao] ?? [];
    return piso.includes(permissao);
  }
}
