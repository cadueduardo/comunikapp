import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

// GET /api/os - Listar OS (sessão via cookie HttpOnly ou Bearer legado)
// Query string é encaminhada por proxyBackend — não embutir no path.
export async function GET(request: NextRequest) {
  return proxyBackend(request, '/os');
}

// POST /api/os - Criar OS
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, '/os', {
    method: 'POST',
    body,
  });
}
