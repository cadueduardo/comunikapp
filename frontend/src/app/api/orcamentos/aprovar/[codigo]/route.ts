import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    
    console.log('🔍 API Route - Código recebido (raw):', JSON.stringify(codigo));
    console.log('🔍 API Route - Código length:', codigo?.length);
    console.log('🔍 API Route - Código decoded:', decodeURIComponent(codigo));
    
    // Validar se o código foi fornecido
    if (!codigo || typeof codigo !== 'string') {
      return NextResponse.json(
        { error: 'Código de aprovação é obrigatório' },
        { status: 400 }
      );
    }
    
    // Decodificar o código da URL e limpar
    const codigoDecodificado = decodeURIComponent(codigo);
    const codigoLimpo = codigoDecodificado.trim().toUpperCase();
    
    console.log('🔍 API Route - Código decodificado:', codigoDecodificado);
    console.log('🔍 API Route - Código limpo:', codigoLimpo);
    console.log('🔍 API Route - Código limpo length:', codigoLimpo.length);
    
    if (codigoLimpo.length !== 8) {
      return NextResponse.json(
        { error: `Código de aprovação deve ter 8 caracteres. Recebido: ${codigoLimpo.length} caracteres` },
        { status: 400 }
      );
    }
    
    console.log('🔍 API Route - Enviando para backend:', codigoLimpo);
    
    const response = await fetch(`http://localhost:3001/orcamentos/aprovar/${codigoLimpo}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 API Route - Status da resposta:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log('🔍 API Route - Erro do backend:', error);
      return NextResponse.json(
        { message: error.message || 'Erro ao aprovar orçamento' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔍 API Route - Sucesso:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API route /api/orcamentos/aprovar/[codigo]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 