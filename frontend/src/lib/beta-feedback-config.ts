import { ENV_CONFIG } from '@/lib/env';

/**
 * Canal de feedback beta (botao flutuante).
 *
 * Para desativar apos o beta:
 *   Frontend: NEXT_PUBLIC_BETA_FEEDBACK_ENABLED=false
 *   Backend:  BETA_FEEDBACK_ENABLED=false
 * Depois rebuild do frontend + restart do backend.
 */
export const BETA_FEEDBACK_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_BETA_FEEDBACK_ENABLED !== 'false',
  email:
    process.env.NEXT_PUBLIC_BETA_FEEDBACK_EMAIL || 'cadu.eduardo@gmail.com',
  whatsappDisplay:
    process.env.NEXT_PUBLIC_BETA_FEEDBACK_WHATSAPP_DISPLAY ||
    '(11) 97276-3228',
  /** Numero E.164 sem + (wa.me) */
  whatsappE164:
    process.env.NEXT_PUBLIC_BETA_FEEDBACK_WHATSAPP || '5511972763228',
} as const;

export function isBetaFeedbackEnabled() {
  return BETA_FEEDBACK_CONFIG.enabled;
}

export function buildBetaFeedbackVersionLabel() {
  return ENV_CONFIG.GIT_SHA
    ? `${ENV_CONFIG.APP_VERSION} (${ENV_CONFIG.GIT_SHA.slice(0, 7)})`
    : ENV_CONFIG.APP_VERSION;
}

export function buildBetaFeedbackWhatsAppMessage(input: {
  descricao: string;
  expectativa?: string;
  paginaUrl: string;
  paginaPath: string;
  usuarioNome?: string;
  usuarioEmail?: string;
  lojaNome?: string;
  versaoPlataforma?: string;
}) {
  const lines = [
    '*Beta Comunikapp — Feedback*',
    '',
    `*Pagina:* ${input.paginaUrl}`,
    `*Rota:* ${input.paginaPath}`,
    '',
    '*Problema:*',
    input.descricao.trim(),
  ];

  if (input.expectativa?.trim()) {
    lines.push('', '*O que esperava:*', input.expectativa.trim());
  }

  if (input.usuarioNome || input.usuarioEmail) {
    lines.push(
      '',
      `*Usuario:* ${input.usuarioNome || 'N/A'} (${input.usuarioEmail || 'N/A'})`,
    );
  }

  if (input.lojaNome) {
    lines.push(`*Loja:* ${input.lojaNome}`);
  }

  if (input.versaoPlataforma) {
    lines.push(`*Versao:* ${input.versaoPlataforma}`);
  }

  return lines.join('\n');
}

export function buildBetaFeedbackWhatsAppUrl(message: string) {
  return `https://wa.me/${BETA_FEEDBACK_CONFIG.whatsappE164}?text=${encodeURIComponent(message)}`;
}

export function buildBetaFeedbackMailtoUrl(input: {
  descricao: string;
  expectativa?: string;
  paginaUrl: string;
  paginaPath: string;
  usuarioNome?: string;
  usuarioEmail?: string;
  lojaNome?: string;
  versaoPlataforma?: string;
}) {
  const subject = encodeURIComponent(
    `[Beta Comunikapp] Feedback — ${input.paginaPath}`,
  );

  const bodyLines = [
    'Beta Comunikapp — Feedback',
    '',
    `Pagina: ${input.paginaUrl}`,
    `Rota: ${input.paginaPath}`,
    '',
    'Problema:',
    input.descricao.trim(),
  ];

  if (input.expectativa?.trim()) {
    bodyLines.push('', 'O que esperava:', input.expectativa.trim());
  }

  if (input.usuarioNome || input.usuarioEmail) {
    bodyLines.push(
      '',
      `Usuario: ${input.usuarioNome || 'N/A'} (${input.usuarioEmail || 'N/A'})`,
    );
  }

  if (input.lojaNome) {
    bodyLines.push(`Loja: ${input.lojaNome}`);
  }

  if (input.versaoPlataforma) {
    bodyLines.push(`Versao: ${input.versaoPlataforma}`);
  }

  const body = encodeURIComponent(bodyLines.join('\n'));
  return `mailto:${BETA_FEEDBACK_CONFIG.email}?subject=${subject}&body=${body}`;
}
