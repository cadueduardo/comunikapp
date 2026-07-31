/**
 * Gate 0S / HS-05 — contratos do caso de uso único de aceite da proposta.
 *
 * Vivem fora do service porque são consumidos também pelo controller (que
 * monta o contexto da requisição) e pelos testes.
 */

/**
 * Canal pelo qual o aceite chegou.
 *
 * Só existe para trilha de auditoria e para escolher o rótulo de origem da OS.
 * **Não** é usado para decidir autorização: quem autoriza o caminho interno é a
 * permissão do usuário, e quem autoriza o público é a posse do código.
 */
export type OrigemDoAceite = 'INTERNO' | 'PUBLICO';

/**
 * Dados de rede da requisição, para auditoria.
 *
 * Preenchidos no controller a partir de `req.ip` — resolvido pela política
 * `trust proxy` do Express — e do cabeçalho `user-agent`. Nunca de query
 * string, corpo ou header escolhido livremente pelo chamador.
 */
export interface ContextoDaRequisicao {
  readonly ip?: string | null;
  readonly userAgent?: string | null;
}

/**
 * Desfecho da parte transacional do aceite.
 *
 * - `APLICADO`: transição, auditoria e efeitos concluídos.
 * - `CORRIDA_PERDIDA`: outra requisição consumiu o mesmo código antes. É o
 *   clique duplo; o aceite dela já está registrado e nada deve ser repetido.
 * - `CONFLITO_DE_ESTADO`: a proposta saiu do estado que aceitava a ação.
 */
export type DesfechoDoAceite =
  | 'APLICADO'
  | 'CORRIDA_PERDIDA'
  | 'CONFLITO_DE_ESTADO';

export interface ResultadoDoAceite {
  readonly desfecho: DesfechoDoAceite;
  readonly osId?: string;
  readonly osNumero?: string;
}

/** Teto do texto livre gravado em `orcamento_logs.descricao`. */
export const AUDITORIA_DESCRICAO_MAX = 500;

/** Tetos defensivos dos campos de rede da auditoria. */
export const AUDITORIA_IP_MAX = 45;
export const AUDITORIA_USER_AGENT_MAX = 255;
