import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const CENTROS_TRABALHO_CATALOGO = manifestoAcessoModulo({
  chave: 'centros-trabalho',
  nome: 'Centros de trabalho',
  descricao: 'Funções, máquinas, serviços manuais e custos indiretos.',
  grupo: 'cadastros',
  ordem: 150,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/funcoes', '/maquinas', '/servicos-manuais', '/custos-indiretos'],
  rotasFrontend: ['/centros-de-trabalho'],
  funcoesComAcesso: Object.values(usuario_funcao),
});
