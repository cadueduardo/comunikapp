import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Serviço de rateio de custos indiretos por setor.
 * Quando há setores configurados, rateia custos por setor.
 * Fallback: rateio global (horas_produtivas_mensais da loja).
 */
@Injectable()
export class RateioCustosIndiretosService {
  private readonly logger = new Logger(RateioCustosIndiretosService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcula custo indireto total usando rateio por setor (quando configurado)
   * ou rateio global (fallback).
   *
   * @param lojaId - ID da loja
   * @param horasPorSetor - Map setor_id -> horas de produção do orçamento
   * @param horasTotais - Total de horas (para fallback global)
   */
  async calcularCustoIndireto(
    lojaId: string,
    horasPorSetor: Map<string, number>,
    horasTotais: number,
  ): Promise<{
    custoIndiretoTotal: number;
    detalhamentoPorSetor: Array<{
      setor_id: string | null;
      setor_nome: string;
      horas: number;
      custo_indireto: number;
      custo_por_hora: number;
    }>;
  }> {
    const custosIndiretos = await this.prisma.custoindireto.findMany({
      where: { loja_id: lojaId, ativo: true },
      include: { setor: true },
    });

    if (custosIndiretos.length === 0) {
      return {
        custoIndiretoTotal: 0,
        detalhamentoPorSetor: [],
      };
    }

    const setoresComHoras = await this.prisma.setorProdutivo.findMany({
      where: { loja_id: lojaId, ativo: true },
    });

    const loja = await this.prisma.loja.findUnique({
      where: { id: lojaId },
      select: { horas_produtivas_mensais: true },
    });

    const horasProdutivasLoja = loja?.horas_produtivas_mensais ?? 352;

    // Fallback: sem setores configurados ou sem horas por setor -> rateio global
    const temSetoresConfigurados =
      setoresComHoras.length > 0 &&
      setoresComHoras.some(
        (s) =>
          s.horas_produtivas_mensais != null ||
          s.percentual_rateio_geral != null,
      );
    const temHorasPorSetor = horasPorSetor.size > 0;

    if (!temSetoresConfigurados || !temHorasPorSetor) {
      return this.calcularRateioGlobal(
        custosIndiretos,
        horasTotais,
        horasProdutivasLoja,
      );
    }

    return this.calcularRateioPorSetor(
      custosIndiretos,
      setoresComHoras,
      horasPorSetor,
      horasProdutivasLoja,
    );
  }

  private calcularRateioGlobal(
    custosIndiretos: any[],
    horasTotais: number,
    horasProdutivasLoja: number,
  ): {
    custoIndiretoTotal: number;
    detalhamentoPorSetor: Array<{
      setor_id: string | null;
      setor_nome: string;
      horas: number;
      custo_indireto: number;
      custo_por_hora: number;
    }>;
  } {
    const totalMensal = custosIndiretos.reduce(
      (acc, c) => acc + Number(c.valor_mensal),
      0,
    );
    const custoPorHora =
      horasProdutivasLoja > 0 ? totalMensal / horasProdutivasLoja : 0;
    const custoIndiretoTotal = custoPorHora * horasTotais;

    return {
      custoIndiretoTotal,
      detalhamentoPorSetor: [
        {
          setor_id: null,
          setor_nome: 'Geral',
          horas: horasTotais,
          custo_indireto: custoIndiretoTotal,
          custo_por_hora: custoPorHora,
        },
      ],
    };
  }

  private calcularRateioPorSetor(
    custosIndiretos: any[],
    setores: any[],
    horasPorSetor: Map<string, number>,
    horasProdutivasLoja: number,
  ): {
    custoIndiretoTotal: number;
    detalhamentoPorSetor: Array<{
      setor_id: string | null;
      setor_nome: string;
      horas: number;
      custo_indireto: number;
      custo_por_hora: number;
    }>;
  } {
    const custosPorSetor = new Map<
      string,
      { valor: number; setor_nome: string }
    >();
    const custosGerais: number[] = [];

    for (const custo of custosIndiretos) {
      const valor = Number(custo.valor_mensal);
      if (custo.setor_id && custo.setor) {
        const atual = custosPorSetor.get(custo.setor_id) || {
          valor: 0,
          setor_nome: custo.setor.nome,
        };
        atual.valor += valor;
        custosPorSetor.set(custo.setor_id, atual);
      } else {
        custosGerais.push(valor);
      }
    }

    const totalCustosGerais = custosGerais.reduce((a, b) => a + b, 0);

    const totalHorasSetores = setores.reduce(
      (acc, s) => acc + (s.horas_produtivas_mensais ?? 0),
      0,
    );

    // Percentual rateio geral: setores com percentual definido recebem essa fatia;
    // o restante é dividido entre setores sem percentual (que aparecem no orçamento), por horas_produtivas_mensais.
    const setorIdsNoOrcamento = new Set(horasPorSetor.keys());
    const somaPercentuaisNoOrcamento = setores
      .filter((s) => setorIdsNoOrcamento.has(s.id))
      .filter(
        (s) =>
          s.percentual_rateio_geral != null &&
          Number(s.percentual_rateio_geral) > 0,
      )
      .reduce((acc, s) => acc + Number(s.percentual_rateio_geral), 0);
    const percentualEfetivo = Math.min(somaPercentuaisNoOrcamento, 100);
    const restanteParaHoras =
      (totalCustosGerais * (100 - percentualEfetivo)) / 100;

    const totalHorasSemPercentual = setores
      .filter((s) => setorIdsNoOrcamento.has(s.id))
      .filter(
        (s) =>
          s.percentual_rateio_geral == null ||
          Number(s.percentual_rateio_geral) <= 0,
      )
      .reduce((acc, s) => acc + (s.horas_produtivas_mensais ?? 0), 0);

    const detalhamentoPorSetor: Array<{
      setor_id: string | null;
      setor_nome: string;
      horas: number;
      custo_indireto: number;
      custo_por_hora: number;
    }> = [];

    let custoIndiretoTotal = 0;

    for (const [setorId, horas] of horasPorSetor) {
      if (horas <= 0) continue;

      const setor = setores.find((s) => s.id === setorId);
      const horasProdutivasSetor = setor?.horas_produtivas_mensais ?? 0;
      const percentualSetor =
        setor?.percentual_rateio_geral != null
          ? Number(setor.percentual_rateio_geral)
          : null;

      const horasProdutivasEfetivas =
        horasProdutivasSetor > 0
          ? horasProdutivasSetor
          : totalHorasSetores > 0
            ? (horas /
                Math.max(
                  1,
                  Array.from(horasPorSetor.values()).reduce((a, b) => a + b, 0),
                )) *
              totalHorasSetores
            : horasProdutivasLoja;

      const custosEspecificos = custosPorSetor.get(setorId)?.valor ?? 0;

      let parteGerais = 0;
      if (totalCustosGerais > 0) {
        if (percentualSetor != null && percentualSetor > 0) {
          parteGerais =
            (totalCustosGerais * Math.min(percentualSetor, 100)) / 100;
        } else if (restanteParaHoras > 0) {
          const divisor =
            totalHorasSemPercentual > 0
              ? totalHorasSemPercentual
              : totalHorasSetores;
          if (divisor > 0 && horasProdutivasSetor > 0) {
            parteGerais = (restanteParaHoras * horasProdutivasSetor) / divisor;
          }
        }
      }

      const custoTotalSetor = custosEspecificos + parteGerais;
      const custoPorHoraSetor =
        horasProdutivasEfetivas > 0
          ? custoTotalSetor / horasProdutivasEfetivas
          : 0;
      const custoIndiretoSetor = custoPorHoraSetor * horas;

      custoIndiretoTotal += custoIndiretoSetor;

      detalhamentoPorSetor.push({
        setor_id: setorId,
        setor_nome:
          setor?.nome ?? custosPorSetor.get(setorId)?.setor_nome ?? 'Setor',
        horas,
        custo_indireto: custoIndiretoSetor,
        custo_por_hora: custoPorHoraSetor,
      });
    }

    return {
      custoIndiretoTotal,
      detalhamentoPorSetor,
    };
  }

  /**
   * Agrupa horas de produção por setor a partir dos produtos.
   * Produtos têm maquinas (setor_id via maquina), funcoes (setor_id via funcao), servicos (setor_id via servico).
   */
  agruparHorasPorSetor(produtos: any[]): Map<string, number> {
    const horasPorSetor = new Map<string, number>();

    const addHoras = (setorId: string | null | undefined, horas: number) => {
      if (!setorId || horas <= 0) return;
      const key = String(setorId);
      horasPorSetor.set(key, (horasPorSetor.get(key) ?? 0) + horas);
    };

    for (const produto of produtos) {
      for (const maq of produto.maquinas || []) {
        const horas = parseFloat(maq.horas_utilizadas || maq.horas || '0');
        addHoras(maq.setor_id, horas);
      }
      for (const fn of produto.funcoes || []) {
        const horas = parseFloat(fn.horas_trabalhadas || fn.horas || '0');
        addHoras(fn.setor_id, horas);
      }
      for (const svc of produto.servicos_manuais || produto.servicos || []) {
        const horas = parseFloat(svc.horas_trabalhadas || svc.horas || '0');
        addHoras(svc.setor_id, horas);
      }
    }

    return horasPorSetor;
  }

  /**
   * Soma total de horas de produção dos produtos.
   */
  somarHorasTotais(produtos: any[]): number {
    let total = 0;
    for (const produto of produtos) {
      for (const maq of produto.maquinas || []) {
        total += parseFloat(maq.horas_utilizadas || maq.horas || '0');
      }
      for (const fn of produto.funcoes || []) {
        total += parseFloat(fn.horas_trabalhadas || fn.horas || '0');
      }
      for (const svc of produto.servicos_manuais || produto.servicos || []) {
        total += parseFloat(svc.horas_trabalhadas || svc.horas || '0');
      }
    }
    return total;
  }
}
