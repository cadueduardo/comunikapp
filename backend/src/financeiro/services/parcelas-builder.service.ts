import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CondicaoPagamentoTipo,
  TIPOS_VENCIMENTO_AUTOMATICO,
} from '../enums/condicao-pagamento-tipo.enum';
import { ParcelaStatus, ParcelaTipo } from '../enums/cobranca-status.enum';
import { CobrancaVencimentoService } from './cobranca-vencimento.service';

export interface ParcelaParaCriar {
  ordem: number;
  tipo: ParcelaTipo;
  valor_previsto: number;
  data_vencimento: Date;
  status: ParcelaStatus;
}

export interface ConstruirParcelasParams {
  tipo: CondicaoPagamentoTipo | string;
  entradaPct: number | null;
  parcelas: number | null;
  valorTotal: number;
  dataAprovacao: Date;
  prazoEntregaDias: number;
  /**
   * Para PERSONALIZADO, o caller deve passar as parcelas pre-montadas.
   * Para os demais tipos, este parametro e ignorado.
   */
  parcelasManuais?: ParcelaParaCriar[];
}

/**
 * Constroi a lista de parcelas para uma cobranca conforme o tipo de
 * condicao de pagamento. Centraliza a regra de produto em um unico lugar
 * para que a UI, o motor de geracao automatica e a tela de edicao
 * compartilhem o mesmo comportamento.
 */
@Injectable()
export class ParcelasBuilderService {
  constructor(private readonly vencimentoService: CobrancaVencimentoService) {}

  construir(params: ConstruirParcelasParams): ParcelaParaCriar[] {
    const tipo = params.tipo as CondicaoPagamentoTipo;
    if (params.valorTotal <= 0) {
      throw new BadRequestException('valor_total deve ser maior que zero');
    }

    switch (tipo) {
      case CondicaoPagamentoTipo.A_VISTA:
        return this.construirAVista(params);
      case CondicaoPagamentoTipo.ENTRADA_SALDO:
        return this.construirEntradaSaldo(params);
      case CondicaoPagamentoTipo.FATURADO_30:
        return this.construirFaturado(params, 30);
      case CondicaoPagamentoTipo.FATURADO_60:
        return this.construirFaturado(params, 60);
      case CondicaoPagamentoTipo.FATURADO_90:
        return this.construirFaturado(params, 90);
      case CondicaoPagamentoTipo.PARCELADO:
        return this.construirParcelado(params);
      case CondicaoPagamentoTipo.PERSONALIZADO:
        return this.validarPersonalizado(params);
      default:
        throw new BadRequestException(
          `Tipo de condicao de pagamento invalido: ${tipo}`,
        );
    }
  }

  private construirAVista(params: ConstruirParcelasParams): ParcelaParaCriar[] {
    return [
      {
        ordem: 1,
        tipo: ParcelaTipo.SALDO,
        valor_previsto: this.arredondar(params.valorTotal),
        data_vencimento: params.dataAprovacao,
        status: ParcelaStatus.PREVISTO,
      },
    ];
  }

  private construirEntradaSaldo(
    params: ConstruirParcelasParams,
  ): ParcelaParaCriar[] {
    const pct = params.entradaPct ?? 50;
    if (pct <= 0 || pct >= 100) {
      throw new BadRequestException(
        'percentual_entrada deve estar entre 1 e 99 para ENTRADA_SALDO',
      );
    }
    const valorEntrada = this.arredondar((params.valorTotal * pct) / 100);
    const valorSaldo = this.arredondar(params.valorTotal - valorEntrada);
    return [
      {
        ordem: 1,
        tipo: ParcelaTipo.ENTRADA,
        valor_previsto: valorEntrada,
        data_vencimento: params.dataAprovacao,
        status: ParcelaStatus.PREVISTO,
      },
      {
        ordem: 2,
        tipo: ParcelaTipo.SALDO,
        valor_previsto: valorSaldo,
        data_vencimento: this.vencimentoService.vencimentoFaturado(
          params.dataAprovacao,
          params.prazoEntregaDias,
        ),
        status: ParcelaStatus.PREVISTO,
      },
    ];
  }

  private construirFaturado(
    params: ConstruirParcelasParams,
    dias: number,
  ): ParcelaParaCriar[] {
    return [
      {
        ordem: 1,
        tipo: ParcelaTipo.SALDO,
        valor_previsto: this.arredondar(params.valorTotal),
        data_vencimento: this.vencimentoService.vencimentoFaturado(
          params.dataAprovacao,
          dias,
        ),
        status: ParcelaStatus.PREVISTO,
      },
    ];
  }

