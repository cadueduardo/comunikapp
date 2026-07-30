import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function DELETE(request: NextRequest) {
  return proxyBackend(request, `/conexoes/google`, { method: 'DELETE' });
}
