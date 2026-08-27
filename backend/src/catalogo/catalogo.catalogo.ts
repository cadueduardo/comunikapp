import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const CATALOGO_PRODUTOS_CATALOGO = manifestoAcessoModulo({
  chave: 'catalogo',
  nome: 'Catálogo',
  descricao: 'Produtos finitos, personalização e estampas.',
  grupo: 'cadastros',
  ordem: 110,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/catalogo', '/produtos-finitos'],
  rotasFrontend: ['/catalogo', '/produtos-finitos'],
  funcoesComAcesso: Object.values(usuario_funcao),
});
