import { BadRequestException } from '@nestjs/common';
import { Prisma, TipoItemCompra } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SolicitacaoItemDto } from '../dto/solicitacao-item.dto';

export function validarItensSolicitacao(itens: SolicitacaoItemDto[]) {
  if (!itens?.length) {
    throw new BadRequestException(
      'Informe ao menos um item na solicitação.',
    );
  }

  for (const item of itens) {
    if (item.tipo === TipoItemCompra.MATERIAL && !item.insumo_id) {
      throw new BadRequestException('Itens MATERIAL exigem insumo_id.');
    }
    if (
      (item.tipo === TipoItemCompra.SERVICO ||
        item.tipo === TipoItemCompra.DESPESA) &&
      !item.descricao?.trim()
    ) {
      throw new BadRequestException(
        'Itens SERVICO/DESPESA exigem descricao.',
      );
    }
  }
}

export async function montarItensSolicitacao(
  prisma: PrismaService,
  itens: SolicitacaoItemDto[],
  lojaId: string,
): Promise<Prisma.SolicitacaoCompraItemCreateWithoutSolicitacaoInput[]> {
  const result: Prisma.SolicitacaoCompraItemCreateWithoutSolicitacaoInput[] =
    [];

  for (const item of itens) {
    let descricao = item.descricao?.trim() ?? '';

    if (item.tipo === TipoItemCompra.MATERIAL) {
      const insumo = await prisma.insumo.findFirst({
        where: { id: item.insumo_id, loja_id: lojaId },
        select: { id: true, nome: true },
      });
      if (!insumo) {
        throw new BadRequestException(
          `Insumo "${item.insumo_id}" não encontrado nesta loja.`,
        );
      }
      if (!descricao) {
        descricao = insumo.nome;
      }
    }

    result.push({
      loja_id: lojaId,
      tipo: item.tipo,
      insumo_id: item.insumo_id ?? null,
      descricao,
      quantidade: new Prisma.Decimal(item.quantidade),
      unidade: item.unidade.trim(),
      item_os_id: item.item_os_id ?? null,
      ordem_terceirizacao_id: item.ordem_terceirizacao_id ?? null,
    });
  }

  return result;
}
