'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, FileImage, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  downloadAnexoGeometria,
  fetchAnexoGeometria,
} from '@/lib/anexo-geometria-client';

interface AnexoGeometriaPreviewModalProps {
  open: boolean;
  onClose: () => void;
  referenciaUrl: string;
  titulo?: string;
  nomeArquivo?: string;
  geometriaOrigem?: string | null;
}

export function AnexoGeometriaPreviewModal({
  open,
  onClose,
  referenciaUrl,
  titulo = 'Referência visual',
  nomeArquivo,
  geometriaOrigem,
}: AnexoGeometriaPreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baixando, setBaixando] = useState(false);

  const previewImagem =
    geometriaOrigem === 'IMAGEM' || !geometriaOrigem || mimeType?.startsWith('image/');

  useEffect(() => {
    if (!open || !referenciaUrl) {
      setBlobUrl(null);
      setMimeType(null);
      setError(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    const carregar = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetchAnexoGeometria(referenciaUrl);
        const blob = await resp.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setMimeType(blob.type || null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Erro ao carregar referência',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void carregar();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, referenciaUrl]);

  const handleDownload = async () => {
    setBaixando(true);
    try {
      await downloadAnexoGeometria(referenciaUrl, nomeArquivo || titulo);
    } finally {
      setBaixando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[90vh] w-[95vw] max-w-5xl flex-col overflow-hidden p-0 sm:max-w-5xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
          <DialogTitle className="text-base font-semibold">{titulo}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={baixando || loading}
              onClick={() => void handleDownload()}
            >
              {baixando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/40 p-6 pb-8">
          {loading && (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {!loading && !error && blobUrl && previewImagem && (
            <div className="relative flex h-full w-full items-center justify-center">
              <Image
                src={blobUrl}
                alt={titulo}
                width={1200}
                height={900}
                className="max-h-full max-w-full object-contain"
                unoptimized
              />
            </div>
          )}
          {!loading && !error && blobUrl && !previewImagem && (
            <div className="flex flex-col items-center gap-4 text-center text-muted-foreground">
              <FileImage className="h-16 w-16 opacity-50" />
              <p className="text-sm">
                Pré-visualização indisponível para este tipo de arquivo.
              </p>
              <Button variant="outline" onClick={() => void handleDownload()}>
                <Download className="mr-2 h-4 w-4" />
                Baixar arquivo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
