import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ModoPersonalizacao, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const MODOS_VENDA = new Set<ModoPersonalizacao>([
  ModoPersonalizacao.ESTAMPA,
  ModoPersonalizacao.IMPRINT_LIVRE,
  ModoPersonalizacao.ARTE_SOB_MEDIDA,
]);

export function normalizarModosPersonalizacao(
  modos?: ModoPersonalizacao[],
): ModoPersonalizacao[] {
  if (!modos?.length) {
    return [];
  }

  const filtrados = [...new Set(modos)].filter((m) => MODOS_VENDA.has(m));

  if (filtrados.length !== modos.length) {
    throw new BadRequestException(
      'Modos de personalização inválidos. Use ESTAMPA, IMPRINT_LIVRE ou ARTE_SOB_MEDIDA.',
    );
  }

  return filtrados;
}

/**
 * Valida que todos os IDs pertencem ao tenant (BOLA — OWASP A01).
 * Retorna 404 genérico para não revelar existência cross-tenant.
 */
export async function assertEstampasAtivasDaLoja(
  prisma: PrismaService,
  ids: string[],
  lojaId: string,
): Promise<void> {
  if (!ids.length) return;

  const total = await prisma.estampa.count({
    where: {
      id: { in: ids },
      loja_id: lojaId,
      ativo: true,
    },
  });

  if (total !== ids.length) {
    throw new NotFoundException(
      'Uma ou mais estampas informadas não foram encontradas.',
    );
  }
}

export async function assertProcessosAtivosDaLoja(
  prisma: PrismaService,
  ids: string[],
  lojaId: string,
): Promise<void> {
  if (!ids.length) return;

  const total = await prisma.processoDecoracao.count({
    where: {
      id: { in: ids },
      loja_id: lojaId,
      ativo: true,
    },
  });

  if (total !== ids.length) {
    throw new NotFoundException(
      'Um ou mais processos informados não foram encontrados.',
    );
  }
}

export const includePersonalizacaoParaOrcamento = {
  modos: {
    where: { habilitado: true },
    select: { modo: true, habilitado: true },
    orderBy: { modo: 'asc' as const },
  },
  estampas: {
    include: {
      estampa: {
        include: {
          processo: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              custo_setup: true,
              preco_base: true,
              faixas_preco: true,
              insumos_aceitos: true,
              exige_arte_aprovada: true,
              ativo: true,
            },
          },
          conjunto_campos: {
            include: {
              campos: { orderBy: { ordem: 'asc' as const } },
            },
          },
        },
      },
    },
  },
  processos: {
    include: {
      processo: {
        select: {
          id: true,
          nome: true,
          codigo: true,
          descricao: true,
          custo_setup: true,
          preco_base: true,
          faixas_preco: true,
          insumos_aceitos: true,
          exige_arte_aprovada: true,
          setor_pcp_sugerido: true,
          ativo: true,
        },
      },
    },
  },
} satisfies Prisma.ProdutoFinitoInclude;

export function mapearPersonalizacaoParaOrcamento(
  produto: Prisma.ProdutoFinitoGetPayload<{
    include: typeof includePersonalizacaoParaOrcamento;
  }>,
) {
  const estampasPermitidas = produto.estampas
    .map((v) => v.estampa)
    .filter((e) => e.ativo)
    .map((estampa) => ({
      id: estampa.id,
      nome: estampa.nome,
      codigo: estampa.codigo,
      preco_adicional: estampa.preco_adicional,
      arte_mestra_url: estampa.arte_mestra_url,
      thumb_url: estampa.thumb_url,
      metadados: estampa.metadados,
      processo: estampa.processo,
      conjunto_campos: estampa.conjunto_campos
        ? {
            id: estampa.conjunto_campos.id,
            nome: estampa.conjunto_campos.nome,
            campos: estampa.conjunto_campos.campos,
          }
        : null,
    }));

  const processosLivres = produto.processos
    .map((v) => v.processo)
    .filter((p) => p.ativo);

  return {
    personalizavel: produto.personalizavel,
    fulfillment_padrao: produto.fulfillment_padrao,
    modos_habilitados: produto.modos.map((m) => m.modo),
    estampas_permitidas: estampasPermitidas,
    processos_livres_permitidos: processosLivres,
  };
}
