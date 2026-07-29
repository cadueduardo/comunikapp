import { NextRequest } from 'next/server';
import { proxyAdminBackend } from '@/lib/api/proxy-admin-backend';

export async function POST(request: NextRequest) {
  return proxyAdminBackend(request, '/admin/v1/auth/logout', {
    method: 'POST',
  });
}

