'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertasResumo,
  BannerMensagem,
  FluxoResumo,
  KpisResumo,
  OnboardingResumo,
  ResumoFinanceiroResponse,
  fetchAlertas,
  fetchBannerEstado,
  fetchFluxo,
  fetchKpis,
  fetchOnboarding,
  fetchResumoFinanceiro,
  patchOnboardingStep,
  postAplicarConfiguracaoRecomendada,
} from '@/lib/home-operacional-api';

interface UseOnboardingResult {
  resumo: OnboardingResumo | null;
  loading: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
  ignorarStep: (stepId: string) => Promise<void>;
  reativarStep: (stepId: string) => Promise<void>;
  aplicarConfiguracaoRecomendada: (opcoes?: { sobrescrever_existentes?: boolean }) => Promise<void>;
}

export function useOnboarding(): UseOnboardingResult {
  const [resumo, setResumo] = useState<OnboardingResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await fetchOnboarding();
      setResumo(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao carregar onboarding');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const ignorarStep = useCallback(async (stepId: string) => {
    try {
      const data = await patchOnboardingStep(stepId, 'ignorar');
      setResumo(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao ignorar etapa');
    }
  }, []);

  const reativarStep = useCallback(async (stepId: string) => {
    try {
      const data = await patchOnboardingStep(stepId, 'reativar');
      setResumo(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao reativar etapa');
    }
  }, []);

  const aplicarConfiguracaoRecomendada = useCallback(
    async (opcoes?: { sobrescrever_existentes?: boolean }) => {
      await postAplicarConfiguracaoRecomendada(opcoes);
      await recarregar();
    },
    [recarregar],
  );

  return { resumo, loading, erro, recarregar, ignorarStep, reativarStep, aplicarConfiguracaoRecomendada };
}

interface UseBannerEstadoResult {
  mensagens: BannerMensagem[];
  loading: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useBannerEstado(): UseBannerEstadoResult {
  const [mensagens, setMensagens] = useState<BannerMensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await fetchBannerEstado();
      setMensagens(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao carregar banner de estado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { mensagens, loading, erro, recarregar };
}

// ====================================================================
// Fluxo de trabalho (Fase 4)
// ====================================================================

interface UseFluxoTrabalhoResult {
  fluxo: FluxoResumo | null;
  loading: boolean;
  erro: string | null;
  /**
   * Recarrega o fluxo. Por default reutiliza o cache de 60s do backend.
   * Use `recarregar({ forcar: true })` para enviar `?refresh=1` e
   * recomputar do zero (ex.: depois que o usuario aprovou um orcamento
   * em outro modulo).
   */
  recarregar: (opcoes?: { forcar?: boolean }) => Promise<void>;
}

export function useFluxoTrabalho(): UseFluxoTrabalhoResult {
  const [fluxo, setFluxo] = useState<FluxoResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async (opcoes?: { forcar?: boolean }) => {
    setLoading(true);
    setErro(null);
    try {
      const data = await fetchFluxo({ refresh: opcoes?.forcar === true });
      setFluxo(data);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Falha ao carregar fluxo de trabalho',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { fluxo, loading, erro, recarregar };
}

// ====================================================================
// Alertas operacionais (Fase 5)
// ====================================================================

interface UseAlertasOperacionaisResult {
  resumo: AlertasResumo | null;
  loading: boolean;
  erro: string | null;
  /**
   * Recarrega os alertas. Por default reutiliza o cache de 60s do
   * backend. Use `recarregar({ forcar: true })` para enviar
   * `?refresh=1` e recomputar do zero (ex.: depois que o usuario tomou
   * uma acao em outro modulo).
   */
  recarregar: (opcoes?: { forcar?: boolean }) => Promise<void>;
}

// ====================================================================
// KPIs do dashboard
// ====================================================================

interface UseKpisDashboardResult {
  resumo: KpisResumo | null;
  loading: boolean;
  erro: string | null;
  recarregar: (opcoes?: { forcar?: boolean }) => Promise<void>;
}

export function useKpisDashboard(): UseKpisDashboardResult {
  const [resumo, setResumo] = useState<KpisResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async (opcoes?: { forcar?: boolean }) => {
    setLoading(true);
    setErro(null);
    try {
      const data = await fetchKpis({ refresh: opcoes?.forcar === true });
      setResumo(data);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Falha ao carregar KPIs do dashboard',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { resumo, loading, erro, recarregar };
}

export function useAlertasOperacionais(): UseAlertasOperacionaisResult {
  const [resumo, setResumo] = useState<AlertasResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async (opcoes?: { forcar?: boolean }) => {
    setLoading(true);
    setErro(null);
    try {
      const data = await fetchAlertas({ refresh: opcoes?.forcar === true });
      setResumo(data);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Falha ao carregar alertas operacionais',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { resumo, loading, erro, recarregar };
}

// ====================================================================
// Resumo Financeiro Simples (Fase 6.C)
// ====================================================================

interface UseResumoFinanceiroResult {
  resumo: ResumoFinanceiroResponse | null;
  loading: boolean;
  erro: string | null;
  recarregar: (opcoes?: { forcar?: boolean }) => Promise<void>;
}

export function useResumoFinanceiro(): UseResumoFinanceiroResult {
  const [resumo, setResumo] = useState<ResumoFinanceiroResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async (opcoes?: { forcar?: boolean }) => {
    setLoading(true);
    setErro(null);
    try {
      const data = await fetchResumoFinanceiro({
        refresh: opcoes?.forcar === true,
      });
      setResumo(data);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Falha ao carregar resumo financeiro',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { resumo, loading, erro, recarregar };
}
