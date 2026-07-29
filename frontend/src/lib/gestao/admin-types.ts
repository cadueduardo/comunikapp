export type AdminRole =
  | 'SUPER_ADMIN'
  | 'OPERACAO'
  | 'SUPORTE'
  | 'FINANCEIRO_SAAS'
  | 'ANALISTA';

export type StoreStatus =
  | 'PENDENTE_VERIFICACAO'
  | 'ATIVO'
  | 'INATIVO'
  | 'BLOQUEADO';

export interface AdminSession {
  id: string;
  sessionId: string;
  nome: string;
  email: string;
  role: AdminRole;
}

export interface AdminStore {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cnpj?: string | null;
  cpf?: string | null;
  status: StoreStatus;
  assinatura_ativa: boolean;
  data_inicio_trial?: string | null;
  trial_restante_dias?: number | null;
  slug: string;
  dominio_custom?: string | null;
  dominio_custom_status?: string | null;
  criado_em: string;
  atualizado_em: string;
  activeUsers: number;
}

export interface AdminInvitation {
  id: string;
  nome: string;
  email: string;
  role: AdminRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expires_at: string;
  accepted_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  invited_by?: {
    id: string;
    nome: string;
    email: string;
  } | null;
}

export type ProductUpdateCategory =
  | 'NEW_MODULE'
  | 'FEATURE'
  | 'IMPROVEMENT'
  | 'FIX'
  | 'SECURITY'
  | 'NOTICE';

export type ProductUpdateStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export interface ProductUpdate {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  version?: string | null;
  category: ProductUpdateCategory;
  modules?: string[];
  audience?: string[];
  status: ProductUpdateStatus;
  origin: 'DEPLOY_AUTOMATION' | 'MANUAL';
  changelog_enabled: boolean;
  in_app_enabled: boolean;
  email_enabled: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  author?: { id: string; nome: string } | null;
}

export interface ProductUpdateInput {
  title: string;
  slug: string;
  summary: string;
  content: string;
  version?: string;
  category: ProductUpdateCategory;
  modules: string[];
  audience: string[];
  changelogEnabled: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  changeReason?: string;
}
