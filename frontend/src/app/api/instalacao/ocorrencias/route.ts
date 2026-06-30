import { NextRequest } from 'next/server';
import { proxyBackend } from '../../_proxy';

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, '/instalacao/ocorrencias', {
    method: 'POST',
    body,
  });
}
