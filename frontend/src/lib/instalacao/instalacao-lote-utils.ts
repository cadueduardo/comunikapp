import { chaveDiaPrevisaoAgenda } from './instalacao-calendario.utils';
import { TURNO_PREVISAO_LABEL } from './instalacao-labels';
import type {
  LotePainelOs,
  StatusInstalacao,
  TurnoPrevisaoInstalacao,
} from './instalacao.types';

const STATUS_LOTE_ENCERRADO: StatusInstalacao[] = [
  'CONCLUIDO',
  'LOGISTICA_NEGATIVA',
];

export function loteAguardaConclusaoCampo(
  lote: Pick<LotePainelOs, 'status_instalacao' | 'assinatura_url'>,
): boolean {
  return (
    !STATUS_LOTE_ENCERRADO.includes(lote.status_instalacao) &&
    !lote.assinatura_url
  );
}

export function contarLotesAguardandoConclusaoCampo(
  lotes: Array<Pick<LotePainelOs, 'status_instalacao' | 'assinatura_url'>>,
): number {
  return lotes.filter(loteAguardaConclusaoCampo).length;
}

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

  const chave = chaveDiaPrevisaoAgenda(data);
  const dataFmt = new Date(`${chave}T12:00:00.000Z`).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (turno && TURNO_PREVISAO_LABEL[turno]) {
    return `${dataFmt} · ${TURNO_PREVISAO_LABEL[turno]}`;
  }

  return dataFmt;
}
