'use client';

import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Download, 
  Eye, 
  FileText, 
  Image, 
  Calendar, 
  User,
  MessageSquare
} from 'lucide-react';
import { ArteMessagesModal } from './ArteMessagesModal';
import { ArtePreviewModalProps, ArteStatus, ComentarioTipo } from '../types/arte-types';
import {
  fetchArteFileBlob,
  openArteFilePreview,
  resolveArteAuthenticatedFileUrl,
} from '@/lib/arte-assets';

export function ArtePreviewModal({ versao, isOpen, onClose, osId, produtoId }: ArtePreviewModalProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);

  const firstImageFile = versao?.arquivos.find((arquivo) =>
    ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(arquivo.tipo_arquivo.toLowerCase()),
  );

  useEffect(() => {
    if (!isOpen || !firstImageFile) {
      setPreviewSrc(null);
      setPreviewFailed(false);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      try {
        const url = resolveArteAuthenticatedFileUrl(firstImageFile, false);
        if (!url) {
          if (!cancelled) setPreviewFailed(true);
          return;
        }
        objectUrl = await fetchArteFileBlob(url);
        if (!cancelled) {
          setPreviewSrc(objectUrl);
          setPreviewFailed(false);
        }
      } catch {
        if (!cancelled) setPreviewFailed(true);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, firstImageFile?.id, firstImageFile?.url_arquivo]);

  if (!versao) return null;

  const getStatusColor = (status: ArteStatus) => {
    switch (status) {
      case ArteStatus.APROVADA:
        return 'bg-green-100 text-green-800';
      case ArteStatus.ENVIADA_CLIENTE:
        return 'bg-blue-100 text-blue-800';
      case ArteStatus.REVISAO_SOLICITADA:
        return 'bg-red-100 text-red-800';
      case ArteStatus.RASCUNHO:
        return 'bg-gray-100 text-gray-800';
      case ArteStatus.BLOQUEADA:
        return 'bg-orange-100 text-orange-800';
      case ArteStatus.ENVIADA_PCP:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ArteStatus) => {
    switch (status) {
      case ArteStatus.APROVADA:
        return 'Aprovada';
      case ArteStatus.ENVIADA_CLIENTE:
        return 'Enviada ao Cliente';
      case ArteStatus.REVISAO_SOLICITADA:
        return 'Revisão Solicitada';
      case ArteStatus.RASCUNHO:
        return 'Rascunho';
      case ArteStatus.BLOQUEADA:
        return 'Bloqueada';
      case ArteStatus.ENVIADA_PCP:
        return 'Enviada ao PCP';
      default:
        return status;
    }
  };

  const getComentarioTipoColor = (tipo: ComentarioTipo) => {
    switch (tipo) {
      case ComentarioTipo.CLIENTE:
        return 'bg-blue-100 text-blue-800';
      case ComentarioTipo.SISTEMA:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getComentarioTipoLabel = (tipo: ComentarioTipo) => {
    switch (tipo) {
      case ComentarioTipo.CLIENTE:
        return 'Cliente';
      case ComentarioTipo.SISTEMA:
        return 'Sistema';
      default:
        return 'Interno';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (tipo: string) => {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(tipo.toLowerCase());
  };

  const handleDownload = async (arquivo: (typeof versao.arquivos)[number]) => {
    try {
      await openArteFilePreview(arquivo, { preferThumbnail: false });
    } catch {
      window.open(resolveArteAuthenticatedFileUrl(arquivo, false), '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold">
              {versao.versao} - {versao.descricao || 'Visualização'}
            </h2>
            <Badge className={getStatusColor(versao.status)}>
              {getStatusLabel(versao.status)}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex h-[calc(95vh-80px)]">
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            {firstImageFile ? (
              previewSrc ? (
                <div className="relative max-w-full max-h-full">
                  <img
                    src={previewSrc}
                    alt={firstImageFile.nome_original}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
                    <p className="text-sm font-medium">{firstImageFile.nome_original}</p>
                    <p className="text-xs opacity-75">
                      {formatFileSize(firstImageFile.tamanho)} • {firstImageFile.tipo_arquivo.toUpperCase()}
                    </p>
                  </div>
                </div>
              ) : previewFailed ? (
                <div className="text-center text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Erro ao carregar imagem</p>
                </div>
              ) : (
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              )
            ) : (
              <div className="text-center text-gray-500">
                <FileText className="h-24 w-24 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhuma imagem encontrada</p>
                <p className="text-sm">Esta versão não possui arquivos de imagem</p>
              </div>
            )}
          </div>

          <div className="w-80 border-l bg-white overflow-y-auto">
            <div className="p-4 space-y-6">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Informações</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(versao.data_criacao).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {versao.autor_nome || 'Desconhecido'}
                  </div>
                  {versao.data_aprovacao && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Aprovado: {new Date(versao.data_aprovacao).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Arquivos ({versao.arquivos.length})</h3>
                {versao.arquivos.length > 0 ? (
                  <div className="space-y-2">
                    {versao.arquivos.map((arquivo) => (
                      <div key={arquivo.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            {isImageFile(arquivo.tipo_arquivo) ? (
                              <Image className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-600 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{arquivo.nome_original}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(arquivo.tamanho)} • {arquivo.tipo_arquivo.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void openArteFilePreview(arquivo, { preferThumbnail: false })}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleDownload(arquivo)}
                              className="h-6 w-6 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum arquivo</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200">
                <Button
                  onClick={() => setShowMessagesModal(true)}
                  className="w-full"
                  variant="outline"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ver Mensagens desta Versão
                </Button>
              </div>
              
              {showMessagesModal && osId && produtoId && (
                <ArteMessagesModal
                  isOpen={showMessagesModal}
                  onClose={() => setShowMessagesModal(false)}
                  produtoId={produtoId}
                  produtoNome={versao.servico_id || 'Produto'}
                  osId={osId}
                  versaoId={versao.id}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
