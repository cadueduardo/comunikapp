'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
  MessageSquare,
} from 'lucide-react';
import { ArteMessagesModal } from './ArteMessagesModal';
import { ArtePreviewModalProps, ArteStatus, ComentarioTipo } from '../types/arte-types';
import {
  fetchArteFileBlob,
  openArteFilePreview,
  resolveArteAuthenticatedFileUrl,
} from '@/lib/arte-assets';

export function ArtePreviewModal({
  versao,
  isOpen,
  onClose,
  osId,
  produtoId,
}: ArtePreviewModalProps) {
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const isImageFile = (tipo: string) =>
    ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(tipo.toLowerCase());

  const handleDownload = async (arquivo: (typeof versao.arquivos)[number]) => {
    try {
      const url = resolveArteAuthenticatedFileUrl(arquivo, false);
      if (!url) return;
      const blob = await fetchArteFileBlob(url);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = arquivo.nome_original || arquivo.nome_arquivo;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(resolveArteAuthenticatedFileUrl(arquivo, false), '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[92vh] w-[96vw] max-w-7xl flex-col overflow-hidden p-0 sm:max-w-7xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <DialogTitle className="truncate text-base font-semibold">
              {versao.versao}
              {versao.descricao ? ` — ${versao.descricao}` : ''}
            </DialogTitle>
            <Badge className={getStatusColor(versao.status)}>
              {getStatusLabel(versao.status)}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-[45vh] flex-1 items-center justify-center bg-muted/30 p-6 lg:min-h-0">
            {firstImageFile ? (
              previewSrc ? (
                <img
                  src={previewSrc}
                  alt={firstImageFile.nome_original}
                  className="max-h-full max-w-full object-contain"
                />
              ) : previewFailed ? (
                <div className="text-center text-muted-foreground">
                  <FileText className="mx-auto mb-4 h-16 w-16 opacity-50" />
                  <p>Erro ao carregar imagem</p>
                </div>
              ) : (
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
              )
            ) : (
              <div className="text-center text-muted-foreground">
                <FileText className="mx-auto mb-4 h-24 w-24 opacity-50" />
                <p className="text-lg">Nenhuma imagem encontrada</p>
                <p className="text-sm">Esta versão não possui arquivos de imagem</p>
              </div>
            )}
          </div>

          <aside className="flex w-full shrink-0 flex-col border-t bg-background lg:w-[22rem] lg:border-t-0 lg:border-l">
            <div className="flex-1 space-y-6 overflow-y-auto p-5 pb-8">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Informações</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    {new Date(versao.data_criacao).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {versao.autor_nome || 'Desconhecido'}
                  </div>
                  {versao.data_aprovacao && (
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Aprovado:{' '}
                      {new Date(versao.data_aprovacao).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  Arquivos ({versao.arquivos.length})
                </h3>
                {versao.arquivos.length > 0 ? (
                  <div className="space-y-2">
                    {versao.arquivos.map((arquivo) => (
                      <div
                        key={arquivo.id}
                        className="rounded-lg border p-3 hover:bg-muted/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-start gap-2">
                            {isImageFile(arquivo.tipo_arquivo) ? (
                              <Image className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                            ) : (
                              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="break-words text-sm font-medium">
                                {arquivo.nome_original}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(arquivo.tamanho)} •{' '}
                                {arquivo.tipo_arquivo.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                void openArteFilePreview(arquivo, {
                                  preferThumbnail: false,
                                })
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => void handleDownload(arquivo)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="text-sm">Nenhum arquivo</p>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t p-5">
              <Button
                onClick={() => setShowMessagesModal(true)}
                className="w-full"
                variant="outline"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Ver Mensagens desta Versão
              </Button>
            </div>
          </aside>
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
      </DialogContent>
    </Dialog>
  );
}
