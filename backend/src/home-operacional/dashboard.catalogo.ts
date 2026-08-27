import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

const TODAS = Object.values(usuario_funcao);

export const DASHBOARD_CATALOGO = manifestoAcessoModulo({
  chave: 'dashboard',
  nome: 'Painel',
  descricao: 'Home operacional da loja.',
  grupo: 'operacao',
  ordem: 10,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/dashboard', '/home-operacional'],
  rotasFrontend: ['/dashboard'],
  funcoesComAcesso: TODAS,
});
