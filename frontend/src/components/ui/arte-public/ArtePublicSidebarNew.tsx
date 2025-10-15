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
  ChevronUp,
  X,
  Maximize2
} from 'lucide-react';
import { ArtePublicChatWithMentions } from './ArtePublicChatWithMentions';
// Removido useIsMobile para evitar erro do React

interface VersaoArte {
  id: string;
  versao: string;
  status: string;
  data_criacao: string;
  autor: {
    nome: string;
  };
  nomeArquivo?: string;
  descricao?: string;
  arquivos?: Array<{
    id: string;
    nome_original: string;
    url_thumbnail?: string;
  }>;
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
  token: string;
}

export function ArtePublicSidebarNew({
  produtoAtual,
  versoes,
  versaoSelecionada,
  onVersaoChange,
  token
}: ArtePublicSidebarProps) {

  const [showMobileModal, setShowMobileModal] = useState(false);
  const [versaoModal, setVersaoModal] = useState<VersaoArte | null>(null);

  // Função para formatar datas
  const formatarData = (dataString: any): string => {
    console.log('🔍 [formatarData] Data recebida:', { 
      dataString, 
      tipo: typeof dataString,
      keys: dataString && typeof dataString === 'object' ? Object.keys(dataString) : 'N/A'
    });
    
    if (!dataString) {
      return 'Data não disponível';
    }

    try {
      let data: Date;
      
      // Se já é um objeto Date
      if (dataString instanceof Date) {
        data = dataString;
      } 
      // Se é uma string
      else if (typeof dataString === 'string') {
        data = new Date(dataString);
      }
      // Se é um objeto
      else if (typeof dataString === 'object') {
        // Verificar se é um objeto vazio
        if (Object.keys(dataString).length === 0) {
          console.warn('🔍 [formatarData] Objeto vazio recebido, usando data atual como fallback');
          return 'Data não disponível';
        }
        
        // Tentar diferentes propriedades comuns
        const dateValue = dataString.date || dataString.data_criacao || dataString.created_at || dataString.timestamp;
        if (dateValue) {
          console.log('🔍 [formatarData] Usando propriedade de data:', dateValue);
          data = new Date(dateValue);
        } else {
          console.warn('🔍 [formatarData] Nenhuma propriedade de data encontrada no objeto:', dataString);
          return 'Data não disponível';
        }
      }
      else {
        console.warn('🔍 [formatarData] Tipo de data não suportado:', typeof dataString);
        return 'Data não disponível';
      }

      if (isNaN(data.getTime())) {
        console.warn('🔍 [formatarData] Data inválida após parsing:', dataString);
        return 'Data não disponível';
      }

      const dataFormatada = data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      console.log('✅ [formatarData] Data formatada:', dataFormatada);
      return dataFormatada;
    } catch (error) {
      console.error('❌ [formatarData] Erro ao formatar data:', error, { dataString });
      return 'Data não disponível';
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
    <div className="w-full bg-white flex flex-col h-full">
      
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
                       onClick={() => {
                         // Sempre abre modal mobile, CSS responsivo controla a exibição
                         setVersaoModal(versao);
                         setShowMobileModal(true);
                         // Também seleciona a versão para desktop
                         onVersaoChange(versao.id);
                       }}
                       className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                         versaoSelecionada === versao.id
                           ? 'border-purple-500 bg-purple-100 shadow-md ring-2 ring-purple-200'
                           : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                       }`}
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                           <span 
                             className={`font-semibold text-sm ${
                               versaoSelecionada === versao.id ? 'text-purple-900' : 'text-gray-700'
                             }`}
                             title={`${versao.versao.toUpperCase()} - ${produtoAtual?.nome || 'Produto'}`}
                           >
                             {(() => {
                               const tituloCompleto = `${versao.versao.toUpperCase()} - ${produtoAtual?.nome || 'Produto'}`;
                               return tituloCompleto.length > 25 ? `${tituloCompleto.substring(0, 22)}...` : tituloCompleto;
                             })()}
                           </span>
                           {getStatusIcon(versao.status)}
                           {/* Ícone para indicar modal - visível apenas em mobile */}
                           <Maximize2 className="lg:hidden h-3 w-3 text-gray-400 ml-1" title="Toque para visualizar" />
                         </div>
                         <div 
                           className={`text-xs truncate max-w-[60px] ${
                             versaoSelecionada === versao.id ? 'text-purple-600' : 'text-gray-500'
                           }`}
                           title={formatarData(versao.data_criacao)}
                         >
                           {formatarData(versao.data_criacao)}
                         </div>
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

      {/* Modal Mobile - Visualização da arte em tela cheia */}
      {showMobileModal && versaoModal && (
        <div 
          className="fixed inset-0 bg-black z-50 flex flex-col lg:hidden"
          onClick={() => setShowMobileModal(false)}
        >
          {/* Header do Modal Mobile */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {produtoAtual?.nome || 'Produto'}
              </h3>
              <p className="text-sm text-gray-600">
                {versaoModal.versao.toUpperCase()} • {versaoModal.nomeArquivo || versaoModal.descricao || 'Arte'}
              </p>
            </div>
            <button 
              onClick={() => setShowMobileModal(false)}
              className="ml-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Conteúdo da Arte em Tela Cheia */}
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            {versaoModal.arquivos?.[0]?.url_thumbnail ? (
              <img
                src={`http://localhost:4000${versaoModal.arquivos[0].url_thumbnail}`}
                alt={versaoModal.arquivos[0].nome_original}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="text-center text-white">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-lg">Arte não disponível</p>
              </div>
            )}
          </div>

          {/* Footer com informações */}
          <div className="bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Toque fora da imagem para fechar</span>
              <span>{versaoModal.versao.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
