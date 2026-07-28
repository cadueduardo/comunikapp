import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  getClearSessionCookieOptions,
} from '@/lib/auth-cookie';

export async function POST(request: NextRequest) {
  const host =
    request.headers.get('x-forwarded-host') || request.headers.get('host');
  const res = NextResponse.json({ ok: true, message: 'Logout efetuado.' });
  res.cookies.set(
    SESSION_COOKIE_NAME,
    '',
    getClearSessionCookieOptions(host),
  );
  return res;
}
