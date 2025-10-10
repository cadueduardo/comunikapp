/**
 * Componente para listar produtos da OS com seus prazos
 * Exibe lista de produtos com status e permite gerenciar prazos individuais
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PrazoProdutoComponent } from './PrazoProdutoComponent';
import { AlertTriangle, Package, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Produto {
  id: string;
  produto_servico: string;
  quantidade: number;
  data_inicio_producao?: Date;
  data_prazo_produto?: Date;
  prioridade_produto?: string;
  status_liberacao_pcp?: string;
}

interface ListaProdutosComPrazoProps {
  osId: string;
  prazoFinalOS?: Date;
  readonly?: boolean;
}

export function ListaProdutosComPrazo({ 
  osId, 
  prazoFinalOS,
  readonly = false 
}: ListaProdutosComPrazoProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resumo, setResumo] = useState({
    total_produtos: 0,
    com_prazo: 0,
    sem_prazo: 0,
    liberados_pcp: 0,
    pendentes: 0
  });

  useEffect(() => {
    if (osId) {
      carregarProdutos();
    }
  }, [osId]);

  const carregarProdutos = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/os/produtos/${osId}/status-produtos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      
      if (result.success) {
        setProdutos(result.data.produtos || []);
        setResumo(result.data.resumo || {
          total_produtos: 0,
          com_prazo: 0,
          sem_prazo: 0,
          liberados_pcp: 0,
          pendentes: 0
        });
      } else {
        toast.error('Erro ao carregar produtos');
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>Nenhum produto encontrado nesta OS</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-gray-600">Total: </span>
            <span className="font-medium">{resumo.total_produtos}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Com prazo: </span>
            <span className="font-medium text-green-600">{resumo.com_prazo}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Sem prazo: </span>
            <span className="font-medium text-yellow-600">{resumo.sem_prazo}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Liberados: </span>
            <span className="font-medium text-blue-600">{resumo.liberados_pcp}</span>
          </div>
        </div>
      </div>

      {/* Disclaimer se houver produtos sem prazo */}
      {resumo.sem_prazo > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">
                {resumo.sem_prazo} produto(s) sem prazo de produção definido
              </p>
              <p className="text-xs mt-1">
                Defina os prazos para liberar os produtos ao PCP.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de produtos */}
      <div className="space-y-3">
        {produtos.map((produto, index) => (
          <PrazoProdutoComponent
            key={produto.item_id || `produto-${index}-${produto.produto_servico}`}
            osId={osId}
            itemId={produto.item_id} // ID do item da OS
            produtoId={produto.produto_id || produto.item_id} // Usar produto_id se disponível (ID original do orçamento)
            produtoNome={produto.produto_servico}
            dataPrazoProduto={produto.data_prazo_produto}
            dataInicio={produto.data_inicio_producao}
            prioridade={produto.prioridade_produto}
            statusLiberacao={produto.status_liberacao_pcp}
            prazoFinalOS={prazoFinalOS}
            onPrazoChange={carregarProdutos}
            readonly={readonly}
          />
        ))}
      </div>
    </div>
  );
}
