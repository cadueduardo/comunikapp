import {
  StatusFinanceiroOcorrencia,
  StatusInstalacao,
  StatusInstalacaoOs,
} from '@prisma/client';

export interface LoteAtencaoInput {
  status_instalacao: StatusInstalacao;
  assinatura_url?: string | null;
  atualizado_em?: Date | null;
}

export interface OcorrenciaAtencaoInput {
  status_financeiro: StatusFinanceiroOcorrencia;
  criado_em: Date;
}

export interface AtencaoInstalacaoOs {
  requer_atencao: boolean;
  ultima_atividade_em: string | null;
  motivos: string[];
}

export function calcularAtencaoInstalacaoOs(params: {
  statusInstalacaoOs: StatusInstalacaoOs | null;
  relatorioEmitido: boolean;
  lotes: LoteAtencaoInput[];
  ocorrencias: OcorrenciaAtencaoInput[];
}): AtencaoInstalacaoOs {
  const motivos: string[] = [];
  let ultimaMs = 0;

  const registrarAtividade = (data?: Date | null) => {
    if (!data) return;
    ultimaMs = Math.max(ultimaMs, data.getTime());
  };

  if (
    params.statusInstalacaoOs ===
      StatusInstalacaoOs.AGUARDANDO_RELATORIO_TECNICO &&
    !params.relatorioEmitido
  ) {
    motivos.push('relatorio_pendente');
  }

  if (params.statusInstalacaoOs === StatusInstalacaoOs.EM_ANDAMENTO) {
    motivos.push('em_andamento');
  }

  for (const occ of params.ocorrencias) {
    registrarAtividade(occ.criado_em);
    if (
      occ.status_financeiro === StatusFinanceiroOcorrencia.PENDENTE_PRECIFICACAO
    ) {
      motivos.push('precificacao_pendente');
    }
  }

  for (const lote of params.lotes) {
    registrarAtividade(lote.atualizado_em);
    const aguardaCampo =
      (lote.status_instalacao === StatusInstalacao.EM_ANDAMENTO ||
        lote.status_instalacao === StatusInstalacao.AGUARDANDO) &&
      !lote.assinatura_url;
    if (aguardaCampo) {
      motivos.push('campo_pendente');
    }
  }

  const motivosUnicos = [...new Set(motivos)];

  return {
    requer_atencao: motivosUnicos.length > 0,
    ultima_atividade_em:
      ultimaMs > 0 ? new Date(ultimaMs).toISOString() : null,
    motivos: motivosUnicos,
  };
}

export function compararPrioridadeAtencaoInstalacao(
  a: { requer_atencao: boolean; ultima_atividade_em: string | null },
  b: { requer_atencao: boolean; ultima_atividade_em: string | null },
): number {
  if (a.requer_atencao !== b.requer_atencao) {
    return a.requer_atencao ? -1 : 1;
  }
  const ta = a.ultima_atividade_em
    ? new Date(a.ultima_atividade_em).getTime()
    : 0;
  const tb = b.ultima_atividade_em
    ? new Date(b.ultima_atividade_em).getTime()
    : 0;
  return tb - ta;
}
