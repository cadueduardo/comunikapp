import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';
import { resolveBackendAuth } from '@/lib/api/proxy-backend';

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

    if (!arquivo) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 },
      );
    }

    const tiposPermitidos = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/postscript',
    ];
    if (!tiposPermitidos.includes(arquivo.type)) {
      return NextResponse.json(
        {
          error: 'Tipo de arquivo não permitido. Aceitos: PDF, JPG, PNG, AI',
        },
        { status: 400 },
      );
    }

    const maxSize = 50 * 1024 * 1024;
    if (arquivo.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 50MB' },
        { status: 400 },
      );
    }

    const backendFormData = new FormData();
    backendFormData.append('arquivo', arquivo);
    backendFormData.append('nome_original', arquivo.name);

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
          message: errorData.message || 'Erro ao fazer upload',
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
    const name = error instanceof Error ? error.name : 'InternalServerError';
    console.error('Erro no upload de arte:', error);
    return NextResponse.json(
      { success: false, message, error: name },
      { status: 500 },
    );
  }
}
