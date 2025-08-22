export type MaquinaModoProducao = 'M2_H' | 'ML_H' | 'MANUAL';

export interface MaquinaParametros {
  modoProducao: MaquinaModoProducao;
  areaTotalM2?: number; // quando M2_H
  comprimentoLinearTotalM?: number; // quando ML_H (opcional por ora)
  velocidadeM2PorHora?: number;
  velocidadeMLPorHora?: number; // ainda não modelado em Prisma
  eficienciaPercent?: number; // 0..100
  setupMin?: number; // minutos
  horasManuais?: number; // fallback manual informado
}

export function calcularHorasMaquina(params: MaquinaParametros): number {
  const eficiencia = normalizarPercent(params.eficienciaPercent);
  const setupHoras = (params.setupMin || 0) / 60;

  if (params.modoProducao === 'MANUAL') {
    return clampHoras(params.horasManuais || 0) + setupHoras;
  }

  if (params.modoProducao === 'M2_H') {
    const area = clampNaoNegativo(params.areaTotalM2 || 0);
    const v = clampNaoNegativo(params.velocidadeM2PorHora || 0);
    if (area === 0 || v === 0) return clampHoras(params.horasManuais || 0) + setupHoras;
    const horasBase = area / v;
    const horasAjustadas = aplicarEficiencia(horasBase, eficiencia);
    return clampHoras(horasAjustadas + setupHoras);
  }

  if (params.modoProducao === 'ML_H') {
    const comp = clampNaoNegativo(params.comprimentoLinearTotalM || 0);
    const v = clampNaoNegativo(params.velocidadeMLPorHora || 0);
    if (comp === 0 || v === 0) return clampHoras(params.horasManuais || 0) + setupHoras;
    const horasBase = comp / v;
    const horasAjustadas = aplicarEficiencia(horasBase, eficiencia);
    return clampHoras(horasAjustadas + setupHoras);
  }

  return clampHoras(params.horasManuais || 0) + setupHoras;
}

export type FuncaoTipoCalculo = 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'MANUAL';

export interface FuncaoParametros {
  tipoCalculo: FuncaoTipoCalculo;
  horasMaquina?: number; // quando acompanha máquina
  fatorAcompanhamento?: number; // multiplicador
  areaTotalM2?: number; // quando POR_M2
  horasPorM2?: number;
  quantidade?: number; // quando POR_UNIDADE
  horasPorUnidade?: number;
  eficienciaPercent?: number; // 0..100
  setupMin?: number; // minutos
  horasManuais?: number; // fallback
}

export function calcularHorasFuncao(params: FuncaoParametros): number {
  const eficiencia = normalizarPercent(params.eficienciaPercent);
  const setupHoras = (params.setupMin || 0) / 60;

  switch (params.tipoCalculo) {
    case 'ACOMPANHA_MAQUINA': {
      const base = clampHoras(params.horasMaquina || 0);
      const fator = params.fatorAcompanhamento == null ? 1 : params.fatorAcompanhamento;
      return clampHoras(aplicarEficiencia(base * fator, eficiencia) + setupHoras);
    }
    case 'POR_M2': {
      const area = clampNaoNegativo(params.areaTotalM2 || 0);
      const hPorM2 = clampNaoNegativo(params.horasPorM2 || 0);
      const base = area * hPorM2;
      return clampHoras(aplicarEficiencia(base, eficiencia) + setupHoras);
    }
    case 'POR_UNIDADE': {
      const qtd = clampNaoNegativo(params.quantidade || 0);
      const hPorUn = clampNaoNegativo(params.horasPorUnidade || 0);
      const base = qtd * hPorUn;
      return clampHoras(aplicarEficiencia(base, eficiencia) + setupHoras);
    }
    case 'MANUAL':
    default:
      return clampHoras(params.horasManuais || 0) + setupHoras;
  }
}

function normalizarPercent(p?: number): number {
  if (p == null || isNaN(p)) return 100;
  if (p <= 0) return 100;
  return p;
}

function aplicarEficiencia(horas: number, eficienciaPercent: number): number {
  const fator = 100 / eficienciaPercent; // 80% => 1.25x tempo
  return horas * fator;
}

function clampHoras(v: number): number {
  if (!isFinite(v) || isNaN(v)) return 0;
  return v < 0 ? 0 : v;
}

function clampNaoNegativo(v: number): number {
  if (!isFinite(v) || isNaN(v)) return 0;
  return v < 0 ? 0 : v;
}



