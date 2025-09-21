
import { Insumo, Maquina, Funcao, ServicoManual } from '../types/common.types';
import { calcularCustoPorUnidadeUso, calcularArea } from './calculo.utils';

type NumericLike = number | string | null | undefined;

const MIN_EFFICIENCY_DECIMAL = 0.05;
const HORAS_PRODUTIVAS_MES = 352;

const parseNumber = (value: NumericLike): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    try {
      const parsed = parseFloat((value as { toString(): string }).toString().replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  }
  return 0;
};

const clampDecimal = (value: number): number => {
  if (!Number.isFinite(value)) return MIN_EFFICIENCY_DECIMAL;
  return Math.min(Math.max(value, MIN_EFFICIENCY_DECIMAL), 1);
};

interface ProdutoContexto {
  quantidade: number;
  largura: number;
  altura: number;
  unidadeMedida: string;
  areaUnit: number;
  areaTotal: number;
}

const buildProdutoContexto = (produto: any): ProdutoContexto => {
  const quantidade = parseNumber(produto?.quantidade_produto) || 1;
  const largura = parseNumber(produto?.largura_produto);
  const altura = parseNumber(produto?.altura_produto);
  const unidadeMedida = (produto?.unidade_medida_produto as string) || 'm';
  const areaInformada = parseNumber(produto?.area_produto);

  const areaUnit = areaInformada || (largura && altura ? calcularArea(largura, altura, unidadeMedida) : 0);
  const areaTotal = areaUnit * quantidade;

  return {
    quantidade,
    largura,
    altura,
    unidadeMedida,
    areaUnit,
    areaTotal,
  };
};
type CustoIndiretoEntrada = {
  id?: string;
  nome?: string;
  categoria?: string | null;
  valor_mensal?: NumericLike;
  percentual_rateio?: NumericLike;
  valor_rateado?: NumericLike;
};

type CustoIndiretoResumoItem = {
  id: string;
  nome: string;
  categoria?: string | null;
  valor_mensal: number;
  percentual_rateio: number;
  valor_rateado: number;
};

export interface CustosIndiretosResumo {
  totalMensal: number;
  custoPorHora: number;
  totalRateado: number;
  itens: CustoIndiretoResumoItem[];
}

const normalizarCustosIndiretos = (custos: CustoIndiretoEntrada[] | undefined): CustoIndiretoResumoItem[] => {
  if (!Array.isArray(custos) || custos.length === 0) {
    return [];
  }

  return custos.map((custo, index) => {
    const valorMensal = parseNumber(custo?.valor_mensal);
    const nome = typeof custo?.nome === 'string' && custo.nome.trim().length > 0
      ? custo.nome
      : `Custo indireto ${index + 1}`;

    return {
      id: custo?.id ? String(custo.id) : `custo_${index}`,
      nome,
      categoria: custo?.categoria ?? null,
      valor_mensal: valorMensal,
      percentual_rateio: parseNumber(custo?.percentual_rateio) || 0,
      valor_rateado: parseNumber(custo?.valor_rateado) || 0,
    };
  });
};

const calcularResumoCustosIndiretos = (
  custos: CustoIndiretoEntrada[] | undefined,
  totalRateadoCalculado: number,
  totalHorasProducao: number,
): CustosIndiretosResumo | undefined => {
  const itensNormalizados = normalizarCustosIndiretos(custos).filter((item) => Number.isFinite(item.valor_mensal));

  if (itensNormalizados.length === 0) {
    return undefined;
  }

  const totalMensal = itensNormalizados.reduce((acc, item) => acc + (Number.isFinite(item.valor_mensal) ? item.valor_mensal : 0), 0);
  const custoPorHora = totalMensal > 0 ? totalMensal / HORAS_PRODUTIVAS_MES : 0;
  const valorRateioBase = totalRateadoCalculado > 0
    ? totalRateadoCalculado
    : custoPorHora * Math.max(totalHorasProducao, 0);

  const itens = itensNormalizados.map((item) => {
    const percentual = totalMensal > 0 ? (item.valor_mensal / totalMensal) * 100 : 0;
    const valorRateado = totalMensal > 0 ? valorRateioBase * (item.valor_mensal / totalMensal) : 0;

    return {
      ...item,
      percentual_rateio: percentual,
      valor_rateado: valorRateado,
    };
  });

  const totalRateado = itens.reduce((acc, item) => acc + item.valor_rateado, 0);

  return {
    totalMensal,
    custoPorHora,
    totalRateado,
    itens,
  };
};


