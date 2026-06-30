import { NextRequest } from 'next/server';
import { proxyBackend } from '../../instalacao/_proxy';

export async function GET(request: NextRequest) {
  return proxyBackend(request, '/instalador/lotes');
}
