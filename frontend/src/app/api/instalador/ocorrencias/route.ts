import { NextRequest } from 'next/server';
import { proxyBackend } from '../../instalacao/_proxy';

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, '/instalador/ocorrencias', {
    method: 'POST',
    body,
  });
}