export interface MaterialPreview {
  insumo_id: string;
  nome: string;
  quantidade: number;
  custo_unitario: number;
  custo_total: number;
  unidade_consumo?: string;
}

const calcularMateriais = (
  materiais: Array<{ insumo_id: string; quantidade?: NumericLike }>,
  insumos: Insumo[],
): { itens: MaterialPreview[]; total: number } => {
  const itens = (materiais || []).reduce<MaterialPreview[]>((acc, material) => {
    if (!material?.insumo_id) {
      return acc;
    }

    const insumo = insumos.find((i) => i.id === material.insumo_id);
    const quantidade = parseNumber(material?.quantidade);

    if (quantidade <= 0) {
      return acc;
    }

    const custoUnitario = insumo ? calcularCustoPorUnidadeUso(insumo) : 0;
    const custoTotal = quantidade * custoUnitario;

    acc.push({
      insumo_id: material.insumo_id,
      nome: insumo?.nome || 'Insumo não encontrado',
      quantidade,
      custo_unitario: custoUnitario,
      custo_total: custoTotal,
      unidade_consumo: insumo?.unidade_uso,
    });

    return acc;
  }, []);

  const total = itens.reduce((acc, item) => acc + item.custo_total, 0);
  return { itens, total };
};

interface MaquinaPreview {
  maquina_id: string;
  nome: string;
  horas_utilizadas: number;
  custo_por_hora: number;
  custo_total: number;
  modo_producao?: string;
}

const calcularHorasMaquina = (
  entrada: { maquina_id?: string; horas_utilizadas?: NumericLike },
  maquina: Maquina | undefined,
  contexto: ProdutoContexto,
): number => {
  const horasManuais = parseNumber(entrada?.horas_utilizadas);
  if (horasManuais > 0) {
    return horasManuais;
  }

  if (!maquina || !entrada?.maquina_id) {
    return 0;
  }

  const modo = maquina?.modo_producao as string | undefined;
  const eficienciaPercent = parseNumber((maquina as any)?.eficiencia_percent) || 100;
  const eficienciaDecimal = clampDecimal(eficienciaPercent / 100);
  const fatorEficiencia = 1 / eficienciaDecimal;

  switch (modo) {
    case 'M2_H': {
      const velocidade = parseNumber((maquina as any)?.velocidade_m2_h);
      const setupMin = parseNumber((maquina as any)?.setup_min);
      if (velocidade > 0 && contexto.areaTotal > 0) {
        const velocidadeCorrigida = velocidade < 0.5 ? 1 / velocidade : velocidade;
        const horasBase = contexto.areaTotal / velocidadeCorrigida;
        const horasSetup = setupMin / 60;
        const horasAuto = (horasBase + horasSetup) * fatorEficiencia;
        if (Number.isFinite(horasAuto) && horasAuto > 0 && horasAuto < 500) {
          return horasAuto;
        }
        return 100;
      }
      break;
    }
    default:
      break;
  }

  return 0;
};

const calcularMaquinas = (
  maquinasEntrada: Array<{ maquina_id: string; horas_utilizadas?: NumericLike }>,
  maquinas: Maquina[],
  contexto: ProdutoContexto,
): { itens: MaquinaPreview[]; total: number; horas: number } => {
  const itens = (maquinasEntrada || []).reduce<MaquinaPreview[]>((acc, entrada) => {
    if (!entrada?.maquina_id) {
      return acc;
    }

    const maquina = maquinas.find((m) => m.id === entrada.maquina_id);
    if (!maquina) {
      return acc;
    }

    const horas = calcularHorasMaquina(entrada, maquina, contexto);
    if (horas <= 0) {
      return acc;
    }

    const custoPorHora = parseNumber(maquina?.custo_hora);
    const custoTotal = custoPorHora * horas;

    acc.push({
      maquina_id: entrada.maquina_id,
      nome: maquina?.nome || 'Máquina não encontrada',
      horas_utilizadas: horas,
      custo_por_hora: custoPorHora,
      custo_total: custoTotal,
      modo_producao: (maquina as any)?.modo_producao,
    });

    return acc;
  }, []);

  const total = itens.reduce((acc, item) => acc + item.custo_total, 0);
  const horas = itens.reduce((acc, item) => acc + item.horas_utilizadas, 0);
  return { itens, total, horas };
};

