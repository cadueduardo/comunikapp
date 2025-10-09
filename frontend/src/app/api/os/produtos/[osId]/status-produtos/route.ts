import { NextRequest, NextResponse } from 'next/server';
import { apiRequest } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { osId: string } }
) {
  try {
    const { osId } = params;

    const result = await apiRequest({
      method: 'GET',
      endpoint: `/os/produtos/${osId}/status-produtos`,
      request,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao consultar status dos produtos:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erro ao consultar status dos produtos' 
      },
      { status: error.status || 500 }
    );
  }
}
