import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

async function proxyPatch(
  request: NextRequest,
  id: string,
  action: 'inativar' | 'reativar',
) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json(
      { message: 'Token de autorização não fornecido' },
      { status: 401 },
    );
  }

  const body =
    action === 'inativar' ? await request.json().catch(() => ({})) : undefined;

  const response = await fetch(buildApiUrl(`/os/${id}/${action}`), {
    method: 'PATCH',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(
      { message: payload.message || `Erro ao ${action} OS` },
      { status: response.status },
    );
  }

  return NextResponse.json(payload);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  try {
    const { id, action } = await params;
    if (action !== 'inativar' && action !== 'reativar') {
      return NextResponse.json({ message: 'Ação inválida' }, { status: 400 });
    }
    return proxyPatch(request, id, action);
  } catch (error) {
    console.error('Erro na API route inativar/reativar OS:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
