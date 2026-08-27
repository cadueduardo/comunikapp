import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const MODELOS_CATALOGO = manifestoAcessoModulo({
  chave: 'modelos',
  nome: 'Modelos de orçamento',
  descricao: 'Templates de produto usados no orçamento.',
  grupo: 'cadastros',
  ordem: 120,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/produtos'],
  rotasFrontend: ['/produtos'],
  funcoesComAcesso: Object.values(usuario_funcao),
});
