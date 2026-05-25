import { Injectable } from '@nestjs/common';

/**
 * Helpers de calculo de datas para cobrancas.
 *
 * Decisao de produto (2026-05-25): a entrada vence em D+0 da aprovacao;
 * o saldo vence em D + dias parseados do campo `orcamento.prazo_entrega`
 * (texto livre tipo "10 a 15 dias uteis", "30 dias", "2 semanas").
 *
 * Para PARCELADO em N parcelas mensais, a parcela K vence em
 * data_aprovacao + (30 * K) dias.
 */
@Injectable()
export class CobrancaVencimentoService {
  /** Fallback se o prazo_entrega for vazio ou nao parseavel. */
  private readonly PRAZO_DEFAULT_DIAS = 15;

  /** Conversao aproximada de dias uteis -> dias corridos (5d util = 7d corrido). */
  private readonly FATOR_UTIL_CORRIDO = 7 / 5;

  /**
   * Parseia uma descricao livre de prazo em dias corridos.
   *
   * Exemplos aceitos:
   * - "10 a 15 dias uteis"     -> usa o maior (15) e converte: ~21
   * - "30 dias"                -> 30
   * - "2 semanas"              -> 14
   * - "1 mes" / "1 mês"        -> 30
   * - vazio / nao parseavel    -> PRAZO_DEFAULT_DIAS (15)
   */
  parsePrazoEntrega(texto: string | null | undefined): number {
    if (!texto || typeof texto !== 'string') return this.PRAZO_DEFAULT_DIAS;

    const normalizado = texto.toLowerCase().trim();
    if (!normalizado) return this.PRAZO_DEFAULT_DIAS;

    // Extrai todos os numeros do texto.
    const numeros = normalizado.match(/\d+/g);
    if (!numeros || numeros.length === 0) return this.PRAZO_DEFAULT_DIAS;

    // Usa o maior (interpretacao otimista: "10 a 15 dias" -> 15).
    const maior = Math.max(...numeros.map((n) => Number(n)));

    // Detecta unidade.
    if (/semanas?/.test(normalizado)) return maior * 7;
    if (/m[eê]s(es)?/.test(normalizado)) return maior * 30;
    if (/dias?\s*[uú]teis/.test(normalizado)) {
      return Math.ceil(maior * this.FATOR_UTIL_CORRIDO);
    }
    // Default: trata como dias corridos.
    return maior;
  }

  /** Soma dias corridos a uma data e retorna o resultado (preserva hora). */
  somarDias(data: Date, dias: number): Date {
    const resultado = new Date(data.getTime());
    resultado.setDate(resultado.getDate() + dias);
    return resultado;
  }

  /**
   * Calcula a data de vencimento da entrada/saldo conforme o tipo da cobranca.
   *
   * - A_VISTA: tudo em D+0
   * - ENTRADA_SALDO: entrada em D+0, saldo em D + prazoDias
   * - FATURADO_N: tudo em D + N
   * - PARCELADO: parcela K em D + (30 * K)
   * - PERSONALIZADO: nao calcula (caller deve sobrescrever)
   */
  vencimentoFaturado(dataAprovacao: Date, dias: number): Date {
    return this.somarDias(dataAprovacao, dias);
  }

  vencimentoParcela(dataAprovacao: Date, ordem: number): Date {
    return this.somarDias(dataAprovacao, 30 * ordem);
  }
}
