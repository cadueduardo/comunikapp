/**
 * Motivos oficiais para forçar aprovação técnica com OS ainda
 * retida em AGUARDANDO_APROVACAO_FINANCEIRA (entrada não liquidada).
 */
export enum MotivoForcarLiberacaoFinanceira {
  CLIENTE_RECORRENTE = 'CLIENTE_RECORRENTE',
  ACORDO_COMERCIAL = 'ACORDO_COMERCIAL',
  URGENCIA_PRAZO = 'URGENCIA_PRAZO',
  PAGAMENTO_COMPROVADO_FORA_SISTEMA = 'PAGAMENTO_COMPROVADO_FORA_SISTEMA',
  AUTORIZACAO_GERENCIAL = 'AUTORIZACAO_GERENCIAL',
  OUTRO = 'OUTRO',
}

export const MOTIVOS_FORCAR_LIBERACAO_FINANCEIRA = Object.values(
  MotivoForcarLiberacaoFinanceira,
);

export const LABEL_MOTIVO_FORCAR_LIBERACAO_FINANCEIRA: Record<
  MotivoForcarLiberacaoFinanceira,
  string
> = {
  [MotivoForcarLiberacaoFinanceira.CLIENTE_RECORRENTE]: 'Cliente recorrente',
  [MotivoForcarLiberacaoFinanceira.ACORDO_COMERCIAL]: 'Acordo comercial',
  [MotivoForcarLiberacaoFinanceira.URGENCIA_PRAZO]: 'Urgência de prazo',
  [MotivoForcarLiberacaoFinanceira.PAGAMENTO_COMPROVADO_FORA_SISTEMA]:
    'Pagamento comprovado fora do sistema',
  [MotivoForcarLiberacaoFinanceira.AUTORIZACAO_GERENCIAL]:
    'Autorização gerencial',
  [MotivoForcarLiberacaoFinanceira.OUTRO]: 'Outro (descrever)',
};

export const TIPO_LOG_APROVACAO_TECNICA_FORCADA_FINANCEIRO =
  'APROVACAO_TECNICA_FORCADA_FINANCEIRO';

/** Funções que podem forçar liberação financeira na aprovação técnica. */
export const FUNCOES_PODEM_FORCAR_LIBERACAO_FINANCEIRA = [
  'ADMINISTRADOR',
  'FINANCEIRO',
] as const;

export function validarPayloadForcarLiberacaoFinanceira(params: {
  forcar?: boolean;
  motivo?: string | null;
  detalhe?: string | null;
}): { ok: true; motivo: MotivoForcarLiberacaoFinanceira; detalhe: string | null } | { ok: false; erro: string } {
  if (!params.forcar) {
    return {
      ok: false,
      erro:
        'Esta Ordem de Serviço está retida no financeiro. Informe forcar_liberacao_financeira com motivo para aprovar mesmo assim.',
    };
  }

  if (
    !params.motivo ||
    !MOTIVOS_FORCAR_LIBERACAO_FINANCEIRA.includes(
      params.motivo as MotivoForcarLiberacaoFinanceira,
    )
  ) {
    return {
      ok: false,
      erro: 'Selecione um motivo válido para forçar a liberação financeira.',
    };
  }

  const motivo = params.motivo as MotivoForcarLiberacaoFinanceira;
  const detalhe = (params.detalhe || '').trim();

  if (motivo === MotivoForcarLiberacaoFinanceira.OUTRO && detalhe.length < 10) {
    return {
      ok: false,
      erro:
        'Descreva o motivo (mínimo 10 caracteres) ao escolher "Outro".',
    };
  }

  return { ok: true, motivo, detalhe: detalhe || null };
}

export function montarObsForcarLiberacaoFinanceira(
  motivo: MotivoForcarLiberacaoFinanceira,
  detalhe: string | null,
  observacoes?: string | null,
): string {
  const label = LABEL_MOTIVO_FORCAR_LIBERACAO_FINANCEIRA[motivo];
  const partes = [
    `[FORÇADO — pendência financeira] Motivo: ${label}`,
  ];
  if (detalhe) {
    partes.push(`Detalhe: ${detalhe}`);
  }
  if (observacoes?.trim()) {
    partes.push(observacoes.trim());
  }
  return partes.join(' | ');
}
