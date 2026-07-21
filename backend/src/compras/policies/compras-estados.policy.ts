import { BadRequestException } from '@nestjs/common';
import { createRequire } from 'node:module';
import {
  StatusPedidoCompra,
  StatusSolicitacaoCompra,
} from '@prisma/client';

const requireMaps = createRequire(__filename);
const {
  SOLICITACAO_TRANSICOES,
  SOLICITACAO_STATUS_ALVO,
  PEDIDO_TRANSICOES,
  PEDIDO_STATUS_ALVO,
} = requireMaps('./compras-estados.maps.js') as {
  SOLICITACAO_TRANSICOES: Record<string, string[]>;
  SOLICITACAO_STATUS_ALVO: Record<string, string>;
  PEDIDO_TRANSICOES: Record<string, string[]>;
  PEDIDO_STATUS_ALVO: Record<string, string>;
};

export type AcaoSolicitacao =
  | 'enviar'
  | 'aprovar'
  | 'rejeitar'
  | 'devolver'
  | 'cancelar';

export type AcaoPedido =
  | 'enviarAprovacao'
  | 'aprovar'
  | 'rejeitar'
  | 'enviarFornecedor'
  | 'cancelar'
  | 'substituivel';

export {
  SOLICITACAO_TRANSICOES,
  SOLICITACAO_STATUS_ALVO,
  PEDIDO_TRANSICOES,
  PEDIDO_STATUS_ALVO,
};

export function statusAlvoSolicitacao(
  acao: Exclude<AcaoSolicitacao, never>,
): StatusSolicitacaoCompra {
  return SOLICITACAO_STATUS_ALVO[acao] as StatusSolicitacaoCompra;
}

export function statusAlvoPedido(
  acao: Exclude<AcaoPedido, 'substituivel'>,
): StatusPedidoCompra {
  return PEDIDO_STATUS_ALVO[acao] as StatusPedidoCompra;
}

export function assertTransicaoSolicitacao(
  acao: AcaoSolicitacao,
  statusAtual: StatusSolicitacaoCompra,
): void {
  const permitidos = SOLICITACAO_TRANSICOES[acao];
  if (!permitidos?.includes(statusAtual)) {
    throw new BadRequestException(
      `Transição inválida: não é possível "${acao}" a partir do status ${statusAtual}.`,
    );
  }
}

export function assertTransicaoPedido(
  acao: AcaoPedido,
  statusAtual: StatusPedidoCompra,
): void {
  const permitidos = PEDIDO_TRANSICOES[acao];
  if (!permitidos?.includes(statusAtual)) {
    throw new BadRequestException(
      `Transição inválida: não é possível "${acao}" a partir do status ${statusAtual}.`,
    );
  }
}
