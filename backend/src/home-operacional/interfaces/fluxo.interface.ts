/**
 * Tipos do agregador de fluxo da Home operacional (Fase 4).
 *
 * Contrato JSON oficial em
 * docs/fase-0-home-operacional/02-contratos-home-operacional.md secao 5.
 *
 * Regras gerais do contrato:
 * - Cada coluna devolve no maximo 5 cards mais recentes; `total` traz o
 *   numero real de itens.
 * - `tipo` distingue a origem do card (orcamento, OS, item de OS, cobranca).
 * - `acoes` e heterogenea: pode ter `href` (navegacao) ou `endpoint` (acao
 *   direta via HTTP).
 * - Bloco e somente leitura + atalho; nao ha drag-and-drop entre colunas.
 */

export type TipoCardFluxo = 'orcamento' | 'os' | 'item_os' | 'cobranca';

export type StatusColunaFluxo = 'ativa' | 'aguardando_modulo';

export interface AcaoCardFluxo {
  /** Identificador estavel da acao (ex.: 'abrir', 'enviar', 'gerar_os'). */
  id: string;
  /** Texto exibido no botao. */
  label: string;
  /**
   * Navegacao via Next.js Router. Quando presente, o front faz `router.push(href)`.
   * Mutuamente exclusivo com `endpoint` na pratica - se ambos vierem, o front
   * prioriza `endpoint` (acao direta).
   */
  href?: string;
  /**
   * Acao direta via HTTP no formato "METODO /caminho" (ex.:
   * "POST /orcamentos-v2/orc_123/enviar"). O front interpreta e dispara.
   */
  endpoint?: string;
}

export interface CardFluxo {
  id: string;
  tipo: TipoCardFluxo;
  titulo: string;
  subtitulo?: string;
  status_label?: string;
  valor?: number;
  atualizado_em: string;
  acoes: AcaoCardFluxo[];
}

export interface ColunaFluxo {
  /** Identificador estavel da coluna (snake_case). */
  id:
    | 'orcamentos'
    | 'aprovados'
    | 'revisao_tecnica'
    | 'producao'
    | 'prontos'
    | 'a_receber'
    | 'concluidos';
  /** Label visivel em pt-BR. */
  label: string;
  /** Contagem total de itens no estagio (independente do limite de 5 cards). */
  total: number;
  /** Maximo de 5 cards mais recentes. */
  cards: CardFluxo[];
  /**
   * Estado da coluna na primeira versao da Fase 4:
   * - `ativa`: agregando dados reais.
   * - `aguardando_modulo`: coluna aparece com `total=0` e `cards=[]` ate o
   *   modulo upstream ficar pronto (ex.: Cobranca na Fase 6).
   */
  status: StatusColunaFluxo;
  /** Aviso opcional quando `status = aguardando_modulo`. */
  aviso?: string;
}

export interface FluxoResponseData {
  colunas: ColunaFluxo[];
}
