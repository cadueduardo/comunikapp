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

export function formatAdminDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}
