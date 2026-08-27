import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const FINANCEIRO_CATALOGO = manifestoAcessoModulo({
  chave: 'financeiro',
  nome: 'Financeiro',
  descricao: 'Recebimentos, contas a pagar e pós-cálculo.',
  grupo: 'financeiro',
  ordem: 70,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/financeiro'],
  rotasFrontend: ['/financeiro'],
  funcoesComAcesso: [usuario_funcao.ADMINISTRADOR, usuario_funcao.FINANCEIRO],
});
