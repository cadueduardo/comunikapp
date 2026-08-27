import { CHAVES_MODULOS_FUNCIONAIS } from './tipos';
import {
  HASH_CATALOGO,
  listarChavesPermissao,
  listarManifestos,
  MANIFESTOS_MODULOS,
  permissaoNoCatalogo,
  resolverModuloPorPath,
} from './agregador';
import { COMPRAS_PERMISSOES } from '../../compras/compras-permissoes';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';

describe('Gate do catálogo RBAC', () => {
  it('inclui todos os módulos funcionais obrigatórios', () => {
    const chaves = listarManifestos().map((m) => m.chave);
    expect(chaves.sort()).toEqual([...CHAVES_MODULOS_FUNCIONAIS].sort());
  });

  it('cada módulo tem permissão-base .acessar', () => {
    for (const modulo of listarManifestos()) {
      expect(modulo.permissaoAcesso).toBe(`${modulo.chave}.acessar`);
      expect(modulo.permissoes.some((p) => p.chave === modulo.permissaoAcesso)).toBe(
        true,
      );
    }
  });

  it('não há chaves duplicadas', () => {
    const chaves = listarChavesPermissao();
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it('agrega Vendas e Compras sem perder chaves canônicas', () => {
    for (const chave of Object.values(VENDAS_PERMISSOES)) {
      expect(permissaoNoCatalogo(chave)).toBe(true);
    }
    for (const chave of Object.values(COMPRAS_PERMISSOES)) {
      expect(permissaoNoCatalogo(chave)).toBe(true);
    }
  });

  it('expõe hash estável do catálogo', () => {
    expect(HASH_CATALOGO).toMatch(/^[a-f0-9]{64}$/);
    expect(MANIFESTOS_MODULOS.length).toBe(CHAVES_MODULOS_FUNCIONAIS.length);
  });

  it('resolve prefixo de API para a permissão-base do módulo', () => {
    expect(resolverModuloPorPath('/os/abc')?.permissaoAcesso).toBe('os.acessar');
    expect(resolverModuloPorPath('/modulo-sem-manifesto-xyz')).toBeUndefined();
  });
});
