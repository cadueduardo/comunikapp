import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../../rbac/catalogo/factory';
import { PermissaoCatalogo } from '../../rbac/catalogo/tipos';
import { VENDAS_PERMISSOES, DEFAULTS_CONCEDIDOS_FASE_7 } from './vendas-permissoes';

const METADADOS: Record<string, Omit<PermissaoCatalogo, 'chave'>> = {
  [VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA]: {
    nome: 'Ver carteira própria',
    descricao: 'Clientes em que é responsável ou participante.',
    grupo: 'carteira',
    risco: 'BAIXO',
  },
  [VENDAS_PERMISSOES.CARTEIRA_VER_EQUIPE]: {
    nome: 'Ver carteira da equipe',
    descricao: 'Carteiras dos vendedores sob gestão.',
    grupo: 'carteira',
    risco: 'MEDIO',
  },
  [VENDAS_PERMISSOES.CARTEIRA_VER_TODOS]: {
    nome: 'Ver todas as carteiras',
    descricao: 'Cadastro mestre completo da loja.',
    grupo: 'carteira',
    risco: 'ALTO',
  },
  [VENDAS_PERMISSOES.CARTEIRA_VER_SEM_RESPONSAVEL]: {
    nome: 'Ver fila sem responsável',
    descricao: 'Fila de distribuição de clientes.',
    grupo: 'carteira',
    risco: 'MEDIO',
  },
  [VENDAS_PERMISSOES.CARTEIRA_TRANSFERIR]: {
    nome: 'Transferir carteira',
    descricao: 'Trocar o responsável comercial.',
    grupo: 'carteira',
    risco: 'ALTO',
  },
  [VENDAS_PERMISSOES.CLIENTE_CRIAR]: {
    nome: 'Criar cliente',
    descricao: 'Criar cliente ou prospect.',
    grupo: 'cliente',
    risco: 'BAIXO',
  },
  [VENDAS_PERMISSOES.CLIENTE_EDITAR]: {
    nome: 'Editar cliente',
    descricao: 'Editar dados comerciais do cliente.',
    grupo: 'cliente',
    risco: 'MEDIO',
  },
  [VENDAS_PERMISSOES.CLIENTE_MESCLAR]: {
    nome: 'Mesclar clientes',
    descricao: 'Mesclagem administrativa de duplicados.',
    grupo: 'cliente',
    risco: 'CRITICO',
  },
  [VENDAS_PERMISSOES.CLIENTE_INATIVAR]: {
    nome: 'Inativar cliente',
    descricao: 'Inativar ou bloquear cliente.',
    grupo: 'cliente',
    risco: 'ALTO',
  },
  [VENDAS_PERMISSOES.CONTATO_GERENCIAR]: {
    nome: 'Gerenciar contatos',
    descricao: 'Contatos e papéis do cliente.',
    grupo: 'cliente',
    risco: 'MEDIO',
  },
  [VENDAS_PERMISSOES.PROPOSTA_VER]: {
    nome: 'Ver propostas',
    descricao: 'Listar e abrir propostas no escopo permitido.',
    grupo: 'proposta',
    risco: 'BAIXO',
  },
  [VENDAS_PERMISSOES.PROPOSTA_CRIAR]: {
    nome: 'Criar proposta',
    descricao: 'Criar orçamento ou proposta.',
    grupo: 'proposta',
    risco: 'MEDIO',
  },
  [VENDAS_PERMISSOES.PROPOSTA_EDITAR]: {
    nome: 'Editar proposta',
    descricao: 'Editar proposta antes do envio.',
    grupo: 'proposta',
    risco: 'MEDIO',
  },
  [VENDAS_PERMISSOES.PROPOSTA_ENVIAR]: {
    nome: 'Enviar proposta',
    descricao: 'Congelar versão e enviar ao cliente.',
    grupo: 'proposta',
    risco: 'ALTO',
  },
  [VENDAS_PERMISSOES.PROPOSTA_REVISAR]: {
    nome: 'Revisar proposta',
    descricao: 'Criar nova versão de proposta enviada.',
    grupo: 'proposta',
    risco: 'MEDIO',
  },
  [VENDAS_PERMISSOES.PROPOSTA_MARCAR_PERDIDA]: {
    nome: 'Marcar proposta perdida',
    descricao: 'Encerrar proposta com motivo de perda.',
    grupo: 'proposta',
    risco: 'MEDIO',
  },
  [VENDAS_PERMISSOES.PROPOSTA_REABRIR]: {
    nome: 'Reabrir proposta',
    descricao: 'Reabrir proposta perdida ou expirada.',
    grupo: 'proposta',
    risco: 'ALTO',
  },
  [VENDAS_PERMISSOES.PROPOSTA_ACEITE_REGISTRAR]: {
    nome: 'Registrar aceite',
    descricao: 'Registrar aceite externo manualmente.',
    grupo: 'proposta',
    risco: 'ALTO',
  },
  [VENDAS_PERMISSOES.PROPOSTA_EXCLUIR]: {
    nome: 'Excluir proposta',
    descricao: 'Excluir orçamento no escopo permitido.',
    grupo: 'proposta',
    risco: 'CRITICO',
  },
  [VENDAS_PERMISSOES.PRECO_DESCONTO_APLICAR]: {
    nome: 'Aplicar desconto',
    descricao: 'Aplicar desconto dentro do limite da alçada.',
    grupo: 'preco',
    risco: 'ALTO',
  },
  [VENDAS_PERMISSOES.PRECO_CUSTO_VER]: {
    nome: 'Ver custo interno',
    descricao: 'Ver custo interno detalhado da proposta.',
    grupo: 'preco',
    risco: 'ALTO',
  },
  [VENDAS_PERMISSOES.PRECO_MARGEM_VER]: {
    nome: 'Ver margem',
    descricao: 'Ver margem resultante e limite.',
    grupo: 'preco',
    risco: 'ALTO',
  },
  [VENDAS_PERMISSOES.ALCADA_SOLICITAR]: {
    nome: 'Solicitar alçada',
    descricao: 'Pedir exceção de desconto ou margem.',
    grupo: 'preco',
    risco: 'MEDIO',
  },
  [VENDAS_PERMISSOES.ALCADA_APROVAR]: {
    nome: 'Aprovar alçada',
    descricao: 'Decidir exceção comercial.',
    grupo: 'preco',
    risco: 'CRITICO',
  },
  [VENDAS_PERMISSOES.PEDIDO_VER]: {
    nome: 'Ver pedido',
    descricao: 'Acompanhamento comercial do pedido.',
    grupo: 'pedido',
    risco: 'BAIXO',
  },
  [VENDAS_PERMISSOES.PEDIDO_CANCELAR]: {
    nome: 'Cancelar pedido',
    descricao: 'Cancelamento pós-aceite por fluxo compensatório.',
    grupo: 'pedido',
    risco: 'CRITICO',
  },
  [VENDAS_PERMISSOES.PEDIDO_COBRANCA_VER]: {
    nome: 'Ver cobrança do pedido',
    descricao: 'Situação da cobrança em modo leitura.',
    grupo: 'pedido',
    risco: 'MEDIO',
  },
  [VENDAS_PERMISSOES.ADITIVO_VER]: {
    nome: 'Ver aditivos',
    descricao: 'Fila de ocorrências a precificar.',
    grupo: 'aditivo',
    risco: 'BAIXO',
  },
  [VENDAS_PERMISSOES.ADITIVO_PRECIFICAR]: {
    nome: 'Precificar aditivo',
    descricao: 'Definir preço ao cliente da ocorrência.',
    grupo: 'aditivo',
    risco: 'ALTO',
  },
  [VENDAS_PERMISSOES.ADITIVO_ENVIAR]: {
    nome: 'Enviar aditivo',
    descricao: 'Enviar proposta de aditivo.',
    grupo: 'aditivo',
    risco: 'ALTO',
  },
  [VENDAS_PERMISSOES.ADITIVO_GERAR_OS]: {
    nome: 'Gerar OS de aditivo',
    descricao: 'Disparar o split existente do aditivo.',
    grupo: 'aditivo',
    risco: 'CRITICO',
  },
  [VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA]: {
    nome: 'Ver atividades próprias',
    descricao: 'Minhas atividades comerciais.',
    grupo: 'atividade',
    risco: 'BAIXO',
  },
  [VENDAS_PERMISSOES.ATIVIDADE_VER_EQUIPE]: {
    nome: 'Ver atividades da equipe',
    descricao: 'Atividades comerciais da equipe.',
    grupo: 'atividade',
    risco: 'MEDIO',
  },
  [VENDAS_PERMISSOES.ATIVIDADE_GERENCIAR]: {
    nome: 'Gerenciar atividades',
    descricao: 'Criar, concluir e reatribuir atividades.',
    grupo: 'atividade',
    risco: 'MEDIO',
  },
};

