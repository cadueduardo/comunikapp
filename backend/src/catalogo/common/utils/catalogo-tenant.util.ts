import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Garante que o recurso pertence ao tenant (mitigação BOLA — OWASP A01).
 * Retorna 404 genérico para não revelar existência cross-tenant.
 */
export async function assertProcessoDecoracaoDaLoja(
  prisma: PrismaService,
  id: string,
  lojaId: string,
) {
  const processo = await prisma.processoDecoracao.findFirst({
    where: { id, loja_id: lojaId },
  });

  if (!processo) {
    throw new NotFoundException('Processo de decoração não encontrado.');
  }

  return processo;
}

export async function assertConjuntoCamposDaLoja(
  prisma: PrismaService,
  id: string,
  lojaId: string,
) {
  const conjunto = await prisma.conjuntoCampos.findFirst({
    where: { id, loja_id: lojaId },
  });

  if (!conjunto) {
    throw new NotFoundException('Conjunto de campos não encontrado.');
  }

  return conjunto;
}

export async function assertEstampaDaLoja(
  prisma: PrismaService,
  id: string,
  lojaId: string,
) {
  const estampa = await prisma.estampa.findFirst({
    where: { id, loja_id: lojaId },
  });

  if (!estampa) {
    throw new NotFoundException('Estampa não encontrada.');
  }

  return estampa;
}
