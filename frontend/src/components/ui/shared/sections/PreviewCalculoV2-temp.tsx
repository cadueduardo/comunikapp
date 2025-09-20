'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertCircle } from 'lucide-react';
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
  // Tentar obter contexto do formulário
  let form: any = null;
  try {
    form = useFormContext();
  } catch {
    // Formulário não disponível
  }

  // Hook para dados auxiliares
  const { insumos, maquinas, funcoes, custosIndiretos } = useOrcamentoData();
  
  // Hook para WebSocket
  const { 
    connectionStatus,
    isConnected,
    executarCalculoOrcamento,
    resultadoOrcamento
  } = useCalculoWebSocket();

  // Formatar valores monetários
  const formatarValor = (valor: any): string => {
    if (typeof valor === 'string') {
      return valor; // "Aguardando..."
    }
    if (typeof valor === 'number') {
      return valor.toFixed(2);
    }
    return '0.00';
  };

  // Processar dados do formulário
  const processarDadosFormulario = () => {
    if (!form) {
      return {
        produtos: [],
        resumo: {
          total_produtos: 0,
          total_custo_producao: 'Aguardando...',
          preco_final: 'Aguardando...',
          tempo_total_producao: 'Aguardando...',
        }
      };
    }

    try {
      const formData = form.getValues();
      const itensFormulario = formData.itens_produto || [];

      console.log('🔍 Dados do formulário:', { formData, itensFormulario });

      const produtos = itensFormulario.map((item: any, index: number) => {
        const temNome = item.nome_servico && item.nome_servico.trim() !== '';
        const temQuantidade = item.quantidade_produto && Number(item.quantidade_produto.replace(',', '.')) > 0;
        
        // Processar apenas insumos válidos
        const insumosValidos = (item.materiais || [])
          .filter((material: any) => {
            if (!material.insumo_id || !material.quantidade) return false;
            const insumoData = insumos.find(i => i.id === material.insumo_id);
            return !!insumoData;
          })
          .map((material: any) => {
            const insumoData = insumos.find(i => i.id === material.insumo_id)!;
            const quantidade = Number(material.quantidade?.replace(',', '.')) || 0;
            const custoUnitario = Number(insumoData.custo_unitario) || 0;
            
            return {
              nome: insumoData.nome,
              quantidade,
              custo_unitario: custoUnitario,
              custo_total: quantidade * custoUnitario
            };
          });

        const custoTotal = insumosValidos.reduce((acc, insumo) => acc + insumo.custo_total, 0);

        return {
          id: index + 1,
          nome: temNome ? item.nome_servico : 'Aguardando...',
          quantidade: temQuantidade ? Number(item.quantidade_produto.replace(',', '.')) : 'Aguardando...',
          insumos: insumosValidos,
          custo_total: custoTotal > 0 ? custoTotal : 'Aguardando...'
        };
      });

      const totalCustoProducao = produtos.reduce((acc, p) => {
        if (typeof p.custo_total === 'number') {
          return acc + p.custo_total;
        }
        return acc;
      }, 0);

      return {
        produtos,
        resumo: {
          total_produtos: produtos.length,
          total_custo_producao: totalCustoProducao > 0 ? totalCustoProducao : 'Aguardando...',
          preco_final: totalCustoProducao > 0 ? totalCustoProducao * 1.5 : 'Aguardando...',
          tempo_total_producao: 'Aguardando...',
        }
      };
    } catch (error) {
      console.error('Erro ao processar dados:', error);
      return {
        produtos: [],
        resumo: {
          total_produtos: 0,
          total_custo_producao: 'Erro',
          preco_final: 'Erro',
          tempo_total_producao: 'Erro',
        }
      };
    }
  };

  const data = processarDadosFormulario();

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Preview do Cálculo V2</h2>
        <div className="flex gap-4 text-sm">
          <span>Status: {connectionStatus}</span>
          <span>Conectado: {isConnected ? 'Sim' : 'Não'}</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Produtos:</span>
                <span>{data.resumo.total_produtos}</span>
              </div>
              <div className="flex justify-between">
                <span>Custo de Produção:</span>
                <span>R$ {formatarValor(data.resumo.total_custo_producao)}</span>
              </div>
              <div className="flex justify-between">
                <span>Preço Final:</span>
                <span>R$ {formatarValor(data.resumo.preco_final)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos ({data.produtos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.produtos.length === 0 ? (
              <p className="text-gray-500">Aguardando produtos...</p>
            ) : (
              <div className="space-y-2">
                {data.produtos.map((produto: any, index: number) => (
                  <div key={index} className="border rounded p-3">
                    <div className="font-medium">{produto.nome}</div>
                    <div className="text-sm text-gray-600">
                      Quantidade: {formatarValor(produto.quantidade)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Insumos: {produto.insumos.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Custo: R$ {formatarValor(produto.custo_total)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-xs text-gray-500 text-center">
          <div>Dados: {insumos.length} insumos, {maquinas.length} máquinas, {funcoes.length} funções</div>
          <div>Form: {form ? 'Conectado' : 'Desconectado'}</div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCalculoV2;
