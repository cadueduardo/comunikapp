import { Logger } from '@nestjs/common';
import { PREFIXO_EVENTO_SEGURANCA } from '../eventos-seguranca';

/**
 * Gate 0S / HS-06 — captura das linhas realmente emitidas.
 *
 * Existe para que a comprovação dos eventos seja feita sobre o texto final que
 * vai para o log, e não sobre o argumento passado à função de registro.
 * Inspecionar o argumento provaria apenas que o chamador tinha boa intenção; o
 * que precisa ser verificado é o que um operador enxerga no arquivo.
 *
 * Não é `.spec.ts` de propósito: o `testRegex` do projeto só coleta
 * `*.spec.ts`, então este módulo pode ser importado por vários testes sem virar
 * uma suíte vazia.
 */

export interface EventoCapturado {
  readonly linha: string;
  readonly tipo?: string;
  readonly rota?: string;
  readonly recurso?: string;
  readonly origem?: string;
  readonly motivo?: string;
}

function interpretar(linha: string): EventoCapturado {
  const campos: Record<string, string> = {};

  for (const parte of linha.split(' ').slice(1)) {
    const separador = parte.indexOf('=');
    if (separador > 0) {
      campos[parte.slice(0, separador)] = parte.slice(separador + 1);
    }
  }

  return {
    linha,
    tipo: campos.tipo,
    rota: campos.rota,
    recurso: campos.recurso,
    origem: campos.origem,
    motivo: campos.motivo,
  };
}

export interface CapturaDeEventos {
  /** Eventos emitidos desde a instalação da captura, em ordem. */
  eventos: () => EventoCapturado[];
  /** Descarta o que foi capturado até aqui, mantendo a captura ativa. */
  limpar: () => void;
  restaurar: () => void;
}

/**
 * Intercepta `Logger.warn` e guarda só as linhas de evento de segurança.
 *
 * Avisos comuns da aplicação são deixados passar; suprimir tudo esconderia
 * ruído legítimo de quem estiver depurando o teste.
 */
export function capturarEventosDeSeguranca(): CapturaDeEventos {
  let linhas: string[] = [];
  const original = Logger.prototype.warn;

  const spy = jest
    .spyOn(Logger.prototype, 'warn')
    .mockImplementation(function (this: Logger, ...args: unknown[]) {
      const [mensagem] = args;
      if (
        typeof mensagem === 'string' &&
        mensagem.startsWith(PREFIXO_EVENTO_SEGURANCA)
      ) {
        linhas.push(mensagem);
        return;
      }
      return (original as (...a: unknown[]) => void).apply(this, args);
    } as never);

  return {
    eventos: () => linhas.map(interpretar),
    limpar: () => {
      linhas = [];
    },
    restaurar: () => spy.mockRestore(),
  };
}

/**
 * Padrões que jamais podem aparecer numa linha de evento.
 *
 * A lista é o contrário do resto do contrato: em vez de conferir se os campos
 * esperados estão lá, procura o que não pode estar. É essa direção que pega
 * regressão — um campo novo com dado sensível passa por qualquer asserção
 * escrita em cima dos campos conhecidos.
 */
export const PADROES_PROIBIDOS_EM_EVENTO: ReadonlyArray<
  readonly [string, RegExp]
> = [
  ['e-mail', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/],
  ['IPv4 bruto', /\b\d{1,3}(?:\.\d{1,3}){3}\b/],
  ['IPv6 bruto', /\b(?:[0-9a-fA-F]{0,4}:){2,}[0-9a-fA-F]{0,4}\b/],
  ['código de aprovação', /\bcodigo=|\bcodigo_aprovacao\b/],
  ['token', /\btoken\b/i],
  ['custo ou margem', /\bcusto|\bmargem|\bpreco/i],
  ['authorization', /\bauthorization\b|\bbearer\b/i],
];

/** Devolve `[padrão, linha]` do primeiro achado, ou `null` se estiver limpo. */
export function procurarDadoSensivel(
  eventos: readonly EventoCapturado[],
): [string, string] | null {
  for (const evento of eventos) {
    for (const [nome, padrao] of PADROES_PROIBIDOS_EM_EVENTO) {
      if (padrao.test(evento.linha)) {
        return [nome, evento.linha];
      }
    }
  }
  return null;
}
