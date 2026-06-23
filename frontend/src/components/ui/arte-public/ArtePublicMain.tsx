'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  XCircle,
  User,
  Calendar
} from 'lucide-react';

import { resolveArtePublicFileUrl } from '@/lib/arte-assets';

// Componente para carregar imagem com fallback
function ImageWithFallback({ arquivo, token }: { arquivo: any, token: string }) {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const urlPrincipal = resolveArtePublicFileUrl(arquivo, token, {
      preferThumbnail: false,
    });
    const urlThumbnail = resolveArtePublicFileUrl(arquivo, token, {
      preferThumbnail: true,
    });
    setCurrentSrc(urlPrincipal || urlThumbnail);
    setLoading(true);
    setHasError(false);
  }, [arquivo, token]);

  const handleError = () => {
    const urlThumbnail = resolveArtePublicFileUrl(arquivo, token, {
      preferThumbnail: true,
    });
    if (urlThumbnail && currentSrc !== urlThumbnail) {
      setCurrentSrc(urlThumbnail);
    } else {
      setHasError(true);
      setLoading(false);
    }
  };

  const handleLoad = () => {
    console.log('✅ Imagem carregada com sucesso:', arquivo.nome_original);
    setLoading(false);
    setHasError(false);
  };

  if (hasError) {
    return (
      <div className="text-center text-gray-500 p-4">
        <div className="text-6xl mb-4">📄</div>
        <p className="text-lg mb-2">Erro ao carregar imagem</p>
        <p className="text-sm mb-2">Arquivo: {arquivo.nome_original}</p>
        <p className="text-xs text-gray-400">URL: {currentSrc}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      <img
        src={currentSrc}
        alt={arquivo.nome_original}
        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
        onError={handleError}
        onLoad={handleLoad}
        style={{ opacity: loading ? 0 : 1 }}
      />
    </div>
  );
}

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

interface ArtePublicMainProps {
  versaoAtual: VersaoArte | null;
  produtoAtual: {
    id: string;
    nome: string;
    versaoAtual: string;
  } | null;
  loading: boolean;
  token: string;
}

export function ArtePublicMain({
  versaoAtual,
  produtoAtual,
  loading,
  token
}: ArtePublicMainProps) {
  
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REVISAO_SOLICITADA':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'ENVIADA_CLIENTE':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'Aprovada';
      case 'REVISAO_SOLICITADA':
        return 'Revisão Solicitada';
      case 'ENVIADA_CLIENTE':
        return 'Aguardando Aprovação';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REVISAO_SOLICITADA':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ENVIADA_CLIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isImageFile = (tipo: string) => {
    return tipo.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(tipo.toLowerCase());
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

  if (!versaoAtual || !produtoAtual) {
    return (
      <div className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Selecione um produto para visualizar a arte</p>
        </div>
      </div>
    );
  }

  const arquivoPrincipal = versaoAtual.arquivos.find(f => isImageFile(f.tipo_arquivo)) || versaoAtual.arquivos[0];
  
  // Log detalhado dos dados
  console.log('🔍 [ArtePublicMain] Dados da versão:', {
    versao: versaoAtual.versao,
    arquivos: versaoAtual.arquivos,
    arquivoPrincipal,
    token,
    url_final: arquivoPrincipal ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${arquivoPrincipal.url_thumbnail || arquivoPrincipal.url_arquivo}?token=${token}` : 'N/A',
    api_url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  });

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header da Arte */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-lg font-semibold text-gray-900">
              {versaoAtual.versao}
            </span>
            <Badge className={getStatusColor(versaoAtual.status)}>
              {getStatusIcon(versaoAtual.status)}
              <span className="ml-1">{getStatusLabel(versaoAtual.status)}</span>
            </Badge>
          </div>
          
          <div className="text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Criado em {formatarData(versaoAtual.data_criacao)} por
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{versaoAtual.autor.nome}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview da Arte */}
      <div className="flex-1 p-8 flex items-center justify-center bg-gray-50">
        {arquivoPrincipal && arquivoPrincipal.url_arquivo ? (
          <div className="max-w-full max-h-full">
            {isImageFile(arquivoPrincipal.tipo_arquivo) ? (
              <ImageWithFallback
                arquivo={arquivoPrincipal}
                token={token}
              />
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📄</div>
                <p className="mb-2">Preview não disponível</p>
                <p className="text-sm">Arquivo: {arquivoPrincipal.nome_original}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">📄</div>
            <p>Nenhum arquivo disponível</p>
          </div>
        )}
      </div>
    </div>
  );
}
