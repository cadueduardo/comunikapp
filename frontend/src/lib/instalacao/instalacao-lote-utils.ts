import { TURNO_PREVISAO_LABEL } from './instalacao-labels';
import type { LotePainelOs, TurnoPrevisaoInstalacao } from './instalacao.types';

export function montarEnderecoResumido(
  lote: Pick<LotePainelOs, 'logradouro' | 'numero' | 'bairro' | 'cidade' | 'uf'>,
): string {
  const partes = [
    `${lote.logradouro}, ${lote.numero}`,
    lote.bairro,
    `${lote.cidade}/${lote.uf}`,
  ].filter(Boolean);
  return partes.join(' — ');
}

export function formatarDataPrevisaoLote(
  data: string | null,
  turno?: TurnoPrevisaoInstalacao | null,
): string {
  if (!data) return 'Sem previsão';

  const dataFmt = new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (turno && TURNO_PREVISAO_LABEL[turno]) {
    return `${dataFmt} · ${TURNO_PREVISAO_LABEL[turno]}`;
  }

  return dataFmt;
}
