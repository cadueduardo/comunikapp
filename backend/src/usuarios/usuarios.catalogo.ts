import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const USUARIOS_CATALOGO = manifestoAcessoModulo({
  chave: 'usuarios',
  nome: 'Usuários e perfis',
  descricao: 'Gestão de contas, funções, perfis e permissões da loja.',
  grupo: 'administracao',
  ordem: 170,
  statusEnforcement: 'ENFORCED',
  prefixosApi: ['/usuarios'],
  rotasFrontend: ['/usuarios'],
  funcoesComAcesso: [usuario_funcao.ADMINISTRADOR],
  permissoesGranulares: [
    {
      chave: 'usuarios.usuarios.gerenciar',
      nome: 'Gerenciar usuários',
      descricao: 'Criar, editar, inativar e reativar usuários da loja.',
      grupo: 'usuarios',
      risco: 'ALTO',
    },
    {
      chave: 'usuarios.perfis.gerenciar',
      nome: 'Gerenciar perfis',
      descricao: 'Criar perfis, alterar grants e associar usuários.',
      grupo: 'perfis',
      risco: 'CRITICO',
    },
  ],
});
