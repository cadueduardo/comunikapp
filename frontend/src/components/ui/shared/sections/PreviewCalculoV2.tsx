'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, ChevronDown, ChevronUp, Eye, Calculator, Clock, Package } from 'lucide-react';
import { montarPreviewOrcamento } from '../utils/montar-preview-orcamento';
import { useOrcamentoData } from '../../orcamento/hooks/useOrcamentoData';
import { useCalculoWebSocket } from '@/hooks/use-calculo-websocket';
import { useUser } from '@/contexts/UserContext';
import { Cliente, Insumo, Maquina, Funcao, ServicoManual } from '../types/common.types';
import { produtosFinitosApi } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const parseCustoPreview = (valor: unknown): number => {
  if (valor === null || valor === undefined || valor === '') return 0;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  if (typeof valor === 'string') {
    const parsed = parseFloat(valor.replace(/[^0-9,.-]/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof valor === 'object' && valor !== null && 'toString' in valor) {
    try {
      const parsed = parseFloat(
        String((valor as { toString(): string }).toString()).replace(',', '.'),
      );
      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  }
  return 0;
};

interface PreviewCalculoDatasets {
  insumos: Insumo[];
  maquinas: Maquina[];
  funcoes: Funcao[];
  servicos: ServicoManual[];
  custosIndiretos?: unknown[];
}

interface PreviewCalculoV2Props {
  variant?: 'orcamento' | 'produto';
  showAllProducts?: boolean;
  dadosCarregados?: boolean;
  /** Incrementar após form.reset (ex.: produtosSectionKey) para forçar recálculo. */
  refreshKey?: number;
  /** Snapshot dos produtos ao carregar rascunho — garante cálculo com accordion fechado. */
  itensProdutoCarregados?: unknown[];
  /** Quando informado, o preview usa a mesma lista do formulário (evita estado duplicado após cadastro inline de insumo). */
  datasets?: PreviewCalculoDatasets;
  /**
   * sidebar — sticky desktop (default)
   * plain — conteúdo sem sticky (ex.: dentro de modal)
   * mobile-dock — barra fixa + sheet no mobile
   */
  layout?: 'sidebar' | 'plain' | 'mobile-dock';
}

type PreviewCustoIndireto = {
  id: string;
  nome: string;
  categoria?: string | null;
  valor_mensal: number;
  valor_rateado?: number;
  percentual_rateio?: number;
  ativo?: boolean;
};

type PreviewMaterial = {
  insumo_id?: string;
  nome: string;
  quantidade: number;
  custo_unitario: number;
  unidade_consumo?: string;
};

type PreviewMaquina = {
  maquina_id?: string;
  nome: string;
  horas_utilizadas: number;
  custo_por_hora: number;
};

type PreviewFuncao = {
  funcao_id?: string;
  servico_id?: string;
  nome: string;
  horas_trabalhadas: number;
  custo_por_hora: number;
};

type PreviewProduto = {
  id: string;
  nome_servico: string;
  descricao: string;
  quantidade: number;
  tipo_item?: 'SOB_DEMANDA' | 'PRODUTO_FINITO';
  produto_finito_id?: string;
  dimensoes: Record<string, unknown>;
  materiais: PreviewMaterial[];
  maquinas: PreviewMaquina[];
  funcoes: PreviewFuncao[];
  servicos: PreviewFuncao[];
  custo_total_producao: number;
  horas_producao: number;
  custos_indiretos_rateados: number;
  preco_unitario?: number;
  preco_total?: number;
  preco_custo_unitario?: number;
  custo_informado?: boolean;
  preco_venda_total?: number | string;
  preco_venda_unitario?: number | string;
  margem_lucro_produto?: number;
  margem_bruta_percentual?: number;
  impostos_produto?: number;
  comissao_produto?: number;
  instalacao_necessaria?: boolean;
  instalacao_regra_cobranca?: string;
  instalacao_valor_unitario?: number;
  instalacao_preco_cobrado?: number;
  instalacao_custo_mao_obra?: number;
  instalacao_custo_deslocamento?: number;
  instalacao_tempo_estimado_min?: number;
  instalacao_quantidade_pessoas?: number;
  instalacao_usar_endereco_entrega?: boolean;
  instalacao_cep?: string;
  instalacao_logradouro?: string;
  instalacao_numero?: string;
  instalacao_bairro?: string;
  instalacao_cidade?: string;
  instalacao_estado?: string;
};

type PreviewData = {
  resumo: {
    total_produtos: number;
    total_custo_material: number;
    total_custo_maquinaria: number;
    total_custo_mao_obra: number;
    total_custo_indireto: number;
    total_custo_producao: number;
    total_custo_prateleira?: number;
    total_custo_gerencial?: number;
    total_margem_lucro: number;
    total_impostos: number;
    preco_final: number;
    preco_final_calculado?: number;
    valor_final_manual?: number;
    preco_final_manual?: boolean;
    preco_abaixo_custo?: boolean;
    margem_planejada_valor?: number;
    margem_manual_valor?: number;
    margem_manual_percentual?: number;
    margem_consumida_valor?: number;
    margem_consumida_percentual?: number;
    tempo_total_producao: number;
    margem_lucro_percentual: number;
    impostos_percentual: number;
    comissao_percentual: number;
    comissao_total: number;
  };
  produtos: PreviewProduto[];
  entrega?: {
    modalidade_id?: string;
    usar_endereco_cliente: boolean;
    cep?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    prazo_dias?: number;
    valor_cobrado: number;
    custo_estimado: number;
  };
  custosIndiretos: PreviewCustoIndireto[];
  custosIndiretosResumo?: {
    totalMensal: number;
    custoPorHora: number;
    totalRateado: number;
    itens: PreviewCustoIndireto[];
  };
  metadata: {
    timestamp_calculo: Date;
    versao_motor: string;
    tempo_execucao_ms: number;
    estagios_executados?: string[];
  };
};

const PreviewCalculoV2: React.FC<PreviewCalculoV2Props> = ({
  dadosCarregados = true,
  refreshKey = 0,
  itensProdutoCarregados,
  datasets,
  layout = 'sidebar',
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showIndirectCosts, setShowIndirectCosts] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [formSnapshot, setFormSnapshot] = useState<Record<string, unknown> | null>(null);
  /** Cache produto_finito_id → preço de custo do catálogo (fonte de verdade para o preview). */
  const [custosCatalogo, setCustosCatalogo] = useState<Record<string, number>>({});
  const custosBuscadosRef = useRef<Set<string>>(new Set());
  const form = useFormContext<Record<string, unknown>>();
  const { user } = useUser();

  const hookData = useOrcamentoData();
  const insumos = datasets?.insumos ?? hookData.insumos;
  const maquinas = datasets?.maquinas ?? hookData.maquinas;
  const funcoes = datasets?.funcoes ?? hookData.funcoes;
  const servicos = datasets?.servicos ?? hookData.servicos;
  const custosIndiretos = datasets?.custosIndiretos ?? hookData.custosIndiretos;

  useEffect(() => {
    if (!form) {
      return;
    }

    const syncSnapshot = () => {
      try {
        setFormSnapshot(form.getValues() as Record<string, unknown>);
      } catch (error) {
        console.warn('[PreviewCalculoV2] Não foi possível obter valores do formulário', error);
      }
    };

    syncSnapshot();

    const subscription = form.watch(() => {
      syncSnapshot();
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [form]);

  // Após reabrir rascunho / reset, garantir snapshot com todos os itens_produto.
  useEffect(() => {
    if (!form || !dadosCarregados) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          setFormSnapshot(form.getValues() as Record<string, unknown>);
        } catch {
          /* ignora */
        }
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [dadosCarregados, refreshKey, form, insumos.length, maquinas.length, funcoes.length, servicos.length, itensProdutoCarregados]);

  // Busca preço de custo no catálogo para itens de prateleira.
  // Importante: NÃO depender de formSnapshot (mudava a cada tecla e cancelava o fetch
  // marcando o id como "já buscado", travando o custo para sempre).
  useEffect(() => {
    if (!form || !dadosCarregados) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    let cancelado = false;

    const sincronizarCustos = async () => {
      const itens = (form.getValues('itens_produto') as unknown[]) || [];

      for (const item of itens) {
        if (cancelado) return;
        const registro = item as Record<string, unknown>;
        const tipo = String(registro?.tipo_item || '').toUpperCase();
        if (tipo !== 'PRODUTO_FINITO') continue;

        const id = String(registro?.produto_finito_id || '').trim();
        if (!id) continue;

        const unitarioLocal =
          parseCustoPreview(registro?.preco_custo_snapshot) ||
          parseCustoPreview(
            (registro?.produto_finito as { preco_custo?: unknown } | undefined)?.preco_custo,
          ) ||
          (() => {
            const total = parseCustoPreview(registro?.custo_total_producao);
            const qtd = Math.max(parseCustoPreview(registro?.quantidade_produto) || 1, 1);
            return total > 0 ? total / qtd : 0;
          })();

        if (unitarioLocal > 0) {
          setCustosCatalogo((prev) =>
            prev[id] === unitarioLocal ? prev : { ...prev, [id]: unitarioLocal },
          );
          continue;
        }

        if (custosBuscadosRef.current.has(id)) continue;
        custosBuscadosRef.current.add(id);

        try {
          const produto = (await produtosFinitosApi.getParaOrcamento(id, token)) as {
            preco_custo?: unknown;
          };
          const custo = parseCustoPreview(produto?.preco_custo);
          if (cancelado) {
            custosBuscadosRef.current.delete(id);
            return;
          }
          if (custo > 0) {
            setCustosCatalogo((prev) => ({ ...prev, [id]: custo }));
          } else {
            custosBuscadosRef.current.delete(id);
          }
        } catch {
          custosBuscadosRef.current.delete(id);
        }
      }
    };

    void sincronizarCustos();

    return () => {
      cancelado = true;
    };
  }, [form, dadosCarregados, refreshKey]);

  // Hook para dados auxiliares (insumos, maquinas, etc.)
  // Hook para WebSocket em tempo real
  const { 
    connectionStatus,
    isConnected,
    resultadoOrcamento
  } = useCalculoWebSocket({ autoConnect: false });

  // Dados mockados como fallback (mantendo estrutura original)
  const mockData: PreviewData = {
    resumo: {
      total_produtos: 3,
      total_custo_material: 5200.00,
      total_custo_maquinaria: 1015.00,
      total_custo_mao_obra: 565.00,
      total_custo_indireto: 2992.00,
      total_custo_producao: 9772.00,
      total_margem_lucro: 2931.60,
      total_impostos: 1954.40,
      preco_final: 14658.00,
      tempo_total_producao: 25.5,
      margem_lucro_percentual: 30,
      impostos_percentual: 20,
      comissao_percentual: 5,
      comissao_total: 732.90
    },
    produtos: [
      {
        id: '1',
        nome_servico: "Banner",
        descricao: "Banner promocional",
        quantidade: 100,
        dimensoes: { largura: 2, altura: 1, area_produto: 2, unidade_medida: 'm' },
        materiais: [
          { insumo_id: '1', nome: "Vinil Brilho", quantidade: 200, custo_unitario: 15.00, unidade_consumo: 'm2' },
          { insumo_id: '2', nome: "Cordao", quantidade: 600, custo_unitario: 2.50, unidade_consumo: 'm' }
        ],
        maquinas: [
          { maquina_id: '1', nome: "Plotter de Impressao", horas_utilizadas: 15, custo_por_hora: 50.00 }
        ],
        funcoes: [
          { funcao_id: '1', nome: "Operador de Plotter", horas_trabalhadas: 15, custo_por_hora: 30.00 }
        ],
        servicos: [
          { servico_id: '1', nome: "Acabamento", horas_trabalhadas: 10, custo_por_hora: 50.00 }
        ],
        custo_total_producao: 8500.00,
        preco_unitario: 125.00,
        preco_total: 12500.00,
        horas_producao: 20,
        custos_indiretos_rateados: 2300.00
      },
      {
        id: '2',
        nome_servico: "Painel",
        descricao: "Painel ACM com impressao",
        quantidade: 1,
        dimensoes: { largura: 3, altura: 2, area_produto: 6, unidade_medida: 'm' },
        materiais: [
          { insumo_id: '3', nome: "ACM", quantidade: 6, custo_unitario: 80.00, unidade_consumo: 'm2' },
          { insumo_id: '4', nome: "Adesivo", quantidade: 6, custo_unitario: 25.00, unidade_consumo: 'm2' }
        ],
        maquinas: [
          { maquina_id: '2', nome: "Router CNC", horas_utilizadas: 2, custo_por_hora: 120.00 }
        ],
        funcoes: [
          { funcao_id: '2', nome: "Operador CNC", horas_trabalhadas: 2, custo_por_hora: 35.00 }
        ],
        servicos: [
          { servico_id: '2', nome: "Montagem", horas_trabalhadas: 4, custo_por_hora: 40.00 }
        ],
        custo_total_producao: 1700.00,
        preco_unitario: 2500.00,
        preco_total: 2500.00,
        horas_producao: 4,
        custos_indiretos_rateados: 600.00
      },
      {
        id: '3',
        nome_servico: "Expositor PDV",
        descricao: "Expositor para ponto de venda",
        quantidade: 1,
        dimensoes: { largura: 1.5, altura: 0.8, area_produto: 1.2, unidade_medida: 'm' },
        materiais: [
          { insumo_id: '5', nome: "MDF 15mm", quantidade: 2, custo_unitario: 45.00, unidade_consumo: 'chapa' },
          { insumo_id: '6', nome: "Ponteiras", quantidade: 8, custo_unitario: 3.50, unidade_consumo: 'unidade' }
        ],
        maquinas: [
          { maquina_id: '3', nome: "Serra Circular", horas_utilizadas: 1, custo_por_hora: 25.00 }
        ],
        funcoes: [
          { funcao_id: '3', nome: "Marceneiro", horas_trabalhadas: 1, custo_por_hora: 45.00 }
        ],
        servicos: [
          { servico_id: '3', nome: "Acabamento", horas_trabalhadas: 0.5, custo_por_hora: 40.00 }
        ],
        custo_total_producao: 300.00,
        preco_unitario: 750.00,
        preco_total: 750.00,
        horas_producao: 1.5,
        custos_indiretos_rateados: 92.00
      }
    ],
    custosIndiretos: [
      { id: '1', nome: "Aluguel", categoria: "Infraestrutura", valor_mensal: 2000.00, valor_rateado: 1730.40, percentual_rateio: 57.97, ativo: true },
      { id: '2', nome: "Energia Elétrica", categoria: "Serviços", valor_mensal: 800.00, valor_rateado: 692.16, percentual_rateio: 23.19, ativo: true },
      { id: '3', nome: "Água", categoria: "Serviços", valor_mensal: 200.00, valor_rateado: 173.04, percentual_rateio: 5.80, ativo: true },
      { id: '4', nome: "Internet", categoria: "Serviços", valor_mensal: 150.00, valor_rateado: 129.78, percentual_rateio: 4.35, ativo: true },
      { id: '5', nome: "Seguro", categoria: "Seguros", valor_mensal: 300.00, valor_rateado: 266.62, percentual_rateio: 8.70, ativo: true }
    ],
    custosIndiretosResumo: {
      totalMensal: 3450.00,
      custoPorHora: 9.80,
      totalRateado: 2992.00,
      itens: [
        { id: '1', nome: "Aluguel", categoria: "Infraestrutura", valor_mensal: 2000.00, valor_rateado: 1730.40, percentual_rateio: 57.97 },
        { id: '2', nome: "Energia Elétrica", categoria: "Serviços", valor_mensal: 800.00, valor_rateado: 692.16, percentual_rateio: 23.19 },
        { id: '3', nome: "Água", categoria: "Serviços", valor_mensal: 200.00, valor_rateado: 173.04, percentual_rateio: 5.80 },
        { id: '4', nome: "Internet", categoria: "Serviços", valor_mensal: 150.00, valor_rateado: 129.78, percentual_rateio: 4.35 },
        { id: '5', nome: "Seguro", categoria: "Seguros", valor_mensal: 300.00, valor_rateado: 266.62, percentual_rateio: 8.70 }
      ]
    },
    metadata: {
      timestamp_calculo: new Date(),
      versao_motor: '2.1.3',
      tempo_execucao_ms: 245,
      estagios_executados: ['validacao', 'materiais', 'maquinas', 'funcoes', 'custos_indiretos', 'margem_lucro', 'impostos']
    }
  };

  // Toggle de expansao de itens
  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Formatar dimensoes
  const formatarDimensoes = (dimensoes: Record<string, unknown>): string => {
    const unidade = typeof dimensoes.unidade_medida === 'string' ? dimensoes.unidade_medida : '';
    const largura = typeof dimensoes.largura === 'number' || typeof dimensoes.largura === 'string' ? dimensoes.largura : 0;
    const altura = typeof dimensoes.altura === 'number' || typeof dimensoes.altura === 'string' ? dimensoes.altura : 0;
    if (unidade === 'm') {
      return `${largura}x${altura}m`;
    }
    return `${largura}x${altura}${unidade}`;
  };

  // Formatar consumo de material
  const formatarConsumoMaterial = (material: Record<string, unknown>): string => {
    const quantidade = typeof material.quantidade === 'number' || typeof material.quantidade === 'string' ? material.quantidade : 0;
    const unidade = typeof material.unidade_consumo === 'string' ? material.unidade_consumo : '';
    return `${quantidade} ${unidade}`;
  };

  // Formatar horas
  const formatarHoras = (horas: number): string => {
    if (!Number.isFinite(horas) || horas <= 0) {
      return '0min';
    }

    const horasInteiras = Math.floor(horas);
    let minutos = Math.round((horas - horasInteiras) * 60);

    let horasAjustadas = horasInteiras;
    if (minutos === 60) {
      horasAjustadas += 1;
      minutos = 0;
    }

    if (horasAjustadas > 0 && minutos > 0) {
      return `${horasAjustadas}h${minutos.toString().padStart(2, '0')}min`;
    }

    if (horasAjustadas > 0) {
      return `${horasAjustadas}h`;
    }

    return `${minutos}min`;
  };

  // Formatar valores monetários (aceita números ou "Aguardando...")
  const formatarValor = (valor: unknown): string => {
    if (typeof valor === 'string') {
      return valor;
    }

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    return '0,00';
  };

  const formatarNumero = (numero: unknown): string => {
    if (typeof numero === 'string') {
      return numero;
    }

    if (typeof numero === 'number' && Number.isFinite(numero)) {
      return numero.toLocaleString('pt-BR', {
        maximumFractionDigits: 2,
      });
    }

    return '0';
  };

  const injetarCustosCatalogoNosItens = (
    formData: Record<string, unknown>,
  ): Record<string, unknown> => {
    const itens = Array.isArray(formData.itens_produto)
      ? (formData.itens_produto as Record<string, unknown>[])
      : [];
    if (itens.length === 0 || Object.keys(custosCatalogo).length === 0) {
      return formData;
    }

    const itensComCusto = itens.map((item) => {
      const tipo = String(item?.tipo_item || '').toUpperCase();
      if (tipo !== 'PRODUTO_FINITO') return item;
      const id = String(item?.produto_finito_id || '').trim();
      const custoCatalogo = id ? custosCatalogo[id] : 0;
      if (!(custoCatalogo > 0)) return item;

      const qtd = Math.max(parseCustoPreview(item?.quantidade_produto) || 1, 1);
      const snapshotAtual = parseCustoPreview(item?.preco_custo_snapshot);
      const totalAtual = parseCustoPreview(item?.custo_total_producao);
      const pf = (item?.produto_finito as Record<string, unknown> | undefined) || {};

      return {
        ...item,
        preco_custo_snapshot:
          snapshotAtual > 0 ? String(snapshotAtual) : String(custoCatalogo),
        custo_total_producao: totalAtual > 0 ? totalAtual : custoCatalogo * qtd,
        produto_finito: {
          ...pf,
          preco_custo:
            parseCustoPreview(pf.preco_custo) > 0 ? pf.preco_custo : custoCatalogo,
        },
      };
    });

    return { ...formData, itens_produto: itensComCusto };
  };

  const montarPreviewFormulario = (formData: Record<string, unknown>): PreviewData | null => {
    const formDataComCusto = injetarCustosCatalogoNosItens(formData);
    const carregadosComCusto = Array.isArray(itensProdutoCarregados)
      ? ((injetarCustosCatalogoNosItens({ itens_produto: itensProdutoCarregados })
          .itens_produto as unknown[]) ?? itensProdutoCarregados)
      : itensProdutoCarregados;
    return montarPreviewOrcamento(formDataComCusto, {
      datasets: { insumos, maquinas, funcoes, servicos, custosIndiretos },
      loja: user?.loja,
      itensProdutoCarregados: carregadosComCusto,
    }) as PreviewData | null;
  };

  const processarDadosReais = (): PreviewData => {
    if (form) {
      try {
        // Sempre ler estado atual do RHF (formSnapshot pode ficar defasado após reset).
        const formData = form.getValues() as Record<string, unknown>;
        const previewFormulario = montarPreviewFormulario(formData);
        if (previewFormulario) {
          return previewFormulario;
        }
      } catch (error) {
        console.error('[PreviewCalculoV2] Erro no preview local', error);
      }
    }

    if (resultadoOrcamento?.resultado) {
      const resultadoMotor = resultadoOrcamento.resultado as Partial<PreviewData>;
      if (
        resultadoMotor &&
        typeof resultadoMotor === 'object' &&
        resultadoMotor.resumo &&
        Array.isArray(resultadoMotor.produtos)
      ) {
        const metadataMotor = (resultadoMotor.metadata ?? {}) as Partial<PreviewData['metadata']>;
        return {
          ...mockData,
          ...resultadoMotor,
          metadata: {
            ...mockData.metadata,
            ...metadataMotor,
            timestamp_calculo: new Date(),
            versao_motor:
              resultadoOrcamento.versao_motor || metadataMotor.versao_motor || '2.0.0',
            tempo_execucao_ms:
              resultadoOrcamento.tempo_execucao_ms ?? metadataMotor.tempo_execucao_ms ?? 0,
          },
        };
      }
    }

    return mockData;
  };
  // Usar dados reais se disponíveis, senão usar mockados
  const data: PreviewData = (() => {
    void formSnapshot;
    void custosCatalogo;
    console.debug('[PreviewCalculoV2] Estados', {
      form: !!form,
      dadosCarregados,
      isConnected,
      connectionStatus,
      resultadoOrcamento: !!resultadoOrcamento,
      resultadoOrcamento_detalhes: resultadoOrcamento
    });

    if (form && dadosCarregados) {
      const dadosReais = processarDadosReais();
      console.debug('[PreviewCalculoV2] Dados processados', dadosReais);
      return dadosReais;
    }
    
    console.debug('[PreviewCalculoV2] Usando mockData porque', {
      form: !!form,
      dadosCarregados,
      motivo: !form ? 'sem formulário' : !dadosCarregados ? 'dados não carregados' : 'desconhecido'
    });
    
    // TEMPORARIO: Vamos forcar usar dados reais mesmo sem form completo
    if (form) {
      console.debug('[PreviewCalculoV2] Forcando processamento de dados reais...');
      const dadosReais = processarDadosReais();
      console.debug('[PreviewCalculoV2] Dados reais processados', dadosReais);
      return dadosReais;
    }
    
    return mockData;
  })();

  // Calcular total dos custos indiretos
  const totalCustosIndiretos = typeof data?.custosIndiretosResumo?.totalRateado === 'number'
    ? data.custosIndiretosResumo.totalRateado
    : data.custosIndiretos.reduce((total: number, custo: PreviewCustoIndireto) => {
        if (typeof custo?.valor_rateado === 'number') {
          return total + custo.valor_rateado;
        }
        if (typeof custo?.valor_mensal === 'number') {
          return total + custo.valor_mensal;
        }
        return total;
      }, 0);

  const enderecoEntrega = data.entrega
    ? [
        data.entrega.logradouro,
        data.entrega.numero,
        data.entrega.bairro,
        data.entrega.cidade,
        data.entrega.estado,
        data.entrega.cep,
      ].filter(Boolean).join(', ')
    : '';

  const regraInstalacaoLabel: Record<string, string> = {
    FIXO: 'Valor fixo',
    POR_M2: 'Por m² instalado',
    POR_ML: 'Por metro linear',
    POR_UNIDADE: 'Por unidade',
    POR_HORA: 'Por hora/equipe',
    MANUAL: 'Manual',
  };

  // Se nao ha dados, mostrar estado vazio
  if (!data) {
    const emptyBody = (
      <div
        className={cn(
        layout === 'plain' || layout === 'mobile-dock'
            ? 'flex flex-col bg-background'
            : 'sticky top-6 flex max-h-[calc(100vh-3rem)] flex-col rounded-lg border bg-white shadow-sm',
        )}
      >
        <div className="border-b border-gray-100 p-6 pb-4">
          <div className="mb-2 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Preview do Cálculo</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            Cálculo local
          </Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <div className="py-8 text-center text-gray-500">
            <Calculator className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p>Nenhum cálculo disponível</p>
            <p className="text-sm">Adicione produtos para ver o preview</p>
          </div>
        </div>
      </div>
    );

    if (layout === 'mobile-dock') {
      return (
        <MobileDockShell
          totalLabel="0,00"
          open={dockOpen}
          onOpenChange={setDockOpen}
        >
          {emptyBody}
        </MobileDockShell>
      );
    }

    return emptyBody;
  }

  const connectionBadgeLabel = isConnected
    ? 'Tempo real ativo'
    : connectionStatus === 'connecting'
      ? 'Conectando...'
      : 'Cálculo local';

  const previewBody = (
    <div
      className={cn(
        'flex flex-col',
        layout === 'plain' || layout === 'mobile-dock'
          ? 'bg-background'
          : 'sticky top-6 max-h-[calc(100vh-3rem)] rounded-lg border bg-white shadow-sm',
      )}
    >
      {/* Header fixo */}
      <div className="border-b border-gray-100 p-6 pb-4">
        <div className="mb-2 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Preview do Cálculo</h2>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${
            isConnected
              ? 'border-green-200 text-green-600'
              : 'border-blue-200 text-blue-700'
          }`}
        >
          {connectionBadgeLabel}
        </Badge>
      </div>

      {/* Conteudo com scroll */}
      <div className="flex-1 overflow-y-auto p-6 pt-4">
        <div className="space-y-4">
        {/* Resumo do Orçamento */}
        <div>
          <div className="pb-3">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Package className="h-4 w-4" />
              Resumo do Orçamento
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Valor Total (Venda)</span>
              <span className="text-lg font-bold text-green-600">
                R$ {formatarValor(data.resumo.preco_final)}
              </span>
            </div>
            {data.resumo.preco_final_manual && (
              <div
                className={`rounded-md border p-3 text-sm ${
                  data.resumo.preco_abaixo_custo
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : (data.resumo.margem_consumida_valor ?? 0) > 0
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-green-200 bg-green-50 text-green-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium">
                      {data.resumo.preco_abaixo_custo
                        ? 'Valor final manual abaixo do custo de produção.'
                        : (data.resumo.margem_consumida_valor ?? 0) > 0
                          ? 'Valor manual reduziu a margem prevista.'
                          : 'Valor manual preserva ou aumenta a margem prevista.'}
                    </p>
                    <div className="space-y-0.5 text-xs">
                      {data.resumo.preco_final_calculado !== undefined && (
                        <p>
                          Preço calculado: R$ {formatarValor(data.resumo.preco_final_calculado)}
                        </p>
                      )}
                      {data.resumo.margem_planejada_valor !== undefined && (
                        <p>
                          Margem prevista: R$ {formatarValor(data.resumo.margem_planejada_valor)}
                        </p>
                      )}
                      {data.resumo.margem_consumida_valor !== undefined && (
                        <p>
                          {data.resumo.margem_consumida_valor > 0
                            ? 'Margem consumida'
                            : 'Margem adicional'}
                          : R$ {formatarValor(Math.abs(data.resumo.margem_consumida_valor))}
                          {data.resumo.margem_consumida_percentual !== undefined
                            ? ` (${formatarNumero(Math.abs(data.resumo.margem_consumida_percentual))}% da margem prevista)`
                            : ''}
                        </p>
                      )}
                      {data.resumo.margem_manual_valor !== undefined && (
                        <p>
                          {data.resumo.margem_manual_valor >= 0
                            ? 'Margem restante'
                            : 'Prejuízo estimado'}
                          : R$ {formatarValor(Math.abs(data.resumo.margem_manual_valor))}
                          {data.resumo.margem_manual_percentual !== undefined
                            ? ` (${formatarNumero(data.resumo.margem_manual_percentual)}% sobre a venda)`
                            : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Preços de venda por produto */}
            <div className="space-y-2 text-sm">
              {data.produtos.map((produto: PreviewProduto) => (
                <div key={produto.id}>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      {produto.nome_servico}
                    </span>
                    <span className="text-gray-700 font-medium">
                      R$ {formatarValor(produto.preco_venda_total)} ({formatarNumero(produto.quantidade)})
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-xs text-gray-500">
                      R$ {formatarValor(produto.preco_venda_unitario)}/un
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Custo de Produção</span>
                <span>
                  R${' '}
                  {formatarValor(
                    data.resumo.total_custo_gerencial ?? data.resumo.total_custo_producao,
                  )}
                </span>
              </div>
              {(data.resumo.total_custo_prateleira ?? 0) > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Inclui custo de prateleira (informativo)</span>
                  <span>R$ {formatarValor(data.resumo.total_custo_prateleira)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Margem de Lucro ({data.resumo.margem_lucro_percentual}%)</span>
                <span className="text-green-600">+R$ {formatarValor(data.resumo.total_margem_lucro)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impostos ({data.resumo.impostos_percentual}%)</span>
                <span className="text-red-600">+R$ {formatarValor(data.resumo.total_impostos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Comissão ({data.resumo.comissao_percentual}%)</span>
                <span className="text-orange-600">+R$ {formatarValor(data.resumo.comissao_total)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-gray-600">Horas Totais</span>
              </div>
              <span>{formatarNumero(data.resumo.tempo_total_producao)}h</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Itens no Orçamento</span>
              <span>{data.resumo.total_produtos}</span>
            </div>
          </div>

        </div>

        {/* Separador */}
        <Separator className="my-6" />

        {/* Detalhamento por Produto */}
        <div>
          <div className="pb-3">
            <h3 className="text-base font-semibold">Produtos no Orçamento</h3>
          </div>
          <div className="space-y-3">
            {data.produtos.map((produto: PreviewProduto, index: number) => (
              <div key={produto.id}>
                {index > 0 && <Separator className="my-3" />}
                <div className="p-3">
                {/* Nome do produto - linha separada em bold */}
                <div className="mb-2">
                  <h4 className="font-bold text-sm">{produto.nome_servico}</h4>
                </div>

                {/* Dimensões + descrição - linha separada, fonte menor */}
                <div className="mb-2">
                  <p className="text-xs text-gray-500">
                    {produto.tipo_item === 'PRODUTO_FINITO'
                      ? produto.descricao
                      : `${formatarDimensoes(produto.dimensoes)} - ${produto.descricao}`}
                  </p>
                </div>

                {produto.tipo_item === 'PRODUTO_FINITO' ? (
                  (() => {
                    const finitoId = String(produto.produto_finito_id || '').trim();
                    const custoUnitarioEfetivo =
                      parseCustoPreview(produto.preco_custo_unitario) ||
                      (finitoId ? custosCatalogo[finitoId] || 0 : 0) ||
                      parseCustoPreview(produto.custo_total_producao) /
                        Math.max(produto.quantidade, 1);
                    const custoTotalEfetivo = custoUnitarioEfetivo * Math.max(produto.quantidade, 1);
                    const precoVendaTotal = parseCustoPreview(
                      produto.preco_venda_total ?? produto.preco_total,
                    );
                    const margemEfetiva =
                      custoTotalEfetivo > 0 && precoVendaTotal > 0
                        ? precoVendaTotal - custoTotalEfetivo
                        : parseCustoPreview(produto.margem_lucro_produto);
                    const margemPct =
                      custoTotalEfetivo > 0 && precoVendaTotal > 0
                        ? (margemEfetiva / precoVendaTotal) * 100
                        : parseCustoPreview(produto.margem_bruta_percentual);
                    const custoVisivel = custoUnitarioEfetivo > 0;

                    return (
                  <div className="mb-3 space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span>Preço ao cliente</span>
                      <span>
                        R$ {formatarValor(produto.preco_venda_total ?? produto.preco_total)} (
                        {formatarNumero(produto.quantidade)} unid)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>Preço unitário de venda</span>
                      <span>
                        R${' '}
                        {formatarValor(
                          produto.preco_venda_unitario ??
                            Number(produto.preco_venda_total || 0) / Math.max(produto.quantidade, 1),
                        )}
                        /un
                      </span>
                    </div>
                    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50/80 p-2 space-y-1.5">
                      <p className="text-[11px] font-medium text-gray-700">
                        Gestão interna — não altera a proposta
                      </p>
                      {custoVisivel ? (
                        <>
                          <div className="flex justify-between items-center text-xs text-gray-600">
                            <span>Custo interno</span>
                            <span>
                              R$ {formatarValor(custoTotalEfetivo)} (
                              {formatarNumero(produto.quantidade)} unid)
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-600">
                            <span>Custo unitário</span>
                            <span>
                              R$ {formatarValor(custoUnitarioEfetivo)}/un
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-medium text-green-700">
                            <span>Margem bruta (ganho real)</span>
                            <span>
                              R$ {formatarValor(margemEfetiva)}
                              {margemPct > 0 ? ` (${formatarNumero(margemPct)}%)` : ''}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-amber-700">
                          Custo não informado no cadastro do produto. Preencha o preço de custo
                          para ver a margem real.
                        </p>
                      )}
                    </div>
                  </div>
                    );
                  })()
                ) : (
                  <>
                    {/* Custo Total de Produção com quantidade - linha separada */}
                    <div className="mb-1">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span>Custo Total de Produção</span>
                        <span>
                          R$ {formatarValor(produto.custo_total_producao)} (
                          {formatarNumero(produto.quantidade)}/unid)
                        </span>
                      </div>
                    </div>

                    {/* Custo unitário de produção - linha separada */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>Custo unitário de produção</span>
                        <span>
                          R${' '}
                          {formatarValor(
                            produto.custo_total_producao / Math.max(produto.quantidade, 1),
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Informações de produção */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Horas de Produção</span>
                        <span>{formatarNumero(produto.horas_producao)}h</span>
                      </div>
                    </div>
                  </>
                )}

                {produto.instalacao_necessaria && (
                  <div className="mt-3 rounded-md border border-gray-100 bg-gray-50 p-2 text-xs">
                    <div className="mb-1 flex items-center justify-between gap-3 font-semibold text-gray-900">
                      <span>Instalação</span>
                      <span>R$ {formatarValor(produto.instalacao_preco_cobrado ?? 0)}</span>
                    </div>
                    <div className="space-y-1 text-gray-600">
                      <div className="flex justify-between gap-3">
                        <span>Regra</span>
                        <span>
                          {regraInstalacaoLabel[produto.instalacao_regra_cobranca || 'FIXO'] || 'Valor fixo'}
                          {produto.instalacao_valor_unitario
                            ? ` / R$ ${formatarValor(produto.instalacao_valor_unitario)}`
                            : ''}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Custo de mão de obra</span>
                        <span>R$ {formatarValor(produto.instalacao_custo_mao_obra ?? 0)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Custo de deslocamento</span>
                        <span>R$ {formatarValor(produto.instalacao_custo_deslocamento ?? 0)}</span>
                      </div>
                      {(produto.instalacao_tempo_estimado_min || produto.instalacao_quantidade_pessoas) && (
                        <div className="flex justify-between gap-3">
                          <span>Equipe e tempo</span>
                          <span>
                            {produto.instalacao_quantidade_pessoas
                              ? `${produto.instalacao_quantidade_pessoas} pessoa(s)`
                              : 'Equipe não informada'}
                            {produto.instalacao_tempo_estimado_min
                              ? ` / ${produto.instalacao_tempo_estimado_min}min`
                              : ''}
                          </span>
                        </div>
                      )}
                      {produto.instalacao_usar_endereco_entrega === false && (
                        <div className="pt-1 text-gray-500">
                          {[
                            produto.instalacao_logradouro,
                            produto.instalacao_numero,
                            produto.instalacao_bairro,
                            produto.instalacao_cidade,
                            produto.instalacao_estado,
                            produto.instalacao_cep,
                          ].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {produto.tipo_item !== 'PRODUTO_FINITO' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 h-7 text-xs"
                  onClick={() => toggleItemExpansion(produto.id)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver Detalhes de Custo
                  {expandedItems[produto.id] ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
                )}

                {produto.tipo_item !== 'PRODUTO_FINITO' && expandedItems[produto.id] && (
                  <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                    {/* Materiais */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Materiais</h5>
                      <div className="space-y-1">
                        {produto.materiais.map((material: PreviewMaterial, idx: number) => (
                          <div key={idx} className="flex justify-between items-start text-xs">
                            <div className="flex-1 pr-2 min-w-0">
                              <div className="font-medium break-words">{material.nome}</div>
                              <div className="text-gray-500 break-words">
                                {formatarConsumoMaterial(material)} - R$ {formatarValor(material.custo_unitario)}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 whitespace-nowrap">
                              R$ {formatarValor(material.quantidade * material.custo_unitario)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                {/* Máquinas */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Máquinas</h5>
                      <div className="space-y-1">
                        {produto.maquinas.map((maquina: PreviewMaquina, idx: number) => (
                          <div key={idx} className="flex justify-between items-start text-xs">
                            <div className="flex-1 pr-2 min-w-0">
                              <div className="font-medium break-words">{maquina.nome}</div>
                              <div className="text-gray-500 break-words">
                                {formatarHoras(maquina.horas_utilizadas)} - R$ {formatarValor(maquina.custo_por_hora)}/h
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 whitespace-nowrap">
                              R$ {formatarValor(maquina.horas_utilizadas * maquina.custo_por_hora)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Funções */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Mão de Obra</h5>
                      <div className="space-y-1">
                        {produto.funcoes.map((funcao: PreviewFuncao, idx: number) => (
                          <div key={idx} className="flex justify-between items-start text-xs">
                            <div className="flex-1 pr-2 min-w-0">
                              <div className="font-medium break-words">{funcao.nome}</div>
                              <div className="text-gray-500 break-words">
                                {formatarHoras(funcao.horas_trabalhadas)} - R$ {formatarValor(funcao.custo_por_hora)}/h
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 whitespace-nowrap">
                              R$ {formatarValor(funcao.horas_trabalhadas * funcao.custo_por_hora)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Serviços Manuais */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Serviços Manuais</h5>
                      <div className="space-y-1">
                        {produto.servicos.map((servico: PreviewFuncao, idx: number) => (
                          <div key={idx} className="flex justify-between items-start text-xs">
                            <div className="flex-1 pr-2 min-w-0">
                              <div className="font-medium break-words">{servico.nome}</div>
                              <div className="text-gray-500 break-words">
                                {formatarHoras(servico.horas_trabalhadas)} - R$ {formatarValor(servico.custo_por_hora)}/h
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 whitespace-nowrap">
                              R$ {formatarValor(servico.horas_trabalhadas * servico.custo_por_hora)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Custos Indiretos Rateados */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Custos Indiretos (Rateados)</h5>
                      <div className="flex justify-between text-xs">
                        <span>Total rateado para este item</span>
                        <span>R$ {formatarValor(produto.custos_indiretos_rateados)}</span>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Separador */}
        <Separator className="my-6" />

        {data.entrega && (
          <>
            <div>
              <div className="pb-3">
                <h3 className="text-base font-semibold">Entrega</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Valor cobrado</span>
                  <span className="font-semibold">
                    R$ {formatarValor(data.entrega.valor_cobrado)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-xs text-gray-600">
                  <span>Custo estimado</span>
                  <span>R$ {formatarValor(data.entrega.custo_estimado)}</span>
                </div>
                {data.entrega.prazo_dias && (
                  <div className="flex justify-between gap-3 text-xs text-gray-600">
                    <span>Prazo</span>
                    <span>{data.entrega.prazo_dias} dia(s)</span>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {data.entrega.usar_endereco_cliente
                    ? 'Endereço do cliente'
                    : enderecoEntrega || 'Endereço de entrega não informado'}
                </div>
              </div>
            </div>

            <Separator className="my-6" />
          </>
        )}

        {/* Custos Indiretos Globais */}
        <div>
          <div className="pb-3">
            <h3 className="text-base font-semibold">Custos Indiretos</h3>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Total dos Custos Indiretos</span>
              <span className="font-semibold">
                R$ {formatarValor(totalCustosIndiretos)}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => setShowIndirectCosts(!showIndirectCosts)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver Detalhes
              {showIndirectCosts ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>

            {showIndirectCosts && (
              <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                {(!data.custosIndiretos || data.custosIndiretos.length === 0) ? (
                  <p className="text-xs text-muted-foreground">Nenhum custo indireto cadastrado.</p>
                ) : data.custosIndiretos.map((custo: PreviewCustoIndireto) => (
                  <div key={custo.id} className="flex justify-between items-start text-xs">
                    <div className="flex-1 pr-2 min-w-0">
                      <div className="break-words">{custo.nome}</div>
                      <div className="text-[10px] text-gray-500 break-words">
                        Mensal: R$ {formatarValor(custo.valor_mensal)} - {formatarNumero(custo.percentual_rateio ?? 0)}%
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 whitespace-nowrap">
                      <div>R$ {formatarValor(typeof custo.valor_rateado === 'number' ? custo.valor_rateado : custo.valor_mensal)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Separador */}
        <Separator className="my-6" />

        {/* Informações de Sistema */}
        <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded">
          <div className="mb-1 font-medium text-gray-600">
            Valor estimado (pequenas variações de centavos são normais)
          </div>
          <div>Última atualização: {data.metadata.timestamp_calculo.toLocaleTimeString('pt-BR')}</div>
          <div className="mt-1">Versão do cálculo: {data.metadata.versao_motor}</div>
          <div className="mt-1">Tempo de execução: {data.metadata.tempo_execucao_ms}ms</div>
        </div>
        </div>
      </div>
    </div>
  );

  if (layout === 'mobile-dock') {
    return (
      <MobileDockShell
        totalLabel={formatarValor(data.resumo.preco_final ?? 0)}
        open={dockOpen}
        onOpenChange={setDockOpen}
      >
        {previewBody}
      </MobileDockShell>
    );
  }

  return previewBody;
};

function MobileDockShell({
  totalLabel,
  open,
  onOpenChange,
  children,
}: {
  totalLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-x-0 z-30 border-t border-[#1254d4] bg-[#1764F5] text-white',
          'shadow-[0_-4px_16px_rgba(23,100,245,0.28)]',
          'bottom-[calc(3.5rem+env(safe-area-inset-bottom))]',
        )}
      >
        <Button
          type="button"
          variant="ghost"
          className="h-14 w-full justify-between gap-3 rounded-none px-4 text-white hover:bg-white/15 hover:text-white"
          onClick={() => onOpenChange(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Calculator className="h-5 w-5 shrink-0" />
            <span className="truncate text-sm font-medium">Total venda</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-base font-bold tabular-nums">R$ {totalLabel}</span>
            <ChevronUp className="h-4 w-4 opacity-90" />
          </span>
        </Button>
      </div>
      <div className="h-14" aria-hidden />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className={cn(
            'top-auto bottom-0 left-0 right-0 flex max-h-[88dvh] w-full max-w-none flex-col gap-0 overflow-hidden p-0',
            'translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-x-0 border-b-0',
            'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
            'data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100',
          )}
        >
          <DialogHeader className="shrink-0 border-b px-4 py-3 text-left">
            <DialogTitle>Preview do cálculo</DialogTitle>
            <DialogDescription>
              Detalhamento do orçamento. Role para ver custos e margens.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PreviewCalculoV2;








































