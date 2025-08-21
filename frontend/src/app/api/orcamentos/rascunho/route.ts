import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || '';
    
    console.log('📤 Enviando rascunho para backend:', body);
    
    const response = await fetch(buildApiUrl('/orcamentos/rascunho'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(body),
    });

    console.log('📥 Resposta do backend:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erro do backend:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao salvar rascunho' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Rascunho salvo com sucesso:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Erro na API route /api/orcamentos/rascunho:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 