import type { ExpedicaoCardKanban } from './expedicao.types';

export interface EstiloCardExpedicao {
  cardClass: string;
  dragRingClass: string;
  alerta?: { texto: string; classe: string };
  badgeRetrabalho?: boolean;
}

function prazoVencido(dataPrazo: string | null | undefined): boolean {
  if (!dataPrazo) return false;
  const prazo = new Date(dataPrazo);
  if (Number.isNaN(prazo.getTime())) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  prazo.setHours(0, 0, 0, 0);
  return prazo < hoje;
}

export function obterEstiloCardExpedicao(
  card: Pick<
    ExpedicaoCardKanban,
    'retrabalho' | 'bloqueado_financeiro' | 'data_prazo'
  >,
): EstiloCardExpedicao {
  if (card.retrabalho) {
    return {
      cardClass:
        'border border-fuchsia-300 bg-fuchsia-50/50 hover:border-fuchsia-400 hover:shadow-md',
      dragRingClass: 'ring-fuchsia-200',
      badgeRetrabalho: true,
      alerta: card.bloqueado_financeiro
        ? {
            texto: 'Bloqueio financeiro',
            classe: 'text-amber-700',
          }
        : undefined,
    };
  }

  if (card.bloqueado_financeiro) {
    return {
      cardClass:
        'border border-amber-300 bg-amber-50/50 hover:border-amber-400 hover:shadow-md',
      dragRingClass: 'ring-amber-200',
      alerta: {
        texto: 'Entrega bloqueada — pendência financeira',
        classe: 'text-amber-800',
      },
    };
  }

  if (prazoVencido(card.data_prazo)) {
    return {
      cardClass:
        'border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md',
      dragRingClass: 'ring-blue-200',
      alerta: {
        texto: 'Prazo vencido',
        classe: 'text-red-600',
      },
    };
  }

  return {
    cardClass:
      'border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md',
    dragRingClass: 'ring-blue-200',
  };
}
