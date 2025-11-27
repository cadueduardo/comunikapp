import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { operadorId: string } }
) {
  try {
    const { operadorId } = params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 },
      );
    }

    console.log('⚙️ API Route - Buscando setor do operador:', operadorId);

    const response = await fetch(
      buildApiUrl(`/centros-de-trabalho/setores-produtivos/operador/${operadorId}`),
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('⚙️ API Route - Status da resposta:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('ℹ️ Operador sem setor associado:', operadorId);
        return NextResponse.json([]);
      }

      const error = await response.json().catch(() => ({}));
      console.log('⚠️ API Route - Erro do backend:', error);
      return NextResponse.json(
        { error: error?.message || 'Erro ao buscar setor do operador' },
        { status: response.status },
      );
    }

    const data = await response.json().catch(() => []);

    if (Array.isArray(data)) {
      console.log('⚙️ API Route - Lista de setores retornada:', data);
      return NextResponse.json(data);
    }

    console.warn('⚠️ API Route - Resposta inesperada para operador', operadorId, data);
    return NextResponse.json([]);
  } catch (error) {
    console.error(
      'Erro na API route /api/centros-de-trabalho/setores-produtivos/operador/[operadorId]:',
      error,
    );
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}








