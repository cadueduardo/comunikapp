import { Prisma } from '@prisma/client';
import { TIPO_VINCULO_OS_ADITIVA_INSTALACAO } from '../../os/utils/os-pular-fluxo.util';

/**
 * OS Aditiva de instalação e registros com `pular_pcp` não entram no fluxo PCP.
 * Relação operacional: instalação → OS/financeiro, sem produção.
 */
export const filtroOsElegivelFluxoPcp: Prisma.OrdemServicoWhereInput = {
  pular_pcp: { not: true },
  NOT: {
    tipo_vinculo_os: TIPO_VINCULO_OS_ADITIVA_INSTALACAO,
  },
};

export function mesclarFiltroOsElegivelPcp(
  where: Prisma.OrdemServicoWhereInput,
): Prisma.OrdemServicoWhereInput {
  return {
    AND: [where, filtroOsElegivelFluxoPcp],
  };
}
