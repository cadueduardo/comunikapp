/**
 * Resolução de URLs de arquivos de arte (preview/download).
 *
 * Em produção NEXT_PUBLIC_API_URL=/api e os paths já vêm como /api/arte-aprovacao/...
 * Concatenar base + path gerava /api/api/... (404). Caminhos relativos /api/... usam
 * o rewrite do Next.js e funcionam no browser.
 */

export interface ArteArquivoRef {
  url_arquivo?: string;
  url_thumbnail?: string;
  nome_arquivo?: string;
  nome_original?: string;
  versao_id?: string;
  storage_provider?: string;
}

export function buildArteVersaoDownloadUrl(
  versaoId: string,
  storedFileName: string,
): string {
  return normalizeArteFilePath(
    `/arte-aprovacao/versoes/${versaoId}/arquivos/download/${encodeURIComponent(storedFileName)}`,
  );
}

function isGoogleDriveWebUrl(url: string): boolean {
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}

function isArteApiDownloadPath(urlOrPath: string): boolean {
  return (
    urlOrPath.includes('/arte-aprovacao/') &&
    urlOrPath.includes('/arquivos/download/')
  );
}

function resolveDriveProxyUrl(
  arquivo: ArteArquivoRef,
  preferThumbnail: boolean,
): string | null {
  if (!arquivo.versao_id || !arquivo.nome_arquivo) return null;

  if (preferThumbnail && arquivo.url_thumbnail) {
    const thumbRaw = arquivo.url_thumbnail;
    if (isArteApiDownloadPath(thumbRaw)) {
      return normalizeArteFilePath(thumbRaw);
    }
    // Thumb legado com link do Drive: nome no storage não é previsível — fallback no componente
    if (isGoogleDriveWebUrl(thumbRaw)) {
      return null;
    }
  }

  const raw = arquivo.url_arquivo || '';
  if (raw && isGoogleDriveWebUrl(raw)) {
    return buildArteVersaoDownloadUrl(arquivo.versao_id, arquivo.nome_arquivo);
  }

  if (arquivo.storage_provider === 'google_drive') {
    if (isArteApiDownloadPath(raw)) {
      return normalizeArteFilePath(raw);
    }
    return buildArteVersaoDownloadUrl(arquivo.versao_id, arquivo.nome_arquivo);
  }

  return null;
}

export function normalizeArteFilePath(path?: string | null): string {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }

  let normalized = path.trim().replace(/^\/api\/api\//, '/api/');

  if (normalized.startsWith('/api/')) return normalized;
  if (normalized.startsWith('/arte-aprovacao/')) return `/api${normalized}`;
  if (normalized.startsWith('/uploads/')) return `/api${normalized}`;

  return normalized.startsWith('/') ? `/api${normalized}` : normalized;
}

export function appendQueryToken(url: string, token: string): string {
  if (!token || !url) return url;
  if (/[?&]token=/.test(url)) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

/** Converte rota autenticada de download para rota pública (link de aprovação). */
export function toPublicArteDownloadPath(path: string): string {
  if (path.includes('/arquivos/public/download/')) return path;
  return path.replace('/arquivos/download/', '/arquivos/public/download/');
}

/**
 * URL para preview/download na página pública do cliente (token do link de aprovação).
 */
export function resolveArtePublicFileUrl(
  arquivo: ArteArquivoRef | null | undefined,
  approvalToken: string,
  options?: { preferThumbnail?: boolean },
): string {
  if (!arquivo || !approvalToken) return '';

  const preferThumbnail = options?.preferThumbnail ?? false;
  const raw = preferThumbnail
    ? arquivo.url_thumbnail || arquivo.url_arquivo
    : arquivo.url_arquivo || arquivo.url_thumbnail;

  if (!raw) return '';

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return appendQueryToken(raw, approvalToken);
  }

  let path = normalizeArteFilePath(raw);
  path = toPublicArteDownloadPath(path);

  if (path.includes('/arquivos/public/download/') && /[?&]token=/.test(path)) {
    return path;
  }

  return appendQueryToken(path, approvalToken);
}

/**
 * URL para fetch autenticado (equipe interna).
 * Não usar direto em <img> — JWT não vai no header; use fetchArteFileBlob ou ArteAuthenticatedImage.
 */
export function resolveArteAuthenticatedFileUrl(
  arquivo: ArteArquivoRef | null | undefined,
  preferThumbnail = false,
): string {
  if (!arquivo) return '';

  const raw = preferThumbnail
    ? arquivo.url_thumbnail || arquivo.url_arquivo
    : arquivo.url_arquivo || arquivo.url_thumbnail;

  if (!raw) return '';

  const driveProxy = resolveDriveProxyUrl(arquivo, preferThumbnail);
  if (driveProxy) return driveProxy;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    // Link externo do Drive sem proxy resolvível — tentar arquivo principal
    if (preferThumbnail && arquivo.url_arquivo && !isGoogleDriveWebUrl(arquivo.url_arquivo)) {
      return resolveArteAuthenticatedFileUrl(arquivo, false);
    }
    if (isGoogleDriveWebUrl(raw) && arquivo.versao_id && arquivo.nome_arquivo) {
      return buildArteVersaoDownloadUrl(arquivo.versao_id, arquivo.nome_arquivo);
    }
    return raw;
  }

  let path = normalizeArteFilePath(raw);

  if (isArteApiDownloadPath(path)) {
    return path;
  }

  // Thumbnail aponta para public/download; equipe autenticada usa download com JWT.
  if (path.includes('/public/download/') && arquivo.url_arquivo) {
    path = normalizeArteFilePath(arquivo.url_arquivo);
  }

  return path;
}

export async function fetchArteFileBlob(url: string): Promise<string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar arquivo (${response.status})`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function openArteFilePreview(
  arquivo: ArteArquivoRef,
  options?: { preferThumbnail?: boolean },
): Promise<void> {
  const url = resolveArteAuthenticatedFileUrl(arquivo, options?.preferThumbnail ?? false);
  if (!url) throw new Error('URL do arquivo indisponível');

  const blobUrl = await fetchArteFileBlob(url);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
