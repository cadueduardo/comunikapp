import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';
import { resolveBackendAuth } from '@/lib/api/proxy-backend';

/**
 * POST /api/arte-aprovacao/versoes/:id/arquivos/upload
 * Multipart — não usar proxyBackend (JSON). Auth via cookie/Bearer.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: versaoId } = await params;
    const auth = resolveBackendAuth(request);
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const arquivo = formData.get('arquivo') as File | null;
    const nomeOriginal =
      (formData.get('nome_original') as string | null) || arquivo?.name || null;

    if (!arquivo) {
      return NextResponse.json(
        { message: 'Nenhum arquivo fornecido' },
        { status: 400 },
      );
    }

    const tiposPermitidos = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/postscript',
      'application/illustrator',
      'image/vnd.adobe.photoshop',
    ];
    const extensoesPermitidas = [
      '.pdf',
      '.jpg',
      '.jpeg',
      '.png',
      '.ai',
      '.psd',
      '.eps',
    ];
    const nomeLower = arquivo.name.toLowerCase();
    const extOk = extensoesPermitidas.some((ext) => nomeLower.endsWith(ext));
    if (!tiposPermitidos.includes(arquivo.type) && !extOk) {
      return NextResponse.json(
        {
          message: 'Tipo de arquivo não permitido. Aceitos: PDF, JPG, PNG, AI',
        },
        { status: 400 },
      );
    }

    const maxSize = 50 * 1024 * 1024;
    if (arquivo.size > maxSize) {
      return NextResponse.json(
        { message: 'Arquivo muito grande. Tamanho máximo: 50MB' },
        { status: 400 },
      );
    }

    const backendFormData = new FormData();
    // Reempacota bytes: repassar File do Next→Nest às vezes chega sem buffer.
    const bytes = Buffer.from(await arquivo.arrayBuffer());
    if (bytes.length === 0) {
      return NextResponse.json(
        { message: 'Arquivo vazio ou não lido pelo servidor' },
        { status: 400 },
      );
    }
    backendFormData.append(
      'arquivo',
      new Blob([new Uint8Array(bytes)], {
        type: arquivo.type || 'application/octet-stream',
      }),
      arquivo.name,
    );
    if (nomeOriginal) {
      backendFormData.append('nome_original', nomeOriginal);
    }

    const response = await fetch(
      buildApiUrl(
        `/arte-aprovacao/versoes/${encodeURIComponent(versaoId)}/arquivos/upload`,
      ),
      {
        method: 'POST',
        headers: auth.headers,
        body: backendFormData,
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: 'Erro ao fazer upload' }));
      return NextResponse.json(
        {
          success: false,
          message:
            errorData.message ||
            errorData.error ||
            'Erro ao fazer upload',
          error: errorData.error,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    console.error('Erro no upload de arte:', error);
    return NextResponse.json(
      { success: false, message, error: 'InternalServerError' },
      { status: 500 },
    );
  }
}
