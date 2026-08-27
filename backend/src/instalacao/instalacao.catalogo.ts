import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';

export const INSTALACAO_CATALOGO = manifestoAcessoModulo({
  chave: 'instalacao',
  nome: 'Instalação',
  descricao: 'Agenda de instalação e superfície de campo.',
  grupo: 'producao',
  ordem: 90,
  statusEnforcement: 'PARCIAL',
  prefixosApi: ['/instalacao', '/instalador'],
  rotasFrontend: ['/instalacao', '/instalador'],
  funcoesComAcesso: [
    usuario_funcao.ADMINISTRADOR,
    usuario_funcao.FINANCEIRO,
    usuario_funcao.VENDAS,
    usuario_funcao.PRODUCAO,
  ],
});
