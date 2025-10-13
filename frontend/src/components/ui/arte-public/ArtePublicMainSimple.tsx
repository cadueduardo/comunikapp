'use client';

import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle,
  User,
  Calendar
} from 'lucide-react';

interface VersaoArte {
  id: string;
  versao: string;
  status: string;
  descricao?: string;
  data_criacao: string;
  autor: {
    nome: string;
    email: string;
  };
  arquivos: Array<{
    id: string;
    nome_original: string;
    tipo_arquivo: string;
    url_arquivo: string;
    url_thumbnail?: string;
  }>;
}

interface ArtePublicMainSimpleProps {
  versaoAtual: VersaoArte | null;
  produtoAtual: {
    id: string;
    nome: string;
    versaoAtual: string;
  } | null;
  loading: boolean;
  token: string;
}

export function ArtePublicMainSimple({
  versaoAtual,
  produtoAtual,
  loading,
  token
}: ArtePublicMainSimpleProps) {

  const formatarData = (dataString: any): string => {
    if (!dataString || (typeof dataString === 'object' && Object.keys(dataString).length === 0)) {
      return 'Data não disponível';
    }
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) {
        return 'Data não disponível';
      }
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Data não disponível';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADA': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REVISAO_SOLICITADA': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'ENVIADA_CLIENTE': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APROVADA': return 'Aprovada';
      case 'REVISAO_SOLICITADA': return 'Revisão Solicitada';
      case 'ENVIADA_CLIENTE': return 'Aguardando Aprovação';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADA': return 'bg-green-100 text-green-800 border-green-200';
      case 'REVISAO_SOLICITADA': return 'bg-red-100 text-red-800 border-red-200';
      case 'ENVIADA_CLIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isImageFile = (tipo: string) => {
    return tipo.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(tipo.toLowerCase());
  };

  const isPdfFile = (tipo: string, nome: string) => {
    return tipo === 'application/pdf' || nome.toLowerCase().endsWith('.pdf');
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando arte...</p>
        </div>
      </div>
    );
  }

  if (!versaoAtual) {
    return (
      <div className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">Nenhuma versão encontrada</p>
          <p className="text-sm">Verifique se o link está correto</p>
        </div>
      </div>
    );
  }

  const arquivoPrincipal = versaoAtual.arquivos[0];
  
  // Usar arquivo original em alta qualidade, não thumbnail
  let imageSrc = '';
  if (arquivoPrincipal?.url_arquivo) {
    // SOLUÇÃO TEMPORÁRIA: Usar endpoint de arquivos estáticos
    // O arquivo está em: backend/uploads/arte/cmgp6zhzs0003ja1sxdeal4wl/1760363516121-377257937-20250720_165442.jpg
    // Endpoint estático: http://localhost:4000/uploads/arte/cmgp6zhzs0003ja1sxdeal4wl/1760363516121-377257937-20250720_165442.jpg
    
    // Extrair o nome do arquivo da URL
    const filename = arquivoPrincipal.url_arquivo.split('/').pop();
    // Obter versaoId da URL do arquivo ou do token
    const urlParts = arquivoPrincipal.url_arquivo.split('/');
    const versaoIndex = urlParts.findIndex(part => part === 'versoes');
    const versaoId = versaoIndex !== -1 ? urlParts[versaoIndex + 1] : null;
    
    if (versaoId && filename) {
      imageSrc = `http://localhost:4000/uploads/arte/${versaoId}/${filename}`;
    }
  } else if (arquivoPrincipal?.url_thumbnail) {
    // Fallback para thumbnail se não houver arquivo original
    imageSrc = `http://localhost:4000${arquivoPrincipal.url_thumbnail}`;
  }

  const [showModal, setShowModal] = React.useState(false);

  return (
    <>
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header simplificado */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Criado por {versaoAtual.autor.nome}
            </div>
          </div>
        </div>

        {/* Contexto da imagem - título e versão */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg">{produtoAtual?.nome || 'Produto'}</span>
            <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded border">
              Versão {versaoAtual.versao}
            </span>
          </div>
        </div>

        {/* Preview da Arte */}
        <div className="flex-1 bg-gray-50 min-h-0 overflow-auto">
          <div className="w-full h-full flex items-center justify-center p-4">
            {imageSrc ? (
              isPdfFile(arquivoPrincipal.tipo_arquivo, arquivoPrincipal.nome_original) ? (
                <div className="w-full h-full flex items-center justify-center">
                  <iframe
                    src={imageSrc}
                    className="w-full h-full rounded-lg shadow-lg"
                    title={arquivoPrincipal.nome_original}
                  />
                </div>
              ) : isImageFile(arquivoPrincipal.tipo_arquivo) ? (
                <div className="relative">
                  <img
                    src={imageSrc}
                    alt={arquivoPrincipal.nome_original}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300"
                    onClick={() => setShowModal(true)}
                    title="Clique para abrir em tamanho completo"
                  />
                  {/* Overlay para indicar versão */}
                  <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                    {versaoAtual.versao.toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="mb-4">{arquivoPrincipal.nome_original}</p>
                  <p className="text-sm">Tipo de arquivo não suportado para preview</p>
                </div>
              )
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📄</div>
                <p>Nenhum arquivo disponível</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para visualização completa */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-7xl max-h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{arquivoPrincipal?.nome_original}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {imageSrc && (
                isPdfFile(arquivoPrincipal.tipo_arquivo, arquivoPrincipal.nome_original) ? (
                  <iframe
                    src={imageSrc}
                    className="w-full h-[80vh] rounded-lg"
                    title={arquivoPrincipal.nome_original}
                  />
                ) : (
                  <img
                    src={imageSrc}
                    alt={arquivoPrincipal.nome_original}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}