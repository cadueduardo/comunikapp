import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface ItemFila {
  id: string;
  os_id?: string;
  numero: string;
  titulo: string;
  cliente: string;
  status: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' | 'NORMAL' | 'URGENTE';
  data_prazo: string;
  progresso: number;
  alertas: string[];
  setor_atual?: string;
  operador_atual?: string;
  observacoes?: string;
  quantidade_produzida?: number;
  quantidade_refugo?: number;
  workflow_id?: string;
  workflow_nome?: string;
  workflow_setores_nomes?: string[];
  instancia_setor_id?: string;
  proximos_setores_ids?: string[];
  retrabalho?: boolean;
  tempo_previsto_min?: number;
  tempo_previsto_horas?: number;
  maquina_prevista?: {
    id?: string;
    nome?: string;
  } | null;
  item_os_id?: string;
  modo_fulfillment?: 'PICK' | 'MAKE' | 'HIBRIDO' | null;
  arte_producao_url?: string | null;
  personalizacao_modo?: string | null;
}

export interface SetorOperador {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
}

export interface UseMeuSetorReturn {
  // Dados
  setor: SetorOperador | null;
  fila: ItemFila[];
  loading: boolean;
  error: string | null;
  setoresDisponiveis: SetorOperador[];

  // Estados
  operadorId: string | null;
  lastRefresh: Date;
  isAdministrador: boolean;
  setorSelecionadoId: string | null;

  // Handlers
  refreshData: () => Promise<void>;
  iniciarProducao: (
    itemId: string,
    observacoes?: string,
    maquinaId?: string,
  ) => Promise<void>;
  concluirEtapa: (
    itemId: string,
    observacoes?: string,
    quantidadeProduzida?: number,
  ) => Promise<void>;
  pausarProducao: (
    itemId: string,
    motivo: string,
    observacoes?: string,
  ) => Promise<void>;
  moverItemSetor: (itemId: string, setorDestinoId: string) => Promise<void>;
  selecionarSetor: (setorId: string | null) => void;
  filtrarSomenteMinhaFila: boolean;
  setFiltrarSomenteMinhaFila: (value: boolean) => void;
  setoresParaMovimento: SetorOperador[];
}

async function extrairErroApi(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message || payload.error || fallback;
  } catch {
    return fallback;
  }
}

