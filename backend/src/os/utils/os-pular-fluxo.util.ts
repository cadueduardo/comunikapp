/**
 * Flags de bypass de fluxo operacional (OS Aditiva de instalação e similares).
 */
export interface OsFlagsPularFluxo {
  pular_pcp?: boolean | null;
  pular_expedicao?: boolean | null;
  pular_validacao_estoque?: boolean | null;
  tipo_vinculo_os?: string | null;
}

export const TIPO_VINCULO_OS_ADITIVA_INSTALACAO = 'ADITIVA_INSTALACAO';

export function devePularPcp(os: OsFlagsPularFluxo): boolean {
  return (
    os.pular_pcp === true ||
    os.tipo_vinculo_os === TIPO_VINCULO_OS_ADITIVA_INSTALACAO
  );
}

export function devePularExpedicao(os: OsFlagsPularFluxo): boolean {
  return (
    os.pular_expedicao === true ||
    os.tipo_vinculo_os === TIPO_VINCULO_OS_ADITIVA_INSTALACAO
  );
}

export function materiaisDisponiveisParaFluxo(
  os: OsFlagsPularFluxo & { materiais_disponivel?: boolean | null },
): boolean {
  if (os.pular_validacao_estoque === true) {
    return true;
  }
  return Boolean(os.materiais_disponivel);
}
