'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  ArtePublicHeader,
  ArtePublicMain,
  ArtePublicSidebarNew
} from '@/components/ui/arte-public';
import { useArtePublicApproval } from '@/components/ui/arte-public/hooks/useArtePublicApproval';

export default function ArtePublicApprovalPage() {
  const params = useParams();
  const token = params.token as string;
  
  const {
    arteData,
    loading,
    error,
    produtos,
    versoes,
    mensagens,
    produtoAtual,
    versaoAtual,
    produtoSelecionado,
    versaoSelecionada,
    declarationChecked,
    processing,
    setProdutoSelecionado,
    setVersaoSelecionada,
    setDeclarationChecked,
    enviarMensagem,
    aprovarArte,
    rejeitarArte,
  } = useArtePublicApproval(token);

  const handleDownloadPDF = () => {
    console.log('Download PDF');
    toast.info('Funcionalidade de download PDF em desenvolvimento');
  };

  const handleDownloadJPG = () => {
    console.log('Download JPG');
    toast.info('Funcionalidade de download JPG em desenvolvimento');
  };

  const handleClose = () => {
    window.close();
  };

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da arte...</p>
        </div>
      </div>
    );
  }

  if (error || !arteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Inválido</h2>
          <p className="text-gray-600 mb-4">
            {error || 'O link de aprovação não foi encontrado ou expirou.'}
          </p>
          <p className="text-sm text-gray-500">
            Entre em contato com o designer para solicitar um novo link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <ArtePublicHeader
        osData={{
          numero_os: arteData.os.numero_os,
          cliente: arteData.cliente
        }}
        produtos={produtos}
        produtoSelecionado={produtoSelecionado}
        onProdutoChange={setProdutoSelecionado}
        onDownloadPDF={handleDownloadPDF}
        onDownloadJPG={handleDownloadJPG}
        onClose={handleClose}
      />

      {/* Layout Principal - 80% + 20% */}
      <div className="flex-1 flex">
        {/* Área Principal - 80% */}
        <div className="flex-1 p-6">
          <ArtePublicMain
            versaoAtual={versaoAtual}
            produtoAtual={produtoAtual}
            loading={loading}
            token={token}
          />
        </div>

        {/* Sidebar - 20% */}
        <ArtePublicSidebarNew
          produtoAtual={produtoAtual}
          versoes={versoes}
          versaoSelecionada={versaoSelecionada}
          onVersaoChange={setVersaoSelecionada}
          mensagens={mensagens}
          onEnviarMensagem={enviarMensagem}
          onAprovar={aprovarArte}
          onRejeitar={rejeitarArte}
          declarationChecked={declarationChecked}
          onDeclarationChange={setDeclarationChecked}
          processing={processing}
          readonly={arteData.link.aprovado}
        />
      </div>
    </div>
  );
}

