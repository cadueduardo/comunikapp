import type { ModuleNavConfig } from './types';
import { financeiroModuleNav } from './financeiro';
import { estoqueModuleNav } from './estoque';
import { comprasModuleNav } from './compras';
import { catalogoModuleNav } from './catalogo';
import { centrosTrabalhoModuleNav } from './centros-trabalho';
import { configuracoesModuleNav } from './configuracoes';
import { usuariosModuleNav } from './usuarios';
import { pcpModuleNav } from './pcp';
import { expedicaoModuleNav } from './expedicao';
import {
  arteModuleNav,
  clientesModuleNav,
  fornecedoresModuleNav,
  insumosModuleNav,
  instalacaoModuleNav,
  modelosModuleNav,
  orcamentosModuleNav,
  osModuleNav,
} from './operacionais';

/**
 * Índice de navegação por módulo.
 * Fonte de verdade para ModuleHeader / ModuleBottomNav / cards de hub.
 */
export const MODULE_NAV_REGISTRY: Record<string, ModuleNavConfig> = {
  [financeiroModuleNav.id]: financeiroModuleNav,
  [estoqueModuleNav.id]: estoqueModuleNav,
  [comprasModuleNav.id]: comprasModuleNav,
  [catalogoModuleNav.id]: catalogoModuleNav,
  [centrosTrabalhoModuleNav.id]: centrosTrabalhoModuleNav,
  [configuracoesModuleNav.id]: configuracoesModuleNav,
  [usuariosModuleNav.id]: usuariosModuleNav,
  [pcpModuleNav.id]: pcpModuleNav,
  [expedicaoModuleNav.id]: expedicaoModuleNav,
  [osModuleNav.id]: osModuleNav,
  [arteModuleNav.id]: arteModuleNav,
  [instalacaoModuleNav.id]: instalacaoModuleNav,
  [fornecedoresModuleNav.id]: fornecedoresModuleNav,
  [insumosModuleNav.id]: insumosModuleNav,
  [orcamentosModuleNav.id]: orcamentosModuleNav,
  [modelosModuleNav.id]: modelosModuleNav,
  [clientesModuleNav.id]: clientesModuleNav,
};

export function getModuleNavById(id: string): ModuleNavConfig | undefined {
  return MODULE_NAV_REGISTRY[id];
}
