import { NextRequest, NextResponse } from 'next/server';
import { apiRequest } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string }> }
) {
  try {
    const { osId } = await params;

    const result = await apiRequest(
      `/os/produtos/${osId}/status-produtos`,
      {
        method: 'GET',
      },
      request
    );

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
