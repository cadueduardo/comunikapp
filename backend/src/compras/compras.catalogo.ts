import { usuario_funcao } from '@prisma/client';
import { manifestoAcessoModulo } from '../rbac/catalogo/factory';
import { PermissaoCatalogo } from '../rbac/catalogo/tipos';
import { COMPRAS_PERMISSOES } from './compras-permissoes';

const METADADOS: Record<string, Omit<PermissaoCatalogo, 'chave'>> = {
  [COMPRAS_PERMISSOES.SOLICITACAO_CRIAR]: {
    nome: 'Criar solicitação',
    descricao: 'Abrir solicitação de compra.',
    grupo: 'solicitacao',
    risco: 'MEDIO',
  },
  [COMPRAS_PERMISSOES.SOLICITACAO_APROVAR]: {
    nome: 'Aprovar solicitação',
    descricao: 'Aprovar solicitação de compra.',
    grupo: 'solicitacao',
    risco: 'ALTO',
  },
  [COMPRAS_PERMISSOES.PEDIDO_CRIAR]: {
    nome: 'Criar pedido',
    descricao: 'Gerar pedido de compra.',
    grupo: 'pedido',
    risco: 'MEDIO',
  },
  [COMPRAS_PERMISSOES.PEDIDO_APROVAR]: {
    nome: 'Aprovar pedido',
    descricao: 'Aprovar pedido de compra.',
    grupo: 'pedido',
    risco: 'ALTO',
  },
  [COMPRAS_PERMISSOES.PEDIDO_ENVIAR]: {
    nome: 'Enviar pedido',
    descricao: 'Enviar pedido ao fornecedor.',
    grupo: 'pedido',
    risco: 'ALTO',
  },
  [COMPRAS_PERMISSOES.PEDIDO_CANCELAR]: {
    nome: 'Cancelar pedido',
    descricao: 'Cancelar pedido de compra.',
    grupo: 'pedido',
    risco: 'ALTO',
  },
  [COMPRAS_PERMISSOES.PEDIDO_SUBSTITUIR_FORNECEDOR]: {
    nome: 'Substituir fornecedor',
    descricao: 'Trocar fornecedor do pedido.',
    grupo: 'pedido',
    risco: 'ALTO',
  },
  [COMPRAS_PERMISSOES.RECEBIMENTO_REGISTRAR]: {
    nome: 'Registrar recebimento',
    descricao: 'Registrar recebimento de mercadoria.',
    grupo: 'recebimento',
    risco: 'MEDIO',
  },
  [COMPRAS_PERMISSOES.SERVICO_ACEITAR]: {
    nome: 'Aceitar serviço',
    descricao: 'Registrar aceite de serviço terceirizado.',
    grupo: 'servico',
    risco: 'MEDIO',
  },
  [COMPRAS_PERMISSOES.CONTA_PAGAR_CRIAR]: {
    nome: 'Criar conta a pagar',
    descricao: 'Gerar conta a pagar a partir da compra.',
    grupo: 'financeiro',
    risco: 'ALTO',
  },
  [COMPRAS_PERMISSOES.PAGAMENTO_REGISTRAR]: {
    nome: 'Registrar pagamento',
    descricao: 'Registrar pagamento a fornecedor.',
    grupo: 'financeiro',
    risco: 'ALTO',
  },
  [COMPRAS_PERMISSOES.PAGAMENTO_ESTORNAR]: {
    nome: 'Estornar pagamento',
    descricao: 'Estornar pagamento registrado.',
    grupo: 'financeiro',
    risco: 'CRITICO',
  },
  [COMPRAS_PERMISSOES.AUDITORIA_VISUALIZAR]: {
    nome: 'Ver auditoria de compras',
    descricao: 'Consultar histórico e auditoria do módulo.',
    grupo: 'auditoria',
    risco: 'MEDIO',
  },
};

const granulares: PermissaoCatalogo[] = Object.values(COMPRAS_PERMISSOES)
  .filter((chave) => chave !== COMPRAS_PERMISSOES.ACESSAR)
  .map((chave) => {
    const meta = METADADOS[chave];
    if (!meta) {
      throw new Error(`Metadado ausente para permissão de Compras "${chave}".`);
    }
    return { chave, ...meta };
  });

export const COMPRAS_CATALOGO = manifestoAcessoModulo({
  chave: 'compras',
  nome: 'Compras',
  descricao: 'Solicitações, pedidos, recebimentos e contas a pagar.',
  grupo: 'comercial',
  ordem: 30,
  statusEnforcement: 'ENFORCED',
  prefixosApi: ['/compras'],
  rotasFrontend: ['/compras'],
  funcoesComAcesso: Object.values(usuario_funcao),
  permissoesGranulares: granulares,
});
