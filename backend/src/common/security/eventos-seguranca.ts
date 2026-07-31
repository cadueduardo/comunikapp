import { Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

/**
 * Gate 0S / HS-06 — evento de segurança em formato estável e sanitizado.
 *
 * Por que existe: as negações do sistema estavam espalhadas em mensagens de
 * texto livre, cada uma com um formato. Não dá para contar `429` por minuto nem
 * alertar sobre um pico de token recusado se cada ponto escreve a frase que
 * quiser. Aqui todo evento sai com o mesmo prefixo e o mesmo conjunto de
 * campos, então um agregador consegue transformar linha de log em métrica sem
 * parser específico por caso.
 *
 * O projeto **não** tem backend de métricas (nem Prometheus, nem Sentry, nem
 * OpenTelemetry). Este módulo é o substrato para quando houver: enquanto não
 * existe, o mesmo formato serve para `grep` e para alerta baseado em log.
 */

const logger = new Logger('SegurancaVendas');

/** Prefixo único de todos os eventos, para filtro no agregador. */
export const PREFIXO_EVENTO_SEGURANCA = 'SEC_EVT';

export type TipoEventoSeguranca =
  /** Requisição barrada por rate limit. */
  | 'RATE_LIMIT'
  /** Código de aprovação inválido, expirado, revogado ou acima do teto. */
  | 'TOKEN_RECUSADO'
  /** Ação chegou fora do estado que a aceitava; nada foi aplicado. */
  | 'CONFLITO_IDEMPOTENCIA'
  /** Efeito obrigatório pós-commit falhou e o aceite foi revertido. */
  | 'FALHA_HANDOFF'
  /** Autorização negada para usuário autenticado. */
  | 'AUTORIZACAO_NEGADA';

/**
 * Sal do processo. Um hash de IP sem sal é reversível por força bruta — o
 * espaço IPv4 inteiro cabe em minutos de CPU —, então o pseudônimo só protege
 * se o sal for secreto. Sendo gerado por processo, a correlação vale dentro da
 * vida do processo e some no restart, que é o compromisso aceito para não
 * guardar segredo persistente só para isto.
 */
const SAL_DO_PROCESSO = randomBytes(16);

/**
 * Converte um identificador de rede em pseudônimo curto e estável.
 *
 * HS-06 proíbe IP bruto em log. O pseudônimo permite responder "quantas
 * origens distintas" e "é sempre a mesma origem" sem registrar o endereço.
 */
export function pseudonimizar(valor: string): string {
  return createHash('sha256')
    .update(SAL_DO_PROCESSO)
    .update(valor)
    .digest('hex')
    .slice(0, 12);
}

export interface EventoSeguranca {
  readonly tipo: TipoEventoSeguranca;
  /** Rota lógica, sem identificadores embutidos. */
  readonly rota?: string;
  /** ID do recurso alvo. Não é dado pessoal e é necessário para correlação. */
  readonly recursoId?: string;
  /** Origem já pseudonimizada. Nunca o IP. */
  readonly origem?: string;
  /** Motivo curto e enumerável. Nunca texto livre do usuário. */
  readonly motivo?: string;
}

/**
 * Emite o evento.
 *
 * Só aceita os campos declarados acima: não há caminho para passar corpo da
 * requisição, cabeçalho, token ou e-mail. Quem precisar de um campo novo
 * precisa declará-lo aqui e pensar na cardinalidade antes.
 */
export function registrarEventoDeSeguranca(evento: EventoSeguranca): void {
  const partes = [
    PREFIXO_EVENTO_SEGURANCA,
    `tipo=${evento.tipo}`,
    evento.rota ? `rota=${evento.rota}` : null,
    evento.recursoId ? `recurso=${evento.recursoId}` : null,
    evento.origem ? `origem=${evento.origem}` : null,
    evento.motivo ? `motivo=${evento.motivo}` : null,
  ].filter(Boolean);

  logger.warn(partes.join(' '));
}
