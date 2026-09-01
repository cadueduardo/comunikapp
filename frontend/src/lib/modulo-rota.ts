/**
 * Mapa rota (main) → chave de módulo do catálogo RBAC.
 * Espelha `rotasFrontend` dos manifestos. Ordem: prefixo mais longo primeiro.
 */
export const ROTAS_MODULO: ReadonlyArray<{ prefixo: string; chave: string }> = [
  { prefixo: '/produtos-finitos', chave: 'catalogo' },
  { prefixo: '/centros-de-trabalho', chave: 'centros-trabalho' },
  { prefixo: '/orcamentos-v2', chave: 'vendas' },
  { prefixo: '/instalador', chave: 'instalacao' },
  { prefixo: '/configuracoes', chave: 'configuracoes' },
  { prefixo: '/fornecedores', chave: 'fornecedores' },
  { prefixo: '/clientes', chave: 'vendas' },
  { prefixo: '/vendas', chave: 'vendas' },
  { prefixo: '/compras', chave: 'compras' },
  { prefixo: '/insumos', chave: 'insumos' },
  { prefixo: '/estoque', chave: 'estoque' },
  { prefixo: '/financeiro', chave: 'financeiro' },
  { prefixo: '/expedicao', chave: 'expedicao' },
  { prefixo: '/instalacao', chave: 'instalacao' },
  { prefixo: '/catalogo', chave: 'catalogo' },
  { prefixo: '/produtos', chave: 'modelos' },
  { prefixo: '/usuarios', chave: 'usuarios' },
  { prefixo: '/arte', chave: 'arte' },
  { prefixo: '/pcp', chave: 'pcp' },
  { prefixo: '/os', chave: 'os' },
  { prefixo: '/dashboard', chave: 'dashboard' },
];

export function resolverChaveModuloPorPathname(
  pathname: string,
): string | null {
  const path = pathname.split('?')[0] || '/';
  for (const { prefixo, chave } of ROTAS_MODULO) {
    if (path === prefixo || path.startsWith(`${prefixo}/`)) {
      return chave;
    }
  }
  return null;
}

/**
 * Chave cuja falta deve bloquear a página. `null` = não bloquear
 * (dashboard, 2FA em /configuracoes, rotas fora do catálogo).
 */
export function chaveModuloExigidaNaRota(pathname: string): string | null {
  const path = pathname.split('?')[0] || '/';
  const chave = resolverChaveModuloPorPathname(path);
  if (!chave) return null;
  if (chave === 'dashboard') return null;
  if (chave === 'configuracoes' && path === '/configuracoes') return null;
  return chave;
}
