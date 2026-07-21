import { Prisma } from '@prisma/client';
import { TIPO_VINCULO_OS_ADITIVA_INSTALACAO } from '../../os/utils/os-pular-fluxo.util';

/**
 * OS Aditiva de instalação e registros com `pular_pcp` não entram no fluxo PCP.
 * Relação operacional: instalação → OS/financeiro, sem produção.
 *
 * IMPORTANTE (MySQL/Prisma): `NOT: { tipo_vinculo_os: 'X' }` **exclui NULLs**
 * (SQL: `NOT (col = 'X')` é UNKNOWN quando col IS NULL). Quase todas as OS
 * comerciais têm `tipo_vinculo_os = null` e sumiam do Kanban PCP / home.
 * Por isso a exclusão da aditiva usa OR explícito incluindo NULL.
 */
export const filtroOsElegivelFluxoPcp: Prisma.OrdemServicoWhereInput = {
  pular_pcp: { not: true },
  OR: [
    { tipo_vinculo_os: null },
    { tipo_vinculo_os: { not: TIPO_VINCULO_OS_ADITIVA_INSTALACAO } },
  ],
};

export function mesclarFiltroOsElegivelPcp(
  where: Prisma.OrdemServicoWhereInput,
): Prisma.OrdemServicoWhereInput {
  return {
    AND: [where, filtroOsElegivelFluxoPcp],
  };
}
