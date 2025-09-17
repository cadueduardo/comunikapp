'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Eye, Calculator, Clock, Package, AlertCircle, Save, Send, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { orcamentosApi } from '@/lib/api-client';

interface PreviewCalculoV2IntegradoProps {
  variant?: 'orcamento' | 'produto';
  showAllProducts?: boolean;
  dadosCarregados?: boolean;
  orcamentoId?: string;
  onCalculoCompleto?: (resultado: any) => void;
  modo?: 'visualizacao' | 'edicao' | 'criacao';
}

interface ResultadoCalculo {
  orcamento: any;
  custos: any;
  detalhamento: any;
  alertas: string[];
}

const PreviewCalculoV2Integrado: React.FC<PreviewCalculoV2IntegradoProps> = ({
  variant = 'orcamento',
  showAllProducts = true,
  dadosCarregados = true,
  orcamentoId,
  onCalculoCompleto,
  modo = 'visualizacao'
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showIndirectCosts, setShowIndirectCosts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultadoCalculo, setResultadoCalculo] = useState<ResultadoCalculo | null>(null);
  const [dadosOrcamento, setDadosOrcamento] = useState<any>(null);

  // Dados mockados baseados no arquivo original (fallback)
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
      }
    ],
    recursos_compartilhados: {},
    contexto_comercial: {},
    metadata: {
      timestamp_calculo: new Date(),
      versao_motor: '2.0.0',
      tempo_execucao_ms: 100,
      estagios_executados: ['validacao', 'calculo', 'consolidacao']
    }
  };

  // Carregar dados do orçamento se ID fornecido
  useEffect(() => {
    if (orcamentoId && modo !== 'criacao') {
      carregarDadosOrcamento();
    }
  }, [orcamentoId, modo]);

  const carregarDadosOrcamento = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const data = await orcamentosApi.v2.getById(orcamentoId!, token);
      setDadosOrcamento(data);
      
      // Se já tem resultado de cálculo, usar ele
      if (data.resultado_calculo) {
        setResultadoCalculo(data.resultado_calculo);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do orçamento:', error);
      toast.error('Erro ao carregar dados do orçamento');
    } finally {
      setLoading(false);
    }
  };

  // Executar cálculo via motor V2
  const executarCalculo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      // Preparar dados para cálculo
      const dadosCalculo = {
        produtos: dadosOrcamento?.produtos || mockData.produtos,
        configuracoes_globais: {
          margem_lucro_padrao: 0.3,
          impostos_padrao: 0.18,
          horas_produtivas_mensais: 160
        },
        contexto_comercial: dadosOrcamento?.contexto_comercial || {}
      };

      // Executar cálculo via API V2
      const resultado = await orcamentosApi.v2.calcularOrcamento(dadosCalculo, token);
      setResultadoCalculo(resultado);
      
      // Notificar componente pai
      if (onCalculoCompleto) {
        onCalculoCompleto(resultado);
      }

      toast.success('✅ Cálculo realizado com sucesso via Motor V2!');
    } catch (error) {
      console.error('Erro ao executar cálculo:', error);
      toast.error('❌ Erro ao executar cálculo');
    } finally {
      setLoading(false);
    }
  };

  // Salvar orçamento
  const salvarOrcamento = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      if (!resultadoCalculo) {
        toast.error('Execute o cálculo primeiro');
        return;
      }

      const dadosOrcamento = {
        ...dadosOrcamento,
        resultado_calculo: resultadoCalculo,
        custo_total: resultadoCalculo.custos.preco_final,
        status: 'rascunho'
      };

      if (orcamentoId) {
        // Atualizar orçamento existente
        await orcamentosApi.v2.update(orcamentoId, dadosOrcamento, token);
        toast.success('✅ Orçamento atualizado com sucesso!');
      } else {
        // Criar novo orçamento
        const novoOrcamento = await orcamentosApi.v2.create(dadosOrcamento, token);
        toast.success('✅ Orçamento criado com sucesso!');
        
        // Redirecionar para edição
        if (novoOrcamento.id) {
          window.location.href = `/orcamentos/${novoOrcamento.id}/editar`;
        }
      }
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast.error('❌ Erro ao salvar orçamento');
    } finally {
      setLoading(false);
    }
  };

  // Enviar para aprovação
  const enviarParaAprovacao = async () => {
    try {
      if (!orcamentoId) {
        toast.error('Salve o orçamento primeiro');
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      await orcamentosApi.v2.enviarParaAprovacao(orcamentoId, 'Enviado via Preview V2', token);
      toast.success('✅ Orçamento enviado para aprovação!');
    } catch (error) {
      console.error('Erro ao enviar para aprovação:', error);
      toast.error('❌ Erro ao enviar para aprovação');
    } finally {
      setLoading(false);
    }
  };

  // Aprovar orçamento
  const aprovarOrcamento = async () => {
    try {
      if (!orcamentoId) {
        toast.error('ID do orçamento não encontrado');
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      await orcamentosApi.v2.aprovar(orcamentoId, 'Aprovado via Preview V2', token);
      toast.success('✅ Orçamento aprovado com sucesso!');
    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error);
      toast.error('❌ Erro ao aprovar orçamento');
    } finally {
      setLoading(false);
    }
  };

  // Rejeitar orçamento
  const rejeitarOrcamento = async () => {
    try {
      if (!orcamentoId) {
        toast.error('ID do orçamento não encontrado');
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      await orcamentosApi.v2.rejeitar(orcamentoId, 'Rejeitado via Preview V2', token);
      toast.success('✅ Orçamento rejeitado');
    } catch (error) {
      console.error('Erro ao rejeitar orçamento:', error);
      toast.error('❌ Erro ao rejeitar orçamento');
    } finally {
      setLoading(false);
    }
  };

  // Usar dados do cálculo ou fallback para mock
  const dadosExibicao = resultadoCalculo || mockData;

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Preview de Cálculo V2 - Motor Integrado
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {modo === 'edicao' && (
                <>
                  <Button
                    onClick={executarCalculo}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    {loading ? 'Calculando...' : 'Recalcular'}
                  </Button>
                  
                  <Button
                    onClick={salvarOrcamento}
                    disabled={loading || !resultadoCalculo}
                    variant="default"
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </>
              )}
              
              {modo === 'criacao' && (
                <>
                  <Button
                    onClick={executarCalculo}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    {loading ? 'Calculando...' : 'Calcular'}
                  </Button>
                  
                  <Button
                    onClick={salvarOrcamento}
                    disabled={loading || !resultadoCalculo}
                    variant="default"
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Criar Orçamento
                  </Button>
                </>
              )}
              
              {modo === 'visualizacao' && orcamentoId && (
                <>
                  <Button
                    onClick={enviarParaAprovacao}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </Button>
                  
                  <Button
                    onClick={aprovarOrcamento}
                    disabled={loading}
                    variant="default"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                  
                  <Button
                    onClick={rejeitarOrcamento}
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resumo do cálculo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Resumo do Cálculo
            {resultadoCalculo && (
              <Badge variant="secondary" className="ml-2">
                Motor V2 - {dadosExibicao.metadata?.versao_motor || '2.0.0'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dadosExibicao.resumo?.preco_final?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
              </div>
              <div className="text-sm text-gray-600">Preço Final</div>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-semibold text-blue-600">
                {dadosExibicao.resumo?.total_custo_producao?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
              </div>
              <div className="text-sm text-gray-600">Custo Produção</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-medium text-purple-600">
                {dadosExibicao.resumo?.margem_lucro_percentual || 0}%
              </div>
              <div className="text-sm text-gray-600">Margem Lucro</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-medium text-orange-600">
                {dadosExibicao.resumo?.tempo_total_producao || 0}h
              </div>
              <div className="text-sm text-gray-600">Tempo Produção</div>
            </div>
          </div>
          
          {resultadoCalculo && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Cálculo realizado via Motor V2 em {dadosExibicao.metadata?.tempo_execucao_ms || 0}ms
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Produtos */}
      {showAllProducts && dadosExibicao.produtos && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos ({dadosExibicao.produtos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dadosExibicao.produtos.map((produto: any, index: number) => (
                <div key={produto.id || index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{produto.nome_servico}</h4>
                      <p className="text-sm text-gray-600">{produto.descricao}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {produto.preco_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Qtd: {produto.quantidade} | Unit: {produto.preco_unitario?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(produto.id || index.toString())}
                    className="w-full"
                  >
                    {expandedItems[produto.id || index.toString()] ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Ocultar Detalhes
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </>
                    )}
                  </Button>
                  
                  {expandedItems[produto.id || index.toString()] && (
                    <div className="mt-4 space-y-3">
                      {/* Materiais */}
                      {produto.materiais && produto.materiais.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Materiais</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {produto.materiais.map((material: any, matIndex: number) => (
                              <div key={matIndex} className="flex justify-between text-sm">
                                <span>{material.nome}</span>
                                <span className="font-medium">
                                  {material.quantidade} {material.unidade_consumo} × R$ {material.custo_unitario}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Máquinas */}
                      {produto.maquinas && produto.maquinas.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Máquinas</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {produto.maquinas.map((maquina: any, maqIndex: number) => (
                              <div key={maqIndex} className="flex justify-between text-sm">
                                <span>{maquina.nome}</span>
                                <span className="font-medium">
                                  {maquina.horas_utilizadas}h × R$ {maquina.custo_por_hora}/h
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Funções */}
                      {produto.funcoes && produto.funcoes.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Funções</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {produto.funcoes.map((funcao: any, funcIndex: number) => (
                              <div key={funcIndex} className="flex justify-between text-sm">
                                <span>{funcao.nome}</span>
                                <span className="font-medium">
                                  {funcao.horas_trabalhadas}h × R$ {funcao.custo_por_hora}/h
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custos Indiretos */}
      {showIndirectCosts && dadosExibicao.resumo?.total_custo_indireto && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Custos Indiretos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {dadosExibicao.resumo.total_custo_indireto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-sm text-gray-600">Custos Indiretos Rateados</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {resultadoCalculo?.alertas && resultadoCalculo.alertas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Alertas do Motor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resultadoCalculo.alertas.map((alerta, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-orange-700">
                  <AlertCircle className="h-4 w-4" />
                  {alerta}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PreviewCalculoV2Integrado;


