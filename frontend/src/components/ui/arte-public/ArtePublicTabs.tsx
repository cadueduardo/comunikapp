'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface ProdutoArte {
  id: string;
  nome: string;
  versaoAtual: string;
  status: 'APROVADA' | 'ENVIADA_CLIENTE' | 'REVISAO_SOLICITADA';
  statusColor: 'green' | 'yellow' | 'red';
}

interface ArtePublicTabsProps {
  produtos: ProdutoArte[];
  produtoSelecionado: string;
  onProdutoSelect: (produtoId: string) => void;
}

export function ArtePublicTabs({
  produtos,
  produtoSelecionado,
  onProdutoSelect
}: ArtePublicTabsProps) {
  const getStatusIcon = (status: string, statusColor: string) => {
    const iconClass = "h-3 w-3";
    
    switch (statusColor) {
      case 'green':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'yellow':
        return <Clock className={`${iconClass} text-yellow-500`} />;
      case 'red':
        return <XCircle className={`${iconClass} text-red-500`} />;
      default:
        return <Clock className={`${iconClass} text-gray-500`} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'Aprovada';
      case 'ENVIADA_CLIENTE':
        return 'Aguardando Aprovação';
      case 'REVISAO_SOLICITADA':
        return 'Revisão Solicitada';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Produtos</h3>
      
      {produtos.map((produto) => (
        <div
          key={produto.id}
          onClick={() => onProdutoSelect(produto.id)}
          className={`
            cursor-pointer rounded-lg p-3 transition-all duration-200
            ${produtoSelecionado === produto.id 
              ? 'bg-purple-100 border-2 border-purple-300' 
              : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(produto.status, produto.statusColor)}
              <span className="text-sm font-medium text-gray-900">
                {produto.versaoAtual} {produto.nome}
              </span>
            </div>
            
            <Badge 
              variant="secondary"
              className={`
                text-xs
                ${produto.status === 'APROVADA' ? 'bg-green-100 text-green-800' : ''}
                ${produto.status === 'ENVIADA_CLIENTE' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${produto.status === 'REVISAO_SOLICITADA' ? 'bg-red-100 text-red-800' : ''}
              `}
            >
              {getStatusLabel(produto.status)}
            </Badge>
          </div>
          
          {produtoSelecionado === produto.id && (
            <div className="mt-2 text-xs text-purple-600">
              Selecionado
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
