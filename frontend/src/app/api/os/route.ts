import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

// GET /api/os - Listar OS (sessão via cookie HttpOnly ou Bearer legado)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  return proxyBackend(request, qs ? `/os?${qs}` : '/os');
}

// POST /api/os - Criar OS
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, '/os', {
    method: 'POST',
    body,
  });
}
