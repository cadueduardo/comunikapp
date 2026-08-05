import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function POST(request: NextRequest) {
  return proxyBackend(request, '/vendas/atendimento', { method: 'POST' });
}