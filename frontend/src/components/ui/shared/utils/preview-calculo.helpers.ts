
import { truncarDescricaoResumida } from '@/components/produtos-finitos/descricao-produto-finito.helpers';
import {
  calcularPrecoPrateleiraComPersonalizacao,
} from '@/lib/catalogo/montar-personalizacao-payload';
import { calcularCustoDecoracao } from '@/lib/catalogo/personalizacao-preco';
import type { CatalogoRegrasOrcamento } from '@/lib/catalogo/personalizacao-orcamento.types';
import { Insumo, Maquina, Funcao, ServicoManual } from '../types/common.types';
import {
  calcularArea,
  insumoQuantidadeJaIncluiProduto,
  resolverCustoUnitarioMaterial,
} from './calculo.utils';

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

/**
 * Determina se um insumo deve ter sua quantidade multiplicada pela quantidade do produto
 */
const deveAplicarMultiplicacaoMaterial = (unidade?: string): boolean => {
  if (!unidade) return false;

  const unidadeLower = unidade.toLowerCase().trim();

  // Fase 11: M3 (volume) e M2_LATERAL (area lateral) sao TOTAIS - o MaterialSection
  // ja multiplicou por quantidade_produto antes de salvar no form. Aqui o preview
  // NAO pode multiplicar de novo, senao havera dupla multiplicacao (bug do guardrail 3).
  // Match exato para evitar colisao com 'm' / 'm2' em unidadesTotais/unidadesPorUnidade.
  if (unidadeLower === 'm3' || unidadeLower === 'm2_lateral') {
    return false;
  }

  // Materiais que NÃO precisam de multiplicação (já são totais)
  const unidadesTotais = ['m²', 'm2', 'metro quadrado', 'metros quadrados'];
  
  // Materiais que PRECISAM de multiplicação (são por unidade do produto)
  const unidadesPorUnidade = [
    'cm', 'centimetro', 'centimetros',
    'm', 'metro', 'metros', 'metro linear', 'metros lineares',
    'un', 'unidade', 'unidades', 'unid', 'pç', 'peca', 'pecas',
    'kg', 'kilograma', 'kilogramas',
    'g', 'grama', 'gramas',
    'l', 'litro', 'litros',
    'ml', 'mililitro', 'mililitros'
  ];

  // Se é uma unidade total (m²), não multiplicar
  if (unidadesTotais.some(u => unidadeLower.includes(u))) {
    return false;
  }

  // Se é uma unidade por unidade do produto, multiplicar
  if (unidadesPorUnidade.some(u => unidadeLower.includes(u))) {
    return true;
  }

  // Por padrão, não multiplicar (casos não identificados)
  return false;
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
  materiais: Array<{
    insumo_id: string;
    quantidade?: NumericLike;
    material_do_cliente?: boolean;
    preco_unitario_previsto?: NumericLike;
  }>,
  insumos: Insumo[],
  quantidadeProduto?: number, // Nova parâmetro para quantidade do produto
): { itens: MaterialPreview[]; total: number } => {
  // Se não há quantidade do produto, usar lógica original (backward compatibility)
  if (!quantidadeProduto || quantidadeProduto <= 0) {
    quantidadeProduto = 1;
  }

  const itens = (materiais || []).reduce<MaterialPreview[]>((acc, material) => {
    if (!material?.insumo_id) {
      return acc;
    }

    const insumo = insumos.find((i) => i.id === material.insumo_id);
    const quantidadeOriginal = parseNumber(material?.quantidade);
    const materialDoCliente = Boolean(material.material_do_cliente);

    if (quantidadeOriginal <= 0) {
      return acc;
    }

    // Verificar se o insumo precisa de correção
    const precisaCorrecao = deveAplicarMultiplicacaoMaterial(insumo?.unidade_uso);

    // IMPORTANTE: Se o material tem lógica personalizada (custom), ou consumo
    // geométrico automático (área/perímetro/volume), o MaterialSection já
    // calculou a quantidade total incluindo multiplicação por quantidade_produto.
    const jaCalculadoPeloMaterialSection =
      insumoQuantidadeJaIncluiProduto(insumo);

    // Aplicar multiplicação apenas se necessário E não foi calculado pelo MaterialSection
    const quantidadeFinal = (precisaCorrecao && !jaCalculadoPeloMaterialSection)
      ? quantidadeOriginal * quantidadeProduto 
      : quantidadeOriginal;

    // Material do cliente: custo zerado no orçamento
    const custoUnitario = materialDoCliente
      ? 0
      : resolverCustoUnitarioMaterial(insumo, material);
    const custoTotal = materialDoCliente ? 0 : quantidadeFinal * custoUnitario;

    // Log para debug de materiais personalizados
    if (insumo?.logica_consumo === 'custom' && insumo?.tipoMaterial) {
      console.log('🔍 Preview - Material personalizado:', {
        insumo: insumo.nome,
        logica_consumo: insumo.logica_consumo,
        tipoMaterial: insumo.tipoMaterial,
        parametros: insumo.tipoMaterial.parametros_padrao,
        quantidadeOriginal,
        quantidadeFinal,
        quantidadeProduto,
        precisaCorrecao
      });
    }

    // Log da correção aplicada
    if (precisaCorrecao && quantidadeFinal !== quantidadeOriginal) {
      console.log(`🔧 Preview - Correção aplicada para ${insumo?.nome}:`, {
        unidade: insumo?.unidade_uso,
        quantidade_original: quantidadeOriginal,
        quantidade_corrigida: quantidadeFinal,
        quantidade_produto: quantidadeProduto,
        ja_calculado_pelo_material_section: jaCalculadoPeloMaterialSection,
        custo_unitario: custoUnitario,
        custo_total_original: quantidadeOriginal * custoUnitario,
        custo_total_corrigido: custoTotal
      });
    }

    acc.push({
      insumo_id: material.insumo_id,
      nome: insumo?.nome || 'Insumo não encontrado',
      quantidade: quantidadeFinal,
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
  if (!maquina || !entrada?.maquina_id) {
    return 0;
  }

  const horasManuais = parseNumber(entrada?.horas_utilizadas);
  
  // Verificar se deve usar cálculo automático ou manual
  // Se não há modo de produção definido ou é MANUAL, usar horas manuais
  const modo = maquina?.modo_producao as string | undefined;
  if (!modo || modo === 'MANUAL') {
    return horasManuais > 0 ? horasManuais : 0;
  }

  // Para modos automáticos, calcular como no formulário
  // Se não há horas manuais ou são zero, calcular automaticamente
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
        const horasAuto = (horasBase * fatorEficiencia) + horasSetup;
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
  maquinasProduto: MaquinaPreview[],
): number => {
  if (!funcao || !entrada?.funcao_id) {
    return 0;
  }

  const horasManuais = parseNumber(entrada?.horas_trabalhadas);
  
  // Verificar se deve usar cálculo automático ou manual
  const tipoCalculo = funcao?.tipo_calculo as string | undefined;
  if (!tipoCalculo || tipoCalculo === 'MANUAL') {
    return horasManuais > 0 ? horasManuais : 0;
  }

  // Para tipos automáticos, calcular como no formulário
  const eficienciaPercent = parseNumber(funcao?.eficiencia_percent) || 100;
  const fatorEficiencia = 100 / Math.max(eficienciaPercent, 5);
  const setupMin = parseNumber(funcao?.setup_min) || 0;
  const horasSetup = setupMin / 60;
  
  switch (tipoCalculo) {
    case 'POR_M2': {
      const horasPorM2 = parseNumber(funcao?.horas_por_m2);
      if (horasPorM2 > 0 && contexto.areaTotal > 0) {
        const horasBase = contexto.areaTotal * horasPorM2;
        const horasAuto = (horasBase * fatorEficiencia) + horasSetup;
        return horasAuto > 0 ? horasAuto : 0;
      }
      break;
    }
    case 'POR_UNIDADE': {
      const horasPorUnidade = parseNumber(funcao?.horas_por_unidade);
      if (horasPorUnidade > 0 && contexto.quantidade > 0) {
        const horasBase = contexto.quantidade * horasPorUnidade;
        const horasAuto = (horasBase * fatorEficiencia) + horasSetup;
        return horasAuto > 0 ? horasAuto : 0;
      }
      break;
    }
    case 'ACOMPANHA_MAQUINA': {
      const horasMaquinas = maquinasProduto.reduce((total, maquina) => {
        const horas = Number(maquina?.horas_utilizadas) || 0;
        return Number.isFinite(horas) ? total + horas : total;
      }, 0);

      if (horasMaquinas <= 0) {
        return horasManuais > 0 ? horasManuais : 0;
      }

      const fatorAcompanhamentoRaw = parseNumber((funcao as any)?.fator_acompanhamento);
      let fatorAcompanhamentoDecimal = 1;
      if (fatorAcompanhamentoRaw > 1) {
        fatorAcompanhamentoDecimal = fatorAcompanhamentoRaw / 100;
      } else if (fatorAcompanhamentoRaw > 0) {
        fatorAcompanhamentoDecimal = fatorAcompanhamentoRaw;
      }

      const horasBase = horasMaquinas * fatorAcompanhamentoDecimal;
      const horasAuto = (horasBase * fatorEficiencia) + horasSetup;

      return horasAuto > 0 ? horasAuto : 0;
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
  maquinasProduto: MaquinaPreview[],
): { itens: FuncaoPreview[]; total: number; horas: number } => {
  const itens = (funcoesEntrada || []).reduce<FuncaoPreview[]>((acc, entrada) => {
    if (!entrada?.funcao_id) {
      return acc;
    }

    const funcao = funcoes.find((f) => f.id === entrada.funcao_id);
    if (!funcao) {
      return acc;
    }

    const horas = calcularHorasFuncao(entrada, funcao, contexto, maquinasProduto);
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
  if (!servico || !entrada?.servico_id) {
    return 0;
  }

  const horasManuais = parseNumber(entrada?.horas_trabalhadas);
  
  // Verificar se deve usar cálculo automático ou manual
  const tipoCalculo = servico?.tipo_calculo as string | undefined;
  if (!tipoCalculo || tipoCalculo === 'MANUAL') {
    return horasManuais > 0 ? horasManuais : 0;
  }

  // Para tipos automáticos, calcular como no formulário
  const effPercent = parseNumber(servico?.eficiencia_percent) || 100;
  const effDecimal = effPercent / 100; // Converter % para decimal (70% = 0.70)
  const fatorEficiencia = 1 / Math.max(effDecimal, 0.05); // 70% = 0.70 → 1/0.70 = 1.43

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
        let tempoMin = 0;
        
        // Converter tempo_min para minutos se necessário (mesma lógica do ServicoSection)
        if (typeof categoria?.tempo_min === 'number') {
          // CORREÇÃO: Se o valor for muito alto (> 500), provavelmente está em formato incorreto
          if (categoria.tempo_min > 500) {
            tempoMin = categoria.tempo_min / 60; // Converter de formato incorreto para minutos
          } else {
            tempoMin = categoria.tempo_min; // Já são minutos
          }
        } else if (typeof categoria?.tempo_min === 'string' && categoria.tempo_min.includes(':')) {
          // Converter HH:MM para minutos
          const [horas, minutos] = categoria.tempo_min.split(':').map(Number);
          tempoMin = (horas * 60) + minutos;
        } else {
          tempoMin = parseNumber(categoria?.tempo_min) || 0;
        }
        const setupMin = parseNumber(servico?.setup_min);
        const horasBase = (contexto.quantidade * tempoMin) / 60;
        const horasSetup = setupMin / 60;
        let horasAuto = (horasBase + horasSetup) * fatorEficiencia;
        
        // Validação final para garantir valores razoáveis (mesma lógica do ServicoSection)
        if (horasAuto > 1000) {
          console.warn('⚠️ Valor muito alto detectado, limitando a 100 horas.');
          horasAuto = 100;
        }
        
        if (horasAuto > 0) {
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
  servicosEntrada: Array<{
    servico_id?: string;
    horas_trabalhadas?: NumericLike;
    origem?: string;
    custo_hora?: NumericLike;
    custo_total?: NumericLike;
    descricao?: string;
  }>,
  servicos: ServicoManual[],
  contexto: ProdutoContexto,
): { itens: ServicoPreview[]; total: number; horas: number } => {
  const itens = (servicosEntrada || []).reduce<ServicoPreview[]>((acc, entrada) => {
    if (!entrada?.servico_id) {
      return acc;
    }

    const servico = servicos.find((s) => s.id === entrada.servico_id);
    const isArteAutomatica = entrada.origem === 'ARTE_AUTOMATICA';

    if (!servico && !isArteAutomatica) {
      return acc;
    }

    const horas = isArteAutomatica
      ? parseNumber(entrada.horas_trabalhadas)
      : calcularHorasServico(
          { servico_id: entrada.servico_id, horas_trabalhadas: entrada.horas_trabalhadas },
          servico,
          contexto,
        );

    if (horas <= 0 && !isArteAutomatica) {
      return acc;
    }

    const custoPorHora = isArteAutomatica
      ? parseNumber(entrada.custo_hora)
      : parseNumber(servico?.custo_hora);
    const custoTotalInformado = parseNumber(entrada.custo_total);
    const custoTotal =
      custoTotalInformado > 0
        ? custoTotalInformado
        : custoPorHora * horas;

    acc.push({
      servico_id: entrada.servico_id,
      nome:
        entrada.descricao ||
        servico?.nome ||
        (isArteAutomatica ? 'Criação de arte (automática)' : 'Serviço manual'),
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
  tipo_item?: 'SOB_DEMANDA' | 'PRODUTO_FINITO';
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
  custo_terceirizacao?: number;
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
    terceirizacao: number;
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
  comissaoPercentual: number = 5, // Valor padrão se não fornecido
  tipoMargemLucro: 'markup' | 'margem_por_dentro' = 'margem_por_dentro',
): ProdutosPreviewResultado => {
  let totalMateriais = 0;
  let totalMaquinas = 0;
  let totalFuncoes = 0;
  let totalServicos = 0;
  let totalIndiretos = 0;
  let totalHoras = 0;
  let totalTerceirizacao = 0;

  const produtos = (itensProduto || []).map((item: any, index: number) => {
    const tipoItem = String(item?.tipo_item || 'SOB_DEMANDA').toUpperCase();

    if (tipoItem === 'PRODUTO_FINITO') {
      const quantidade = Math.max(parseNumber(item?.quantidade_produto) || 1, 1);
      const precoUnitario = parseNumber(item?.preco_unitario_snapshot);
      const precoTotal = calcularPrecoPrateleiraComPersonalizacao(
        item,
        quantidade,
        precoUnitario,
      );
      // Snapshot do orçamento → custo do catálogo embutido → deriva de custo_total salvo.
      const custoSalvoTotal = parseNumber(item?.custo_total_producao);
      const precoCustoUnitario =
        parseNumber(item?.preco_custo_snapshot) ||
        parseNumber(item?.produto_finito?.preco_custo) ||
        (custoSalvoTotal > 0 ? custoSalvoTotal / quantidade : 0);
      let custoTotalProducao = precoCustoUnitario * quantidade;

      if (item?.personalizacao_ativa && item?.personalizacao_modo) {
        const regras = item?.catalogo_regras as CatalogoRegrasOrcamento | undefined;
        const modo = String(item.personalizacao_modo);
        const estampa =
          regras?.estampas_permitidas?.find(
            (e) => e.id === item.personalizacao_estampa_id,
          ) ?? null;
        const processo =
          modo === 'ESTAMPA'
            ? estampa?.processo ?? null
            : regras?.processos_livres_permitidos?.find(
                (p) => p.id === item.personalizacao_processo_id,
              ) ?? null;
        if (processo) {
          custoTotalProducao += calcularCustoDecoracao(processo, quantidade).total;
        }
      }

      totalMateriais += custoTotalProducao;

      return {
        id: `produto_${index}`,
        tipo_item: 'PRODUTO_FINITO' as const,
        nome_servico: item?.nome_servico || `Produto ${index + 1}`,
        descricao: truncarDescricaoResumida(item?.descricao || ''),
        quantidade,
        dimensoes: {
          largura: 0,
          altura: 0,
          area_produto: 0,
          unidade_medida: 'un',
        },
        materiais: [],
        maquinas: [],
        funcoes: [],
        servicos: [],
        custo_total_producao: custoTotalProducao,
        preco_custo_unitario: precoCustoUnitario,
        preco_unitario: precoUnitario,
        preco_total: precoTotal,
        horas_producao: 0,
        custos_indiretos_rateados: 0,
      };
    }

    const contexto = buildProdutoContexto(item);

    const materiais = calcularMateriais(item?.materiais || [], datasets.insumos, contexto.quantidade);
    const maquinas = calcularMaquinas(item?.maquinas || [], datasets.maquinas, contexto);
    const funcoes = calcularFuncoes(
      item?.funcoes || [],
      datasets.funcoes,
      contexto,
      maquinas.itens,
    );
    const servicos = calcularServicos(item?.servicos || [], datasets.servicos, contexto);

    const custoMateriais = materiais.total;
    const custoMaquinas = maquinas.total;
    const custoFuncoes = funcoes.total;
    const custoServicos = servicos.total;
    const custoTerceirizacao =
      item?.modo_fulfillment === 'OUTSOURCE' ||
      item?.modo_fulfillment === 'HIBRIDO'
        ? item?.terceirizacao_modelo_custo === 'PRECO_FECHADO'
          ? parseNumber(item?.terceirizacao_custo_total)
          : parseNumber(item?.terceirizacao_custo_unitario) *
              contexto.quantidade +
            parseNumber(item?.terceirizacao_custo_setup) +
            parseNumber(item?.terceirizacao_custo_frete)
        : 0;

    const custoBase =
      custoMateriais +
      custoMaquinas +
      custoFuncoes +
      custoServicos +
      custoTerceirizacao;
    // Só aplicar custos indiretos quando houver itens cadastrados
    const temCustosIndiretosCadastrados = Array.isArray(datasets.custosIndiretos) && datasets.custosIndiretos.length > 0;
    const custoIndiretos = temCustosIndiretosCadastrados
      ? custoBase * (custosIndiretosPercentual / 100)
      : 0;

    const custoTotalProducao = custoBase + custoIndiretos;

    const percentualMargemDecimal = margemPercentual / 100;
    const percentualImpostosDecimal = impostosPercentual / 100;
    const percentualComissaoDecimal = comissaoPercentual / 100;

    let precoTotal: number;
    if (tipoMargemLucro === 'markup') {
      const divisorMarkup = 1 - percentualImpostosDecimal - percentualComissaoDecimal;
      precoTotal = divisorMarkup > 0
        ? (custoTotalProducao * (1 + percentualMargemDecimal)) / divisorMarkup
        : custoTotalProducao * (1 + percentualMargemDecimal);
    } else {
      const divisor = 1 - percentualImpostosDecimal - percentualComissaoDecimal - percentualMargemDecimal;
      precoTotal = divisor > 0 ? custoTotalProducao / divisor : custoTotalProducao;
    }
    
    // Calcular valores para exibição
    const impostosValor = precoTotal * percentualImpostosDecimal;
    const comissaoValor = precoTotal * percentualComissaoDecimal;
    const margemValor = precoTotal * percentualMargemDecimal;
    const subtotalComLucro = precoTotal - impostosValor - comissaoValor;
    const quantidadeSegura = contexto.quantidade > 0 ? contexto.quantidade : 1;
    const precoUnitario = precoTotal / quantidadeSegura;

    const horasTotal = maquinas.horas + funcoes.horas + servicos.horas;

    totalMateriais += custoMateriais;
    totalMaquinas += custoMaquinas;
    totalFuncoes += custoFuncoes;
    totalServicos += custoServicos;
    totalIndiretos += custoIndiretos;
    totalHoras += horasTotal;
    totalTerceirizacao += custoTerceirizacao;

    return {
      id: `produto_${index}`,
      nome_servico: item?.nome_servico || `Produto ${index + 1}`,
      descricao: truncarDescricaoResumida(
        item?.descricao || `Descrição do produto ${index + 1}`,
      ),
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
      custo_terceirizacao: custoTerceirizacao,
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
      terceirizacao: totalTerceirizacao,
    },
    custosIndiretosResumo: resumoIndiretos,
  };
};
