export type { ModuleNavConfig, ModuleNavItem } from './types';
export { resolveActiveModuleNavItem } from './resolve-active-item';
export {
  getModuleHubCardItems,
  getNavigableModuleNavItems,
  shouldShowModuleSectionNav,
} from './helpers';
export { MODULE_NAV_REGISTRY, getModuleNavById } from './registry';

export { financeiroModuleNav } from './financeiro';
export { estoqueModuleNav } from './estoque';
export { comprasModuleNav } from './compras';
export { catalogoModuleNav } from './catalogo';
export { centrosTrabalhoModuleNav } from './centros-trabalho';
export { configuracoesModuleNav } from './configuracoes';
export { usuariosModuleNav } from './usuarios';
export { pcpModuleNav } from './pcp';
export { expedicaoModuleNav } from './expedicao';
export {
  arteModuleNav,
  clientesModuleNav,
  fornecedoresModuleNav,
  insumosModuleNav,
  instalacaoModuleNav,
  modelosModuleNav,
  orcamentosModuleNav,
  osModuleNav,
} from './operacionais';
