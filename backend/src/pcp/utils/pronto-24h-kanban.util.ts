import { estaDentroDaJanelaUtc } from '../../common/utils/utc-time.util';

export interface OsPronto24hInput {
  id: string;
  status: string;
  atualizado_em: Date;
  workflow_instancia?: {
    status?: string;
    data_fim?: Date | null;
    instancias_setor?: Array<{ data_conclusao?: Date | null }>;
  } | null;
}

/**
 * Instante em que a OS entrou na coluna «Pronto» do PCP.
 * - Com PCP: `workflow_instancia.data_fim`
 * - Sem workflow / finalização manual: `ordem_servicos.atualizado_em`
 */
export function obterInstanteConclusaoPronto(
  os: OsPronto24hInput,
): Date | null {
  const workflow = os.workflow_instancia;

  if (workflow?.data_fim) {
    return workflow.data_fim;
  }

  if (workflow) {
    const datasConclusao = (workflow.instancias_setor ?? [])
      .map((setor) => setor.data_conclusao)
      .filter((data): data is Date => data != null);

    if (datasConclusao.length > 0) {
      const maxMs = Math.max(...datasConclusao.map((d) => d.getTime()));
      return new Date(maxMs);
    }
  }

  if (!workflow && os.status === 'FINALIZADA') {
    return os.atualizado_em;
  }

  if (os.status === 'FINALIZADA') {
    return os.atualizado_em;
  }

  return null;
}

/** Card `CONCLUIDA` visível somente dentro da janela UTC (padrão 24h). */
export function deveExibirCardConcluidoPronto24h(
  os: OsPronto24hInput,
  limiarUtc: Date,
): boolean {
  const referencia = obterInstanteConclusaoPronto(os);
  return estaDentroDaJanelaUtc(referencia, limiarUtc);
}
