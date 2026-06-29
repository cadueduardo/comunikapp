import { buildApiUrl } from '@/lib/config';
import { toast } from 'sonner';

export function isAnexoGeometriaUrl(path?: string | null): boolean {
  return Boolean(path?.includes('/orcamentos-v2/anexos-geometria/'));
}

function obterToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function urlAnexoGeometriaParaFetch(path: string): string {
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:')
  ) {
    return path;
  }
  return buildApiUrl(path.startsWith('/') ? path : `/${path}`);
}

export async function fetchAnexoGeometria(path: string): Promise<Response> {
  const token = obterToken();
  if (!token) {
    throw new Error('Token de autenticação não fornecido');
  }

  const resp = await fetch(urlAnexoGeometriaParaFetch(path), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) {
    let message = `Falha ao carregar anexo (${resp.status})`;
    try {
      const json = (await resp.json()) as { message?: string };
      if (json.message) message = json.message;
    } catch {
      // resposta não-JSON
    }
    throw new Error(message);
  }

  return resp;
}

export async function abrirAnexoGeometria(path: string): Promise<void> {
  try {
    const resp = await fetchAnexoGeometria(path);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : 'Não foi possível abrir o anexo';
    toast.error(msg);
  }
}

function nomeArquivoDeUrl(path: string): string {
  const segmento = path.split('/').filter(Boolean).pop();
  return segmento || 'referencia';
}

export async function downloadAnexoGeometria(
  path: string,
  nomeArquivo?: string,
): Promise<void> {
  try {
    const resp = await fetchAnexoGeometria(path);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = nomeArquivo || nomeArquivoDeUrl(path);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : 'Não foi possível baixar o anexo';
    toast.error(msg);
  }
}
