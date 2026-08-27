import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../../rbac/catalogo/factory';

export const ARTE_CATALOGO = manifestoAcessoModulo({
  chave: 'arte',
  nome: 'Arte e aprovação',
  descricao: 'Fila de artes e fluxo de aprovação. Links públicos do cliente ficam fora deste catálogo.',
  grupo: 'producao',
  ordem: 100,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/arte-aprovacao'],
  rotasFrontend: ['/arte'],
  funcoesComAcesso: Object.values(usuario_funcao),
});
