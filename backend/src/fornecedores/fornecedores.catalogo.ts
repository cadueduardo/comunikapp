import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const FORNECEDORES_CATALOGO = manifestoAcessoModulo({
  chave: 'fornecedores',
  nome: 'Fornecedores',
  descricao: 'Cadastro de fornecedores e parceiros.',
  grupo: 'cadastros',
  ordem: 140,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/fornecedores'],
  rotasFrontend: ['/fornecedores'],
  funcoesComAcesso: Object.values(usuario_funcao),
});
