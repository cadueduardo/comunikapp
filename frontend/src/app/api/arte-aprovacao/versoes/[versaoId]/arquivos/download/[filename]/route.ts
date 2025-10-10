import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ versaoId: string; filename: string }> }
) {
  try {
    const { versaoId, filename } = await params;
    
    // Aceitar token do header ou query param
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      const { searchParams } = new URL(request.url);
      token = searchParams.get('token');
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    console.log('📥 [API Route] Download de arquivo:', { versaoId, filename });

    const response = await fetch(
      `${API_BASE_URL}/arte-aprovacao/versoes/${versaoId}/arquivos/download/${filename}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      console.log('❌ [API Route] Erro do backend:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.message || 'Erro ao baixar arquivo' },
        { status: response.status }
      );
    }

    // Obter o blob do arquivo
    const blob = await response.blob();
    
    // Retornar o arquivo com headers apropriados
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': response.headers.get('Content-Disposition') || `inline; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('❌ [API Route] Erro no download:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

