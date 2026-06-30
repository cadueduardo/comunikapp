'use client';

import { useEffect, useState } from 'react';
import { resolverUrlAnexoInstalacao } from '@/lib/instalacao/instalacao-anexo-url';

interface AnexoInstalacaoImagemProps {
  src: string;
  alt: string;
  className?: string;
}

export function AnexoInstalacaoImagem({
  src,
  alt,
  className,
}: AnexoInstalacaoImagemProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    let urlCriada: string | null = null;

    async function carregar() {
      if (!src) return;

      const urlFetch = src.startsWith('/instalacao/anexos/')
        ? resolverUrlAnexoInstalacao(src)
        : src.startsWith('/api/instalacao/anexos/')
          ? src
          : src;

      if (!urlFetch.startsWith('/api/instalacao/anexos/')) {
        if (ativo) setBlobUrl(urlFetch);
        return;
      }

      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('access_token')
          : null;

      if (!token) return;

      try {
        const response = await fetch(src, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;

        const blob = await response.blob();
        urlCriada = URL.createObjectURL(blob);
        if (ativo) setBlobUrl(urlCriada);
      } catch {
        if (ativo) setBlobUrl(null);
      }
    }

    void carregar();

    return () => {
      ativo = false;
      if (urlCriada) URL.revokeObjectURL(urlCriada);
    };
  }, [src]);

  if (!blobUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-xs text-muted-foreground ${className ?? ''}`}
      >
        ...
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={blobUrl} alt={alt} className={className} />
  );
}
