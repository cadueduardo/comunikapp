import {
  Prisma,
  StatusPedidoCompra,
  TipoItemCompra,
} from '@prisma/client';

type Tx = Prisma.TransactionClient;

function toNum(v: Prisma.Decimal | number | string | null | undefined): number {
  if (v == null) return 0;
  return Number(v);
}

/**
 * Recalcula PARCIAL/ATENDIDO após recebimento ou aceite.
 * MATERIAL usa quantidade_recebida (acumula qtd aceita no estoque).
 * SERVICO usa quantidade_aceita.
 */
export async function updatePedidoStatusAposEvento(
  tx: Tx,
  pedidoId: string,
  lojaId: string,
): Promise<StatusPedidoCompra | null> {
  const pedido = await tx.pedidoCompra.findFirst({
    where: { id: pedidoId, loja_id: lojaId },
    include: { itens: true },
  });
  if (!pedido) return null;

  if (
    pedido.status !== StatusPedidoCompra.ENVIADO &&
    pedido.status !== StatusPedidoCompra.PARCIAL &&
    pedido.status !== StatusPedidoCompra.ATENDIDO &&
    pedido.status !== StatusPedidoCompra.APROVADO
  ) {
    return pedido.status;
  }

  const materiais = pedido.itens.filter((i) => i.tipo === TipoItemCompra.MATERIAL);
  const servicos = pedido.itens.filter((i) => i.tipo === TipoItemCompra.SERVICO);

  let materialPendente = false;
  let materialProgresso = false;
  for (const item of materiais) {
    const qtd = toNum(item.quantidade);
    const recebido = toNum(item.quantidade_recebida);
    if (recebido > 0) materialProgresso = true;
    if (recebido + 1e-9 < qtd) materialPendente = true;
  }

  let servicoPendente = false;
  let servicoProgresso = false;
  for (const item of servicos) {
    const qtd = toNum(item.quantidade);
    const aceito = toNum(item.quantidade_aceita);
    if (aceito > 0) servicoProgresso = true;
    if (aceito + 1e-9 < qtd) servicoPendente = true;
  }

  const temMaterial = materiais.length > 0;
  const temServico = servicos.length > 0;

  const tudoMaterialOk = !temMaterial || !materialPendente;
  const tudoServicoOk = !temServico || !servicoPendente;
  const algumProgresso = materialProgresso || servicoProgresso;

  let novoStatus: StatusPedidoCompra = pedido.status;

  if (tudoMaterialOk && tudoServicoOk && algumProgresso) {
    novoStatus = StatusPedidoCompra.ATENDIDO;
  } else if (algumProgresso && (materialPendente || servicoPendente)) {
    novoStatus = StatusPedidoCompra.PARCIAL;
  } else if (
    pedido.status === StatusPedidoCompra.APROVADO &&
    algumProgresso
  ) {
    novoStatus = StatusPedidoCompra.PARCIAL;
  }

  if (novoStatus !== pedido.status) {
    await tx.pedidoCompra.update({
      where: { id: pedido.id },
      data: { status: novoStatus },
    });
  }

  return novoStatus;
}

export function saldoPendenteItem(
  quantidadePedido: number,
  quantidadeAcumulada: number,
): number {
  const pendente = Number(quantidadePedido) - Number(quantidadeAcumulada);
  return pendente > 0 ? pendente : 0;
}
