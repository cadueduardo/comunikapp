/** Mock ESM-safe para testes Jest (otplib v13 puxa @scure/base ESM). */
export const generateSecret = (): string => 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

export const generateURI = (options: {
  issuer?: string;
  label?: string;
  secret?: string;
}): string =>
  `otpauth://totp/${encodeURIComponent(options.label ?? 'user')}?secret=${options.secret ?? generateSecret()}&issuer=${encodeURIComponent(options.issuer ?? 'Comunikapp')}`;

export const verifySync = (_options: {
  token: string;
  secret: string;
}): { valid: boolean } => ({ valid: true });
