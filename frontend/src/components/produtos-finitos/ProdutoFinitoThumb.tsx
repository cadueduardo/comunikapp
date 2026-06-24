'use client';

import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { buildApiUrl } from '@/lib/config';
import { cn } from '@/lib/utils';

interface ProdutoFinitoThumbProps {
  url?: string | null;
  alt?: string;
  className?: string;
  fit?: 'cover' | 'contain';
}

export function ProdutoFinitoThumb({
  url,
  alt,
  className,
  fit = 'cover',
}: ProdutoFinitoThumbProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) {
      setSrc(null);
      setFailed(false);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      try {
        const path = url.startsWith('/') ? url : `/${url}`;
        const fullUrl = buildApiUrl(path);
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('access_token')
            : null;
        const response = await fetch(fullUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error('Falha ao carregar imagem');
        objectUrl = URL.createObjectURL(await response.blob());
        if (!cancelled) {
          setSrc(objectUrl);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setSrc(null);
          setFailed(true);
        }
      }
    };

    setSrc(null);
    setFailed(false);
    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (!url || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground',
          className,
        )}
      >
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={cn('animate-pulse rounded-lg border bg-muted/40', className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || 'Imagem do produto'}
      className={cn(
        'rounded-lg border',
        fit === 'contain' ? 'object-contain' : 'object-cover',
        className,
      )}
    />
  );
}
