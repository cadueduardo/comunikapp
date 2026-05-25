import { Injectable } from '@nestjs/common';
import {
  CobrancaStatus,
  ParcelaStatus,
} from '../enums/cobranca-status.enum';

export interface ParcelaParaRollup {
  status: string;
  valor_previsto: number;
  valor_recebido: number;
  data_vencimento: Date;
}

/**
 * Calcula o status agregado de uma cobranca a partir das suas parcelas.
 *
 * Regras (em ordem de precedencia):
 * 1. Todas CANCELADA -> cobranca CANCELADA.
 * 2. Alguma VENCIDO -> cobranca VENCIDO (precedencia alta sobre PARCIAL_PAGO).
 * 3. Todas LIQUIDADO (ignorando CANCELADA) -> cobranca LIQUIDADO.
 * 4. Alguma PARCIAL_PAGO ou alguma LIQUIDADO + alguma PREVISTO -> cobranca PARCIAL_PAGO.
 * 5. Caso contrario -> cobranca PREVISTA.
 *
 * Recalcular tambem o status individual de parcelas: se `data_vencimento`
 * passou e a parcela esta PREVISTO/PARCIAL_PAGO, recategoriza como VENCIDO.
 * Isso e' chamado tanto pelo job @Cron quanto pela leitura sob demanda.
 */
@Injectable()
export class StatusRollupService {
  /**
   * Aplica regra "venceu? entao VENCIDO" nas parcelas em aberto.
   * Modifica copia local; NAO grava no banco (caller faz se necessario).
   */
  recategorizarVencidas(
    parcelas: ParcelaParaRollup[],
    agora: Date = new Date(),
  ): ParcelaParaRollup[] {
    return parcelas.map((p) => {
      if (
        (p.status === ParcelaStatus.PREVISTO ||
          p.status === ParcelaStatus.PARCIAL_PAGO) &&
        p.data_vencimento.getTime() < agora.getTime()
      ) {
        return { ...p, status: ParcelaStatus.VENCIDO };
      }
      return p;
    });
  }

  calcularStatusCobranca(parcelas: ParcelaParaRollup[]): string {
    if (parcelas.length === 0) return CobrancaStatus.PREVISTA;

    const naoCanceladas = parcelas.filter(
      (p) => p.status !== ParcelaStatus.CANCELADA,
    );
    if (naoCanceladas.length === 0) return CobrancaStatus.CANCELADA;

    const algumaVencida = naoCanceladas.some(
      (p) => p.status === ParcelaStatus.VENCIDO,
    );
    if (algumaVencida) return CobrancaStatus.VENCIDO;

    const todasLiquidadas = naoCanceladas.every(
      (p) => p.status === ParcelaStatus.LIQUIDADO,
    );
    if (todasLiquidadas) return CobrancaStatus.LIQUIDADO;

    const algumComMovimento = naoCanceladas.some(
      (p) =>
        p.status === ParcelaStatus.PARCIAL_PAGO ||
        p.status === ParcelaStatus.LIQUIDADO,
    );
    if (algumComMovimento) return CobrancaStatus.PARCIAL_PAGO;

    return CobrancaStatus.PREVISTA;
  }

  /**
   * Calcula valor_recebido e valor_saldo total da cobranca a partir das parcelas.
   */
  calcularTotais(parcelas: ParcelaParaRollup[]): {
    valor_total: number;
    valor_recebido: number;
    valor_saldo: number;
  } {
    let total = 0;
    let recebido = 0;
    for (const p of parcelas) {
      if (p.status !== ParcelaStatus.CANCELADA) {
        total += Number(p.valor_previsto);
        recebido += Number(p.valor_recebido);
      }
    }
    return {
      valor_total: this.arredondar(total),
      valor_recebido: this.arredondar(recebido),
      valor_saldo: this.arredondar(total - recebido),
    };
  }

  private arredondar(valor: number): number {
    return Math.round(valor * 100) / 100;
  }
}
