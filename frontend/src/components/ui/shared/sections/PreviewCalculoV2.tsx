'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Eye, Calculator, Clock, Package, AlertCircle } from 'lucide-react';
import { calcularProdutosPreview } from '../utils/preview-calculo.helpers';
import { useOrcamentoData } from '../../orcamento/hooks/useOrcamentoData';
import { useCalculoWebSocket } from '@/hooks/use-calculo-websocket';

interface PreviewCalculoV2Props {
  variant?: 'orcamento' | 'produto';
  showAllProducts?: boolean;
  dadosCarregados?: boolean;
}

const PreviewCalculoV2: React.FC<PreviewCalculoV2Props> = ({
  variant = 'orcamento',
  showAllProducts = true,
  dadosCarregados = true
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showIndirectCosts, setShowIndirectCosts] = useState(false);
  const [formSnapshot, setFormSnapshot] = useState<any | null>(null);
  
  // Tentar obter contexto do formulario (se disponivel)
  let form: any = null;
  try {
    form = useFormContext();
  } catch {
    // Formulario nao disponivel - usar dados mockados
  }

  useEffect(() => {
    if (!form) {
      return;
    }

    try {
      setFormSnapshot(form.getValues());
    } catch (error) {
      console.warn('[PreviewCalculoV2] Nao foi possivel obter valores iniciais do formulario', error);
    }

    const subscription = form.watch((values: any) => {
      setFormSnapshot(values);
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [form]);

  // Hook para dados auxiliares (insumos, maquinas, etc.)
  const { insumos, maquinas, funcoes, servicos, custosIndiretos } = useOrcamentoData();

  // Hook para WebSocket em tempo real
  const { 
    connectionStatus,
    isConnected,
    executarCalculoOrcamento,
    resultadoOrcamento
  } = useCalculoWebSocket();

  // Dados mockados como fallback (mantendo estrutura original)
  const mockData = {
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
      { id: '2', nome: "Energia Eletrica", categoria: "Servicos", valor_mensal: 800.00, valor_rateado: 692.16, percentual_rateio: 23.19, ativo: true },
      { id: '3', nome: "Agua", categoria: "Servicos", valor_mensal: 200.00, valor_rateado: 173.04, percentual_rateio: 5.80, ativo: true },
      { id: '4', nome: "Internet", categoria: "Servicos", valor_mensal: 150.00, valor_rateado: 129.78, percentual_rateio: 4.35, ativo: true },
      { id: '5', nome: "Seguro", categoria: "Seguros", valor_mensal: 300.00, valor_rateado: 266.62, percentual_rateio: 8.70, ativo: true }
    ],
    custosIndiretosResumo: {
      totalMensal: 3450.00,
      custoPorHora: 9.80,
      totalRateado: 2992.00,
      itens: [
        { id: '1', nome: "Aluguel", categoria: "Infraestrutura", valor_mensal: 2000.00, valor_rateado: 1730.40, percentual_rateio: 57.97 },
        { id: '2', nome: "Energia Eletrica", categoria: "Servicos", valor_mensal: 800.00, valor_rateado: 692.16, percentual_rateio: 23.19 },
        { id: '3', nome: "Agua", categoria: "Servicos", valor_mensal: 200.00, valor_rateado: 173.04, percentual_rateio: 5.80 },
        { id: '4', nome: "Internet", categoria: "Servicos", valor_mensal: 150.00, valor_rateado: 129.78, percentual_rateio: 4.35 },
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
  const formatarDimensoes = (dimensoes: any): string => {
    if (dimensoes.unidade_medida === 'm') {
      return `${dimensoes.largura}x${dimensoes.altura}m`;
    }
    return `${dimensoes.largura}x${dimensoes.altura}${dimensoes.unidade_medida}`;
  };

  // Formatar consumo de material
  const formatarConsumoMaterial = (material: any): string => {
    return `${material.quantidade} ${material.unidade_consumo}`;
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

  // Formatar valores monetarios (aceita numeros ou "Aguardando...")
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

  const parsePercentual = (value: unknown, fallback: number): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = Number(value.replace(',', '.'));
      if (Number.isFinite(normalized)) {
        return normalized;
      }
    }

    return fallback;
  };

  const criarEstadoVazio = (
    margemPercentual: number,
    impostosPercentual: number,
    comissaoPercentual: number,
    custosIndiretosPercentual: number,
  ) => {
    const itensIndiretos = (custosIndiretos || []).map((custo, index) => {
      const valorMensal = Number(custo?.valor_mensal) || 0;
      const nomeBase = typeof custo?.nome === 'string' && custo.nome.trim().length > 0 ? custo.nome : `Custo indireto ${index + 1}`;
      const categoriaBase = typeof custo?.categoria === 'string' && custo.categoria.trim().length > 0 ? custo.categoria : 'Geral';

      return {
        id: custo?.id ? String(custo.id) : `custo_${index}`,
        nome: nomeBase,
        categoria: categoriaBase,
        valor_mensal: valorMensal,
        valor_rateado: 0,
        percentual_rateio: 0,
      };
    });

    const totalMensal = itensIndiretos.reduce((acc, item) => acc + item.valor_mensal, 0);
    const itensComPercentual = itensIndiretos.map((item) => ({
      ...item,
      percentual_rateio: totalMensal > 0 ? (item.valor_mensal / totalMensal) * 100 : 0,
    }));

    return {
      resumo: {
        total_produtos: 0,
        total_custo_material: 0,
        total_custo_maquinaria: 0,
        total_custo_mao_obra: 0,
        total_custo_indireto: 0,
        total_custo_producao: 0,
        total_margem_lucro: 0,
        total_impostos: 0,
        preco_final: 0,
        tempo_total_producao: 0,
        margem_lucro_percentual: margemPercentual,
        impostos_percentual: impostosPercentual,
        comissao_percentual: comissaoPercentual,
        comissao_total: 0,
      },
      produtos: [],
      custosIndiretos: itensComPercentual,
      custosIndiretosResumo: {
        totalMensal,
        custoPorHora: 0,
        totalRateado: 0,
        itens: itensComPercentual,
      },
      metadata: {
        timestamp_calculo: new Date(),
        versao_motor: 'preview-local',
        tempo_execucao_ms: 0,
        estagios_executados: [],
      },
    };
  };
  const sanitizeDescricao = (descricao: unknown, fallback: string): string => {
    if (typeof descricao !== 'string') {
      return fallback.trim();
    }

    const normalized = descricao
      .normalize('NFC')
      .replace(/[ --ÂŸ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return normalized.length > 0 ? normalized : fallback.trim();
  };

  const montarPreviewFormulario = (formData: any) => {
    const itensFormulario = Array.isArray(formData?.itens_produto) ? formData.itens_produto : [];
    if (itensFormulario.length === 0) {
      return null;
    }

    const custosIndiretosPercentual = parsePercentual(formData?.custos_indiretos_percentual, 15);
    const margemPercentual = parsePercentual(formData?.margem_lucro_customizada, 30);
    const impostosPercentual = parsePercentual(formData?.impostos_customizados, 18);
    const comissaoPercentual = parsePercentual(formData?.comissao_percentual, 5);

    const previewCalculado = calcularProdutosPreview(
      itensFormulario,
      { insumos, maquinas, funcoes, servicos, custosIndiretos },
      custosIndiretosPercentual,
      margemPercentual,
      impostosPercentual,
    );

    const produtosPreview = previewCalculado.produtos;
    if (produtosPreview.length === 0) {
      return null;
    }

    const totais = previewCalculado.totais;
    const resumoIndiretos = previewCalculado.custosIndiretosResumo ?? {
      totalMensal: totais.indiretos,
      custoPorHora: 0,
      totalRateado: totais.indiretos,
      itens: [],
    };

    const produtosNormalizados = produtosPreview.map((produto, index) => {
      const fallbackDescricao = itensFormulario[index]?.descricao?.trim() || `Descrição do produto ${index + 1}`;
      return {
        ...produto,
        descricao: sanitizeDescricao(produto.descricao, fallbackDescricao),
      };
    });

    const totalCustoMaterial = totais.materiais;
    const totalCustoMaquinaria = totais.maquinas;
    const totalCustoServicos = totais.servicos;
    const totalCustoFuncoes = totais.funcoes;
    const totalCustoIndireto = resumoIndiretos.totalRateado ?? totais.indiretos;
    const totalHoras = totais.horas;

    const totalCustoProducao =
      totalCustoMaterial + totalCustoMaquinaria + totalCustoFuncoes + totalCustoServicos + totalCustoIndireto;

    const totalMargemLucro = totalCustoProducao * (margemPercentual / 100);
    const subtotalComLucro = totalCustoProducao + totalMargemLucro;
    const totalImpostos = subtotalComLucro * (impostosPercentual / 100);
    const precoFinal = subtotalComLucro + totalImpostos;
    const comissaoTotal = precoFinal * (comissaoPercentual / 100);

    return {
      resumo: {
        total_produtos: produtosNormalizados.length,
        total_custo_material: totalCustoMaterial,
        total_custo_maquinaria: totalCustoMaquinaria,
        total_custo_mao_obra: totalCustoFuncoes + totalCustoServicos,
        total_custo_indireto: totalCustoIndireto,
        total_custo_producao: totalCustoProducao,
        total_margem_lucro: totalMargemLucro,
        total_impostos: totalImpostos,
        preco_final: precoFinal,
        tempo_total_producao: totalHoras,
        margem_lucro_percentual: margemPercentual,
        impostos_percentual: impostosPercentual,
        comissao_percentual: comissaoPercentual,
        comissao_total: comissaoTotal,
      },
      produtos: produtosNormalizados,
      custosIndiretos: resumoIndiretos.itens.map((custo) => ({
        id: custo.id,
        nome: custo.nome,
        categoria: custo.categoria,
        valor_mensal: custo.valor_mensal,
        valor_rateado: custo.valor_rateado,
        percentual_rateio: custo.percentual_rateio,
      })),
      custosIndiretosResumo: resumoIndiretos,
      metadata: {
        timestamp_calculo: new Date(),
        versao_motor: 'preview-local',
        tempo_execucao_ms: 0,
        estagios_executados: [
          'validacao',
          'materiais',
          'maquinas',
          'funcoes',
          'custos_indiretos',
          'margem_lucro',
          'impostos',
        ],
      },
    };
  };

  // Funcao para transformar dados do formulario para o motor V2
  const transformarDadosParaMotor = () => {
    if (!form) return null;

    try {
      const formData = formSnapshot ?? form.getValues();
      const previewFormulario = montarPreviewFormulario(formData);

      console.debug('[PreviewCalculoV2] Dados do formulario', {
        possuiItens: Array.isArray(formData?.itens_produto) && formData.itens_produto.length > 0,
        insumos: insumos.length,
        maquinas: maquinas.length,
        funcoes: funcoes.length,
        servicos: servicos.length,
      });

      if (previewFormulario) {
        console.debug('[PreviewCalculoV2] Dados processados', previewFormulario);
        return previewFormulario;
      }

      console.debug('[PreviewCalculoV2] Nenhum dado calculado, usando mockData');
      return mockData;
    } catch (error) {
      console.error('[PreviewCalculoV2] Erro ao processar dados reais', error);
      return mockData;
    }
  };

  const processarDadosReais = () => {
    if (resultadoOrcamento?.resultado) {
      console.debug('[PreviewCalculoV2] Usando resultado do motor V2', resultadoOrcamento);
      const resultadoMotor = resultadoOrcamento.resultado as any;

      if (
        resultadoMotor &&
        typeof resultadoMotor === 'object' &&
        resultadoMotor.resumo &&
        Array.isArray(resultadoMotor.produtos)
      ) {
        return {
          ...resultadoMotor,
          metadata: {
            ...(resultadoMotor.metadata || {}),
            timestamp_calculo: new Date(),
            versao_motor:
              resultadoOrcamento.versao_motor || resultadoMotor.metadata?.versao_motor || '2.0.0',
            tempo_execucao_ms:
              resultadoOrcamento.tempo_execucao_ms ?? resultadoMotor.metadata?.tempo_execucao_ms ?? 0,
          },
        };
      }

      console.debug('[PreviewCalculoV2] Estrutura do motor inesperada, usando fallback do formulario');
    }

    if (!form) {
      console.debug('[PreviewCalculoV2] Sem formulario, usando mockData');
      return mockData;
    }

    try {
      const formData = formSnapshot ?? form.getValues();
      const previewFormulario = montarPreviewFormulario(formData);

      if (previewFormulario) {
        return previewFormulario;
      }

      console.debug('[PreviewCalculoV2] Nenhum dado calculado a partir do formulario, usando mockData');
      return mockData;
    } catch (error) {
      console.error('[PreviewCalculoV2] Erro ao processar dados reais', error);
      return mockData;
    }
  };
  // Usar dados reais se disponiveis, senao usar mockados
  const data = (() => {
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
      motivo: !form ? 'sem formulario' : !dadosCarregados ? 'dados nao carregados' : 'desconhecido'
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
    : data.custosIndiretos.reduce((total: number, custo: any) => {
        if (typeof custo?.valor_rateado === 'number') {
          return total + custo.valor_rateado;
        }
        if (typeof custo?.valor_mensal === 'number') {
          return total + custo.valor_mensal;
        }
        return total;
      }, 0);

  // Se nao ha dados, mostrar estado vazio
  if (!data) {
    return (
      <div className="sticky top-6 bg-white rounded-lg shadow-sm border max-h-[calc(100vh-3rem)] flex flex-col">
        {/* Header fixo */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Preview do Calculo</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            Desconectado
          </Badge>
        </div>
        
        {/* Conteudo com scroll */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhum calculo disponivel</p>
            <p className="text-sm">Adicione produtos para ver o preview</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-6 bg-white rounded-lg shadow-sm border max-h-[calc(100vh-3rem)] flex flex-col">
      {/* Header fixo */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Preview do Calculo</h2>
        </div>
        <Badge 
          variant="outline" 
          className={`text-xs ${isConnected ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}
        >
          {connectionStatus === 'connecting' ? 'Conectando...' : 
           isConnected ? 'Tempo real ativo' : 
           connectionStatus === 'error' ? 'Erro de conexao' : 'Desconectado'}
        </Badge>
      </div>

      {/* Conteudo com scroll */}
      <div className="flex-1 overflow-y-auto p-6 pt-4">
        <div className="space-y-4">
        {/* Resumo do Orcamento */}
        <div>
          <div className="pb-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Resumo do Orcamento
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Valor Total (Venda)</span>
              <span className="text-lg font-bold text-green-600">
                R$ {formatarValor(data.resumo.preco_final)}
              </span>
            </div>
            
            <Separator />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Custo de Producao</span>
                <span>R$ {formatarValor(data.resumo.total_custo_producao)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Margem de Lucro ({data.resumo.margem_lucro_percentual}%)</span>
                <span className="text-green-600">+R$ {formatarValor(data.resumo.total_margem_lucro)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impostos ({data.resumo.impostos_percentual}%)</span>
                <span className="text-red-600">+R$ {formatarValor(data.resumo.total_impostos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Comissao ({data.resumo.comissao_percentual}%)</span>
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
              <span className="text-gray-600">Itens no Orcamento</span>
              <span>{data.resumo.total_produtos}</span>
            </div>
          </div>
        </div>

        {/* Separador */}
        <Separator className="my-6" />

        {/* Detalhamento por Produto */}
        <div>
          <div className="pb-3">
            <h3 className="text-base font-semibold">Produtos no Orcamento</h3>
          </div>
          <div className="space-y-3">
            {data.produtos.map((produto, index) => (
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
                    {formatarDimensoes(produto.dimensoes)} - {produto.descricao}
                  </p>
                </div>

                {/* Custo Total de Produção com quantidade - linha separada */}
                <div className="mb-1">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span>Custo Total de Produção</span>
                    <span>R$ {formatarValor(produto.custo_total_producao)} ({formatarNumero(produto.quantidade)}/unid)</span>
                  </div>
                </div>

                {/* Custo unitário de produção - linha separada */}
                <div className="mb-3">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Custo unitário de produção</span>
                    <span>R$ {formatarValor(produto.custo_total_producao / produto.quantidade)}</span>
                  </div>
                </div>

                {/* Informações de produção */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horas de Produção</span>
                    <span>{formatarNumero(produto.horas_producao)}h</span>
                  </div>
                </div>

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

                {expandedItems[produto.id] && (
                  <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                    {/* Materiais */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Materiais</h5>
                      <div className="space-y-1">
                        {produto.materiais.map((material, idx) => (
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

                    {/* Maquinas */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Maquinas</h5>
                      <div className="space-y-1">
                        {produto.maquinas.map((maquina, idx) => (
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

                    {/* Funcoes */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Mao de Obra</h5>
                      <div className="space-y-1">
                        {produto.funcoes.map((funcao, idx) => (
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

                    {/* Servicos Manuais */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Servicos Manuais</h5>
                      <div className="space-y-1">
                        {produto.servicos.map((servico, idx) => (
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
                {data.custosIndiretos.map((custo) => (
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

        {/* Informacoes de Sistema */}
        <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded">
          <div>Ultima atualizacao: {data.metadata.timestamp_calculo.toLocaleTimeString('pt-BR')}</div>
          <div className="mt-1">Versao do calculo: {data.metadata.versao_motor}</div>
          <div className="mt-1">Tempo de execucao: {data.metadata.tempo_execucao_ms}ms</div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCalculoV2;






















































