/* AUTO-GERADO por scripts/gerar-agregador-catalogo-rbac.ts. Não edite. */
import { CATALOGO_PRODUTOS_CATALOGO } from '../../catalogo/catalogo.catalogo';
import { COMPRAS_CATALOGO } from '../../compras/compras.catalogo';
import { CENTROS_TRABALHO_CATALOGO } from '../../configuracoes/centros-trabalho.catalogo';
import { CONFIGURACOES_CATALOGO } from '../../configuracoes/configuracoes.catalogo';
import { ESTOQUE_CATALOGO } from '../../estoque/estoque.catalogo';
import { EXPEDICAO_CATALOGO } from '../../expedicao/expedicao.catalogo';
import { FINANCEIRO_CATALOGO } from '../../financeiro/financeiro.catalogo';
import { FORNECEDORES_CATALOGO } from '../../fornecedores/fornecedores.catalogo';
import { DASHBOARD_CATALOGO } from '../../home-operacional/dashboard.catalogo';
import { INSTALACAO_CATALOGO } from '../../instalacao/instalacao.catalogo';
import { INSUMOS_CATALOGO } from '../../insumos/insumos.catalogo';
import { ARTE_CATALOGO } from '../../modules/arte-aprovacao/arte.catalogo';
import { OS_CATALOGO } from '../../os/os.catalogo';
import { PCP_CATALOGO } from '../../pcp/pcp.catalogo';
import { MODELOS_CATALOGO } from '../../produtos/modelos.catalogo';
import { USUARIOS_CATALOGO } from '../../usuarios/usuarios.catalogo';
import { VENDAS_CATALOGO } from '../../vendas/permissions/vendas.catalogo';
import { ModuloCatalogo } from './tipos';

export const ARQUIVOS_MANIFESTO_RBAC = [
  'catalogo/catalogo.catalogo.ts',
  'compras/compras.catalogo.ts',
  'configuracoes/centros-trabalho.catalogo.ts',
  'configuracoes/configuracoes.catalogo.ts',
  'estoque/estoque.catalogo.ts',
  'expedicao/expedicao.catalogo.ts',
  'financeiro/financeiro.catalogo.ts',
  'fornecedores/fornecedores.catalogo.ts',
  'home-operacional/dashboard.catalogo.ts',
  'instalacao/instalacao.catalogo.ts',
  'insumos/insumos.catalogo.ts',
  'modules/arte-aprovacao/arte.catalogo.ts',
  'os/os.catalogo.ts',
  'pcp/pcp.catalogo.ts',
  'produtos/modelos.catalogo.ts',
  'usuarios/usuarios.catalogo.ts',
  'vendas/permissions/vendas.catalogo.ts',
] as const;

export const MANIFESTOS_DESCOBERTOS: readonly ModuloCatalogo[] = [
  CATALOGO_PRODUTOS_CATALOGO,
  COMPRAS_CATALOGO,
  CENTROS_TRABALHO_CATALOGO,
  CONFIGURACOES_CATALOGO,
  ESTOQUE_CATALOGO,
  EXPEDICAO_CATALOGO,
  FINANCEIRO_CATALOGO,
  FORNECEDORES_CATALOGO,
  DASHBOARD_CATALOGO,
  INSTALACAO_CATALOGO,
  INSUMOS_CATALOGO,
  ARTE_CATALOGO,
  OS_CATALOGO,
  PCP_CATALOGO,
  MODELOS_CATALOGO,
  USUARIOS_CATALOGO,
  VENDAS_CATALOGO,
];
