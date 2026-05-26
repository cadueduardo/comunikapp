'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  Clock, 
  XCircle,
  User,
  Calendar,
  Download,
  X,
  Maximize2
} from 'lucide-react';
// Removido useIsMobile para evitar erro do React

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
  onDownload?: () => void;
}

export function ArtePublicMainSimple({
  versaoAtual,
  produtoAtual,
  loading,
  token,
  onDownload,
  onAprovar,
  onRejeitar,
  declarationChecked = false,
  onDeclarationChange,
  processing = false,
  readonly = false
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
    const isPdf = tipo === 'application/pdf' || nome.toLowerCase().endsWith('.pdf');
    console.log('🔍 [isPdfFile] Verificando se é PDF:', { tipo, nome, isPdf });
    return isPdf;
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
  const resolvePublicFileUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${baseUrl}${url}`;
  };
  
  // Construir URL do arquivo para visualização
  let imageSrc = '';
  console.log('🔍 [ArtePublicMainSimple] Arquivo principal:', arquivoPrincipal);
  
  if (arquivoPrincipal?.url_arquivo) {
    console.log('🔍 [ArtePublicMainSimple] URL do arquivo original:', arquivoPrincipal.url_arquivo);
    
    // Se a URL já é completa (começa com http), usar diretamente
    if (arquivoPrincipal.url_arquivo.startsWith('http')) {
      imageSrc = arquivoPrincipal.url_arquivo;
      console.log('✅ [ArtePublicMainSimple] URL completa detectada:', imageSrc);
    } else {
      // Se é uma URL relativa, construir a URL completa
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      console.log('🔍 [ArtePublicMainSimple] Base URL:', baseUrl);
      
      // Se a URL começa com /uploads, adicionar apenas o baseUrl
      if (arquivoPrincipal.url_arquivo.startsWith('/uploads')) {
        imageSrc = `${baseUrl}${arquivoPrincipal.url_arquivo}`;
        console.log('✅ [ArtePublicMainSimple] URL com /uploads:', imageSrc);
      } else {
        // Extrair o nome do arquivo da URL
        const filename = arquivoPrincipal.url_arquivo.split('/').pop();
        // Obter versaoId da URL do arquivo
        const urlParts = arquivoPrincipal.url_arquivo.split('/');
        const versaoIndex = urlParts.findIndex(part => part === 'versoes');
        const versaoId = versaoIndex !== -1 ? urlParts[versaoIndex + 1] : null;
        
        console.log('🔍 [ArtePublicMainSimple] Construindo URL:', { filename, versaoId, urlParts });
        
        if (versaoId && filename) {
          imageSrc = `${baseUrl}/api/arte-aprovacao/versoes/${versaoId}/arquivos/public/download/${filename}?token=${encodeURIComponent(token)}`;
          console.log('✅ [ArtePublicMainSimple] URL construída:', imageSrc);
        } else {
          console.warn('⚠️ [ArtePublicMainSimple] Não foi possível construir URL:', { versaoId, filename });
        }
      }
    }
    if (arquivoPrincipal.url_arquivo.startsWith('/api/')) {
      imageSrc = resolvePublicFileUrl(arquivoPrincipal.url_arquivo);
    }
  } else if (arquivoPrincipal?.url_thumbnail) {
    // Fallback para thumbnail se não houver arquivo original
    imageSrc = resolvePublicFileUrl(arquivoPrincipal.url_thumbnail);
    console.log('✅ [ArtePublicMainSimple] Usando thumbnail:', imageSrc);
  } else {
    console.warn('⚠️ [ArtePublicMainSimple] Nenhuma URL de arquivo encontrada');
  }
  
  console.log('🎯 [ArtePublicMainSimple] URL final para visualização:', imageSrc);
  
  // Testar se a URL está acessível
  if (imageSrc) {
    fetch(imageSrc, { method: 'HEAD' })
      .then(response => {
        console.log('🔍 [ArtePublicMainSimple] Teste de acesso à URL:', {
          url: imageSrc,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          contentDisposition: response.headers.get('content-disposition')
        });
      })
      .catch(error => {
        console.error('❌ [ArtePublicMainSimple] Erro ao acessar URL:', error);
      });
  }

  const [showModal, setShowModal] = React.useState(false);
  const [showMobileModal, setShowMobileModal] = React.useState(false);

  return (
    <>
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">

        {/* Contexto da imagem - título, versão e download - Oculto em mobile */}
        <div className="hidden lg:block bg-gray-50 px-3 sm:px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between gap-3">
            {/* Nome do produto e versão */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                {produtoAtual?.nome || 'Produto'}
              </span>
              <span className="text-xs sm:text-sm text-gray-600 bg-white px-2 py-1 rounded border flex-shrink-0">
                {versaoAtual.versao.toUpperCase()}
              </span>
            </div>
            
            {/* Botão de download */}
            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 h-7 sm:h-8 flex-shrink-0"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Baixar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Preview da Arte - Desktop */}
        <div className="hidden lg:flex lg:flex-1 bg-gray-50 min-h-0 overflow-auto">
          <div className="w-full h-full flex items-center justify-center p-4">
            {imageSrc ? (
              isPdfFile(arquivoPrincipal.tipo_arquivo, arquivoPrincipal.nome_original) ? (
                <div className="w-full h-full flex items-center justify-center">
                  <iframe
                    src={imageSrc}
                    className="w-full h-full rounded-lg shadow-lg"
                    title={arquivoPrincipal.nome_original}
                    onError={(e) => {
                      console.error('❌ [ArtePublicMainSimple] Erro ao carregar PDF no iframe:', e);
                      console.error('❌ [ArtePublicMainSimple] URL que falhou:', imageSrc);
                    }}
                    onLoad={() => {
                      console.log('✅ [ArtePublicMainSimple] PDF carregado com sucesso:', imageSrc);
                    }}
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

        {/* Área completamente oculta em mobile */}
        <div className="lg:hidden hidden"></div>
      </div>

      {/* Modal para visualização completa - Desktop */}
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

      {/* Modal Mobile - Tela cheia para visualização da arte */}
      {showMobileModal && (
        <div 
          className="fixed inset-0 bg-black z-50 flex flex-col"
          onClick={() => setShowMobileModal(false)}
        >
          {/* Header do Modal Mobile */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {produtoAtual?.nome || 'Produto'}
              </h3>
              <p className="text-sm text-gray-600">
                {versaoAtual.versao.toUpperCase()} • {arquivoPrincipal?.nome_original}
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
            {imageSrc && (
              isPdfFile(arquivoPrincipal.tipo_arquivo, arquivoPrincipal.nome_original) ? (
                <iframe
                  src={imageSrc}
                  className="w-full h-full rounded-lg"
                  title={arquivoPrincipal.nome_original}
                />
              ) : (
                <img
                  src={imageSrc}
                  alt={arquivoPrincipal.nome_original}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              )
            )}
          </div>

          {/* Footer com informações */}
          <div className="bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Toque fora da imagem para fechar</span>
              <span>{versaoAtual.versao.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
