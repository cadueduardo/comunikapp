import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreatePedidoDto } from '../dto/create-pedido.dto';

export function roundMoney2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function calcularTotaisPedido(
  dto: CreatePedidoDto,
  lojaId: string,
): {
  itens: Prisma.PedidoCompraItemCreateWithoutPedidoInput[];
  subtotal: Prisma.Decimal;
  desconto: Prisma.Decimal;
  frete: Prisma.Decimal;
  total: Prisma.Decimal;
} {
  const descontoCabecalho = dto.desconto ?? 0;
  const freteCabecalho = dto.frete ?? 0;

  let somaLinhas = 0;
  const itens: Prisma.PedidoCompraItemCreateWithoutPedidoInput[] = [];

  for (const item of dto.itens) {
    const quantidade = item.quantidade;
    const preco = item.preco_unitario;
    const descontoItem = item.desconto ?? 0;
    const freteRateado = item.frete_rateado ?? 0;
    const linhaBase = quantidade * preco - descontoItem;
    const totalItem = linhaBase + freteRateado;

    if (totalItem < 0) {
      throw new BadRequestException(
        'Total do item não pode ser negativo. Revise preço, quantidade e desconto.',
      );
    }

    somaLinhas += linhaBase;

    itens.push({
      loja_id: lojaId,
      tipo: item.tipo,
      solicitacao_item_id: item.solicitacao_item_id ?? null,
      insumo_id: item.insumo_id ?? null,
      ordem_terceirizacao_id: item.ordem_terceirizacao_id ?? null,
      descricao_snapshot: item.descricao_snapshot.trim(),
      codigo_ref_snapshot: item.codigo_ref_snapshot ?? null,
      quantidade: new Prisma.Decimal(quantidade),
      unidade_snapshot: item.unidade_snapshot.trim(),
      preco_unitario: new Prisma.Decimal(preco),
      desconto: new Prisma.Decimal(descontoItem),
      frete_rateado: new Prisma.Decimal(freteRateado),
      total: new Prisma.Decimal(roundMoney2(totalItem)),
    });
  }

  const subtotal = roundMoney2(somaLinhas);
  const total = roundMoney2(subtotal - descontoCabecalho + freteCabecalho);

  if (total < 0) {
    throw new BadRequestException(
      'Total do pedido não pode ser negativo. Revise desconto e frete.',
    );
  }

  return {
    itens,
    subtotal: new Prisma.Decimal(subtotal),
    desconto: new Prisma.Decimal(descontoCabecalho),
    frete: new Prisma.Decimal(freteCabecalho),
    total: new Prisma.Decimal(total),
  };
}

export function rethrowUniqueConflict(error: unknown, mensagem: string): void {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(mensagem);
  }
}
