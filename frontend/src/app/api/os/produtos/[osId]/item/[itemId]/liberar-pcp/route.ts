import { NextRequest, NextResponse } from 'next/server';
import { apiRequest } from '@/lib/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string; itemId: string }> }
) {
  try {
    const body = await request.json();
    const { osId, itemId } = await params;

    const result = await apiRequest(
      `/os/produtos/${osId}/item/${itemId}/liberar-pcp`,
      {
        method: 'POST',
        body,
      },
      request
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao liberar produto para PCP:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erro ao liberar produto para PCP' 
      },
      { status: error.status || 500 }
    );
  }
}
