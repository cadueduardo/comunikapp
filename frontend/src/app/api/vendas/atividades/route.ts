import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  return proxyBackend(request, '/vendas/atividades', { method: 'GET' });
}

export async function POST(request: NextRequest) {
  return proxyBackend(request, '/vendas/atividades', { method: 'POST' });
}