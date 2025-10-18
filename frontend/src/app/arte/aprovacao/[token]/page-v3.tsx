'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  X, 
  AlertCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  ArtePublicSidebar,
  useArtePublicData 
} from '@/components/ui/arte-public';

export default function ArtePublicApprovalPageV3() {
  const params = useParams();
  const token = params.token as string;
  
  const {
    arteData,
    loading,
    error,
    produtos,
    versoesHistorico,
    mensagens,
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
    versaoAtual
  } = useArtePublicData(token);

  const handleDownloadPDF = () => {
    console.log('Download PDF');
    toast.info('Funcionalidade de download PDF em desenvolvimento');
  };

  const handleDownloadJPG = () => {
    console.log('Download JPG');
    toast.info('Funcionalidade de download JPG em desenvolvimento');
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Prévia pública — Aprovação de Arte
              </h1>
              <p className="text-gray-600">
                {arteData.os.numero_os} • {arteData.cliente.nome}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Baixar prova (PDF)
              </Button>
              
              <Button
                onClick={handleDownloadJPG}
                variant="outline"
                size="sm"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Baixar imagem (JPG)
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.close()}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-[calc(100vh-200px)]">
          
          {/* Área Principal - Preview Central */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg border border-gray-200 h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-96 h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                  {versaoAtual?.thumbnail ? (
                    <img
                      src={versaoAtual.thumbnail}
                      alt={`Versão ${versaoAtual.versao}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">
                        Pré-visualização da arte selecionada (PDF/JPG)
                      </p>
                    </div>
                  )}
                </div>
                
                {versaoAtual && (
                  <div className="text-sm text-gray-600">
                    <p>Versão: {versaoAtual.versao}</p>
                    <p>Criada em: {new Date(versaoAtual.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ArtePublicSidebar
              produtos={produtos}
              produtoSelecionado={produtoSelecionado}
              onProdutoSelect={setProdutoSelecionado}
              versoesHistorico={versoesHistorico}
              versaoAtual={versaoAtual}
              onVersaoSelect={setVersaoSelecionada}
              mensagens={mensagens}
              onEnviarMensagem={enviarMensagem}
              onAprovar={aprovarArte}
              onRejeitar={rejeitarArte}
              declarationChecked={declarationChecked}
              onDeclarationChange={setDeclarationChecked}
              loading={loading}
              processing={processing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}



