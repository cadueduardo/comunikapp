import { createHash } from 'crypto';
import { ARTE_CATALOGO } from '../../modules/arte-aprovacao/arte.catalogo';
import { CATALOGO_PRODUTOS_CATALOGO } from '../../catalogo/catalogo.catalogo';
import { CENTROS_TRABALHO_CATALOGO } from '../../configuracoes/centros-trabalho.catalogo';
import { COMPRAS_CATALOGO } from '../../compras/compras.catalogo';
import { CONFIGURACOES_CATALOGO } from '../../configuracoes/configuracoes.catalogo';
import { DASHBOARD_CATALOGO } from '../../home-operacional/dashboard.catalogo';
import { ESTOQUE_CATALOGO } from '../../estoque/estoque.catalogo';
import { EXPEDICAO_CATALOGO } from '../../expedicao/expedicao.catalogo';
import { FINANCEIRO_CATALOGO } from '../../financeiro/financeiro.catalogo';
import { FORNECEDORES_CATALOGO } from '../../fornecedores/fornecedores.catalogo';
import { INSTALACAO_CATALOGO } from '../../instalacao/instalacao.catalogo';
import { INSUMOS_CATALOGO } from '../../insumos/insumos.catalogo';
import { MODELOS_CATALOGO } from '../../produtos/modelos.catalogo';
import { OS_CATALOGO } from '../../os/os.catalogo';
import { PCP_CATALOGO } from '../../pcp/pcp.catalogo';
import { USUARIOS_CATALOGO } from '../../usuarios/usuarios.catalogo';
import { VENDAS_CATALOGO } from '../../vendas/permissions/vendas.catalogo';
import { validarChavePermissao } from './parser-chave';
import {
  CHAVES_MODULOS_FUNCIONAIS,
  ModuloCatalogo,
  PermissaoCatalogo,
} from './tipos';

const MANIFESTOS_BRUTOS: readonly ModuloCatalogo[] = [
  DASHBOARD_CATALOGO,
  VENDAS_CATALOGO,
  COMPRAS_CATALOGO,
  ESTOQUE_CATALOGO,
  OS_CATALOGO,
  PCP_CATALOGO,
  FINANCEIRO_CATALOGO,
  EXPEDICAO_CATALOGO,
  INSTALACAO_CATALOGO,
  ARTE_CATALOGO,
  CATALOGO_PRODUTOS_CATALOGO,
  MODELOS_CATALOGO,
  INSUMOS_CATALOGO,
  FORNECEDORES_CATALOGO,
  CENTROS_TRABALHO_CATALOGO,
  CONFIGURACOES_CATALOGO,
  USUARIOS_CATALOGO,
];

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

  const ausentes = CHAVES_MODULOS_FUNCIONAIS.filter(
    (chave) => !porChave.has(chave),
  );
  if (ausentes.length > 0) {
    throw new Error(
      `Módulos funcionais sem manifesto: ${ausentes.join(', ')}.`,
    );
  }

  const orfaos = [...porChave.keys()].filter(
    (chave) =>
      !(CHAVES_MODULOS_FUNCIONAIS as readonly string[]).includes(chave),
  );
  if (orfaos.length > 0) {
    throw new Error(`Manifestos órfãos: ${orfaos.join(', ')}.`);
  }

  return [...porChave.values()].sort((a, b) => a.ordem - b.ordem || a.chave.localeCompare(b.chave));
}

export const MANIFESTOS_MODULOS: readonly ModuloCatalogo[] =
  validarManifestos(MANIFESTOS_BRUTOS);

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

export function resolverModuloPorPath(pathname: string): ModuloCatalogo | undefined {
  const path = pathname.replace(/^\/api(?=\/)/, '') || pathname;
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
