import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const EXPEDICAO_CATALOGO = manifestoAcessoModulo({
  chave: 'expedicao',
  nome: 'Expedição',
  descricao: 'Fila de expedição e arquivo de entregas.',
  grupo: 'producao',
  ordem: 80,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/expedicao'],
  rotasFrontend: ['/expedicao'],
  funcoesComAcesso: [
    usuario_funcao.ADMINISTRADOR,
    usuario_funcao.PRODUCAO,
    usuario_funcao.ESTOQUE,
  ],
});
