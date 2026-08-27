import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';
import { cabecalhosDeEncaminhamento } from '@/lib/client-ip';

/**
 * Gate 0S — proxy do reenvio do código de aprovação da proposta.
 *
 * Este arquivo existia vazio no repositório, o que fazia o Next registrar a
 * rota sem nenhum método e responder 405 ao botão "Reenviar Código". Com a
 * invalidação dos códigos legados, este é o caminho de recuperação do cliente,
 * então precisa funcionar.
 *
 * A rota não tem corpo: quem identifica o destinatário é o cadastro do
 * orçamento, nunca um e-mail informado pelo chamador anônimo. A resposta do
 * backend é sempre a mesma, com sucesso ou recusa, para não revelar se o
 * orçamento existe ou está em estado que aceita reenvio.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const semCache = { 'Cache-Control': 'no-store' };

  try {
    const { id } = await params;

    const response = await fetch(
      buildApiUrl(`/orcamentos-v2/${id}/reenviar-codigo`),
      {
        method: 'POST',
        headers: cabecalhosDeEncaminhamento(request.headers),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { message: data?.message || 'Não foi possível reenviar o código.' },
        { status: response.status, headers: semCache }
      );
    }

    return NextResponse.json(data, { headers: semCache });
  } catch (error) {
    console.error(
      'Erro na API route /api/orcamentos-v2/[id]/reenviar-codigo:',
      error instanceof Error ? error.name : 'erro desconhecido'
    );
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500, headers: semCache }
    );
  }
}
