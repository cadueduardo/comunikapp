import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const ESTOQUE_CATALOGO = manifestoAcessoModulo({
  chave: 'estoque',
  nome: 'Estoque',
  descricao: 'Localizações, lotes, transferências e movimentações.',
  grupo: 'operacao',
  ordem: 40,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/estoque'],
  rotasFrontend: ['/estoque'],
  funcoesComAcesso: [
    usuario_funcao.ADMINISTRADOR,
    usuario_funcao.FINANCEIRO,
    usuario_funcao.ESTOQUE,
    usuario_funcao.PRODUCAO,
  ],
});