interface FuncaoPreview {
  funcao_id: string;
  nome: string;
  horas_trabalhadas: number;
  custo_por_hora: number;
  custo_total: number;
}

const calcularHorasFuncao = (
  entrada: { funcao_id?: string; horas_trabalhadas?: NumericLike },
  funcao: Funcao | undefined,
  contexto: ProdutoContexto,
): number => {
  const horasManuais = parseNumber(entrada?.horas_trabalhadas);
  if (horasManuais > 0) {
    return horasManuais;
  }

  if (!funcao || !entrada?.funcao_id) {
    return 0;
  }

  const tipoCalculo = funcao?.tipo_calculo as string | undefined;
  const eficienciaPercent = parseNumber(funcao?.eficiencia_percent) || 100;
  const fatorEficiencia = 100 / Math.max(eficienciaPercent, 5);

  switch (tipoCalculo) {
    case 'POR_M2': {
      const horasPorM2 = parseNumber(funcao?.horas_por_m2);
      if (horasPorM2 > 0 && contexto.areaTotal > 0) {
        const horasBase = contexto.areaTotal * horasPorM2;
        const horasAuto = (horasBase * fatorEficiencia) / 100;
        return horasAuto > 0 ? horasAuto : 0;
      }
      break;
    }
    case 'POR_UNIDADE': {
      const horasPorUnidade = parseNumber(funcao?.horas_por_unidade);
      if (horasPorUnidade > 0 && contexto.quantidade > 0) {
        const horasBase = contexto.quantidade * horasPorUnidade;
        const horasAuto = (horasBase * fatorEficiencia) / 100;
        return horasAuto > 0 ? horasAuto : 0;
      }
      break;
    }
    default:
      break;
  }

  return 0;
};

const calcularFuncoes = (
  funcoesEntrada: Array<{ funcao_id: string; horas_trabalhadas?: NumericLike }>,
  funcoes: Funcao[],
  contexto: ProdutoContexto,
): { itens: FuncaoPreview[]; total: number; horas: number } => {
  const itens = (funcoesEntrada || []).reduce<FuncaoPreview[]>((acc, entrada) => {
    if (!entrada?.funcao_id) {
      return acc;
    }

    const funcao = funcoes.find((f) => f.id === entrada.funcao_id);
    if (!funcao) {
      return acc;
    }

    const horas = calcularHorasFuncao(entrada, funcao, contexto);
    if (horas <= 0) {
      return acc;
    }

    const custoPorHora = parseNumber(funcao?.custo_hora);
    const custoTotal = custoPorHora * horas;

    acc.push({
      funcao_id: entrada.funcao_id,
      nome: funcao?.nome || 'Função não encontrada',
      horas_trabalhadas: horas,
      custo_por_hora: custoPorHora,
      custo_total: custoTotal,
    });

    return acc;
  }, []);

  const total = itens.reduce((acc, item) => acc + item.custo_total, 0);
  const horas = itens.reduce((acc, item) => acc + item.horas_trabalhadas, 0);
  return { itens, total, horas };
};

interface ServicoPreview {
  servico_id: string;
  nome: string;
  horas_trabalhadas: number;
  custo_por_hora: number;
  custo_total: number;
}

const converterTempoMinutos = (valor: NumericLike): number => {
  if (typeof valor === 'string' && valor.includes(':')) {
    const [horas, minutos] = valor.split(':').map((v) => parseInt(v, 10) || 0);
    return horas * 60 + minutos;
  }
  return parseNumber(valor);
};


