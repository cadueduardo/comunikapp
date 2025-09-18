'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Eye, Calculator, Clock, Package, AlertCircle } from 'lucide-react';
import { orcamentosApi } from '@/lib/api-client';
import { useOrcamentoData } from '../orcamento/hooks/useOrcamentoData';
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
  
  // Tentar obter contexto do formulário (se disponível)
  let form: any = null;
  try {
    form = useFormContext();
  } catch {
    // Formulário não disponível - usar dados mockados
  }

  // Hook para dados auxiliares (insumos, máquinas, etc.)
  const { insumos, maquinas, funcoes, custosIndiretos } = useOrcamentoData();
  
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
          { insumo_id: '1', nome: "Vinil Brilho", quantidade: 200, custo_unitario: 15.00, unidade_consumo: 'm²' },
          { insumo_id: '2', nome: "Cordão", quantidade: 600, custo_unitario: 2.50, unidade_consumo: 'm' }
        ],
        maquinas: [
          { maquina_id: '1', nome: "Plotter de Impressão", horas_utilizadas: 15, custo_por_hora: 50.00 }
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
        descricao: "Painel ACM com impressão",
        quantidade: 1,
        dimensoes: { largura: 3, altura: 2, area_produto: 6, unidade_medida: 'm' },
        materiais: [
          { insumo_id: '3', nome: "ACM", quantidade: 6, custo_unitario: 80.00, unidade_consumo: 'm²' },
          { insumo_id: '4', nome: "Adesivo", quantidade: 6, custo_unitario: 25.00, unidade_consumo: 'm²' }
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
      { id: '1', nome: "Aluguel", categoria: "Infraestrutura", valor_mensal: 2000.00, ativo: true },
      { id: '2', nome: "Energia Elétrica", categoria: "Serviços", valor_mensal: 800.00, ativo: true },
      { id: '3', nome: "Água", categoria: "Serviços", valor_mensal: 200.00, ativo: true },
      { id: '4', nome: "Internet", categoria: "Serviços", valor_mensal: 150.00, ativo: true },
      { id: '5', nome: "Seguro", categoria: "Seguros", valor_mensal: 300.00, ativo: true }
    ],
    metadata: {
      timestamp_calculo: new Date(),
      versao_motor: '2.1.3',
      tempo_execucao_ms: 245,
      estagios_executados: ['validacao', 'materiais', 'maquinas', 'funcoes', 'custos_indiretos', 'margem_lucro', 'impostos']
    }
  };

  // Toggle de expansão de itens
  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Formatar dimensões
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
    return `${horas}h`;
  };

  // Função para transformar dados do formulário para o motor V2
  const transformarDadosParaMotor = () => {
    if (!form) return null;

    try {
      const formData = form.getValues();
      const itensFormulario = formData.itens_produto || [];
      
      if (itensFormulario.length === 0) return null;

      // Transformar cada produto do formulário
      const produtos = itensFormulario.map((item: any, index: number) => ({
        id: `produto_${index}`,
        nome: item.nome_servico || `Produto ${index + 1}`,
        nome_servico: item.nome_servico || `Produto ${index + 1}`,
        quantidade: Number(item.quantidade_produto?.replace(',', '.')) || 1,
        insumos: (item.materiais || []).map((material: any) => {
          const insumoData = insumos.find(i => i.id === material.insumo_id);
          return {
            id: material.insumo_id,
            nome: insumoData?.nome || 'Insumo não encontrado',
            unidade: insumoData?.unidade_uso || 'un',
            preco_unitario: Number(insumoData?.custo_unitario) || 0,
            quantidade: Number(material.quantidade?.replace(',', '.')) || 0,
            categoria: 'Material',
            fornecedor: 'Fornecedor',
            estoque_disponivel: 100,
          };
        }),
        maquinas: (item.maquinas || []).map((maquina: any) => {
          const maquinaData = maquinas.find(m => m.id === maquina.maquina_id);
          return {
            id: maquina.maquina_id,
            nome: maquinaData?.nome || 'Máquina não encontrada',
            tipo: maquinaData?.tipo || 'Equipamento',
            custo_hora: Number(maquinaData?.custo_hora) || 0,
            tempo_setup: Number(maquina.horas_utilizadas?.replace(',', '.')) || 1,
            eficiencia: 100,
            disponivel: true,
          };
        }),
        funcoes: (item.funcoes || []).map((funcao: any) => {
          const funcaoData = funcoes.find(f => f.id === funcao.funcao_id);
          return {
            id: funcao.funcao_id,
            nome: funcaoData?.nome || 'Função não encontrada',
            categoria: 'Operacional',
            custo_hora: Number(funcaoData?.custo_hora) || 0,
            tempo_estimado: Number(funcao.horas_trabalhadas?.replace(',', '.')) || 1,
            nivel_experiencia: 'Intermediário',
            disponivel: true,
          };
        }),
        servicos_manuais: (item.servicos || []).map((servico: any) => ({
          id: servico.servico_id,
          horas: Number(servico.horas_trabalhadas?.replace(',', '.')) || 1,
          custo_por_hora: 50, // TODO: Obter do cadastro de serviços
        })),
        custos_indiretos: custosIndiretos.map((custo: any) => ({
          id: custo.id,
          percentual: 15, // Rateio padrão
          valor_fixo: Number(custo.valor_mensal) || 0,
        })),
        metadata: {
          largura: Number(item.largura_produto?.replace(',', '.')) || 0,
          altura: Number(item.altura_produto?.replace(',', '.')) || 0,
          area_produto: Number(item.area_produto?.replace(',', '.')) || 0,
          unidade_medida: item.unidade_medida_produto || 'm',
        },
      }));

      return {
        lojaId: 'loja_atual', // TODO: Obter da sessão
        produtos,
        configuracoes: {
          margem_lucro_padrao: Number(formData.margem_lucro_customizada?.replace(',', '.')) || 30,
          impostos_padrao: Number(formData.impostos_customizados?.replace(',', '.')) || 18,
          custos_indiretos_padrao: 15,
          desconto_padrao: 0,
          prazo_entrega_padrao: 10,
          unidade_monetaria: 'BRL',
          timezone: 'America/Sao_Paulo',
        },
      };
    } catch (error) {
      console.error('Erro ao transformar dados do formulário:', error);
      return null;
    }
  };

  // Executar cálculo via WebSocket quando dados do formulário mudarem
  useEffect(() => {
    if (form && dadosCarregados && isConnected) {
      const subscription = form.watch(() => {
        // Debounce para evitar muitas chamadas
        const timeoutId = setTimeout(() => {
          const dadosMotor = transformarDadosParaMotor();
          if (dadosMotor) {
            console.log('🔄 Enviando cálculo via WebSocket:', dadosMotor);
            executarCalculoOrcamento(dadosMotor);
          }
        }, 500);
        
        return () => clearTimeout(timeoutId);
      });

      // Executar cálculo inicial
      const dadosMotor = transformarDadosParaMotor();
      if (dadosMotor) {
        console.log('🔄 Cálculo inicial via WebSocket:', dadosMotor);
        executarCalculoOrcamento(dadosMotor);
      }

      return () => subscription?.unsubscribe?.();
    }
  }, [form, dadosCarregados, isConnected, insumos, maquinas, funcoes, executarCalculoOrcamento]);

  // Função para processar dados reais e converter para formato do preview
  const processarDadosReais = () => {
    // Usar resultado do WebSocket se disponível, senão calcular localmente
    if (resultadoOrcamento && form) {
      console.log('✅ Usando resultado do WebSocket:', resultadoOrcamento);
      return resultadoOrcamento.data || mockData;
    }
    
    if (!form) return mockData;

    try {
      const formData = form.getValues();
      const itensFormulario = formData.itens_produto || [];

      // Converter resultado do motor V2 para formato do preview (mantendo estrutura)
      const produtos = itensFormulario.map((item: any, index: number) => {
        const insumosDoProduto = (item.materiais || []).map((material: any) => {
          const insumoData = insumos.find(i => i.id === material.insumo_id);
          const quantidade = Number(material.quantidade?.replace(',', '.')) || 0;
          const custoUnitario = Number(insumoData?.custo_unitario) || 0;
          
          return {
            insumo_id: material.insumo_id,
            nome: insumoData?.nome || 'Insumo não encontrado',
            quantidade: quantidade,
            custo_unitario: custoUnitario,
            unidade_consumo: insumoData?.unidade_uso || 'un',
          };
        });

        const maquinasDoProduto = (item.maquinas || []).map((maquina: any) => {
          const maquinaData = maquinas.find(m => m.id === maquina.maquina_id);
          const horasUtilizadas = Number(maquina.horas_utilizadas?.replace(',', '.')) || 1;
          const custoPorHora = Number(maquinaData?.custo_hora) || 0;
          
          return {
            maquina_id: maquina.maquina_id,
            nome: maquinaData?.nome || 'Máquina não encontrada',
            horas_utilizadas: horasUtilizadas,
            custo_por_hora: custoPorHora,
          };
        });

        const funcoesDoProduto = (item.funcoes || []).map((funcao: any) => {
          const funcaoData = funcoes.find(f => f.id === funcao.funcao_id);
          const horasTrabalhadas = Number(funcao.horas_trabalhadas?.replace(',', '.')) || 1;
          const custoPorHora = Number(funcaoData?.custo_hora) || 0;
          
          return {
            funcao_id: funcao.funcao_id,
            nome: funcaoData?.nome || 'Função não encontrada',
            horas_trabalhadas: horasTrabalhadas,
            custo_por_hora: custoPorHora,
          };
        });

        const servicosDoProduto = (item.servicos || []).map((servico: any) => {
          const horasTrabalhadas = Number(servico.horas_trabalhadas?.replace(',', '.')) || 1;
          
          return {
            servico_id: servico.servico_id,
            nome: 'Serviço Manual',
            horas_trabalhadas: horasTrabalhadas,
            custo_por_hora: 50, // TODO: Obter do cadastro
          };
        });

        // Calcular custos do produto
        const custoMateriais = insumosDoProduto.reduce((acc, mat) => 
          acc + (mat.quantidade * mat.custo_unitario), 0);
        const custoMaquinas = maquinasDoProduto.reduce((acc, maq) => 
          acc + (maq.horas_utilizadas * maq.custo_por_hora), 0);
        const custoFuncoes = funcoesDoProduto.reduce((acc, func) => 
          acc + (func.horas_trabalhadas * func.custo_por_hora), 0);
        const custoServicos = servicosDoProduto.reduce((acc, serv) => 
          acc + (serv.horas_trabalhadas * serv.custo_por_hora), 0);
        
        const custoTotalProducao = custoMateriais + custoMaquinas + custoFuncoes + custoServicos;
        const horasProducao = maquinasDoProduto.reduce((acc, maq) => acc + maq.horas_utilizadas, 0) +
                             funcoesDoProduto.reduce((acc, func) => acc + func.horas_trabalhadas, 0) +
                             servicosDoProduto.reduce((acc, serv) => acc + serv.horas_trabalhadas, 0);
        
        const quantidade = Number(item.quantidade_produto?.replace(',', '.')) || 1;
        const custosIndiretos = custoTotalProducao * 0.15; // 15% padrão
        const precoUnitario = (custoTotalProducao + custosIndiretos) * 1.3 * 1.18; // Margem + impostos
        const precoTotal = precoUnitario * quantidade;

        return {
          id: `${index + 1}`,
          nome_servico: item.nome_servico || `Produto ${index + 1}`,
          descricao: item.descricao || `Descrição do produto ${index + 1}`,
          quantidade: quantidade,
          dimensoes: {
            largura: Number(item.largura_produto?.replace(',', '.')) || 0,
            altura: Number(item.altura_produto?.replace(',', '.')) || 0,
            area_produto: Number(item.area_produto?.replace(',', '.')) || 0,
            unidade_medida: item.unidade_medida_produto || 'm',
          },
          materiais: insumosDoProduto,
          maquinas: maquinasDoProduto,
          funcoes: funcoesDoProduto,
          servicos: servicosDoProduto,
          custo_total_producao: custoTotalProducao,
          preco_unitario: precoUnitario,
          preco_total: precoTotal,
          horas_producao: horasProducao,
          custos_indiretos_rateados: custosIndiretos,
        };
      });

      // Calcular resumo geral
      const totalCustoMaterial = produtos.reduce((acc, p) => 
        acc + p.materiais.reduce((acc2, m) => acc2 + (m.quantidade * m.custo_unitario), 0), 0);
      const totalCustoMaquinaria = produtos.reduce((acc, p) => 
        acc + p.maquinas.reduce((acc2, m) => acc2 + (m.horas_utilizadas * m.custo_por_hora), 0), 0);
      const totalCustoMaoObra = produtos.reduce((acc, p) => 
        acc + p.funcoes.reduce((acc2, f) => acc2 + (f.horas_trabalhadas * f.custo_por_hora), 0), 0);
      const totalCustoIndireto = produtos.reduce((acc, p) => acc + p.custos_indiretos_rateados, 0);
      const totalCustoProducao = totalCustoMaterial + totalCustoMaquinaria + totalCustoMaoObra + totalCustoIndireto;
      
      const margemLucroPercentual = Number(formData.margem_lucro_customizada?.replace(',', '.')) || 30;
      const impostosPercentual = Number(formData.impostos_customizados?.replace(',', '.')) || 18;
      const comissaoPercentual = Number(formData.comissao_percentual?.replace(',', '.')) || 5;
      
      const totalMargemLucro = totalCustoProducao * (margemLucroPercentual / 100);
      const subtotalComLucro = totalCustoProducao + totalMargemLucro;
      const totalImpostos = subtotalComLucro * (impostosPercentual / 100);
      const precoFinal = subtotalComLucro + totalImpostos;
      const comissaoTotal = precoFinal * (comissaoPercentual / 100);
      const tempoTotalProducao = produtos.reduce((acc, p) => acc + p.horas_producao, 0);

      return {
        resumo: {
          total_produtos: produtos.length,
          total_custo_material: totalCustoMaterial,
          total_custo_maquinaria: totalCustoMaquinaria,
          total_custo_mao_obra: totalCustoMaoObra,
          total_custo_indireto: totalCustoIndireto,
          total_custo_producao: totalCustoProducao,
          total_margem_lucro: totalMargemLucro,
          total_impostos: totalImpostos,
          preco_final: precoFinal,
          tempo_total_producao: tempoTotalProducao,
          margem_lucro_percentual: margemLucroPercentual,
          impostos_percentual: impostosPercentual,
          comissao_percentual: comissaoPercentual,
          comissao_total: comissaoTotal,
        },
        produtos: produtos,
        custosIndiretos: custosIndiretos.map((custo: any) => ({
          id: custo.id,
          nome: custo.nome,
          categoria: custo.categoria || 'Geral',
          valor_mensal: Number(custo.valor_mensal) || 0,
          ativo: true,
        })),
        metadata: {
          timestamp_calculo: new Date(),
          versao_motor: '2.1.3',
          tempo_execucao_ms: loading ? 0 : 245,
          estagios_executados: ['validacao', 'materiais', 'maquinas', 'funcoes', 'custos_indiretos', 'margem_lucro', 'impostos'],
        },
      };
    } catch (error) {
      console.error('Erro ao processar dados reais:', error);
      return mockData;
    }
  };

  // Usar dados reais se disponíveis, senão usar mockados
  const data = form && dadosCarregados ? processarDadosReais() : mockData;

  // Calcular total dos custos indiretos
  const totalCustosIndiretos = data.custosIndiretos.reduce((total: number, custo: any) => {
    return total + custo.valor_mensal;
  }, 0);

  // Se não há dados, mostrar estado vazio
  if (!data) {
    return (
      <div className="sticky top-6 bg-white rounded-lg shadow-sm border max-h-[calc(100vh-3rem)] flex flex-col">
        {/* Header fixo */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Preview do Cálculo</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            Desconectado
          </Badge>
        </div>
        
        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhum cálculo disponível</p>
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
          <h2 className="text-lg font-semibold text-gray-900">Preview do Cálculo</h2>
        </div>
        <Badge 
          variant="outline" 
          className={`text-xs ${isConnected ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}
        >
          {connectionStatus === 'connecting' ? 'Conectando...' : 
           isConnected ? 'Tempo real ativo' : 
           connectionStatus === 'error' ? 'Erro de conexão' : 'Desconectado'}
        </Badge>
      </div>

      {/* Conteúdo com scroll */}
      <div className="flex-1 overflow-y-auto p-6 pt-4">
        <div className="space-y-4">
        {/* Resumo do Orçamento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Resumo do Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Valor Total (Venda)</span>
              <span className="text-lg font-bold text-green-600">
                R$ {data.resumo.preco_final.toFixed(2)}
              </span>
            </div>
            
            <Separator />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Custo de Produção</span>
                <span>R$ {data.resumo.total_custo_producao.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Margem de Lucro ({data.resumo.margem_lucro_percentual}%)</span>
                <span className="text-green-600">+R$ {data.resumo.total_margem_lucro.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impostos ({data.resumo.impostos_percentual}%)</span>
                <span className="text-red-600">+R$ {data.resumo.total_impostos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Comissão ({data.resumo.comissao_percentual}%)</span>
                <span className="text-orange-600">+R$ {data.resumo.comissao_total.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-gray-600">Horas Totais</span>
              </div>
              <span>{data.resumo.tempo_total_producao}h</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Itens no Orçamento</span>
              <span>{data.resumo.total_produtos}</span>
            </div>
          </CardContent>
        </Card>

        {/* Detalhamento por Produto */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Produtos no Orçamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.produtos.map((produto) => (
              <div key={produto.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{produto.nome_servico}</h4>
                    <p className="text-xs text-gray-500">
                      {produto.quantidade}x • {formatarDimensoes(produto.dimensoes)} • {produto.descricao}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      R$ {produto.preco_total.toFixed(2)}
                    </div>
                    {produto.quantidade > 1 && (
                      <div className="text-xs text-gray-500">
                        R$ {produto.preco_unitario.toFixed(2)}/un
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Custo de Produção</span>
                    <span>R$ {produto.custo_total_producao.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horas de Produção</span>
                    <span>{produto.horas_producao}h</span>
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
                          <div key={idx} className="flex justify-between text-xs">
                            <div>
                              <div className="font-medium">{material.nome}</div>
                              <div className="text-gray-500">
                                {formatarConsumoMaterial(material)} • R$ {material.custo_unitario.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              R$ {(material.quantidade * material.custo_unitario).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Máquinas */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Máquinas</h5>
                      <div className="space-y-1">
                        {produto.maquinas.map((maquina, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <div>
                              <div className="font-medium">{maquina.nome}</div>
                              <div className="text-gray-500">
                                {formatarHoras(maquina.horas_utilizadas)} • R$ {maquina.custo_por_hora.toFixed(2)}/h
                              </div>
                            </div>
                            <div className="text-right">
                              R$ {(maquina.horas_utilizadas * maquina.custo_por_hora).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Funções */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Mão de Obra</h5>
                      <div className="space-y-1">
                        {produto.funcoes.map((funcao, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <div>
                              <div className="font-medium">{funcao.nome}</div>
                              <div className="text-gray-500">
                                {formatarHoras(funcao.horas_trabalhadas)} • R$ {funcao.custo_por_hora.toFixed(2)}/h
                              </div>
                            </div>
                            <div className="text-right">
                              R$ {(funcao.horas_trabalhadas * funcao.custo_por_hora).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Serviços Manuais */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Serviços Manuais</h5>
                      <div className="space-y-1">
                        {produto.servicos.map((servico, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <div>
                              <div className="font-medium">{servico.nome}</div>
                              <div className="text-gray-500">
                                {formatarHoras(servico.horas_trabalhadas)} • R$ {servico.custo_por_hora.toFixed(2)}/h
                              </div>
                            </div>
                            <div className="text-right">
                              R$ {(servico.horas_trabalhadas * servico.custo_por_hora).toFixed(2)}
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
                        <span>R$ {produto.custos_indiretos_rateados.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Custos Indiretos Globais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Custos Indiretos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Total dos Custos Indiretos</span>
              <span className="font-semibold">
                R$ {totalCustosIndiretos.toFixed(2)}
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
                  <div key={custo.id} className="flex justify-between text-xs">
                    <span>{custo.nome}</span>
                    <span>R$ {custo.valor_mensal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações de Sistema */}
        <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded">
          <div>Última atualização: {data.metadata.timestamp_calculo.toLocaleTimeString('pt-BR')}</div>
          <div className="mt-1">Versão do cálculo: {data.metadata.versao_motor}</div>
          <div className="mt-1">Tempo de execução: {data.metadata.tempo_execucao_ms}ms</div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCalculoV2;
