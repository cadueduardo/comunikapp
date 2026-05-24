'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BannerMensagem,
  OnboardingResumo,
  fetchBannerEstado,
  fetchOnboarding,
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
