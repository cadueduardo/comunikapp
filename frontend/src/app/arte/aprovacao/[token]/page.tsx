'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  ArtePublicHeader,
  ArtePublicMainSimple,
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
           <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
             {/* Header Principal - Toda a largura */}
             <div className="px-6 py-4 bg-white border-b border-gray-200">
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
             </div>

             {/* Layout Principal - 75% + 25% */}
             <div className="flex-1 flex overflow-hidden">
               {/* Área Principal - 75% */}
               <div className="flex-1 px-6 py-6 overflow-hidden">
                 <ArtePublicMainSimple
                   versaoAtual={versaoAtual}
                   produtoAtual={produtoAtual}
                   loading={loading}
                   token={token}
                 />
               </div>

               {/* Sidebar - 25% */}
               <div className="w-1/4 flex-shrink-0 flex flex-col bg-white border-l border-gray-200">
                 {/* Header da Sidebar */}
                 <div className="px-6 py-4 border-b border-gray-200">
                   <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                     <div className="flex items-center space-x-3">
                       <span className="font-semibold text-lg text-purple-900">{produtoAtual?.nome || 'Produto'}</span>
                       <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center space-x-1 font-medium">
                         <span>⏰</span>
                         <span>Aguardando Aprovação</span>
                       </span>
                     </div>
                   </div>
                 </div>

                 {/* Conteúdo da Sidebar */}
                 <div className="flex-1 px-6 py-4 overflow-hidden">
                   <ArtePublicSidebarNew
                     produtoAtual={produtoAtual}
                     versoes={versoes}
                     versaoSelecionada={versaoSelecionada}
                     onVersaoChange={setVersaoSelecionada}
                     onAprovar={aprovarArte}
                     onRejeitar={rejeitarArte}
                     declarationChecked={declarationChecked}
                     onDeclarationChange={setDeclarationChecked}
                     processing={processing}
                     readonly={arteData.link.aprovado}
                     token={token}
                   />
                 </div>
               </div>
             </div>
           </div>
         );
}
