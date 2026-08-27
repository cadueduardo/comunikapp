import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const INSUMOS_CATALOGO = manifestoAcessoModulo({
  chave: 'insumos',
  nome: 'Insumos',
  descricao: 'Cadastro de insumos e custos de material.',
  grupo: 'cadastros',
  ordem: 130,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/insumos'],
  rotasFrontend: ['/insumos'],
  funcoesComAcesso: Object.values(usuario_funcao),
});