const calcularHorasServico = (
  entrada: { servico_id?: string; horas_trabalhadas?: NumericLike },
  servico: ServicoManual | undefined,
  contexto: ProdutoContexto,
): number => {
  const horasManuais = parseNumber(entrada?.horas_trabalhadas);
  if (horasManuais > 0) {
    return horasManuais;
  }

  if (!servico || !entrada?.servico_id) {
    return 0;
  }

  const tipoCalculo = servico?.tipo_calculo as string | undefined;
  const eficienciaPercent = parseNumber(servico?.eficiencia_percent) || 100;
  const eficienciaDecimal = clampDecimal(eficienciaPercent / 100);
  const fatorEficiencia = 1 / eficienciaDecimal;

  switch (tipoCalculo) {
    case 'POR_M2': {
      const horasPorM2 = parseNumber(servico?.horas_por_m2);
      if (horasPorM2 > 0 && contexto.areaTotal > 0) {
        const horasBase = contexto.areaTotal * horasPorM2;
        const horasAuto = horasBase * fatorEficiencia;
        return horasAuto > 0 ? horasAuto : 0;
      }
      break;
    }
    case 'POR_UNIDADE': {
      const horasPorUnidade = parseNumber(servico?.horas_por_unidade);
      if (horasPorUnidade > 0 && contexto.quantidade > 0) {
        const horasBase = contexto.quantidade * horasPorUnidade;
        const horasAuto = horasBase * fatorEficiencia;
        return horasAuto > 0 ? horasAuto : 0;
      }
      break;
    }
    case 'POR_PECA_COM_CATEGORIA': {
      const categorias = servico?.categorias || [];
      if (categorias.length > 0) {
        const areaUnit = contexto.areaUnit;
        const categoria = categorias.find((cat) => areaUnit <= (cat.ate_m2 || 0)) || categorias[categorias.length - 1];
        const tempoMin = typeof categoria?.tempo_min === 'number' ? categoria.tempo_min : converterTempoMinutos(categoria?.tempo_min);
        const setupMin = parseNumber(servico?.setup_min);
        const horasBase = (contexto.quantidade * tempoMin) / 60;
        const horasSetup = setupMin / 60;
        const horasAuto = (horasBase + horasSetup) * fatorEficiencia;
        if (horasAuto > 0 && horasAuto < 1000) {
          return horasAuto;
        }
        return 0;
      }
      break;
    }
    default:
      break;
  }

  return 0;
};

const calcularServicos = (
  servicosEntrada: Array<{ servico_id: string; horas_trabalhadas?: NumericLike }>,
  servicos: ServicoManual[],
  contexto: ProdutoContexto,
): { itens: ServicoPreview[]; total: number; horas: number } => {
  const itens = (servicosEntrada || []).reduce<ServicoPreview[]>((acc, entrada) => {
    if (!entrada?.servico_id) {
      return acc;
    }

    const servico = servicos.find((s) => s.id === entrada.servico_id);
    if (!servico) {
      return acc;
    }

    const horas = calcularHorasServico(entrada, servico, contexto);
    if (horas <= 0) {
      return acc;
    }

    const custoPorHora = parseNumber(servico?.custo_hora);
    const custoTotal = custoPorHora * horas;

    acc.push({
      servico_id: entrada.servico_id,
      nome: servico?.nome || 'Serviço manual',
      horas_trabalhadas: horas,
      custo_por_hora: custoPorHora,
      custo_total: custoTotal,
    });

    return acc;
  }, []);

  const total = itens.reduce((acc, item) => acc + item.custo_total, 0);
  const horas = itens.reduce((acc, item) => acc + item.horas_trabalhadas, 0);
  return { itens, total, horas };
};

export interface ProdutoPreviewCalculo {
  id: string;
  nome_servico: string;
  descricao: string;
  quantidade: number;
  dimensoes: {
    largura: number;
    altura: number;
    area_produto: number;
    unidade_medida: string;
  };
  materiais: MaterialPreview[];
  maquinas: MaquinaPreview[];
  funcoes: FuncaoPreview[];
  servicos: ServicoPreview[];
  custo_total_producao: number;
  preco_unitario: number;
  preco_total: number;
  horas_producao: number;
  custos_indiretos_rateados: number;
}

