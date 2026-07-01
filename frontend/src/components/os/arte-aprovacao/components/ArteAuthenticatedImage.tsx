'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import {
  ArteArquivoRef,
  fetchArteFileBlob,
  resolveArteAuthenticatedFileUrl,
} from '@/lib/arte-assets';

interface ArteAuthenticatedImageProps {
  arquivo: ArteArquivoRef;
  versaoId?: string;
  alt: string;
  className?: string;
  preferThumbnail?: boolean;
  onClick?: () => void;
  fallbackClassName?: string;
}

export function ArteAuthenticatedImage({
  arquivo,
  versaoId,
  alt,
  className,
  preferThumbnail = true,
  onClick,
  fallbackClassName = 'flex items-center justify-center h-32 bg-gray-100',
}: ArteAuthenticatedImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      const ref = { ...arquivo, versao_id: versaoId ?? arquivo.versao_id };
      const attempts = preferThumbnail ? [true, false] : [false];

      for (const useThumb of attempts) {
        try {
          const url = resolveArteAuthenticatedFileUrl(ref, useThumb);
          if (!url) continue;
          objectUrl = await fetchArteFileBlob(url);
          if (!cancelled) {
            setSrc(objectUrl);
            setFailed(false);
          }
          return;
        } catch {
          /* tenta imagem completa se thumb falhar */
        }
      }

      if (!cancelled) setFailed(true);
    };

    setSrc(null);
    setFailed(false);
    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [arquivo.url_arquivo, arquivo.url_thumbnail, arquivo.nome_arquivo, arquivo.storage_provider, versaoId, preferThumbnail]);

  if (failed) {
    return (
      <div className={fallbackClassName}>
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  if (!src) {
    return (
      <div className={`${fallbackClassName} animate-pulse`}>
        <div className="h-8 w-8 rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
    />
  );
}
