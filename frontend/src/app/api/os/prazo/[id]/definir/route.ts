import { NextRequest, NextResponse } from 'next/server';
import { apiRequest } from '@/lib/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    const result = await apiRequest(
      `/os/prazo/${id}/definir`,
      {
        method: 'POST',
        body,
      },
      request
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao definir prazo da OS:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erro ao definir prazo da OS' 
      },
      { status: error.status || 500 }
    );
  }
}