export interface ProdutosPreviewResultado {
  produtos: ProdutoPreviewCalculo[];
  totais: {
    materiais: number;
    maquinas: number;
    funcoes: number;
    servicos: number;
    indiretos: number;
    horas: number;
  };
  custosIndiretosResumo?: CustosIndiretosResumo;
}

export const calcularProdutosPreview = (
  itensProduto: any[],
  datasets: {
    insumos: Insumo[];
    maquinas: Maquina[];
    funcoes: Funcao[];
    servicos: ServicoManual[];
    custosIndiretos?: CustoIndiretoEntrada[];
  },
  custosIndiretosPercentual: number,
  margemPercentual: number,
  impostosPercentual: number,
): ProdutosPreviewResultado => {
  let totalMateriais = 0;
  let totalMaquinas = 0;
  let totalFuncoes = 0;
  let totalServicos = 0;
  let totalIndiretos = 0;
  let totalHoras = 0;

  const produtos = (itensProduto || []).map((item: any, index: number) => {
    const contexto = buildProdutoContexto(item);

    const materiais = calcularMateriais(item?.materiais || [], datasets.insumos);
    const maquinas = calcularMaquinas(item?.maquinas || [], datasets.maquinas, contexto);
    const funcoes = calcularFuncoes(item?.funcoes || [], datasets.funcoes, contexto);
    const servicos = calcularServicos(item?.servicos || [], datasets.servicos, contexto);

    const custoMateriais = materiais.total;
    const custoMaquinas = maquinas.total;
    const custoFuncoes = funcoes.total;
    const custoServicos = servicos.total;

    const custoBase = custoMateriais + custoMaquinas + custoFuncoes + custoServicos;
    const custoIndiretos = custoBase * (custosIndiretosPercentual / 100);

    const custoTotalProducao = custoBase + custoIndiretos;
    const margemValor = custoTotalProducao * (margemPercentual / 100);
    const subtotalComLucro = custoTotalProducao + margemValor;
    const impostosValor = subtotalComLucro * (impostosPercentual / 100);
    const precoTotal = subtotalComLucro + impostosValor;
    const quantidadeSegura = contexto.quantidade > 0 ? contexto.quantidade : 1;
    const precoUnitario = precoTotal / quantidadeSegura;

    const horasTotal = maquinas.horas + funcoes.horas + servicos.horas;

    totalMateriais += custoMateriais;
    totalMaquinas += custoMaquinas;
    totalFuncoes += custoFuncoes;
    totalServicos += custoServicos;
    totalIndiretos += custoIndiretos;
    totalHoras += horasTotal;

    return {
      id: `produto_${index}`,
      nome_servico: item?.nome_servico || `Produto ${index + 1}`,
      descricao: item?.descricao || `Descrição do produto ${index + 1}`,
      quantidade: contexto.quantidade,
      dimensoes: {
        largura: contexto.largura,
        altura: contexto.altura,
        area_produto: contexto.areaUnit,
        unidade_medida: contexto.unidadeMedida,
      },
      materiais: materiais.itens,
      maquinas: maquinas.itens,
      funcoes: funcoes.itens,
      servicos: servicos.itens,
      custo_total_producao: custoTotalProducao,
      preco_unitario: precoUnitario,
      preco_total: precoTotal,
      horas_producao: horasTotal,
      custos_indiretos_rateados: custoIndiretos,
    };
  });
  const resumoIndiretos = calcularResumoCustosIndiretos(datasets.custosIndiretos, totalIndiretos, totalHoras);

  return {
    produtos,
    totais: {
      materiais: totalMateriais,
      maquinas: totalMaquinas,
      funcoes: totalFuncoes,
      servicos: totalServicos,
      indiretos: totalIndiretos,
      horas: totalHoras,
    },
    custosIndiretosResumo: resumoIndiretos,
  };
};


