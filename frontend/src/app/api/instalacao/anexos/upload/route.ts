import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';
import { resolveBackendAuth } from '@/lib/api/proxy-backend';

export async function POST(request: NextRequest) {
  try {
    const auth = resolveBackendAuth(request);
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const arquivo = formData.get('arquivo');
    if (!(arquivo instanceof File)) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 },
      );
    }

    const backendFormData = new FormData();
    backendFormData.append('arquivo', arquivo);

    const response = await fetch(buildApiUrl('/instalacao/anexos/upload'), {
      method: 'POST',
      headers: auth.headers,
      body: backendFormData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro upload instalacao/anexos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
