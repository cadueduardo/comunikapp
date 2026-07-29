import { NextRequest } from 'next/server';
import { proxyAdminBackend } from '@/lib/api/proxy-admin-backend';

export async function GET(request: NextRequest) {
  return proxyAdminBackend(
    request,
    '/admin/v1/administrator-invitations',
    { method: 'GET' },
  );
}

export async function POST(request: NextRequest) {
  return proxyAdminBackend(
    request,
    '/admin/v1/administrator-invitations',
    {
      method: 'POST',
      body: await request.text(),
    },
  );
}

