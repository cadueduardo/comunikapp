'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArtePublicHeader,
  ArtePublicMainSimple,
  ArtePublicSidebarNew,
  ArtePublicTabs
} from '@/components/ui/arte-public';
import { ArteApprovalModal } from '@/components/ui/arte-public/ArteApprovalModal';
import { useArtePublicApproval } from '@/components/ui/arte-public/hooks/useArtePublicApproval';
import { resolveArtePublicFileUrl } from '@/lib/arte-assets';

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

  const [showApprovalModal, setShowApprovalModal] = React.useState(false);

  const handleAprovarClick = () => {
    if (!declarationChecked) {
      toast.error('Por favor, confirme que revisou e aprova a arte');
      return;
    }
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = async () => {
    setShowApprovalModal(false);
    await aprovarArte();
  };

  const handleDownload = async () => {
    if (versaoAtual?.arquivos?.[0]) {
      const arquivo = versaoAtual.arquivos[0];
      try {
        const downloadUrl = resolveArtePublicFileUrl(arquivo, token);
        if (!downloadUrl) {
          toast.error('Erro ao preparar download');
          return;
        }

        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error('Erro ao baixar arquivo');
        }
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = arquivo.nome_original;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        
        toast.success('Download iniciado');
      } catch (error) {
        console.error('Erro no download:', error);
        toast.error('Erro ao fazer download do arquivo');
      }
    } else {
      toast.error('Nenhum arquivo disponível para download');
    }
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
             <div className="bg-white border-b border-gray-200">
               <ArtePublicHeader
                 osData={{
                   numero_os: arteData.os.numero_os,
                   cliente: arteData.cliente
                 }}
                 produtos={produtos}
                 produtoSelecionado={produtoSelecionado}
                 onProdutoChange={setProdutoSelecionado}
                 onClose={handleClose}
               />
             </div>

             {/* Layout Principal - Responsivo */}
             <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
               {/* Área Principal - Oculto em mobile, Desktop: 75% */}
               <div className="hidden lg:flex lg:flex-[3] px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 overflow-hidden">
                 <ArtePublicMainSimple
                   versaoAtual={versaoAtual}
                   produtoAtual={produtoAtual}
                   loading={loading}
                   token={token}
                   onDownload={handleDownload}
                 />
               </div>

               {/* Sidebar - Mobile: 100%, Desktop: 25% */}
               <div className="w-full lg:w-1/4 lg:flex-shrink-0 flex flex-col bg-white border-t lg:border-t-0 lg:border-l border-gray-200">
                 {/* Seleção de Produtos */}
                 <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
                   <ArtePublicTabs
                     produtos={produtos}
                     produtoSelecionado={produtoSelecionado}
                     onProdutoSelect={setProdutoSelecionado}
                   />
                 </div>

                 {/* Conteúdo da Sidebar */}
                 <div className="flex-1 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 overflow-hidden">
                   <ArtePublicSidebarNew
                     produtoAtual={produtoAtual}
                     versoes={versoes}
                     versaoSelecionada={versaoSelecionada}
                     onVersaoChange={setVersaoSelecionada}
                     token={token}
                   />
                 </div>
               </div>
             </div>

             {/* Área de Aprovação Flutuante - Responsivo */}
             {!arteData.link.aprovado && (
               <div className="fixed bottom-0 left-0 right-0 lg:right-auto lg:w-3/4 z-50 bg-white border-t border-gray-200 shadow-lg">
                 <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                   <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                     {/* Botões à esquerda */}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 flex-1">
                      <Button
                        onClick={handleAprovarClick}
                        disabled={processing || !declarationChecked}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar Arte
                      </Button>
                       <Button
                         onClick={rejeitarArte}
                         disabled={processing}
                         variant="outline"
                         className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                         size="sm"
                       >
                         <XCircle className="h-4 w-4 mr-2" />
                         Solicitar Alteração
                       </Button>
                     </div>
                     
                     {/* Checkbox à direita */}
                     <div className="flex items-center space-x-2 flex-shrink-0">
                       <Checkbox
                         id="declaration"
                         checked={declarationChecked}
                         onCheckedChange={setDeclarationChecked}
                       />
                       <label htmlFor="declaration" className="text-xs text-gray-700 whitespace-nowrap">
                         Declaro que revisei e aprovo a arte final
                       </label>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* Modal de Confirmação de Aprovação */}
             <ArteApprovalModal
               isOpen={showApprovalModal}
               onClose={() => setShowApprovalModal(false)}
               onConfirm={handleConfirmApproval}
               produtoNome={produtoAtual?.nome || 'Produto'}
               versao={versaoAtual?.versao || 'N/A'}
               processing={processing}
             />
           </div>
         );
}
