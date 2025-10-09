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
      `/os/produtos/${osId}/item/${itemId}/definir-prazo`,
      {
        method: 'POST',
        body,
      },
      request
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao definir prazo do produto:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erro ao definir prazo do produto' 
      },
      { status: error.status || 500 }
    );
  }
}
