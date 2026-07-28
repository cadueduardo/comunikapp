/** Nome do cookie HttpOnly de sessão (front + back devem coincidir). */
export const SESSION_COOKIE_NAME = 'comunikapp_session';

/**
 * Extrai JWT de Authorization Bearer ou do cookie de sessão.
 * Preferência: Bearer (compatível com clientes legados / scripts).
 */
export function extractJwtFromRequest(req: {
  headers?: { authorization?: string };
  cookies?: Record<string, string>;
}): string | null {
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer && bearer !== 'null' && bearer !== 'undefined') {
      return bearer;
    }
  }

  const fromCookie = req.cookies?.[SESSION_COOKIE_NAME];
  if (typeof fromCookie === 'string' && fromCookie.trim()) {
    return fromCookie.trim();
  }

  return null;
}
