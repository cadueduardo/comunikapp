import {
  ResponsabilidadeArte,
  StatusArte,
} from '../constants/arte.enums';

export interface StatusArteInicialResult {
  status_arte: StatusArte;
  arte_fila_desde: Date | null;
}

/**
 * Define status inicial de arte ao propagar ProdutoOrcamento → ItemOS.
 */
export function resolverStatusArteInicial(
  responsabilidade: string | null | undefined,
): StatusArteInicialResult {
  const resp = (responsabilidade ||
    ResponsabilidadeArte.NAO_APLICAVEL) as ResponsabilidadeArte;

  if (
    resp === ResponsabilidadeArte.EMPRESA_CRIA ||
    resp === ResponsabilidadeArte.EMPRESA_ADAPTA
  ) {
    return {
      status_arte: StatusArte.AGUARDANDO_INICIO,
      arte_fila_desde: new Date(),
    };
  }

  if (resp === ResponsabilidadeArte.CLIENTE_FORNECE) {
    return {
      status_arte: StatusArte.AGUARDANDO_ARQUIVO_CLIENTE,
      arte_fila_desde: null,
    };
  }

  return {
    status_arte: StatusArte.NAO_APLICA,
    arte_fila_desde: null,
  };
}

export function arteRequerTrabalhoInterno(
  responsabilidade: string | null | undefined,
): boolean {
  return (
    responsabilidade === ResponsabilidadeArte.EMPRESA_CRIA ||
    responsabilidade === ResponsabilidadeArte.EMPRESA_ADAPTA
  );
}
