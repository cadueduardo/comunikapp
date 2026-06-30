import { NextRequest } from 'next/server';
import { proxyBackend } from '../_proxy';

export async function GET(request: NextRequest) {
  return proxyBackend(request, '/instalacao/lotes');
}
