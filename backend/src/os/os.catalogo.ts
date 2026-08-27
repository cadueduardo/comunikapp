import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const OS_CATALOGO = manifestoAcessoModulo({
  chave: 'os',
  nome: 'Ordens de serviço',
  descricao: 'Abertura, execução e aprovação de OS. Operações granulares seguem os guards de função.',
  grupo: 'producao',
  ordem: 50,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/os'],
  rotasFrontend: ['/os'],
  funcoesComAcesso: Object.values(usuario_funcao),
});