const granulares: PermissaoCatalogo[] = Object.values(VENDAS_PERMISSOES)
  .filter((chave) => chave !== 'vendas.acessar')
  .map((chave) => {
    const meta = METADADOS[chave];
    if (!meta) {
      throw new Error(`Metadado ausente para permissão de Vendas "${chave}".`);
    }
    return { chave, ...meta };
  });

export const VENDAS_CATALOGO = manifestoAcessoModulo({
  chave: 'vendas',
  nome: 'Vendas',
  descricao: 'Carteira, propostas, pedidos, aditivos e atividades comerciais.',
  grupo: 'comercial',
  ordem: 20,
  statusEnforcement: 'ENFORCED',
  prefixosApi: ['/vendas', '/orcamentos-v2', '/clientes'],
  rotasFrontend: ['/vendas', '/orcamentos-v2', '/clientes'],
  funcoesComAcesso: [
    usuario_funcao.ADMINISTRADOR,
    usuario_funcao.VENDAS,
    usuario_funcao.FINANCEIRO,
  ],
  permissoesGranulares: granulares,
  pisoExtra: {
    [usuario_funcao.VENDAS]: DEFAULTS_CONCEDIDOS_FASE_7.VENDEDOR,
    [usuario_funcao.FINANCEIRO]: DEFAULTS_CONCEDIDOS_FASE_7.FINANCEIRO,
  },
});
