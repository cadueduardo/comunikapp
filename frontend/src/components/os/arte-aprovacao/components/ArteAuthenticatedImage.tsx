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
  alt: string;
  className?: string;
  preferThumbnail?: boolean;
  onClick?: () => void;
  fallbackClassName?: string;
}

export function ArteAuthenticatedImage({
  arquivo,
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
      try {
        const url = resolveArteAuthenticatedFileUrl(arquivo, preferThumbnail);
        if (!url) {
          if (!cancelled) setFailed(true);
          return;
        }
        objectUrl = await fetchArteFileBlob(url);
        if (!cancelled) {
          setSrc(objectUrl);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    setSrc(null);
    setFailed(false);
    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [arquivo.url_arquivo, arquivo.url_thumbnail, preferThumbnail]);

  if (failed || !src) {
    return (
      <div className={fallbackClassName}>
        <FileText className="h-8 w-8 text-gray-400" />
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
