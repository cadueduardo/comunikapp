import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  getClearSessionCookieOptions,
} from '@/lib/auth-cookie';

export async function POST() {
  const res = NextResponse.json({ ok: true, message: 'Logout efetuado.' });
  res.cookies.set(SESSION_COOKIE_NAME, '', getClearSessionCookieOptions());
  return res;
}
