'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, FileText } from 'lucide-react';

interface VersaoHistorico {
  id: string;
  versao: string;
  data: string;
  autor: string;
  status: string;
  thumbnail: string;
  isAtual: boolean;
}

interface ArtePublicVersaoHistoricoProps {
  versoes: VersaoHistorico[];
  versaoAtual: VersaoHistorico | null;
  onVersaoSelect: (versaoId: string) => void;
}

export function ArtePublicVersaoHistorico({
  versoes,
  versaoAtual,
  onVersaoSelect
}: ArtePublicVersaoHistoricoProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'REVISAO_SOLICITADA':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'ENVIADA_CLIENTE':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'bg-green-100 text-green-800';
      case 'REVISAO_SOLICITADA':
        return 'bg-red-100 text-red-800';
      case 'ENVIADA_CLIENTE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-2 max-h-32 overflow-y-auto">
      {versoes.map((versao) => (
        <div
          key={versao.id}
          onClick={() => onVersaoSelect(versao.id)}
          className={`
            cursor-pointer rounded-lg p-2 transition-all duration-200
            ${versaoAtual?.id === versao.id 
              ? 'bg-blue-50 border border-blue-200' 
              : 'bg-gray-50 hover:bg-gray-100'
            }
          `}
        >
          <div className="flex items-center space-x-2">
            {/* Thumbnail */}
            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
              {versao.thumbnail ? (
                <img
                  src={versao.thumbnail}
                  alt={versao.versao}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <FileText className="h-4 w-4 text-gray-500" />
              )}
            </div>

            {/* Informações */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-gray-900">
                  {versao.versao}
                </span>
                {versao.isAtual && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Atual
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                {getStatusIcon(versao.status)}
                <span className="text-xs text-gray-500">
                  {formatarData(versao.data)}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <Badge 
              variant="secondary" 
              className={`text-xs px-1 py-0 ${getStatusColor(versao.status)}`}
            >
              {versao.status === 'APROVADA' && 'Aprovada'}
              {versao.status === 'REVISAO_SOLICITADA' && 'Revisão'}
              {versao.status === 'ENVIADA_CLIENTE' && 'Pendente'}
            </Badge>
          </div>
        </div>
      ))}
      
      {versoes.length === 0 && (
        <div className="text-center py-4">
          <FileText className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Nenhuma versão encontrada</p>
        </div>
      )}
    </div>
  );
}
