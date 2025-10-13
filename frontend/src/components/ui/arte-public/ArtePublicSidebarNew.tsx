'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ArtePublicChatWithMentions } from './ArtePublicChatWithMentions';

interface VersaoArte {
  id: string;
  versao: string;
  status: string;
  data_criacao: string;
  autor: {
    nome: string;
  };
}

interface MensagemArte {
  id: string;
  autor: string;
  autorTipo: 'cliente' | 'equipe';
  mensagem: string;
  data: string;
  lida: boolean;
}

interface ArtePublicSidebarProps {
  produtoAtual: {
    id: string;
    nome: string;
    versaoAtual: string;
  } | null;
  versoes: VersaoArte[];
  versaoSelecionada: string;
  onVersaoChange: (versaoId: string) => void;
  onAprovar: () => void;
  onRejeitar: () => void;
  declarationChecked: boolean;
  onDeclarationChange: (checked: boolean) => void;
  processing?: boolean;
  readonly?: boolean;
  token: string;
}

export function ArtePublicSidebarNew({
  produtoAtual,
  versoes,
  versaoSelecionada,
  onVersaoChange,
  onAprovar,
  onRejeitar,
  declarationChecked,
  onDeclarationChange,
  processing = false,
  readonly = false,
  token
}: ArtePublicSidebarProps) {

  // Função para formatar datas
  const formatarData = (dataString: string): string => {
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) {
        return 'Data inválida';
      }
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

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


  return (
    <div className="w-full bg-white border-l border-gray-200 flex flex-col h-full">
      
             {/* Seletor de Versões */}
             <div className="border-b border-gray-200">
               <div className="px-4 py-3">
                 <h3 className="text-sm font-medium text-gray-900 mb-3">Versões</h3>
               </div>
               
               {/* Container com scroll limitado */}
               <div className="max-h-64 overflow-y-auto px-4 pb-4">
                 <div className="space-y-2">
                   {versoes.slice(0, 10).map((versao) => (
                     <button
                       key={versao.id}
                       onClick={() => onVersaoChange(versao.id)}
                       className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                         versaoSelecionada === versao.id
                           ? 'border-purple-500 bg-purple-100 shadow-md ring-2 ring-purple-200'
                           : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                       }`}
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                           <span className={`font-semibold text-sm ${
                             versaoSelecionada === versao.id ? 'text-purple-900' : 'text-gray-700'
                           }`}>
                             {versao.versao}
                           </span>
                           {getStatusIcon(versao.status)}
                         </div>
                         <div className={`text-xs truncate max-w-[60px] ${
                           versaoSelecionada === versao.id ? 'text-purple-600' : 'text-gray-500'
                         }`}>
                           {formatarData(versao.data_criacao)}
                         </div>
                       </div>
                       <div className={`text-xs mt-1 truncate ${
                         versaoSelecionada === versao.id ? 'text-purple-600' : 'text-gray-600'
                       }`}>
                         {versao.autor.nome}
                       </div>
                     </button>
                   ))}
                   
                   {/* Indicador se há mais versões */}
                   {versoes.length > 10 && (
                     <div className="text-center py-2">
                       <span className="text-xs text-gray-500">
                         +{versoes.length - 10} versões anteriores
                       </span>
                     </div>
                   )}
                 </div>
               </div>
             </div>

      {/* Chat com Menções */}
      <div className="flex-1 flex flex-col">
        <ArtePublicChatWithMentions
          versaoId={versaoSelecionada}
          token={token}
          versoesDisponiveis={versoes}
          produtoNome={produtoAtual?.nome || ''}
          onMensagemEnviada={() => {
            // Callback para atualizar notificações no sistema interno
            console.log('Mensagem enviada - atualizar notificações');
          }}
        />
      </div>

      {/* Ações */}
      {!readonly && (
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex space-x-2">
            <Button
              onClick={onAprovar}
              disabled={processing || !declarationChecked}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprovar Arte
            </Button>
            <Button
              onClick={onRejeitar}
              disabled={processing}
              variant="outline"
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Solicitar Alteração
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="declaration"
              checked={declarationChecked}
              onCheckedChange={onDeclarationChange}
            />
            <label htmlFor="declaration" className="text-xs text-gray-700">
              Declaro que revisei e aprovo a arte final
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
