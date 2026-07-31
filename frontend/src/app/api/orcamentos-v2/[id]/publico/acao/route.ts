import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';
import { cabecalhosDeEncaminhamento } from '@/lib/client-ip';

/**
 * Gate 0S — proxy da ação pública do cliente sobre a proposta.
 *
 * O corpo pode conter o código de aprovação, então nada dele é registrado em
 * log, nem em caso de erro: a mensagem de exceção de um JSON malformado carrega
 * trecho do payload.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const semCache = { 'Cache-Control': 'no-store' };

  try {
    const { id } = await params;
    const body = await request.json();

    const response = await fetch(buildApiUrl(`/orcamentos-v2/${id}/publico/acao`), {
      method: 'POST',
      headers: cabecalhosDeEncaminhamento(request.headers),
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Repassa `message` com a mesma chave que o Nest usa. Traduzir para
      // `error` fazia a página cair no texto genérico dela e descartar a
      // orientação de reenvio que o backend devolve.
      return NextResponse.json(
        {
          message:
            data?.message || 'Não foi possível registrar esta ação.',
        },
        { status: response.status, headers: semCache }
      );
    }

    return NextResponse.json(data, { headers: semCache });
  } catch (error) {
    console.error(
      'Erro na API route /api/orcamentos-v2/[id]/publico/acao:',
      error instanceof Error ? error.name : 'erro desconhecido'
    );
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500, headers: semCache }
    );
  }
}
