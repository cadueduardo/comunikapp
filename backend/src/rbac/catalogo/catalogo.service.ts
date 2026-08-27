import { Injectable } from '@nestjs/common';
import { HASH_CATALOGO, listarManifestos, obterManifesto } from './agregador';
import { ModuloCatalogo } from './tipos';

export type EstadoDecisaoPermissao =
  | 'CONCEDIDA'
  | 'NEGADA'
  | 'NAO_REVISADA';

export type PermissaoCatalogoComEstado = ModuloCatalogo['permissoes'][number] & {
  estado: EstadoDecisaoPermissao;
};

export type ModuloCatalogoResposta = Omit<ModuloCatalogo, 'pisoPorFuncao'> & {
  permissoes: PermissaoCatalogoComEstado[];
};

@Injectable()
export class CatalogoService {
  obterCatalogo(decisoes?: Map<string, boolean>): {
    versao: string;
    modulos: ModuloCatalogoResposta[];
  } {
    return {
      versao: HASH_CATALOGO,
      modulos: listarManifestos().map((modulo) =>
        this.comEstado(modulo, decisoes),
      ),
    };
  }

  obterModulo(
    chave: string,
    decisoes?: Map<string, boolean>,
  ): ModuloCatalogoResposta | undefined {
    const modulo = obterManifesto(chave);
    return modulo ? this.comEstado(modulo, decisoes) : undefined;
  }

  private comEstado(
    modulo: ModuloCatalogo,
    decisoes?: Map<string, boolean>,
  ): ModuloCatalogoResposta {
    const { pisoPorFuncao: _piso, ...rest } = modulo;
    return {
      ...rest,
      permissoes: modulo.permissoes.map((permissao) => {
        if (!decisoes || !decisoes.has(permissao.chave)) {
          return { ...permissao, estado: 'NAO_REVISADA' as const };
        }
        return {
          ...permissao,
          estado: decisoes.get(permissao.chave)
            ? ('CONCEDIDA' as const)
            : ('NEGADA' as const),
        };
      }),
    };
  }
}