  private construirParcelado(
    params: ConstruirParcelasParams,
  ): ParcelaParaCriar[] {
    const numeroParcelas = params.parcelas ?? 0;
    if (numeroParcelas < 2) {
      throw new BadRequestException(
        'PARCELADO requer condicao_pagamento_parcelas >= 2',
      );
    }
    if (numeroParcelas > 36) {
      throw new BadRequestException('PARCELADO suporta no maximo 36 parcelas');
    }

    const valorParcelaBase = this.arredondar(
      params.valorTotal / numeroParcelas,
    );
    const parcelas: ParcelaParaCriar[] = [];
    let valorAcumulado = 0;
    for (let i = 1; i <= numeroParcelas; i++) {
      // Ultima parcela ajusta o residuo de arredondamento.
      const valor =
        i === numeroParcelas
          ? this.arredondar(params.valorTotal - valorAcumulado)
          : valorParcelaBase;
      valorAcumulado = this.arredondar(valorAcumulado + valor);
      parcelas.push({
        ordem: i,
        tipo: ParcelaTipo.PARCELA,
        valor_previsto: valor,
        data_vencimento: this.vencimentoService.vencimentoParcela(
          params.dataAprovacao,
          i,
        ),
        status: ParcelaStatus.PREVISTO,
      });
    }
    return parcelas;
  }

  private validarPersonalizado(
    params: ConstruirParcelasParams,
  ): ParcelaParaCriar[] {
    const manuais = params.parcelasManuais ?? [];
    if (manuais.length === 0) {
      throw new BadRequestException(
        'PERSONALIZADO requer pelo menos uma parcela em parcelasManuais',
      );
    }
    const somaParcelas = manuais.reduce((acc, p) => acc + p.valor_previsto, 0);
    if (Math.abs(somaParcelas - params.valorTotal) > 0.02) {
      throw new BadRequestException(
        `Soma das parcelas (R$ ${this.formatarMoeda(somaParcelas)}) deve ser igual ao valor_total (R$ ${this.formatarMoeda(params.valorTotal)})`,
      );
    }
    return manuais
      .map((p, idx) => ({
        ordem: p.ordem ?? idx + 1,
        tipo: p.tipo ?? ParcelaTipo.PARCELA,
        valor_previsto: this.arredondar(p.valor_previsto),
        data_vencimento: p.data_vencimento,
        status: ParcelaStatus.PREVISTO,
      }))
      .sort((a, b) => a.ordem - b.ordem);
  }

  /**
   * Gera descricao livre da condicao de pagamento, usada quando o usuario
   * nao informou uma descricao customizada. Exibida no orcamento, na OS,
   * no email do cliente e na tela de auditoria.
   */
  gerarDescricao(params: {
    tipo: CondicaoPagamentoTipo | string;
    entradaPct: number | null;
    parcelas: number | null;
  }): string {
    const tipo = params.tipo as CondicaoPagamentoTipo;
    switch (tipo) {
      case CondicaoPagamentoTipo.A_VISTA:
        return 'Pagamento à vista na aprovação';
      case CondicaoPagamentoTipo.ENTRADA_SALDO: {
        const pct = params.entradaPct ?? 50;
        return `${pct.toFixed(0)}% de entrada e ${(100 - pct).toFixed(0)}% no saldo (entrega)`;
      }
      case CondicaoPagamentoTipo.FATURADO_30:
        return 'Faturado 30 dias após aprovação';
      case CondicaoPagamentoTipo.FATURADO_60:
        return 'Faturado 60 dias após aprovação';
      case CondicaoPagamentoTipo.FATURADO_90:
        return 'Faturado 90 dias após aprovação';
      case CondicaoPagamentoTipo.PARCELADO:
        return `Parcelado em ${params.parcelas ?? 2}x sem juros`;
      case CondicaoPagamentoTipo.PERSONALIZADO:
        return 'Condição personalizada';
      default:
        return 'Condição não especificada';
    }
  }

  /**
   * Confere se o tipo aceita calculo automatico de vencimento.
   * PARCELADO tem vencimentos automaticos calculados mas nao depende do prazo_entrega.
   * PERSONALIZADO precisa de parcelasManuais.
   */
  vencimentoEhAutomatico(tipo: string): boolean {
    return TIPOS_VENCIMENTO_AUTOMATICO.has(tipo);
  }

  private arredondar(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  private formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
