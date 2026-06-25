/**
 * Funções puras do PCP progressivo — testáveis via
 * `frontend/scripts/validar-pcp.mjs` (sem Jest no frontend).
 */

export type NivelGargalo = 'BAIXO' | 'MEDIO' | 'ALTO';

export type PrazoBucketKanban =
  | 'atrasados'
  | 'vence_hoje'
  | 'esta_semana'
  | 'sem_prazo';

export interface FiltrosKanbanSetoresInput {
  operadorId?: string;
  prioridade?: string;
  prazoBucket?: PrazoBucketKanban | '';
  dataInicial?: string;
  dataFinal?: string;
}

export interface ColunaGargaloInput {
  setor_id: string;
  titulo: string;
  score_gargalo: number;
  nivel_gargalo: NivelGargalo;
  pendentes: number;
  pausadas: number;
  atrasadas: number;
}

export interface CardAtencaoInput {
  id: string;
  os_id?: string;
  status: string;
  data_prazo?: string;
  alertas?: string[];
}

export type FiltroStatusFila = 'TODOS' | 'PENDENTE' | 'EM_ANDAMENTO' | 'PAUSADA';

export function calcularScoreGargalo({
  pendentes,
  pausadas,
  atrasadas,
}: {
  pendentes: number;
  pausadas: number;
  atrasadas: number;
}): number {
  return pendentes * 1 + pausadas * 2 + atrasadas * 3;
}

export function classificarNivelGargalo(score: number): NivelGargalo {
  if (score >= 10) return 'ALTO';
  if (score >= 4) return 'MEDIO';
  return 'BAIXO';
}

export function montarTopGargalos<T extends ColunaGargaloInput>(
  colunas: T[],
  limite = 3,
): T[] {
  return colunas
    .filter((coluna) => coluna.score_gargalo > 0)
    .sort((a, b) => b.score_gargalo - a.score_gargalo)
    .slice(0, limite);
}

export function cardTemRetrabalho(card: {
  retrabalho?: boolean;
  alertas?: string[];
}): boolean {
  return Boolean(card.retrabalho) || card.alertas?.includes('retrabalho') === true;
}

export function montarQueryKanbanPorSetores(
  filtros: FiltrosKanbanSetoresInput,
): string {
  const search = new URLSearchParams();
  if (filtros.operadorId) search.set('operadorId', filtros.operadorId);
  if (filtros.prioridade) search.set('prioridade', filtros.prioridade);
  if (filtros.prazoBucket) search.set('prazoBucket', filtros.prazoBucket);
  if (filtros.dataInicial) search.set('dataInicial', filtros.dataInicial);
  if (filtros.dataFinal) search.set('dataFinal', filtros.dataFinal);
  return search.toString();
}

export function filtrarFilaPorStatus<T extends { status: string }>(
  fila: T[],
  filtro: FiltroStatusFila,
): T[] {
  if (filtro === 'TODOS') return fila;
  return fila.filter((item) => item.status === filtro);
}

export function selecionarCardsAtencao<T extends CardAtencaoInput>(
  cards: T[],
  limite = 6,
  referencia = new Date(),
): T[] {
  const hoje = new Date(referencia);
  hoje.setHours(0, 0, 0, 0);

  return cards
    .filter((card) => {
      const temAlerta =
        Array.isArray(card.alertas) && card.alertas.length > 0;
      const prazo = card.data_prazo ? new Date(card.data_prazo) : null;
      const atrasado =
        !!prazo && prazo < hoje && card.status !== 'CONCLUIDA';
      return temAlerta || atrasado || !card.data_prazo;
    })
    .slice(0, limite);
}

/** Regra UX: marcar um setor com "Todas" ativo vira seleção única (opt-in). */
export function alternarSetoresVisiveis(
  setoresVisiveis: string[],
  setorId: string,
): string[] {
  const todosAtivos = setoresVisiveis.length === 0;

  if (todosAtivos) {
    return [setorId];
  }

  const proximo = setoresVisiveis.includes(setorId)
    ? setoresVisiveis.filter((id) => id !== setorId)
    : [...setoresVisiveis, setorId];

  if (proximo.length === 0) {
    return [];
  }

  return proximo;
}

export function resumoSelecaoSetores(
  setoresVisiveis: string[],
  totalSetores: number,
): string {
  if (setoresVisiveis.length === 0) {
    return `todos (${totalSetores})`;
  }
  return `${setoresVisiveis.length} de ${totalSetores}`;
}

export function nivelGargaloClassName(nivel: NivelGargalo): string {
  const classes: Record<NivelGargalo, string> = {
    BAIXO: 'border-emerald-200 text-emerald-700',
    MEDIO: 'border-amber-200 text-amber-700',
    ALTO: 'border-red-200 text-red-700',
  };
  return classes[nivel];
}

export interface CardKanbanPendenciaInput {
  tem_workflow?: boolean;
  alertas?: string[];
}

/** OS na fila do PCP que ainda precisa de workflow antes de iniciar produção. */
export function cardPrecisaAtribuirWorkflow(
  card: CardKanbanPendenciaInput,
): boolean {
  if (card.tem_workflow === false) {
    return true;
  }

  return card.alertas?.includes('sem_workflow') ?? false;
}

/** Workflow atribuído, mas o template não gerou filas nos setores produtivos. */
export function cardSemSetoresProdutivos(
  card: CardKanbanPendenciaInput,
): boolean {
  return card.alertas?.includes('workflow_sem_setores') ?? false;
}
