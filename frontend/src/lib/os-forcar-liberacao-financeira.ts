/**
 * Motivos para forçar aprovação técnica com OS ainda retida no financeiro.
 * Espelho do backend — manter sincronizado.
 */
export const MOTIVOS_FORCAR_LIBERACAO_FINANCEIRA = [
  {
    valor: 'CLIENTE_RECORRENTE',
    label: 'Cliente recorrente',
  },
  {
    valor: 'ACORDO_COMERCIAL',
    label: 'Acordo comercial',
  },
  {
    valor: 'URGENCIA_PRAZO',
    label: 'Urgência de prazo',
  },
  {
    valor: 'PAGAMENTO_COMPROVADO_FORA_SISTEMA',
    label: 'Pagamento comprovado fora do sistema',
  },
  {
    valor: 'AUTORIZACAO_GERENCIAL',
    label: 'Autorização gerencial',
  },
  {
    valor: 'OUTRO',
    label: 'Outro (descrever)',
  },
] as const;

export type MotivoForcarLiberacaoFinanceiraValor =
  (typeof MOTIVOS_FORCAR_LIBERACAO_FINANCEIRA)[number]['valor'];
