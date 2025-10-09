import { NextRequest, NextResponse } from 'next/server';
import { apiRequest } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const result = await apiRequest({
      method: 'GET',
      endpoint: `/os/prazo/${id}/status`,
      request,
    });

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
