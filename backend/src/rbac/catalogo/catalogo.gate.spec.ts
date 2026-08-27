import * as path from 'path';
import { COMPRAS_PERMISSOES } from '../../compras/compras-permissoes';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';
import {
  HASH_CATALOGO,
  listarChavesPermissao,
  listarManifestos,
  MANIFESTOS_MODULOS,
  permissaoNoCatalogo,
  resolverModuloPorPath,
} from './agregador';
import {
  descobrirArquivosManifestoRbac,
  descobrirChavesEnforcedNoCodigo,
  descobrirSegmentosRotaMain,
  ROTAS_MAIN_FORA_DO_TENANT,
  segmentoDeRotaFrontend,
} from './descoberta-fontes';
import { ARQUIVOS_MANIFESTO_RBAC } from './manifestos.generated';

const SRC_DIR = path.resolve(__dirname, '../..');
const FRONTEND_MAIN = path.resolve(SRC_DIR, '../../frontend/src/app/(main)');

describe('Gate do catálogo RBAC', () => {
  it('o agregador gerado cobre exatamente os *.catalogo.ts com manifestoAcessoModulo', () => {
    const descobertos = descobrirArquivosManifestoRbac(SRC_DIR).map(
      (arquivo) => arquivo.relativeFromSrc,
    );
    expect(descobertos).toEqual([...ARQUIVOS_MANIFESTO_RBAC]);
    expect(
      listarManifestos()
        .map((m) => m.chave)
        .sort(),
    ).toEqual([...new Set(listarManifestos().map((m) => m.chave))].sort());
  });

  it('cada módulo tem permissão-base .acessar', () => {
    for (const modulo of listarManifestos()) {
      expect(modulo.permissaoAcesso).toBe(`${modulo.chave}.acessar`);
      expect(
        modulo.permissoes.some((p) => p.chave === modulo.permissaoAcesso),
      ).toBe(true);
    }
  });

  it('não há chaves duplicadas', () => {
    const chaves = listarChavesPermissao();
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it('rotas (main) reais estão cobertas por rotasFrontend do catálogo', () => {
    const segmentos = descobrirSegmentosRotaMain(FRONTEND_MAIN);
    const excluidas = new Set<string>(ROTAS_MAIN_FORA_DO_TENANT);
    const cobertas = new Set(
      listarManifestos().flatMap((modulo) =>
        modulo.rotasFrontend
          .map(segmentoDeRotaFrontend)
          .filter((seg): seg is string => Boolean(seg)),
      ),
    );

    const semManifesto = segmentos.filter(
      (seg) => !excluidas.has(seg) && !cobertas.has(seg),
    );
    expect(semManifesto).toEqual([]);

    const orfasNoCatalogo = [...cobertas].filter(
      (seg) => !segmentos.includes(seg),
    );
    expect(orfasNoCatalogo).toEqual([]);
  });

  it('chaves enforced no código existem no catálogo', () => {
    const noCodigo = descobrirChavesEnforcedNoCodigo(SRC_DIR);
    const ausentes = noCodigo.filter((chave) => !permissaoNoCatalogo(chave));
    expect(ausentes).toEqual([]);

    for (const chave of Object.values(VENDAS_PERMISSOES)) {
      expect(permissaoNoCatalogo(chave)).toBe(true);
    }
    for (const chave of Object.values(COMPRAS_PERMISSOES)) {
      expect(permissaoNoCatalogo(chave)).toBe(true);
    }
  });

  it('toda permissão catalogada tem enforcement ou é a porta .acessar do módulo', () => {
    const enforced = new Set([
      ...descobrirChavesEnforcedNoCodigo(SRC_DIR),
      ...Object.values(VENDAS_PERMISSOES),
      ...Object.values(COMPRAS_PERMISSOES),
      ...listarManifestos().map((modulo) => modulo.permissaoAcesso),
    ]);
    const semEnforcement = listarChavesPermissao().filter(
      (chave) => !enforced.has(chave),
    );
    expect(semEnforcement).toEqual([]);
  });

  it('expõe hash estável do catálogo', () => {
    expect(HASH_CATALOGO).toMatch(/^[a-f0-9]{64}$/);
    expect(MANIFESTOS_MODULOS.length).toBeGreaterThan(0);
  });

  it('resolve prefixo de API para a permissão-base do módulo', () => {
    expect(resolverModuloPorPath('/os/abc')?.permissaoAcesso).toBe(
      'os.acessar',
    );
    expect(resolverModuloPorPath('/api/os/abc')?.permissaoAcesso).toBe(
      'os.acessar',
    );
    expect(resolverModuloPorPath('/modulo-sem-manifesto-xyz')).toBeUndefined();
  });
});
