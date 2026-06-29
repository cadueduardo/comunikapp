'use client';

import Image from 'next/image';
import { FileImage, Loader2 } from 'lucide-react';
import { useAnexoGeometriaPreview } from '@/hooks/use-anexo-geometria-preview';

interface AnexoGeometriaThumbProps {
  referenciaUrl: string;
  geometriaOrigem?: string | null;
}

export function AnexoGeometriaThumb({
  referenciaUrl,
  geometriaOrigem,
}: AnexoGeometriaThumbProps) {
  const previewImagem =
    geometriaOrigem === 'IMAGEM' || !geometriaOrigem;
  const { blobUrl, loading, isImage } = useAnexoGeometriaPreview(
    referenciaUrl,
    previewImagem,
  );

  if (!previewImagem) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border bg-muted">
        <FileImage className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border bg-muted">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isImage && blobUrl) {
    return (
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border bg-muted">
        <Image
          src={blobUrl}
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border bg-muted">
      <FileImage className="h-6 w-6 text-muted-foreground" />
    </div>
  );
}
