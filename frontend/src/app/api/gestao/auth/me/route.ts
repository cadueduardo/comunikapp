import { NextRequest } from 'next/server';
import { proxyAdminBackend } from '@/lib/api/proxy-admin-backend';

export async function GET(request: NextRequest) {
  return proxyAdminBackend(request, '/admin/v1/auth/me', {
    method: 'GET',
  });
}

