import { ForbiddenException, Injectable } from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  listarManifestos,
  obterModuloDaPermissao,
  permissaoNoCatalogo,
} from '../catalogo/agregador';
import { separarModuloEAcao } from '../catalogo/parser-chave';

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

    if (usuario.funcao === usuario_funcao.ADMINISTRADOR) {
      return true;
    }

    const decisoes = usuario.perfis
      .filter((vinculo) => vinculo.perfil.ativo)
      .flatMap((vinculo) => vinculo.perfil.permissoes);

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

  async listarAcessoModulos(
    usuarioId: string,
    lojaId: string,
  ): Promise<Record<string, boolean>> {
    const resultado: Record<string, boolean> = {};
    for (const modulo of listarManifestos()) {
      resultado[modulo.chave] = await this.pode(
        usuarioId,
        lojaId,
        modulo.permissaoAcesso,
      );
    }
    return resultado;
  }
}
