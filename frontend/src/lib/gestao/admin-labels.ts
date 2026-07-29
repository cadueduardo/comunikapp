import {
  AdminInvitation,
  AdminRole,
  ProductUpdateCategory,
  ProductUpdateStatus,
  StoreStatus,
} from './admin-types';

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Superadministrador',
  OPERACAO: 'Operação',
  SUPORTE: 'Suporte',
  FINANCEIRO_SAAS: 'Financeiro SaaS',
  ANALISTA: 'Analista',
};

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  PENDENTE_VERIFICACAO: 'Pendente',
  ATIVO: 'Ativa',
  INATIVO: 'Inativa',
  BLOQUEADO: 'Bloqueada',
};

export const INVITATION_STATUS_LABELS: Record<
  AdminInvitation['status'],
  string
> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

export const PRODUCT_UPDATE_CATEGORY_LABELS: Record<
  ProductUpdateCategory,
  string
> = {
  NEW_MODULE: 'Novo módulo',
  FEATURE: 'Nova funcionalidade',
  IMPROVEMENT: 'Melhoria',
  FIX: 'Correção',
  SECURITY: 'Segurança',
  NOTICE: 'Comunicado',
};

export const PRODUCT_UPDATE_STATUS_LABELS: Record<
  ProductUpdateStatus,
  string
> = {
  DRAFT: 'Rascunho',
  IN_REVIEW: 'Em revisão',
  SCHEDULED: 'Agendado',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  ADMIN_LOGIN_SUCCEEDED: 'Login bem-sucedido',
  ADMIN_LOGIN_FAILED: 'Login falhou',
  ADMIN_LOGOUT: 'Logout',
  ADMIN_INVITATION_CREATED: 'Convite criado',
  ADMIN_INVITATION_RESENT: 'Convite reenviado',
  ADMIN_INVITATION_CANCELLED: 'Convite cancelado',
  ADMIN_INVITATION_ACCEPTED: 'Convite aceito',
  ADMIN_INVITATION_EMAIL_FAILED: 'Falha no e-mail do convite',
  ADMIN_TWO_FACTOR_ENABLED: '2FA habilitado',
  STORE_STATUS_CHANGED: 'Status da loja alterado',
  'product_update.created': 'Novidade criada',
  'product_update.updated': 'Novidade editada',
  'product_update.published': 'Novidade publicada',
  'product_update.review_requested': 'Novidade enviada para revisão',
};

export function formatAdminAuditAction(action: string) {
  return AUDIT_ACTION_LABELS[action] || action;
}

export function formatAdminDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}
