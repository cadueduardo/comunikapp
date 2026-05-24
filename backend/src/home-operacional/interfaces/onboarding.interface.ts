import { OnboardingStatus } from '../enums/onboarding-status.enum';
import { OnboardingStepId } from '../enums/onboarding-step.enum';

export interface OnboardingEtapaCatalogo {
  step_id: OnboardingStepId;
  ordem: number;
  obrigatoria: boolean;
  titulo: string;
  descricao_curta: string;
  acao_label: string;
  acao_href: string;
}

export interface OnboardingEtapaEstado {
  step_id: OnboardingStepId;
  titulo: string;
  descricao_curta: string;
  acao_label: string;
  acao_href: string;
  status: OnboardingStatus;
  obrigatoria: boolean;
  concluido_em: Date | null;
  ignorado_em: Date | null;
}

export interface OnboardingResumo {
  progresso_pct: number;
  total_etapas: number;
  total_obrigatorias: number;
  obrigatorias_concluidas: number;
  etapas: OnboardingEtapaEstado[];
}
