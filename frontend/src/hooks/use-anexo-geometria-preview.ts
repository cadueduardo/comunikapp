'use client';

import { useEffect, useState } from 'react';
import {
  fetchAnexoGeometria,
  isAnexoGeometriaUrl,
} from '@/lib/anexo-geometria-client';

export type AnexoGeometriaPreviewState = {
  blobUrl: string | null;
  loading: boolean;
  isImage: boolean;
  isPdf: boolean;
  isDxf: boolean;
  error: string | null;
};

const estadoVazio: AnexoGeometriaPreviewState = {
  blobUrl: null,
  loading: false,
  isImage: false,
  isPdf: false,
  isDxf: false,
  error: null,
};

export function useAnexoGeometriaPreview(
  path: string | null | undefined,
  enabled = true,
): AnexoGeometriaPreviewState {
  const [state, setState] = useState<AnexoGeometriaPreviewState>(estadoVazio);

  useEffect(() => {
    if (!enabled || !path || !isAnexoGeometriaUrl(path)) {
      setState(estadoVazio);
      return;
    }

    let cancelado = false;
    let blobUrl: string | null = null;

    setState((atual) => ({ ...atual, loading: true, error: null }));

    void (async () => {
      try {
        const resp = await fetchAnexoGeometria(path);
        if (cancelado) return;

        const ct = (resp.headers.get('content-type') || '').toLowerCase();
        const isImage = ct.startsWith('image/');
        const isPdf = ct.includes('pdf');
        const isDxf =
          ct.includes('dxf') || (!isImage && !isPdf && ct === 'application/octet-stream');

        blobUrl = URL.createObjectURL(await resp.blob());
        if (!cancelado) {
          setState({
            blobUrl,
            loading: false,
            isImage,
            isPdf,
            isDxf,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelado) {
          setState({
            ...estadoVazio,
            error:
              error instanceof Error
                ? error.message
                : 'Erro ao carregar anexo',
          });
        }
      }
    })();

    return () => {
      cancelado = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [path, enabled]);

  return state;
}
