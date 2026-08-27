import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const PCP_CATALOGO = manifestoAcessoModulo({
  chave: 'pcp',
  nome: 'PCP',
  descricao: 'Kanban, apontamentos e workflows de produção.',
  grupo: 'producao',
  ordem: 60,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/pcp'],
  rotasFrontend: ['/pcp'],
  funcoesComAcesso: Object.values(usuario_funcao),
});
