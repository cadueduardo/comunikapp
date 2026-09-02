import {
  getNavigableModuleNavItems,
  getModuleNavById,
  type ModuleNavConfig,
  type ModuleNavItem,
} from '@/lib/module-nav';
import type {
  SidebarMenuPermissions,
  SidebarNavItem,
} from '@/lib/sidebar-menu';
import { deveAchatarModulo } from './sidebar-achatamento-regra';

const PERMISSAO_PARA_NAV: Array<{
  flag: keyof SidebarMenuPermissions;
  navId: string;
}> = [
  { flag: 'podeVerVendas', navId: 'vendas' },
  { flag: 'podeVerInsumos', navId: 'insumos' },
  { flag: 'podeVerFornecedores', navId: 'fornecedores' },
  { flag: 'podeVerCompras', navId: 'compras' },
  { flag: 'podeVerEstoque', navId: 'estoque' },
  { flag: 'podeVerModelos', navId: 'modelos' },
  { flag: 'podeVerCatalogo', navId: 'catalogo' },
  { flag: 'podeVerOs', navId: 'os' },
  { flag: 'podeVerArte', navId: 'arte' },
  { flag: 'podeVerFinanceiro', navId: 'financeiro' },
  { flag: 'podeVerPcp', navId: 'pcp' },
  { flag: 'podeVerExpedicao', navId: 'expedicao' },
  { flag: 'podeVerInstalacaoGestao', navId: 'instalacao' },
  { flag: 'podeVerCentrosTrabalho', navId: 'centros-trabalho' },
  { flag: 'podeVerUsuarios', navId: 'usuarios' },
];

export function secoesAlemDaHome(nav: ModuleNavConfig): ModuleNavItem[] {
  const home = nav.homeHref.replace(/\/+$/, '') || '/';
  return getNavigableModuleNavItems(nav.items).filter((item) => {
    const href = item.href.replace(/\/+$/, '') || '/';
    return href !== home;
  });
}

export function idsModulosAchatados(
  permissions: SidebarMenuPermissions,
): Set<string> {
  const visiveis = PERMISSAO_PARA_NAV.filter(
    (entrada) => permissions[entrada.flag] === true,
  );
  const achatados = new Set<string>();
  for (const entrada of visiveis) {
    const nav = getModuleNavById(entrada.navId);
    if (!nav) continue;
    const secoes = secoesAlemDaHome(nav);
    if (deveAchatarModulo(secoes.length, visiveis.length)) {
      achatados.add(entrada.navId);
    }
  }
  return achatados;
}

export function itemSidebarDeSecao(
  navId: string,
  item: ModuleNavItem,
  iconClass: string,
): SidebarNavItem {
  const Icon = item.icon;
  return {
    id: `${navId}:${item.id}`,
    label: item.label,
    href: item.href,
    icon: Icon ? <Icon className={iconClass} /> : <span />,
  };
}

export function expandirItensAchatados(
  items: SidebarNavItem[],
  achatados: Set<string>,
  iconClass: string,
): SidebarNavItem[] {
  const saida: SidebarNavItem[] = [];
  for (const item of items) {
    if (!achatados.has(item.id)) {
      saida.push(item);
      continue;
    }
    const nav = getModuleNavById(item.id);
    if (!nav) {
      saida.push(item);
      continue;
    }
    for (const secao of secoesAlemDaHome(nav)) {
      saida.push(itemSidebarDeSecao(nav.id, secao, iconClass));
    }
  }
  return saida;
}
