'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  X, 
  CheckCircle, 
  Clock, 
  XCircle 
} from 'lucide-react';

interface ProdutoArte {
  id: string;
  nome: string;
  versaoAtual: string;
  status: 'APROVADA' | 'ENVIADA_CLIENTE' | 'REVISAO_SOLICITADA';
  statusColor: 'green' | 'yellow' | 'red';
}

interface ArtePublicHeaderProps {
  osData: {
    numero_os: string;
    cliente: { nome: string };
  };
  produtos: ProdutoArte[];
  produtoSelecionado: string;
  onProdutoChange: (produtoId: string) => void;
  onDownloadPDF: () => void;
  onDownloadJPG: () => void;
  onClose: () => void;
}

export function ArtePublicHeader({
  osData,
  produtos,
  produtoSelecionado,
  onProdutoChange,
  onDownloadPDF,
  onDownloadJPG,
  onClose
}: ArtePublicHeaderProps) {
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return <CheckCircle className="h-3 w-3" />;
      case 'ENVIADA_CLIENTE':
        return <Clock className="h-3 w-3" />;
      case 'REVISAO_SOLICITADA':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'text-green-600';
      case 'ENVIADA_CLIENTE':
        return 'text-yellow-600';
      case 'REVISAO_SOLICITADA':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Título e Cliente */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Prévia pública — Aprovação de Arte
          </h1>
          <p className="text-sm text-gray-600">
            • {osData.cliente.nome}
          </p>
        </div>
        
        {/* Botões de Download e Fechar */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadPDF}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Baixar Arquivo</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
