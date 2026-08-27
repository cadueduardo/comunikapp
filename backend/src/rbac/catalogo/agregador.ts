import { createHash } from 'crypto';
import { MANIFESTOS_DESCOBERTOS } from './manifestos.generated';
import { validarChavePermissao } from './parser-chave';
import { ModuloCatalogo, PermissaoCatalogo } from './tipos';

function validarManifestos(
  manifestos: readonly ModuloCatalogo[],
): ModuloCatalogo[] {
  const porChave = new Map<string, ModuloCatalogo>();
  const permissoes = new Map<string, string>();

  for (const manifesto of manifestos) {
    if (porChave.has(manifesto.chave)) {
      throw new Error(`Manifesto duplicado: "${manifesto.chave}".`);
    }
    if (manifesto.permissaoAcesso !== `${manifesto.chave}.acessar`) {
      throw new Error(
        `Permissão-base de "${manifesto.chave}" deve ser "${manifesto.chave}.acessar".`,
      );
    }
    porChave.set(manifesto.chave, manifesto);

    for (const permissao of manifesto.permissoes) {
      validarChavePermissao(permissao.chave);
      const dono = permissoes.get(permissao.chave);
      if (dono) {
        throw new Error(
          `Permissão duplicada "${permissao.chave}" em "${dono}" e "${manifesto.chave}".`,
        );
      }
      permissoes.set(permissao.chave, manifesto.chave);
    }
  }

  return [...porChave.values()].sort(
    (a, b) => a.ordem - b.ordem || a.chave.localeCompare(b.chave),
  );
}

export const MANIFESTOS_MODULOS: readonly ModuloCatalogo[] = validarManifestos(
  MANIFESTOS_DESCOBERTOS,
);

const PERMISSOES_POR_CHAVE = new Map<string, PermissaoCatalogo>();
const MODULO_POR_PERMISSAO = new Map<string, ModuloCatalogo>();
for (const manifesto of MANIFESTOS_MODULOS) {
  for (const permissao of manifesto.permissoes) {
    PERMISSOES_POR_CHAVE.set(permissao.chave, permissao);
    MODULO_POR_PERMISSAO.set(permissao.chave, manifesto);
  }
}

export const HASH_CATALOGO = createHash('sha256')
  .update(
    MANIFESTOS_MODULOS.map((m) =>
      [m.chave, ...m.permissoes.map((p) => p.chave)].join('|'),
    ).join(';'),
  )
  .digest('hex');

export function listarManifestos(): readonly ModuloCatalogo[] {
  return MANIFESTOS_MODULOS;
}

export function obterManifesto(chave: string): ModuloCatalogo | undefined {
  return MANIFESTOS_MODULOS.find((m) => m.chave === chave);
}

export function permissaoNoCatalogo(chave: string): boolean {
  return PERMISSOES_POR_CHAVE.has(chave);
}

export function obterPermissaoCatalogo(
  chave: string,
): PermissaoCatalogo | undefined {
  return PERMISSOES_POR_CHAVE.get(chave);
}

export function obterModuloDaPermissao(
  chave: string,
): ModuloCatalogo | undefined {
  return MODULO_POR_PERMISSAO.get(chave);
}

export function listarChavesPermissao(): readonly string[] {
  return [...PERMISSOES_POR_CHAVE.keys()];
}

/** Produção e o proxy Next mantêm `/api`; o catálogo declara prefixos sem esse segmento. */
export function semPrefixoApi(pathname: string): string {
  return pathname.replace(/^\/api(?=\/)/, '') || pathname;
}

export function resolverModuloPorPath(
  pathname: string,
): ModuloCatalogo | undefined {
  const path = semPrefixoApi(pathname);
  const candidatos = MANIFESTOS_MODULOS.filter((modulo) =>
    modulo.prefixosApi.some((prefixo) => pathCombinaPrefixo(path, prefixo)),
  );
  if (candidatos.length === 0) {
    return undefined;
  }
  candidatos.sort(
    (a, b) =>
      Math.max(...b.prefixosApi.map((p) => p.length)) -
      Math.max(...a.prefixosApi.map((p) => p.length)),
  );
  return candidatos[0];
}

export function pathCombinaPrefixo(path: string, prefixo: string): boolean {
  return path === prefixo || path.startsWith(`${prefixo}/`);
}
