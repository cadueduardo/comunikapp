'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  MessageSquare,
  Download
} from 'lucide-react';
import { ArtePublicTabs } from './ArtePublicTabs';
import { ArtePublicChatWithMentions } from './ArtePublicChatWithMentions';
import { ArtePublicPreview } from './ArtePublicPreview';
import { ArtePublicVersaoHistorico } from './ArtePublicVersaoHistorico';
import { ArteApprovalModal } from './ArteApprovalModal';

interface ProdutoArte {
  id: string;
  nome: string;
  versaoAtual: string;
  status: 'APROVADA' | 'ENVIADA_CLIENTE' | 'REVISAO_SOLICITADA';
  statusColor: 'green' | 'yellow' | 'red';
}

interface VersaoHistorico {
  id: string;
  versao: string;
  data: string;
  autor: string;
  status: string;
  thumbnail: string;
  isAtual: boolean;
}

interface MensagemArte {
  id: string;
  autor_nome: string;
  autor_tipo: 'CLIENTE' | 'EQUIPE';
  mensagem: string;
  mensagem_processada?: string;
  data_comentario: string;
  mencoes_versoes?: string[];
}

interface ArtePublicSidebarProps {
  // Dados dos produtos
  produtos: ProdutoArte[];
  produtoSelecionado: string;
  onProdutoSelect: (produtoId: string) => void;
  
  // Dados das versões
  versoesHistorico: VersaoHistorico[];
  versaoAtual: VersaoHistorico | null;
  onVersaoSelect: (versaoId: string) => void;
  
  // Chat
  mensagens: MensagemArte[];
  onEnviarMensagem: (mensagem: string, mencoes?: string[]) => void;
  
  // Aprovação
  onAprovar: () => void;
  onRejeitar: () => void;
  declarationChecked: boolean;
  onDeclarationChange: (checked: boolean) => void;
  
  // Token para chat público
  token?: string;
  
  // Estados
  loading?: boolean;
  processing?: boolean;
}

export function ArtePublicSidebar({
  produtos,
  produtoSelecionado,
  onProdutoSelect,
  versoesHistorico,
  versaoAtual,
  onVersaoSelect,
  mensagens,
  onEnviarMensagem,
  onAprovar,
  onRejeitar,
  declarationChecked,
  onDeclarationChange,
  token,
  loading = false,
  processing = false
}: ArtePublicSidebarProps) {
  const [chatExpanded, setChatExpanded] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const handleAprovarClick = () => {
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = () => {
    setShowApprovalModal(false);
    onAprovar();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REVISAO_SOLICITADA':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'ENVIADA_CLIENTE':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="w-full h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Tabs de Produtos */}
      <div className="border-b border-gray-200 p-4">
        <ArtePublicTabs
          produtos={produtos}
          produtoSelecionado={produtoSelecionado}
          onProdutoSelect={onProdutoSelect}
        />
      </div>

      {/* Preview da Arte */}
      <div className="flex-1 p-4 border-b border-gray-200">
        <ArtePublicPreview
          versaoAtual={versaoAtual}
          loading={loading}
        />
      </div>

      {/* Histórico de Versões */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Histórico de Versões</h3>
        <ArtePublicVersaoHistorico
          versoes={versoesHistorico}
          versaoAtual={versaoAtual}
          onVersaoSelect={onVersaoSelect}
        />
      </div>

      {/* Botões de Ação */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="space-y-2">
          <Button
            onClick={handleAprovarClick}
            disabled={processing || !declarationChecked}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar Arte
          </Button>
          
          <Button
            onClick={onRejeitar}
            disabled={processing}
            variant="destructive"
            className="w-full"
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
          <label 
            htmlFor="declaration" 
            className="text-xs text-gray-700 cursor-pointer"
          >
            Declaro que revisei e aprovo a arte final
          </label>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Comentários do Cliente
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChatExpanded(!chatExpanded)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {chatExpanded && (
          <div className="flex-1 min-h-0">
            <ArtePublicChatWithMentions
              versaoId={versaoAtual?.id || ''}
              token={token || ''}
              versoesDisponiveis={versoesHistorico.map(v => ({
                id: v.id,
                versao: v.versao,
                status: v.status,
                data_criacao: v.data,
                autor: { nome: v.autor }
              }))}
              produtoNome={produtos.find(p => p.id === produtoSelecionado)?.nome || 'Produto'}
              produtoId={produtoSelecionado}
              onMensagemEnviada={() => {
                // Recarregar mensagens se necessário
              }}
            />
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Aprovação */}
      <ArteApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onConfirm={handleConfirmApproval}
        produtoNome={produtos.find(p => p.id === produtoSelecionado)?.nome || 'Produto'}
        versao={versaoAtual?.versao || 'N/A'}
        processing={processing}
      />
    </div>
  );
}





