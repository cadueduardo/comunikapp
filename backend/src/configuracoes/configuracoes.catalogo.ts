import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const CONFIGURACOES_CATALOGO = manifestoAcessoModulo({
  chave: 'configuracoes',
  nome: 'Configurações',
  descricao: 'Dados da loja, categorias, tipos de material e conexões.',
  grupo: 'administracao',
  ordem: 160,
  statusEnforcement: 'PARCIAL',
  prefixosApi: [
    '/configuracoes',
    '/lojas',
    '/categorias',
    '/tipos-material',
    '/conexoes',
  ],
  rotasFrontend: ['/configuracoes'],
  funcoesComAcesso: Object.values(usuario_funcao),
});
