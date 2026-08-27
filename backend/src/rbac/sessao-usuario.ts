/**
 * Leitura da versão de sessão do usuário sem depender do client Prisma
 * gerado neste worktree. O CI executa `prisma generate` antes do typecheck.
 */
export function lerSessionVersion(usuario: unknown): number {
  if (!usuario || typeof usuario !== 'object') {
    throw new Error('Usuário inválido para validar sessão.');
  }
  const valor = (usuario as { session_version?: unknown }).session_version;
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
    throw new Error('session_version do usuário ausente ou inválida.');
  }
  return valor;
}

export function incrementoSessionVersion(): {
  session_version: { increment: 1 };
} {
  return { session_version: { increment: 1 } };
}
