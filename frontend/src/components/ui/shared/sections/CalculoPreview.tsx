'use client';

import { useFormContext } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Insumo, Maquina, Funcao } from '../types/common.types';
import { calcularCustoPorUnidadeUso } from '../utils/calculo.utils';
import { custosIndiretosApi } from '@/lib/api-client';

interface CalculoPreviewProps {
  variant?: 'orcamento' | 'produto';
  itemIndex?: number; // Opcional agora
  showAllProducts?: boolean; // Novo prop para mostrar todos os produtos
  insumos: Insumo[];
  maquinas: Maquina[];
  funcoes: Funcao[];
  margemLucroCustomizada?: string;
  impostosCustomizados?: string;
  customFields?: React.ReactNode;
  customActions?: React.ReactNode;
}

interface CustoIndireto {
  id: string;
  nome: string;
  categoria: string;
  valor_mensal: number;
  ativo: boolean;
}

export function CalculoPreview({ 
  itemIndex = 0,
  showAllProducts = false,
  insumos,
  maquinas,
  funcoes,
  margemLucroCustomizada,
  impostosCustomizados,
  customFields,
  customActions
}: CalculoPreviewProps) {
  // Função auxiliar para converter valores de forma robusta
  const converterValor = (valor: any): number => {
    if (valor === null || valor === undefined) return 0;
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') return parseFloat(valor.replace(',', '.')) || 0;
    // Se for um objeto Decimal do Prisma (tem propriedade toString)
    if (valor && typeof valor.toString === 'function') {
      try {
        return parseFloat(valor.toString().replace(',', '.')) || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  };
  const form = useFormContext();
  const [custosIndiretos, setCustosIndiretos] = useState<CustoIndireto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Buscar custos indiretos da API
  useEffect(() => {
    const fetchCustosIndiretos = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const data = await custosIndiretosApi.getAll(token);
        setCustosIndiretos(data.filter((custo: CustoIndireto) => custo.ativo));
      } catch (error) {
        console.error('Erro ao buscar custos indiretos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustosIndiretos();
  }, []);
  
  // Verificar se o form está disponível
  if (!form) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview do Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Funções auxiliares para calcular custos por produto específico
  const calcularCustosMateriaisParaProduto = (produtoIndex: number) => {
    const materiais = form.watch(`itens_produto.${produtoIndex}.materiais`) || [];
    let custoTotal = 0;
    const itensDetalhados: Array<{
      insumo_id: string;
      nome_insumo: string;
      quantidade: number;
      custo_unitario: number;
      custo_total: number;
      unidade_medida: string;
    }> = [];

    materiais.forEach((material: { insumo_id: string; quantidade: string }) => {
      if (material.insumo_id && material.quantidade) {
        const insumo = insumos.find(i => i.id === material.insumo_id);
        if (insumo) {
          const quantidade = Number(String(material.quantidade).replace(',', '.')) || 0;
          const custoPorUnidade = calcularCustoPorUnidadeUso(insumo);
          const custoTotalItem = custoPorUnidade * quantidade;
          
          custoTotal += custoTotalItem;
          
          itensDetalhados.push({
            insumo_id: insumo.id,
            nome_insumo: insumo.nome,
            quantidade,
            custo_unitario: custoPorUnidade,
            custo_total: custoTotalItem,
            unidade_medida: insumo.unidade_uso,
          });
        }
      }
    });

    return { custoTotal, itensDetalhados };
  };

  const calcularCustosMaquinasParaProduto = (produtoIndex: number) => {
    const maquinasUtilizadas = form.watch(`itens_produto.${produtoIndex}.maquinas`) || [];
    let custoTotal = 0;
    const maquinasDetalhadas: Array<{
      maquina_id: string;
      nome_maquina: string;
      tipo_maquina: string;
      horas_utilizadas: number;
      custo_por_hora: number;
      custo_total: number;
    }> = [];

    maquinasUtilizadas.forEach((maquina: { maquina_id: string; horas_utilizadas: string }) => {
      if (maquina.maquina_id && maquina.horas_utilizadas) {
        const maquinaEncontrada = maquinas.find(m => m.id === maquina.maquina_id);
        if (maquinaEncontrada) {
          const horas = Number(maquina.horas_utilizadas) || 0;
          const custoPorHora = Number(maquinaEncontrada.custo_hora) || 0;
          const custoTotalItem = horas * custoPorHora;
          
          custoTotal += custoTotalItem;
          
          maquinasDetalhadas.push({
            maquina_id: maquinaEncontrada.id,
            nome_maquina: maquinaEncontrada.nome,
            tipo_maquina: maquinaEncontrada.tipo || 'Geral',
            horas_utilizadas: horas,
            custo_por_hora: custoPorHora,
            custo_total: custoTotalItem,
          });
        }
      }
    });

    return { custoTotal, maquinasDetalhadas };
  };

  const calcularCustosFuncoesParaProduto = (produtoIndex: number) => {
    const funcoesUtilizadas = form.watch(`itens_produto.${produtoIndex}.funcoes`) || [];
    let custoTotal = 0;
    const funcoesDetalhadas: Array<{
      funcao_id: string;
      nome_funcao: string;
      horas_trabalhadas: number;
      custo_por_hora: number;
      custo_total: number;
      maquina_vinculada?: string;
    }> = [];

    funcoesUtilizadas.forEach((funcao: { funcao_id: string; horas_trabalhadas: string }) => {
      if (funcao.funcao_id && funcao.horas_trabalhadas) {
        const funcaoEncontrada = funcoes.find(f => f.id === funcao.funcao_id);
        if (funcaoEncontrada) {
          const horas = Number(funcao.horas_trabalhadas) || 0;
          const custoPorHora = Number(funcaoEncontrada.custo_hora) || 0;
          const custoTotalItem = horas * custoPorHora;
          
          custoTotal += custoTotalItem;
          
          funcoesDetalhadas.push({
            funcao_id: funcaoEncontrada.id,
            nome_funcao: funcaoEncontrada.nome,
            horas_trabalhadas: horas,
            custo_por_hora: custoPorHora,
            custo_total: custoTotalItem,
            maquina_vinculada: funcaoEncontrada.maquina?.nome,
          });
        }
      }
    });

    return { custoTotal, funcoesDetalhadas };
  };

  const calcularHorasProducaoParaProduto = (produtoIndex: number) => {
    const maquinasUtilizadas = form.watch(`itens_produto.${produtoIndex}.maquinas`) || [];
    const funcoesUtilizadas = form.watch(`itens_produto.${produtoIndex}.funcoes`) || [];
    
    const horasMaquinas = maquinasUtilizadas.reduce((total: number, maquina) => {
      return total + (Number(maquina.horas_utilizadas) || 0);
    }, 0);
    
    const horasFuncoes = funcoesUtilizadas.reduce((total: number, funcao) => {
      return total + (Number(funcao.horas_trabalhadas) || 0);
    }, 0);
    
    return horasMaquinas + horasFuncoes;
  };

  const calcularCustosIndiretosParaProduto = (produtoIndex: number) => {
    if (custosIndiretos.length === 0) {
      return { custoIndiretoTotal: 0, custosIndiretosDetalhados: [] };
    }

    // Usar a mesma lógica do backend: custo indireto baseado em horas de produção
    const horasProdutivasMes = 352; // Mesmo valor do backend
    const horasProducao = calcularHorasProducaoParaProduto(produtoIndex);
    
    const custosIndiretosDetalhados = custosIndiretos.map(custo => {
      const custoPorHora = Number(custo.valor_mensal) / horasProdutivasMes;
      const valorRateado = custoPorHora * horasProducao; // Usar horas, não quantidade
      
      return {
        id: custo.id,
        nome: custo.nome,
        categoria: custo.categoria,
        valor_mensal: custo.valor_mensal,
        percentual_rateio: 100, // 100% para horas de produção
        valor_rateado: valorRateado,
      };
    });

    const custoIndiretoTotal = custosIndiretosDetalhados.reduce((total, custo) => total + custo.valor_rateado, 0);

    return { custoIndiretoTotal, custosIndiretosDetalhados };
  };

  // Calcular custos dos materiais
  const calcularCustosMateriais = () => {
    const materiais = form.watch(`itens_produto.${itemIndex}.materiais`) || [];
    let custoTotal = 0;
    const itensDetalhados: Array<{
      insumo_id: string;
      nome_insumo: string;
      quantidade: number;
      custo_unitario: number;
      custo_total: number;
      unidade_medida: string;
    }> = [];

    materiais.forEach((material: { insumo_id: string; quantidade: string }) => {
      if (material.insumo_id && material.quantidade) {
        const insumo = insumos.find(i => i.id === material.insumo_id);
        if (insumo) {
          const quantidade = Number(String(material.quantidade).replace(',', '.')) || 0;
          const custoPorUnidade = calcularCustoPorUnidadeUso(insumo);
          const custoTotalItem = custoPorUnidade * quantidade;
          
          custoTotal += custoTotalItem;
          
          itensDetalhados.push({
            insumo_id: insumo.id,
            nome_insumo: insumo.nome,
            quantidade,
            custo_unitario: custoPorUnidade,
            custo_total: custoTotalItem,
            unidade_medida: insumo.unidade_uso,
          });
        }
      }
    });

    return { custoTotal, itensDetalhados };
  };

  // Calcular custos das máquinas
  const calcularCustosMaquinas = () => {
    const maquinasUtilizadas = form.watch(`itens_produto.${itemIndex}.maquinas`) || [];
    let custoTotal = 0;
    const maquinasDetalhadas: Array<{
      maquina_id: string;
      nome_maquina: string;
      tipo_maquina: string;
      horas_utilizadas: number;
      custo_por_hora: number;
      custo_total: number;
    }> = [];

    maquinasUtilizadas.forEach((maquina: { maquina_id: string; horas_utilizadas: string }) => {
      if (maquina.maquina_id && maquina.horas_utilizadas) {
        const maquinaEncontrada = maquinas.find(m => m.id === maquina.maquina_id);
        if (maquinaEncontrada) {
          const horas = converterValor(maquina.horas_utilizadas);
          const custoPorHora = converterValor(maquinaEncontrada.custo_hora);
          const custoTotalItem = horas * custoPorHora;
          
          // Debug: Log dos valores da máquina
          console.log('🔍 Debug - Máquina:', {
            nome: maquinaEncontrada.nome,
            custo_hora_original: maquinaEncontrada.custo_hora,
            tipo_custo_hora: typeof maquinaEncontrada.custo_hora,
            custo_hora_convertido: custoPorHora,
            horas: horas,
            custo_total: custoTotalItem
          });
          
          custoTotal += custoTotalItem;
          
          maquinasDetalhadas.push({
            maquina_id: maquinaEncontrada.id,
            nome_maquina: maquinaEncontrada.nome,
            tipo_maquina: maquinaEncontrada.tipo || 'Geral',
            horas_utilizadas: horas,
            custo_por_hora: custoPorHora,
            custo_total: custoTotalItem,
          });
        }
      }
    });

    return { custoTotal, maquinasDetalhadas };
  };

  // Calcular custos das funções
  const calcularCustosFuncoes = () => {
    const funcoesUtilizadas = form.watch(`itens_produto.${itemIndex}.funcoes`) || [];
    let custoTotal = 0;
    const funcoesDetalhadas: Array<{
      funcao_id: string;
      nome_funcao: string;
      horas_trabalhadas: number;
      custo_por_hora: number;
      custo_total: number;
      maquina_vinculada?: string;
    }> = [];

    funcoesUtilizadas.forEach((funcao: { funcao_id: string; horas_trabalhadas: string }) => {
      if (funcao.funcao_id && funcao.horas_trabalhadas) {
        const funcaoEncontrada = funcoes.find(f => f.id === funcao.funcao_id);
        if (funcaoEncontrada) {
          const horas = converterValor(funcao.horas_trabalhadas);
          const custoPorHora = converterValor(funcaoEncontrada.custo_hora);
          const custoTotalItem = horas * custoPorHora;
          
          // Debug: Log dos valores da função
          console.log('🔍 Debug - Função:', {
            nome: funcaoEncontrada.nome,
            custo_hora_original: funcaoEncontrada.custo_hora,
            tipo_custo_hora: typeof funcaoEncontrada.custo_hora,
            custo_hora_convertido: custoPorHora,
            horas: horas,
            custo_total: custoTotalItem
          });
          
          custoTotal += custoTotalItem;
          
          funcoesDetalhadas.push({
            funcao_id: funcaoEncontrada.id,
            nome_funcao: funcaoEncontrada.nome,
            horas_trabalhadas: horas,
            custo_por_hora: custoPorHora,
            custo_total: custoTotalItem,
            maquina_vinculada: funcaoEncontrada.maquina?.nome,
          });
        }
      }
    });

    return { custoTotal, funcoesDetalhadas };
  };

  // Calcular horas de produção
  const calcularHorasProducao = () => {
    const maquinasUtilizadas = form.watch(`itens_produto.${itemIndex}.maquinas`) || [];
    const funcoesUtilizadas = form.watch(`itens_produto.${itemIndex}.funcoes`) || [];
    
    const horasMaquinas = maquinasUtilizadas.reduce((total: number, maquina: any) => {
      return total + (Number(maquina.horas_utilizadas) || 0);
    }, 0);
    
    const horasFuncoes = funcoesUtilizadas.reduce((total: number, funcao: any) => {
      return total + (Number(funcao.horas_trabalhadas) || 0);
    }, 0);
    
    return horasMaquinas + horasFuncoes;
  };

  // Calcular custos indiretos usando a mesma lógica do backend
  const calcularCustosIndiretos = () => {
    if (custosIndiretos.length === 0) {
      return { custoIndiretoTotal: 0, custosIndiretosDetalhados: [] };
    }

    // Usar horas produtivas padrão (mesmo valor do backend)
    const horasProdutivasMes = 352;
    
    // Calcular total dos custos indiretos mensais
    const totalCustosIndiretosMensais = custosIndiretos.reduce((total, custo) => {
      return total + Number(custo.valor_mensal);
    }, 0);

    // Calcular custo indireto por hora (mesmo que o backend)
    const custoIndiretoPorHora = totalCustosIndiretosMensais / horasProdutivasMes;
    
    // Calcular custo indireto total para este orçamento
    // IMPORTANTE: Usar horas de produção (mesmo que o backend)
    const horasProducao = calcularHorasProducao();
    const custoIndiretoTotal = custoIndiretoPorHora * horasProducao;

    // Calcular custos indiretos detalhados (mesmo que o backend)
    const custosIndiretosDetalhados = custosIndiretos.map(custo => {
      const valorRateado = (Number(custo.valor_mensal) / horasProdutivasMes) * horasProducao;
      const percentualRateio = (Number(custo.valor_mensal) / (totalCustosIndiretosMensais || 1)) * 100;
      
      return {
        nome: custo.nome,
        categoria: custo.categoria,
        valor_rateado: valorRateado,
        percentual_rateio: percentualRateio,
      };
    });

    return { custoIndiretoTotal, custosIndiretosDetalhados };
  };

  // Calcular custos totais
  const calcularCustosTotais = () => {
    if (showAllProducts) {
      // Calcular todos os produtos do orçamento
      return calcularCustosTodosProdutos();
    } else {
      // Calcular apenas um produto específico (modo atual)
      return calcularCustosProdutoIndividual();
    }
  };

  const calcularCustosProdutoIndividual = () => {
    // Obter a quantidade do produto
    const quantidadeProduto = Number(form.watch(`itens_produto.${itemIndex}.quantidade_produto`)?.replace(',', '.')) || 1;
    
    const { custoTotal: custoMaterial } = calcularCustosMateriais();
    const { custoTotal: custoMaquinaria } = calcularCustosMaquinas();
    const { custoTotal: custoMaoObra } = calcularCustosFuncoes();
    
    const custoTotalProducao = custoMaterial + custoMaquinaria + custoMaoObra;
    const horasProducao = calcularHorasProducao();
    const { custoIndiretoTotal, custosIndiretosDetalhados } = calcularCustosIndiretos();
    const custoTotalComIndiretos = custoTotalProducao + custoIndiretoTotal;
    
    // Margem de lucro (padrão 30% ou customizada)
    const margemLucroPercentual = margemLucroCustomizada ? 
      Number(margemLucroCustomizada.replace(',', '.')) : 30;
    const margemLucroValor = custoTotalComIndiretos * (margemLucroPercentual / 100);
    const subtotalComLucro = custoTotalComIndiretos + margemLucroValor;
    
    // Impostos (padrão 18% ou customizada)
    const impostosPercentual = impostosCustomizados ? 
      Number(impostosCustomizados.replace(',', '.')) : 18;
    const impostosValor = subtotalComLucro * (impostosPercentual / 100);
    const precoFinal = subtotalComLucro + impostosValor;
    
    // Multiplicar pela quantidade (mesmo que o backend)
    const precoFinalTotal = precoFinal * quantidadeProduto;
    const custoTotalProducaoTotal = custoTotalProducao * quantidadeProduto;
    // IMPORTANTE: custos indiretos SÃO multiplicados pela quantidade (mesmo que o backend)
    const custoTotalComIndiretosTotal = custoTotalComIndiretos * quantidadeProduto;
    const margemLucroValorTotal = margemLucroValor * quantidadeProduto;
    const subtotalComLucroTotal = subtotalComLucro * quantidadeProduto;
    const impostosValorTotal = impostosValor * quantidadeProduto;
    
    return {
      custo_material: custoMaterial,
      custo_maquinaria: custoMaquinaria,
      custo_mao_obra: custoMaoObra,
      custo_indireto: custoIndiretoTotal,
      custo_total_producao: custoTotalProducao,
      custo_total_com_indiretos: custoTotalComIndiretos,
      margem_lucro_percentual: margemLucroPercentual,
      margem_lucro_valor: margemLucroValor,
      subtotal_com_lucro: subtotalComLucro,
      impostos_percentual: impostosPercentual,
      impostos_valor: impostosValor,
      preco_final: precoFinal,
      preco_final_total: precoFinalTotal,
      custo_total_producao_total: custoTotalProducaoTotal,
      custo_total_com_indiretos_total: custoTotalComIndiretosTotal,
      margem_lucro_valor_total: margemLucroValorTotal,
      subtotal_com_lucro_total: subtotalComLucroTotal,
      impostos_valor_total: impostosValorTotal,
      quantidade_produto: quantidadeProduto,
      horas_producao: horasProducao,
      custos_indiretos_detalhados: custosIndiretosDetalhados,
    };
  };

  const calcularCustosTodosProdutos = () => {
    const todosProdutos = form.watch('itens_produto') || [];
    let totalGeral = 0;
    let totalCustoMaterial = 0;
    let totalCustoMaquinaria = 0;
    let totalCustoMaoObra = 0;
    let totalHorasProducao = 0;
    const produtosDetalhados: Array<{
      index: number;
      nome: string;
      quantidade: number;
      preco_unitario: number;
      preco_total: number;
    }> = [];

    todosProdutos.forEach((produto: any, index: number) => {
      // Calcular custos para este produto específico
      const { custoTotal: custoMaterial } = calcularCustosMateriaisParaProduto(index);
      const { custoTotal: custoMaquinaria } = calcularCustosMaquinasParaProduto(index);
      const { custoTotal: custoMaoObra } = calcularCustosFuncoesParaProduto(index);
      
      const custoTotalProducao = custoMaterial + custoMaquinaria + custoMaoObra;
      const horasProducao = calcularHorasProducaoParaProduto(index);
      const quantidadeProduto = Number(produto.quantidade_produto?.replace(',', '.')) || 1;
      const { custoIndiretoTotal } = calcularCustosIndiretosParaProduto(index);
      const custoTotalComIndiretos = custoTotalProducao + custoIndiretoTotal;
      
      // Margem de lucro
      const margemLucroPercentual = margemLucroCustomizada ? 
        Number(margemLucroCustomizada.replace(',', '.')) : 30;
      const margemLucroValor = custoTotalComIndiretos * (margemLucroPercentual / 100);
      const subtotalComLucro = custoTotalComIndiretos + margemLucroValor;
      
      // Impostos
      const impostosPercentual = impostosCustomizados ? 
        Number(impostosCustomizados.replace(',', '.')) : 18;
      const impostosValor = subtotalComLucro * (impostosPercentual / 100);
      const precoFinal = subtotalComLucro + impostosValor;
      
      // Usar quantidadeProduto já definida acima
      const precoFinalTotal = precoFinal * quantidadeProduto;
      
      // Acumular totais
      totalGeral += precoFinalTotal;
      totalCustoMaterial += custoMaterial * quantidadeProduto;
      totalCustoMaquinaria += custoMaquinaria * quantidadeProduto;
      totalCustoMaoObra += custoMaoObra * quantidadeProduto;
      totalHorasProducao += horasProducao * quantidadeProduto;
      
      // Adicionar aos detalhes
      produtosDetalhados.push({
        index,
        nome: produto.nome_servico || `Produto ${index + 1}`,
        quantidade: quantidadeProduto,
        preco_unitario: precoFinal,
        preco_total: precoFinalTotal,
      });
    });

    return {
      total_geral: totalGeral,
      total_custo_material: totalCustoMaterial,
      total_custo_maquinaria: totalCustoMaquinaria,
      total_custo_mao_obra: totalCustoMaoObra,
      total_horas_producao: totalHorasProducao,
      produtos_detalhados: produtosDetalhados,
      quantidade_produtos: todosProdutos.length,
    };
  };

  const custosTotais = calcularCustosTotais();
  const { maquinasDetalhadas } = calcularCustosMaquinas();
  const { funcoesDetalhadas } = calcularCustosFuncoes();
  
  // Debug: Log dos arrays de máquinas e funções
  console.log('🔍 Debug - CalculoPreview - maquinasDetalhadas:', maquinasDetalhadas);
  console.log('🔍 Debug - CalculoPreview - funcoesDetalhadas:', funcoesDetalhadas);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-muted-foreground">Carregando custos indiretos...</p>
        </div>
      </div>
    );
  }

  // Verificar se há dados para calcular (materiais, máquinas ou funções)
  const temDadosParaCalcular = () => {
    const materiais = form.watch(`itens_produto.${itemIndex}.materiais`) || [];
    const maquinas = form.watch(`itens_produto.${itemIndex}.maquinas`) || [];
    const funcoes = form.watch(`itens_produto.${itemIndex}.funcoes`) || [];
    
    return materiais.some((m: any) => m.insumo_id) || 
           maquinas.some((m: any) => m.maquina_id) || 
           funcoes.some((f: any) => f.funcao_id);
  };

  // Se não há dados para calcular, mostrar mensagem informativa
  if (!showAllProducts && !temDadosParaCalcular()) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold mb-2 text-blue-800">Preview do Orçamento</h4>
          <p className="text-sm text-blue-700">
            Adicione materiais, máquinas ou funções para ver o cálculo em tempo real do orçamento.
          </p>
          <div className="mt-3 text-xs text-blue-600">
            <p>• <strong>Materiais:</strong> Insumos que serão utilizados</p>
            <p>• <strong>Máquinas:</strong> Equipamentos e suas horas de uso</p>
            <p>• <strong>Funções:</strong> Mão de obra e horas trabalhadas</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderização para modo geral (todos os produtos)
  if (showAllProducts && 'total_geral' in custosTotais) {
    const custosGerais = custosTotais as any;
    return (
      <div className="space-y-4">
        {/* Resumo Geral */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Resumo do Orçamento</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Geral:</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(custosGerais.total_geral)}</span>
            </div>
            <div className="flex justify-between">
              <span>Produtos:</span>
              <span>{custosGerais.quantidade_produtos}</span>
            </div>
            <div className="flex justify-between">
              <span>Horas Totais:</span>
              <span>{custosGerais.total_horas_producao?.toFixed(2) || '0.00'}h</span>
            </div>
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="space-y-3">
          <h4 className="font-semibold">Produtos do Orçamento</h4>
          <div className="space-y-2">
            {custosGerais.produtos_detalhados.map((produto: any, index: number) => (
              <div key={index} className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{produto.nome}</span>
                  <span className="text-sm text-gray-600">Qtd: {produto.quantidade}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Preço Unitário:</span>
                  <span>{formatCurrency(produto.preco_unitario)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(produto.preco_total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custos Totais */}
        <div className="space-y-3">
          <h4 className="font-semibold">Custos Totais</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Materiais:</span>
              <span>{formatCurrency(custosGerais.total_custo_material)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Máquinas:</span>
              <span>{formatCurrency(custosGerais.total_custo_maquinaria)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Mão de Obra:</span>
              <span>{formatCurrency(custosGerais.total_custo_mao_obra)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderização para modo individual (produto específico)
  const custosIndividuais = custosTotais as any;
  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Resumo</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Valor Total:</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(custosIndividuais.preco_final_total)}</span>
          </div>
                     <div className="flex justify-between">
             <span>Horas Totais:</span>
             <span>{custosIndividuais.horas_producao?.toFixed(2) || '0.00'}h</span>
           </div>
          <div className="flex justify-between">
            <span>Preço Final (por unidade):</span>
            <span className="font-semibold">{formatCurrency(custosIndividuais.preco_final)}</span>
          </div>
          <div className="flex justify-between">
            <span>Quantidade:</span>
            <span>{custosIndividuais.quantidade_produto}</span>
          </div>
          <div className="flex justify-between">
            <span>Valor Total:</span>
            <span className="font-semibold">{formatCurrency(custosIndividuais.preco_final_total)}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Margem de Lucro:</span>
              <span>{custosIndividuais.margem_lucro_percentual?.toFixed(1) || '0.0'}%</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Impostos:</span>
              <span>{custosIndividuais.impostos_percentual?.toFixed(1) || '0.0'}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custos Detalhados */}
      <div className="space-y-3">
        <h4 className="font-semibold">Custos Detalhados</h4>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Materiais:</span>
            <span>{formatCurrency(custosIndividuais.custo_material * custosIndividuais.quantidade_produto)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Máquinas:</span>
            <span>{formatCurrency(custosIndividuais.custo_maquinaria * custosIndividuais.quantidade_produto)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Mão de Obra:</span>
            <span>{formatCurrency(custosIndividuais.custo_mao_obra * custosIndividuais.quantidade_produto)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Custos Indiretos:</span>
            <span>{formatCurrency(custosIndividuais.custo_indireto * custosIndividuais.quantidade_produto)}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-semibold">
              <span>Custo Total:</span>
              <span>{formatCurrency(custosIndividuais.custo_total_com_indiretos_total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Informações de Quantidade */}
      <div className="space-y-3">
        <h4 className="font-semibold">Informações do Produto</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Quantidade:</span>
            <span>{custosIndividuais.quantidade_produto}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Valor Unitário (Custo):</span>
            <span>{formatCurrency(custosIndividuais.custo_total_producao)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Preço Unitário (com margem/impostos):</span>
            <span>{formatCurrency(custosIndividuais.preco_final)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Valor Total:</span>
            <span className="font-semibold">{formatCurrency(custosIndividuais.preco_final_total)}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            * Valores calculados automaticamente baseados nos materiais, máquinas e funções selecionadas
          </div>
        </div>
      </div>

      {/* Custos Indiretos Detalhados */}
      {custosIndividuais.custos_indiretos_detalhados.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold">Custos Indiretos</h4>
          <div className="space-y-2">
            {custosIndividuais.custos_indiretos_detalhados.map((custo: any, index: number) => (
              <div key={index} className="text-sm p-2 bg-muted rounded">
                <div className="flex justify-between">
                  <span>{custo.nome}</span>
                  <span>{formatCurrency(custo.valor_rateado)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {custo.categoria} • {custo.percentual_rateio.toFixed(1)}% rateado
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Máquinas Utilizadas */}
      {maquinasDetalhadas.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold">Máquinas</h4>
          <div className="space-y-2">
            {maquinasDetalhadas.map((maquina, index) => (
              <div key={index} className="text-sm p-2 bg-muted rounded">
                <div className="flex justify-between">
                  <span>{maquina.nome_maquina}</span>
                  <span>{formatCurrency(maquina.custo_total)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {maquina.horas_utilizadas}h × {formatCurrency(maquina.custo_por_hora)}/h
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funções Utilizadas */}
      {funcoesDetalhadas.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold">Funções</h4>
          <div className="space-y-2">
            {funcoesDetalhadas.map((funcao, index) => (
              <div key={index} className="text-sm p-2 bg-muted rounded">
                <div className="flex justify-between">
                  <span>{funcao.nome_funcao}</span>
                  <span>{formatCurrency(funcao.custo_total)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {funcao.horas_trabalhadas}h × {formatCurrency(funcao.custo_por_hora)}/h
                  {funcao.maquina_vinculada && ` • ${funcao.maquina_vinculada}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campos customizados específicos do módulo */}
      {customFields}

      {/* Ações customizadas específicas do módulo */}
      {customActions}
    </div>
  );
} 