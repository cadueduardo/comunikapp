import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DetalhamentoEstimativa,
  EntradaEstimativaMaquina,
  ModoProducaoMaquina,
  ResultadoEstimativaMaquina,
} from '../interfaces/estimativa-tempo.interface';

/**
 * Calcula o tempo estimado para uma máquina executar um produto, a partir
 * da geometria (área m² ou perímetro mm) e dos dados cadastrais da máquina.
 *
 * Regras:
 * - modo M2_H usa `velocidade_m2_h` e exige `area_m2`.
 * - modo ML_H usa `velocidade_ml_h` e exige `perimetro_mm`.
 * - modo MANUAL retorna "estimativa não disponível" (usuário deve digitar).
 * - `setup_min` é adicionado uma única vez (não multiplica por quantidade).
 * - `eficiencia_percent` aumenta o tempo (efficiency < 100 → mais tempo real).
 *
 * Este serviço NÃO altera dados; é puramente leitura + cálculo.
 */
@Injectable()
export class EstimativaTempoService {
  constructor(private readonly prisma: PrismaService) {}

  async estimarMaquina(
    lojaId: string,
    entrada: EntradaEstimativaMaquina,
  ): Promise<ResultadoEstimativaMaquina> {
    const maquina = await this.prisma.maquina.findUnique({
      where: { id: entrada.maquina_id },
      select: {
        id: true,
        nome: true,
        loja_id: true,
        ativo: true,
        modo_producao: true,
        velocidade_m2_h: true,
        velocidade_ml_h: true,
        setup_min: true,
        eficiencia_percent: true,
      },
    });

    if (!maquina) {
      throw new NotFoundException('Máquina não encontrada.');
    }
    if (maquina.loja_id !== lojaId) {
      throw new ForbiddenException('Máquina não pertence a esta loja.');
    }

    const modo = (maquina.modo_producao ?? 'M2_H') as ModoProducaoMaquina;
    const setupHoras = this.toNumber(maquina.setup_min) / 60;
    const eficienciaPercent = maquina.eficiencia_percent
      ? this.toNumber(maquina.eficiencia_percent)
      : null;

    const detalhamento: DetalhamentoEstimativa = {
      modo_producao: modo,
      velocidade_usada: null,
      unidade_velocidade: null,
      setup_horas: setupHoras,
      eficiencia_percent: eficienciaPercent,
      tempo_bruto_horas: 0,
      tempo_com_eficiencia_horas: 0,
      tempo_total_horas: 0,
      mensagens: [],
    };

    let estimativaPossivel = false;
    let tempoProcessoHoras = 0;

    if (modo === 'M2_H') {
      const velocidade = this.toNumber(maquina.velocidade_m2_h);
      detalhamento.velocidade_usada = velocidade || null;
      detalhamento.unidade_velocidade = 'm2/h';

      if (velocidade > 0 && entrada.area_m2 && entrada.area_m2 > 0) {
        const areaTotalM2 = entrada.area_m2 * entrada.quantidade;
        tempoProcessoHoras = areaTotalM2 / velocidade;
        estimativaPossivel = true;
      } else if (velocidade <= 0) {
        detalhamento.mensagens.push(
          'Máquina sem velocidade m²/h cadastrada. Estimativa não disponível.',
        );
      } else {
        detalhamento.mensagens.push(
          'Informe a área do produto para estimar tempo nesta máquina.',
        );
      }
    } else if (modo === 'ML_H') {
      const velocidade = this.toNumber(maquina.velocidade_ml_h);
      detalhamento.velocidade_usada = velocidade || null;
      detalhamento.unidade_velocidade = 'm/h';

      if (velocidade > 0 && entrada.perimetro_mm && entrada.perimetro_mm > 0) {
        const perimetroTotalM =
          (entrada.perimetro_mm * entrada.quantidade) / 1000;
        tempoProcessoHoras = perimetroTotalM / velocidade;
        estimativaPossivel = true;
      } else if (velocidade <= 0) {
        detalhamento.mensagens.push(
          'Máquina sem velocidade m/h cadastrada. Estimativa não disponível.',
        );
      } else {
        detalhamento.mensagens.push(
          'Informe o perímetro do produto para estimar tempo nesta máquina.',
        );
      }
    } else {
      detalhamento.mensagens.push(
        'Esta máquina trabalha em modo manual. Informe o tempo manualmente.',
      );
    }

    detalhamento.tempo_bruto_horas = tempoProcessoHoras;

    // Aplicar eficiência (eficiencia < 100% aumenta o tempo real).
    let tempoComEficienciaHoras = tempoProcessoHoras;
    if (
      estimativaPossivel &&
      eficienciaPercent &&
      eficienciaPercent > 0 &&
      eficienciaPercent < 100
    ) {
      tempoComEficienciaHoras = tempoProcessoHoras / (eficienciaPercent / 100);
    }
    detalhamento.tempo_com_eficiencia_horas = tempoComEficienciaHoras;

    // Adicionar setup (uma única vez).
    const tempoTotalHoras = estimativaPossivel
      ? tempoComEficienciaHoras + setupHoras
      : 0;
    detalhamento.tempo_total_horas = tempoTotalHoras;

    return {
      maquina_id: maquina.id,
      maquina_nome: maquina.nome,
      estimativa_possivel: estimativaPossivel,
      tempo_horas: this.arredondar(tempoTotalHoras, 4),
      detalhamento: {
        ...detalhamento,
        setup_horas: this.arredondar(setupHoras, 4),
        tempo_bruto_horas: this.arredondar(detalhamento.tempo_bruto_horas, 4),
        tempo_com_eficiencia_horas: this.arredondar(
          detalhamento.tempo_com_eficiencia_horas,
          4,
        ),
        tempo_total_horas: this.arredondar(detalhamento.tempo_total_horas, 4),
      },
    };
  }

  private toNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    // Prisma retorna Decimal como objeto com toString
    const asString =
      typeof (value as { toString?: () => string }).toString === 'function'
        ? (value as { toString: () => string }).toString()
        : String(value);
    const parsed = Number(asString);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private arredondar(valor: number, casas: number): number {
    if (!Number.isFinite(valor)) return 0;
    const fator = Math.pow(10, casas);
    return Math.round(valor * fator) / fator;
  }
}