export function useMeuSetor(): UseMeuSetorReturn {
  const [setor, setSetor] = useState<SetorOperador | null>(null);
  const [fila, setFila] = useState<ItemFila[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operadorId, setOperadorId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [setoresDisponiveis, setSetoresDisponiveis] = useState<SetorOperador[]>(
    [],
  );
  const [setorSelecionadoId, setSetorSelecionadoId] = useState<string | null>(
    null,
  );
  const [isAdministrador, setIsAdministrador] = useState(false);
  const [filtrarSomenteMinhaFila, setFiltrarSomenteMinhaFila] = useState(false);
  const [setoresParaMovimento, setSetoresParaMovimento] = useState<SetorOperador[]>(
    [],
  );
  const setoresRef = useRef<SetorOperador[]>([]);

  const deveFiltrarPorOperador =
    !isAdministrador || (isAdministrador && filtrarSomenteMinhaFila);

  // Obter informações básicas do usuário (operador/admin) ao montar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const funcao = (localStorage.getItem('user_roles') || '').toUpperCase();
    const admin = funcao === 'ADMINISTRADOR';
    setIsAdministrador(admin);

    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      setOperadorId(storedUserId);
    } else {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const idFromToken =
            payload?.user_id || payload?.sub || payload?.id || null;

          if (idFromToken) {
            setOperadorId(String(idFromToken));
            localStorage.setItem('user_id', String(idFromToken));
          }
        } catch (decodeError) {
          console.error('Erro ao decodificar token:', decodeError);
        }
      }
    }

    // Caso seja admin sem operador definido, ainda vamos carregar os setores
    if (!admin && !storedUserId) {
      setLoading(false);
    }
  }, []);

  const fetchSetorData = useCallback(
    async (options?: { skipLista?: boolean; setorOverride?: string | null }) => {
      if (!operadorId && !isAdministrador) {
        setSetor(null);
        setFila([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Token de autenticação não encontrado.');
        }

        // Administrador: lista completa e possibilidade de selecionar qualquer setor
        if (isAdministrador) {
          let listaAtual = setoresRef.current;
          let selectedId =
            options?.setorOverride !== undefined
              ? options.setorOverride
              : setorSelecionadoId;

          if (!options?.skipLista) {
            const listaResponse = await fetch(
              '/api/centros-de-trabalho/setores-produtivos',
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              },
            );

            if (listaResponse.status === 404) {
              setoresRef.current = [];
              setSetoresDisponiveis([]);
              setSetorSelecionadoId(null);
              setSetor(null);
              setFila([]);
              setLastRefresh(new Date());
              setLoading(false);
              return;
            }

            if (!listaResponse.ok) {
              throw new Error(
                `Erro ${listaResponse.status}: ${listaResponse.statusText}`,
              );
            }

            const listaData = await listaResponse.json();
            const lista = Array.isArray(listaData)
              ? listaData
              : listaData
              ? [listaData]
              : [];
            listaAtual = lista;
            setoresRef.current = lista;
            setSetoresDisponiveis(lista);

            if (!selectedId || !lista.some((item) => item.id === selectedId)) {
              const primeiro = lista[0]?.id ?? null;
              if (primeiro !== selectedId) {
                setSetorSelecionadoId(primeiro);
                selectedId = primeiro;
              }
            }
          } else {
            selectedId =
              options?.setorOverride !== undefined
                ? options.setorOverride
                : setorSelecionadoId;
          }

          const alvoId =
            selectedId ?? (listaAtual.length > 0 ? listaAtual[0].id : null);

          if (!alvoId) {
            setSetor(null);
            setFila([]);
            setLastRefresh(new Date());
            setLoading(false);
            return;
          }

          const setorAlvo =
            listaAtual.find((item) => item.id === alvoId) || null;

          if (!setorAlvo) {
            setSetor(null);
            setFila([]);
            setLastRefresh(new Date());
            setLoading(false);
            return;
          }

          setSetor(setorAlvo);

          const filaParams = new URLSearchParams();
          if (deveFiltrarPorOperador && operadorId) {
            filaParams.set('operadorId', operadorId);
          }

          const filaUrl = filaParams.toString()
            ? `/api/pcp/kanban/fila-setor/${setorAlvo.id}?${filaParams.toString()}`
            : `/api/pcp/kanban/fila-setor/${setorAlvo.id}`;

          const filaResponse = await fetch(filaUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!filaResponse.ok) {
            throw new Error(
              await extrairErroApi(filaResponse, 'Erro ao carregar fila do setor'),
            );
          }

          const filaData = await filaResponse.json();
          setFila(Array.isArray(filaData) ? filaData : []);
          setLastRefresh(new Date());
          return;
        }

        // Operador: busca setor vinculado automaticamente
        const response = await fetch(
          `/api/centros-de-trabalho/setores-produtivos/operador/${operadorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.status === 404) {
          setSetor(null);
          setFila([]);
          setLastRefresh(new Date());
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const setorData = await response.json();
        const setores = Array.isArray(setorData)
          ? setorData
          : setorData
          ? [setorData]
          : [];

        if (setores.length === 0) {
          setSetor(null);
          setFila([]);
          setLastRefresh(new Date());
          setLoading(false);
          return;
        }

        const selectedOperadorId =
          options?.setorOverride !== undefined
            ? options.setorOverride
            : setorSelecionadoId;

        const setorAtual =
          setores.find((item) => item.id === selectedOperadorId) || setores[0];

        setSetor(setorAtual);
        setSetoresDisponiveis(setores);
        setSetorSelecionadoId(setorAtual.id);

        if (setoresParaMovimento.length === 0) {
          const listaResponse = await fetch(
            '/api/centros-de-trabalho/setores-produtivos',
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            },
          );
          if (listaResponse.ok) {
            const listaData = await listaResponse.json();
            const lista = Array.isArray(listaData)
              ? listaData
              : listaData
              ? [listaData]
              : [];
            setSetoresParaMovimento(lista);
          }
        }

        const filaParams = new URLSearchParams();
        if (operadorId) {
          filaParams.set('operadorId', operadorId);
        }

        const filaUrl = filaParams.toString()
          ? `/api/pcp/kanban/fila-setor/${setorAtual.id}?${filaParams.toString()}`
          : `/api/pcp/kanban/fila-setor/${setorAtual.id}`;

        const filaResponse = await fetch(filaUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!filaResponse.ok) {
          throw new Error(
            await extrairErroApi(filaResponse, 'Erro ao carregar fila do setor'),
          );
        }

        const filaData = await filaResponse.json();
        setFila(Array.isArray(filaData) ? filaData : []);
        setLastRefresh(new Date());
      } catch (loadError: unknown) {
        console.error('Erro ao carregar dados do setor:', loadError);
        const mensagem =
          loadError instanceof Error
            ? loadError.message
            : 'Erro ao carregar dados do setor';
        setError(mensagem);
        toast.error(mensagem);
      } finally {
        setLoading(false);
      }
    },
    [
      deveFiltrarPorOperador,
      isAdministrador,
      operadorId,
      setorSelecionadoId,
      setoresParaMovimento.length,
    ],
  );

  const refreshData = useCallback(async () => {
    await fetchSetorData();
  }, [fetchSetorData]);

  useEffect(() => {
    fetchSetorData();
  }, [fetchSetorData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchSetorData({ skipLista: true }).catch((intervalError) =>
          console.error('Erro ao atualizar dados do setor:', intervalError),
        );
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSetorData, loading]);

  const selecionarSetor = useCallback(
    (setorId: string | null) => {
      setSetorSelecionadoId(setorId);
      fetchSetorData({ skipLista: true, setorOverride: setorId }).catch(
        (erro) =>
          console.error('Erro ao atualizar setor selecionado:', erro),
      );
      if (!setorId) {
        setSetor(null);
        setFila([]);
      }
    },
    [fetchSetorData],
  );

  const iniciarProducao = useCallback(
    async (itemId: string, observacoes?: string, maquinaId?: string) => {
      try {
        if (!operadorId) {
          toast.error('Operador não identificado para iniciar a produção.');
          return;
        }

        const token = localStorage.getItem('access_token');

        const response = await fetch(`/api/pcp/kanban/iniciar/${itemId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operadorId,
            observacoes,
            ...(maquinaId ? { maquinaId } : {}),
          }),
        });

        if (!response.ok) {
          throw new Error(
            await extrairErroApi(response, 'Erro ao iniciar produção'),
          );
        }

        toast.success('Produção iniciada com sucesso');
        await fetchSetorData({ skipLista: true });
      } catch (startError: unknown) {
        console.error('Erro ao iniciar produção:', startError);
        const mensagem =
          startError instanceof Error
            ? startError.message
            : 'Erro ao iniciar produção';
        toast.error(mensagem);
      }
    },
    [fetchSetorData, operadorId],
  );

  const concluirEtapa = useCallback(
    async (
      itemId: string,
      observacoes?: string,
      quantidadeProduzida?: number,
    ) => {
      try {
        if (!operadorId) {
          toast.error('Operador não identificado para concluir a etapa.');
          return;
        }

        const token = localStorage.getItem('access_token');

        const response = await fetch(`/api/pcp/kanban/concluir/${itemId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operadorId,
            observacoes,
            quantidadeProduzida,
          }),
        });

        if (!response.ok) {
          throw new Error(await extrairErroApi(response, 'Erro ao concluir etapa'));
        }

        toast.success('Etapa concluída com sucesso');
        await fetchSetorData({ skipLista: true });
      } catch (finishError: unknown) {
        console.error('Erro ao concluir etapa:', finishError);
        const mensagem =
          finishError instanceof Error
            ? finishError.message
            : 'Erro ao concluir etapa';
        toast.error(mensagem);
      }
    },
    [fetchSetorData, operadorId],
  );

  const pausarProducao = useCallback(
    async (itemId: string, motivo: string, observacoes?: string) => {
      try {
        if (!operadorId) {
          toast.error('Operador não identificado para pausar a produção.');
          return;
        }

        const token = localStorage.getItem('access_token');

        const response = await fetch(`/api/pcp/kanban/pausar/${itemId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operadorId,
            motivo,
            observacoes,
          }),
        });

        if (!response.ok) {
          throw new Error(
            await extrairErroApi(response, 'Erro ao pausar produção'),
          );
        }

        toast.success('Produção pausada com sucesso');
        await fetchSetorData({ skipLista: true });
      } catch (pauseError: unknown) {
        console.error('Erro ao pausar produção:', pauseError);
        const mensagem =
          pauseError instanceof Error
            ? pauseError.message
            : 'Erro ao pausar produção';
        toast.error(mensagem);
      }
    },
    [fetchSetorData, operadorId],
  );

  const moverItemSetor = useCallback(
    async (itemId: string, setorDestinoId: string) => {
      try {
        if (!operadorId) {
          toast.error('Operador não identificado para mover o item.');
          return;
        }

        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `/api/pcp/kanban/mover-setor/${itemId}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              setorDestinoId,
              operadorId,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(
            await extrairErroApi(response, 'Erro ao mover item de setor'),
          );
        }

        toast.success('Item movido com sucesso');
        await fetchSetorData({ skipLista: true });
      } catch (moveError: unknown) {
        console.error('Erro ao mover item de setor:', moveError);
        const mensagem =
          moveError instanceof Error
            ? moveError.message
            : 'Erro ao mover item de setor';
        toast.error(mensagem);
      }
    },
    [fetchSetorData, operadorId],
  );

  return {
    // Dados
    setor,
    fila,
    loading,
    error,
    setoresDisponiveis,

    // Estados
    operadorId,
    lastRefresh,
    isAdministrador,
    setorSelecionadoId,

    // Handlers
    refreshData,
    iniciarProducao,
    concluirEtapa,
    pausarProducao,
    moverItemSetor,
    selecionarSetor,
    filtrarSomenteMinhaFila,
    setFiltrarSomenteMinhaFila,
    setoresParaMovimento: isAdministrador
      ? setoresDisponiveis
      : setoresParaMovimento,
  };
}
