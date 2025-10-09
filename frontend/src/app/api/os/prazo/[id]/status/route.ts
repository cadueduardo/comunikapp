import { NextRequest, NextResponse } from 'next/server';
import { apiRequest } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await apiRequest(
      `/os/prazo/${id}/status`,
      {
        method: 'GET',
      },
      request
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao consultar status do prazo:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erro ao consultar status do prazo' 
      },
      { status: error.status || 500 }
    );
  }
}
