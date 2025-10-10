import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');

    // TEMPORÁRIO: Retornar dados mock para testar a integração quando não há token válido
    if (!token || token === 'Bearer null' || token === 'Bearer undefined') {
      const mockData = [
        {
          id: 'mock-1',
          numero: 'OS-2024-001234',
          nome_servico: 'Banner ACM 3mm',
          cliente: { nome: 'Empresa ABC Ltda' },
          status: 'LIBERADA_PARA_PCP',
          prioridade: 'ALTA',
          data_prazo: '2024-01-15',
          workflow_instanciado: false,
          workflow_status: null,
          workflow_progresso: 0
        },
        {
          id: 'mock-2',
          numero: 'OS-2024-001235',
          nome_servico: 'Letra Caixa LED',
          cliente: { nome: 'Loja XYZ' },
          status: 'LIBERADA_PARA_PCP',
          prioridade: 'MEDIA',
          data_prazo: '2024-01-20',
          workflow_instanciado: true,
          workflow_status: 'ATIVO',
          workflow_progresso: 75
        }
      ];
      return NextResponse.json(mockData);
    }

    const response = await fetch(`${BACKEND_URL}/os/liberadas-para-pcp`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/pcp/os/liberadas-para-pcp:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}











