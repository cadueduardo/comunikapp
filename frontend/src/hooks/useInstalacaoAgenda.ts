'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import type {
  AgendaInstalacaoEvento,
  ConflitoAgendaItem,
} from '@/lib/instalacao/instalacao.types';

interface UseInstalacaoAgendaParams {
  data_inicio: string;
  data_fim: string;
  habilitado?: boolean;
}

interface UseInstalacaoAgendaResult {
  eventos: AgendaInstalacaoEvento[];
  conflitos: ConflitoAgendaItem[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useInstalacaoAgenda({
  data_inicio,
  data_fim,
  habilitado = true,
}: UseInstalacaoAgendaParams): UseInstalacaoAgendaResult {
  const [eventos, setEventos] = useState<AgendaInstalacaoEvento[]>([]);
  const [conflitos, setConflitos] = useState<ConflitoAgendaItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const ultimoToastConflitoRef = useRef<string | null>(null);

  const recarregar = useCallback(async () => {
    if (!habilitado || !data_inicio || !data_fim) {
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const intervalo = { data_inicio, data_fim };
      const [agenda, conflitosResposta] = await Promise.all([
        instalacaoApi.consultarAgenda(intervalo),
        instalacaoApi.consultarConflitosAgenda(intervalo),
      ]);

      setEventos(agenda.eventos);
      setConflitos(conflitosResposta.conflitos);

      if (conflitosResposta.total_conflitos > 0) {
        const chaveToast = `${data_inicio}|${data_fim}|${conflitosResposta.total_conflitos}`;
        if (ultimoToastConflitoRef.current !== chaveToast) {
          ultimoToastConflitoRef.current = chaveToast;
          const equipes = [
            ...new Set(
              conflitosResposta.conflitos.map((c) => c.equipe_instalacao),
            ),
          ];
          toast.warning(
            `${conflitosResposta.total_conflitos} conflito(s) de agenda detectado(s). Equipe(s): ${equipes.join(', ')}. Revise os dias marcados com alerta.`,
            { duration: 6000 },
          );
        }
      }
    } catch (err) {
      const mensagem =
        err instanceof Error ? err.message : 'Falha ao carregar agenda';
      setErro(mensagem);
      setEventos([]);
      setConflitos([]);
    } finally {
      setCarregando(false);
    }
  }, [data_inicio, data_fim, habilitado]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return {
    eventos,
    conflitos,
    carregando,
    erro,
    recarregar,
  };
}
