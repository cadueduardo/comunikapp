import { stripDocument } from '../../common/utils/cpf-cnpj.util';

/**
 * Normalização de campos de `cliente` para deduplicação por alerta
 * (RP §5.2.3 / Fase 4 — D-06). Nunca usada como `@@unique`: duplicidade é
 * sinal para o usuário decidir, não bloqueio automático, e uma constraint
 * quebraria cadastros legados já divergentes.
 */

/** Documento (CPF/CNPJ) só com dígitos. `null` quando vazio. */
export function normalizarDocumentoCliente(
  documento: string | null | undefined,
): string | null {
  if (!documento) return null;
  const normalizado = stripDocument(documento);
  return normalizado.length > 0 ? normalizado : null;
}

/** E-mail em minúsculas e sem espaços nas pontas. `null` quando vazio. */
export function normalizarEmailCliente(
  email: string | null | undefined,
): string | null {
  if (!email) return null;
  const normalizado = email.trim().toLowerCase();
  return normalizado.length > 0 ? normalizado : null;
}

/** Telefone/WhatsApp só com dígitos. `null` quando vazio. */
export function normalizarTelefoneCliente(
  telefone: string | null | undefined,
): string | null {
  if (!telefone) return null;
  const normalizado = telefone.replace(/\D/g, '');
  return normalizado.length > 0 ? normalizado : null;
}

export interface NormalizacaoCliente {
  documento_normalizado: string | null;
  email_normalizado: string | null;
  telefone_normalizado: string | null;
}

/** Calcula os três campos `*_normalizado` persistidos em `cliente`. */
export function normalizarCamposCliente(dados: {
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
}): NormalizacaoCliente {
  return {
    documento_normalizado: normalizarDocumentoCliente(dados.documento),
    email_normalizado: normalizarEmailCliente(dados.email),
    telefone_normalizado: normalizarTelefoneCliente(dados.telefone),
  };
}

/**
 * Mesma normalização, mas para `update` parcial: só inclui a chave
 * `*_normalizado` quando o campo de origem foi de fato enviado no DTO. Sem
 * isso, um update que só troca o `nome` apagaria os campos `*_normalizado`
 * existentes (o Prisma trataria `undefined` de `dados.documento` como
 * "documento vazio" em vez de "documento não enviado").
 */
export function normalizarCamposClienteParcial(dados: {
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
}): Partial<NormalizacaoCliente> {
  const parcial: Partial<NormalizacaoCliente> = {};
  if (dados.documento !== undefined) {
    parcial.documento_normalizado = normalizarDocumentoCliente(dados.documento);
  }
  if (dados.email !== undefined) {
    parcial.email_normalizado = normalizarEmailCliente(dados.email);
  }
  if (dados.telefone !== undefined) {
    parcial.telefone_normalizado = normalizarTelefoneCliente(dados.telefone);
  }
  return parcial;
}
