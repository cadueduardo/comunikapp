import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: versaoId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    console.log('📤 [API Route] Upload de arquivo para versão:', versaoId);

    // Extrair o arquivo do FormData
    const formData = await request.formData();
    const arquivo = formData.get('arquivo') as File;

    if (!arquivo) {
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/postscript'];
    if (!tiposPermitidos.includes(arquivo.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não permitido. Aceitos: PDF, JPG, PNG, AI' 
      }, { status: 400 });
    }

    // Validar tamanho (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (arquivo.size > maxSize) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Tamanho máximo: 50MB' 
      }, { status: 400 });
    }

    // Criar FormData para enviar ao backend
    const backendFormData = new FormData();
    backendFormData.append('arquivo', arquivo);

    const response = await fetch(`${API_BASE_URL}/arte-aprovacao/versoes/${versaoId}/arquivos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Não definir Content-Type - deixar o browser definir com boundary
      },
      body: backendFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ [API Route] Erro do backend:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.message || 'Erro ao fazer upload', error: errorData.error },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [API Route] Arquivo enviado:', data.id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [API Route] Erro no upload:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor', error: error.name || 'InternalServerError' },
      { status: error.status || 500 }
    );
  }
}

