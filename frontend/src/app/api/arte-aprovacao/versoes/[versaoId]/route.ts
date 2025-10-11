import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ versaoId: string }> }
) {
  try {
    const { versaoId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    console.log('🔍 [API Route] Buscando versão:', versaoId);

    const response = await fetch(`${API_BASE_URL}/arte-aprovacao/versoes/${versaoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ [API Route] Erro do backend:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.message || 'Erro ao buscar versão', error: errorData.error },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [API Route] Versão encontrada:', data.id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [API Route] Erro ao buscar versão:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor', error: error.name || 'InternalServerError' },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ versaoId: string }> }
) {
  try {
    const { versaoId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const body = await request.json();
    console.log('✏️ [API Route] Atualizando versão:', { versaoId, body });

    const response = await fetch(`${API_BASE_URL}/arte-aprovacao/versoes/${versaoId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ [API Route] Erro do backend:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.message || 'Erro ao atualizar versão', error: errorData.error },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [API Route] Versão atualizada:', data.id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [API Route] Erro ao atualizar versão:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor', error: error.name || 'InternalServerError' },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ versaoId: string }> }
) {
  try {
    const { versaoId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    console.log('🗑️ [API Route] Removendo versão:', versaoId);

    const response = await fetch(`${API_BASE_URL}/arte-aprovacao/versoes/${versaoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ [API Route] Erro do backend:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.message || 'Erro ao remover versão', error: errorData.error },
        { status: response.status }
      );
    }

    console.log('✅ [API Route] Versão removida:', versaoId);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('❌ [API Route] Erro ao remover versão:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor', error: error.name || 'InternalServerError' },
      { status: error.status || 500 }
    );
  }
}


