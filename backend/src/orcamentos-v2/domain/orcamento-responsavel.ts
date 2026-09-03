/**
 * Ownership do orçamento: o responsável é sempre um usuário da loja.
 * `atendente` é só a cópia do nome para o PDF — nunca texto livre do cliente.
 */

export const ATENDENTE_FALLBACK_LOJA = 'Equipe Comercial';

export const ACAO_TRANSFERENCIA_RESPONSAVEL = 'TRANSFERENCIA_RESPONSAVEL';

export function nomeAtendenteDoUsuario(
  nome: string | null | undefined,
): string {
  const n = typeof nome === 'string' ? nome.trim() : '';
  return n.length > 0 ? n : ATENDENTE_FALLBACK_LOJA;
}

/**
 * Criação: o body não escolhe dono nem o rótulo do PDF.
 */
export function aplicarOwnershipCriacao<T extends Record<string, unknown>>(
  dadosPreparados: T,
  usuarioId: string,
  nomeUsuario: string | null | undefined,
): T {
  return {
    ...dadosPreparados,
    responsavel_id: usuarioId,
    atendente: nomeAtendenteDoUsuario(nomeUsuario),
  };
}
