'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkflowAssignmentDialog } from '@/components/pcp/WorkflowAssignmentDialog';
import { WorkflowCardInfo } from '@/components/pcp/WorkflowCardInfo';
import { toast } from 'sonner';
import { solicitarAtualizacaoBadgesSidebar } from '@/lib/sidebar-badge-refresh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KanbanBoard } from '@/components/ui/kanban-board';
import type { KanbanColumn } from '@/components/ui/kanban-board';
import { useKanbanData } from '@/hooks/useKanbanData';
import { pcpApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  alternarSetoresVisiveis,
  cardPrecisaAtribuirWorkflow,
  cardSemSetoresProdutivos,
  montarQueryKanbanPorSetores,
  resumoSelecaoSetores,
} from '@/lib/pcp/pcp.utils';
import type { OSCard } from '@/components/ui/kanban-board';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBuildingFactory,
  IconCheck,
  IconClipboardList,
  IconClock,
  IconChevronDown,
  IconChartBar,
  IconRefresh,
  IconSettings,
  IconUser,
} from '@tabler/icons-react';

type NivelPCP = 'ESSENCIAL' | 'ORGANIZADO' | 'COMPLETO';

interface ConfiguracaoPCP {
  nivel: NivelPCP | null;
  definido: boolean;
}

interface GargaloResumo {
  setor_id: string;
  titulo: string;
  score_gargalo: number;
  nivel_gargalo: 'BAIXO' | 'MEDIO' | 'ALTO';
  pendentes: number;
  pausadas: number;
  atrasadas: number;
}

interface DashboardPCP {
  configuracao: ConfiguracaoPCP;
  stats: {
    total: number;
    fila: number;
    producao: number;
    concluida: number;
    rejeitada: number;
    atrasadas: number;
    criticas: number;
    por_setor: Record<string, number>;
  };
  cards_atencao: Array<{
    id: string;
    os_id?: string;
    numero: string;
    titulo: string;
    cliente: string;
    status: string;
    prioridade: string;
    data_prazo: string;
    alertas: string[];
    tem_workflow?: boolean;
  }>;
  gargalos: GargaloResumo[];
  gerado_em: string;
}

interface KanbanSetorCard {
  id: string;
  os_id?: string;
  operador_id?: string;
  numero: string;
  titulo: string;
  cliente: string;
  status: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' | 'NORMAL' | 'URGENTE';
  responsavel: string;
  data_prazo: string;
  progresso: number;
  alertas: string[];
  workflow_id?: string;
  workflow_nome?: string;
  workflow_setores_nomes?: string[];
  setor_atual?: string;
  operador_atual?: string;
  instancia_setor_id?: string;
  setor_id?: string;
  etapa_ordem?: number;
  proximos_setores_ids?: string[];
}

interface KanbanSetorColuna {
  id: string;
  setor_id: string;
  titulo: string;
  cor: string;
  ordem: number;
  total: number;
  pendentes: number;
  em_andamento: number;
  pausadas: number;
  atrasadas: number;
  score_gargalo: number;
  nivel_gargalo: 'BAIXO' | 'MEDIO' | 'ALTO';
  cards: KanbanSetorCard[];
}

interface KanbanPorSetoresResponse {
  colunas: KanbanSetorColuna[];
  total: number;
  gerado_em: string;
}

interface CapacidadeSetor {
  setor_id: string;
  nome: string;
  cor?: string | null;
  horas_disponiveis: number;
  horas_programadas: number;
  horas_livres: number;
  ocupacao_percent: number;
  status_carga: 'normal' | 'atencao' | 'cheia' | 'sobrecarregada';
  itens_programados: unknown[];
}

interface CapacidadeSetoresResponse {
  setores: CapacidadeSetor[];
  gerado_em: string;
}

interface CapacidadeMaquina {
  maquina_id: string | null;
  nome: string;
  setor?: { id: string; nome: string } | null;
  horas_disponiveis?: number;
  horas_programadas: number;
  horas_livres?: number;
  ocupacao_percent?: number;
  status_carga?: CapacidadeSetor['status_carga'];
  itens_programados: unknown[];
}

interface CapacidadeMaquinasResponse {
  maquinas: CapacidadeMaquina[];
  sem_maquina_definida?: CapacidadeMaquina | null;
  gerado_em: string;
}

type PrazoBucket =
  | 'atrasados'
  | 'vence_hoje'
  | 'esta_semana'
  | 'sem_prazo';

interface FiltrosSetores {
  operadorId: string;
  prioridade: string;
  prazoBucket: PrazoBucket | '';
  dataInicial: string;
  dataFinal: string;
}

const nivelLabel: Record<NivelPCP, string> = {
  ESSENCIAL: 'Essencial',
  ORGANIZADO: 'Organizado',
  COMPLETO: 'Completo',
};

const nivelDescricao: Record<NivelPCP, string> = {
  ESSENCIAL: 'Quadro simples para acompanhar OS em produção sem burocracia.',
  ORGANIZADO: 'Fluxo por etapas comuns da comunicação visual.',
  COMPLETO: 'Controle por setores, operadores, apontamentos e gargalos.',
};

export default function PCPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const osIdAtribuirWorkflow = searchParams.get('atribuirWorkflow');
  const [osSelecionadaAtribuir, setOsSelecionadaAtribuir] = useState<{
    id: string;
    numero?: string;
  } | null>(null);
  const [dashboard, setDashboard] = useState<DashboardPCP | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [kanbanSetores, setKanbanSetores] = useState<KanbanPorSetoresResponse | null>(null);
  const [setoresVisiveis, setSetoresVisiveis] = useState<string[]>([]);
  const [filtrosSetores, setFiltrosSetores] = useState<FiltrosSetores>({
    operadorId: '',
    prioridade: '',
    prazoBucket: '',
    dataInicial: '',
    dataFinal: '',
  });
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [erroSetores, setErroSetores] = useState<string | null>(null);
  const [capacidadeSetores, setCapacidadeSetores] =
    useState<CapacidadeSetoresResponse | null>(null);
  const [capacidadeMaquinas, setCapacidadeMaquinas] =
    useState<CapacidadeMaquinasResponse | null>(null);
  const [loadingCapacidade, setLoadingCapacidade] = useState(false);
  const [erroCapacidade, setErroCapacidade] = useState<string | null>(null);
  const [cargaModalAberto, setCargaModalAberto] = useState(false);
  const {
    cards,
    stats,
    loading,
    error,
    lastRefresh,
    refreshData,
    handleStatusChange,
  } = useKanbanData();

  const carregarDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/pcp/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar dashboard do PCP');
      }

      const data = (await response.json()) as DashboardPCP;
      setDashboard(data);
    } catch (dashboardError) {
      console.error('Erro ao carregar dashboard do PCP:', dashboardError);
      toast.error('Não foi possível carregar o dashboard do PCP.');
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const carregarKanbanPorSetores = useCallback(async () => {
    setLoadingSetores(true);
    setErroSetores(null);

    try {
      const token = localStorage.getItem('access_token');
      const query = montarQueryKanbanPorSetores(filtrosSetores);
      const endpoint = query
        ? `/api/pcp/kanban/por-setores?${query}`
        : '/api/pcp/kanban/por-setores';

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar Kanban por setores');
      }

      const data = (await response.json()) as KanbanPorSetoresResponse;
      setKanbanSetores(data);
    } catch (setoresError) {
      console.error('Erro ao carregar Kanban por setores:', setoresError);
      setErroSetores('Não foi possível carregar a visão por setores.');
    } finally {
      setLoadingSetores(false);
    }
  }, [filtrosSetores]);

  const carregarCapacidadeSetores = useCallback(async () => {
    setLoadingCapacidade(true);
    setErroCapacidade(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Sessao expirada');
      }

      const params: Record<string, string> = {};
      if (filtrosSetores.operadorId) params.operadorId = filtrosSetores.operadorId;
      if (filtrosSetores.prioridade) params.prioridade = filtrosSetores.prioridade;
      if (filtrosSetores.dataInicial) params.dataInicial = filtrosSetores.dataInicial;
      if (filtrosSetores.dataFinal) params.dataFinal = filtrosSetores.dataFinal;

      const data = (await pcpApi.getCapacidadeSetores(
        token,
        params,
      )) as CapacidadeSetoresResponse;
      const maquinas = (await pcpApi.getCapacidadeMaquinas(
        token,
        params,
      )) as CapacidadeMaquinasResponse;
      setCapacidadeSetores(data);
      setCapacidadeMaquinas(maquinas);
    } catch (capacidadeError) {
      console.error('Erro ao carregar capacidade dos setores:', capacidadeError);
      setErroCapacidade('Nao foi possivel carregar a carga produtiva.');
    } finally {
      setLoadingCapacidade(false);
    }
  }, [filtrosSetores]);

  useEffect(() => {
    void carregarDashboard();
  }, [carregarDashboard]);

  useEffect(() => {
    if (osIdAtribuirWorkflow) {
      setOsSelecionadaAtribuir((atual) =>
        atual?.id === osIdAtribuirWorkflow
          ? atual
          : { id: osIdAtribuirWorkflow },
      );
    }
  }, [osIdAtribuirWorkflow]);

  const nivel = dashboard?.configuracao?.nivel ?? null;
  const statsExibir = dashboard?.stats ?? stats;

  useEffect(() => {
    if (nivel === 'COMPLETO') {
      void carregarKanbanPorSetores();
      return;
    }

    setKanbanSetores(null);
    setCapacidadeSetores(null);
    setCapacidadeMaquinas(null);
    setErroSetores(null);
    setErroCapacidade(null);
    setCargaModalAberto(false);
  }, [carregarKanbanPorSetores, nivel]);

  useEffect(() => {
    if (nivel === 'COMPLETO' && cargaModalAberto) {
      void carregarCapacidadeSetores();
    }
  }, [cargaModalAberto, carregarCapacidadeSetores, nivel]);

  const cardsAtencao = useMemo(() => {
    if (dashboard?.cards_atencao?.length) {
      return dashboard.cards_atencao;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return cards
      .filter((card) => {
        const temAlerta = Array.isArray(card.alertas) && card.alertas.length > 0;
        const prazo = card.data_prazo ? new Date(card.data_prazo) : null;
        const atrasado = prazo ? prazo < hoje && card.status !== 'CONCLUIDA' : false;
        return temAlerta || atrasado || !card.data_prazo;
      })
      .slice(0, 6);
  }, [cards, dashboard?.cards_atencao]);

  const osNumeroAtribuir = useMemo(() => {
    if (!osSelecionadaAtribuir) {
      return undefined;
    }

    if (osSelecionadaAtribuir.numero) {
      return osSelecionadaAtribuir.numero;
    }

    const cardKanban = cards.find(
      (card) => card.id === osSelecionadaAtribuir.id,
    );
    if (cardKanban?.numero) {
      return cardKanban.numero;
    }

    const cardAtencao = cardsAtencao.find(
      (card) => (card.os_id ?? card.id) === osSelecionadaAtribuir.id,
    );
    return cardAtencao?.numero;
  }, [cards, cardsAtencao, osSelecionadaAtribuir]);

  const osAguardandoWorkflow = useMemo(
    () => cards.filter((card) => cardPrecisaAtribuirWorkflow(card)).length,
    [cards],
  );

  const cardsFilaEntrada = useMemo(
    () =>
      cards.filter(
        (card) => card.status === 'FILA' && !cardSemSetoresProdutivos(card),
      ),
    [cards],
  );

  const cardsProducaoSemSetor = useMemo(
    () => cards.filter((card) => cardSemSetoresProdutivos(card)),
    [cards],
  );

  const opcoesSetores = useMemo(() => {
    return (kanbanSetores?.colunas ?? []).map((coluna) => ({
      id: coluna.setor_id,
      nome: coluna.titulo,
    }));
  }, [kanbanSetores]);

  const itensNosSetores = useMemo(
    () =>
      (kanbanSetores?.colunas ?? []).reduce(
        (total, coluna) => total + coluna.total,
        0,
      ),
    [kanbanSetores],
  );

  const aguardandoProducaoCount = useMemo(
    () => cards.filter((card) => card.status === 'FILA').length,
    [cards],
  );

  const opcoesOperadores = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const coluna of kanbanSetores?.colunas ?? []) {
      for (const card of coluna.cards) {
        if (card.operador_id && card.operador_atual) {
          mapa.set(card.operador_id, card.operador_atual);
        }
      }
    }
    return Array.from(mapa.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [kanbanSetores]);

  const acoesPorNivel = useMemo(() => {
    if (nivel === 'COMPLETO') {
      return [
        { label: 'Meu Setor', href: '/pcp/meu-setor', icon: <IconUser className="h-4 w-4" /> },
        { label: 'Setores', href: '/centros-de-trabalho/setores-produtivos', icon: <IconBuildingFactory className="h-4 w-4" /> },
        { label: 'Workflows', href: '/pcp/workflows', icon: <IconClipboardList className="h-4 w-4" /> },
      ];
    }

    if (nivel === 'ORGANIZADO') {
      return [
        { label: 'Kanban', href: '/pcp/kanban', icon: <IconClipboardList className="h-4 w-4" /> },
        { label: 'Workflows', href: '/pcp/workflows', icon: <IconClipboardList className="h-4 w-4" /> },
        { label: 'Configuração', href: '/pcp/configuracao', icon: <IconSettings className="h-4 w-4" /> },
      ];
    }

    return [
      { label: 'Kanban', href: '/pcp/kanban', icon: <IconClipboardList className="h-4 w-4" /> },
      { label: 'OS', href: '/os', icon: <IconCheck className="h-4 w-4" /> },
      { label: 'Configuração', href: '/pcp/configuracao', icon: <IconSettings className="h-4 w-4" /> },
    ];
  }, [nivel]);

  const colunasKanban = useMemo<KanbanColumn[]>(() => {
    if (nivel === 'COMPLETO') {
      return [
        {
          id: 'fila',
          title: 'Fila do PCP',
          status: 'FILA',
          color: 'bg-zinc-100',
          icon: <IconClipboardList className="h-4 w-4" />,
        },
        {
          id: 'execucao',
          title: 'Em execução',
          status: 'PRODUCAO',
          color: 'bg-blue-100',
          icon: <IconBuildingFactory className="h-4 w-4" />,
        },
        {
          id: 'pronto',
          title: 'Pronto',
          status: 'CONCLUIDA',
          color: 'bg-emerald-100',
          icon: <IconCheck className="h-4 w-4" />,
        },
        {
          id: 'bloqueado',
          title: 'Bloqueado',
          status: 'REJEITADA',
          color: 'bg-red-100',
          icon: <IconAlertTriangle className="h-4 w-4" />,
        },
      ];
    }

    if (nivel === 'ORGANIZADO') {
      return [
        {
          id: 'pre-producao',
          title: 'Pré-produção',
          status: 'FILA',
          color: 'bg-zinc-100',
          icon: <IconClipboardList className="h-4 w-4" />,
        },
        {
          id: 'producao',
          title: 'Produção',
          status: 'PRODUCAO',
          color: 'bg-blue-100',
          icon: <IconBuildingFactory className="h-4 w-4" />,
        },
        {
          id: 'pronto',
          title: 'Pronto',
          status: 'CONCLUIDA',
          color: 'bg-emerald-100',
          icon: <IconCheck className="h-4 w-4" />,
        },
        {
          id: 'bloqueios',
          title: 'Bloqueios',
          status: 'REJEITADA',
          color: 'bg-red-100',
          icon: <IconAlertTriangle className="h-4 w-4" />,
        },
      ];
    }

    return [
      {
        id: 'aguardando',
        title: 'Aguardando',
        status: 'FILA',
        color: 'bg-zinc-100',
        icon: <IconClock className="h-4 w-4" />,
      },
      {
        id: 'produzindo',
        title: 'Produzindo',
        status: 'PRODUCAO',
        color: 'bg-blue-100',
        icon: <IconBuildingFactory className="h-4 w-4" />,
      },
      {
        id: 'pronto',
        title: 'Pronto',
        status: 'CONCLUIDA',
        color: 'bg-emerald-100',
        icon: <IconCheck className="h-4 w-4" />,
      },
      {
        id: 'bloqueado',
        title: 'Bloqueado',
        status: 'REJEITADA',
        color: 'bg-red-100',
        icon: <IconAlertTriangle className="h-4 w-4" />,
      },
    ];
  }, [nivel]);

  async function atualizar() {
    await Promise.all([
      refreshData(),
      carregarDashboard(),
      nivel === 'COMPLETO' ? carregarKanbanPorSetores() : Promise.resolve(),
      nivel === 'COMPLETO' && cargaModalAberto
        ? carregarCapacidadeSetores()
        : Promise.resolve(),
    ]);
  }

  function abrirAtribuirWorkflow(osId: string, osNumero?: string) {
    setOsSelecionadaAtribuir({ id: osId, numero: osNumero });
  }

  function fecharDialogAtribuirWorkflow() {
    setOsSelecionadaAtribuir(null);
    if (osIdAtribuirWorkflow) {
      router.replace('/pcp');
    }
  }

  async function handleWorkflowAtribuido() {
    await atualizar();
    fecharDialogAtribuirWorkflow();
  }

  function handleKanbanCardClick(card: OSCard) {
    if (cardPrecisaAtribuirWorkflow(card)) {
      abrirAtribuirWorkflow(card.id, card.numero);
      return;
    }

    router.push(`/os/${card.id}`);
  }

  function handleCardAtencaoClick(card: DashboardPCP['cards_atencao'][number]) {
    const osId = card.os_id ?? card.id;
    if (cardPrecisaAtribuirWorkflow(card)) {
      abrirAtribuirWorkflow(osId, card.numero);
      return;
    }

    router.push(`/os/${osId}`);
  }

  function atualizarFiltroSetores<K extends keyof FiltrosSetores>(
    campo: K,
    valor: FiltrosSetores[K],
  ) {
    setFiltrosSetores((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function limparFiltrosSetores() {
    setFiltrosSetores({
      operadorId: '',
      prioridade: '',
      prazoBucket: '',
      dataInicial: '',
      dataFinal: '',
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">PCP</h1>
            {nivel && (
              <Badge variant="secondary" className="text-xs">
                {nivelLabel[nivel]}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {nivel ? nivelDescricao[nivel] : 'Defina como a produção será controlada antes de operar o PCP.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={atualizar} disabled={loading || loadingDashboard || loadingSetores || loadingCapacidade}>
            <IconRefresh className={`mr-2 h-4 w-4 ${loading || loadingSetores || loadingCapacidade ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button asChild size="sm" variant={nivel ? 'outline' : 'default'}>
            <Link href="/pcp/configuracao">
              <IconSettings className="mr-2 h-4 w-4" />
              Configuração
            </Link>
          </Button>
        </div>
      </header>

      {!loadingDashboard && !nivel && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <IconAlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
              <div>
                <h2 className="text-sm font-semibold text-amber-950">Defina o nível do PCP</h2>
                <p className="mt-1 text-sm text-amber-900">
                  Escolha Essencial, Organizado ou Completo para ajustar a home, o Kanban e os próximos passos da produção.
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href="/pcp/configuracao">
                Escolher nível
                <IconArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <section
        className={cn(
          'grid gap-3',
          nivel === 'COMPLETO' ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4',
        )}
      >
        {nivel === 'COMPLETO' ? (
          <>
            <Indicador
              label="Aguardando produção"
              valor={aguardandoProducaoCount}
              detalhe={
                osAguardandoWorkflow > 0
                  ? `${osAguardandoWorkflow} sem workflow`
                  : 'Na fila de entrada'
              }
            />
            <Indicador
              label="Nos setores agora"
              valor={itensNosSetores}
              detalhe="OS distribuídas por setor"
            />
            <Indicador
              label="Atrasadas"
              valor={statsExibir.atrasadas}
              detalhe="Prazo vencido"
              destaque={statsExibir.atrasadas > 0}
            />
          </>
        ) : (
          <>
            <Indicador
              label="Na fila"
              valor={statsExibir.fila}
              detalhe={
                osAguardandoWorkflow > 0
                  ? `${osAguardandoWorkflow} aguardando workflow`
                  : 'Aguardando produção'
              }
            />
            <Indicador
              label="Em produção"
              valor={statsExibir.producao}
              detalhe="Em andamento"
            />
            <Indicador
              label="Atrasadas"
              valor={statsExibir.atrasadas}
              detalhe="Precisam de ação"
              destaque={statsExibir.atrasadas > 0}
            />
            <Indicador
              label="Prontas"
              valor={statsExibir.concluida}
              detalhe="Concluídas no PCP"
            />
          </>
        )}
      </section>

      <section
        className={cn(
          'grid gap-6',
          nivel === 'COMPLETO'
            ? 'xl:grid-cols-[minmax(0,1fr)_260px]'
            : 'xl:grid-cols-[minmax(0,1fr)_340px]',
        )}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {nivel === 'COMPLETO'
                  ? 'Onde estão as OS'
                  : 'Quadro de produção'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {nivel === 'COMPLETO'
                  ? `Aguardando produção e posição em cada setor · atualizado ${lastRefresh.toLocaleTimeString('pt-BR')}`
                  : `Última atualização: ${lastRefresh.toLocaleTimeString('pt-BR')}`}
              </p>
              {nivel !== 'COMPLETO' && osAguardandoWorkflow > 0 && (
                <p className="mt-1 text-sm text-amber-800">
                  {osAguardandoWorkflow}{' '}
                  {osAguardandoWorkflow === 1 ? 'OS aguarda' : 'OS aguardam'}{' '}
                  atribuição de workflow — clique no card para configurar.
                </p>
              )}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={nivel === 'COMPLETO' ? '/pcp/meu-setor' : '/pcp/kanban'}>
                {nivel === 'COMPLETO' ? 'Abrir Meu Setor' : 'Abrir Kanban completo'}
              </Link>
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {nivel === 'COMPLETO' ? (
            <div className="space-y-4">
              <FilaEntradaPCP
                cards={cardsFilaEntrada}
                loading={loading}
                onCardClick={handleKanbanCardClick}
              />

              {cardsProducaoSemSetor.length > 0 && (
                <ProducaoSemSetoresPCP
                  cards={cardsProducaoSemSetor}
                  onReatribuirWorkflow={(card) =>
                    abrirAtribuirWorkflow(card.id, card.numero)
                  }
                />
              )}

              <div className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Em produção — por setor</h3>
                    <p className="text-sm text-muted-foreground">
                      Cada coluna é o setor onde a OS está neste momento.
                    </p>
                  </div>
                </div>

              <FiltrosKanbanSetores
                filtros={filtrosSetores}
                onChange={atualizarFiltroSetores}
                onClear={limparFiltrosSetores}
                setoresVisiveis={setoresVisiveis}
                onSetoresVisiveisChange={setSetoresVisiveis}
                onMarcarTodosSetores={() => setSetoresVisiveis([])}
                setores={opcoesSetores}
                operadores={opcoesOperadores}
              />
              <KanbanPorSetores
                data={kanbanSetores}
                loading={loadingSetores}
                error={erroSetores}
                setoresVisiveis={setoresVisiveis}
                onMoverItem={async (instanciaSetorId, setorDestinoId) => {
                  const token = localStorage.getItem('access_token');
                  const response = await fetch(
                    `/api/pcp/kanban/mover-setor/${instanciaSetorId}`,
                    {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ setorDestinoId }),
                    },
                  );

                  const payload = (await response.json().catch(() => ({}))) as {
                    error?: string;
                    message?: string | string[];
                  };

                  if (!response.ok) {
                    const mensagem = Array.isArray(payload.message)
                      ? payload.message.join(' | ')
                      : payload.message || payload.error;
                    throw new Error(mensagem || 'Falha ao mover item de setor');
                  }

                  toast.success(
                    (typeof payload.message === 'string' && payload.message) ||
                      'Item movido com sucesso',
                  );
                  solicitarAtualizacaoBadgesSidebar();
                  await carregarKanbanPorSetores();
                }}
                onCardClick={(osId) => router.push(`/os/${osId}`)}
              />
              </div>
            </div>
          ) : (
            <KanbanBoard
              data={cards}
              loading={loading}
              columns={colunasKanban}
              onStatusChange={handleStatusChange}
              onCardClick={handleKanbanCardClick}
            />
          )}
        </div>

        <aside className="space-y-4">
          {nivel === 'COMPLETO' && (
            <section className="rounded-lg border bg-white p-4">
              <h2 className="text-sm font-semibold">Consultas</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Capacidade, máquinas e análises fora da visão principal.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full justify-start"
                onClick={() => setCargaModalAberto(true)}
              >
                <IconChartBar className="mr-2 h-4 w-4" />
                Carga produtiva
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full justify-start">
                <Link href="/pcp/relatorios">
                  <IconClipboardList className="mr-2 h-4 w-4" />
                  Relatórios
                </Link>
              </Button>
            </section>
          )}

          {nivel !== 'COMPLETO' && (
            <section className="rounded-lg border bg-white p-4">
              <h2 className="text-sm font-semibold">Precisa de atenção</h2>
              <div className="mt-3 space-y-3">
                {cardsAtencao.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma OS crítica no momento.
                  </p>
                ) : (
                  cardsAtencao.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      className="block w-full rounded-md border p-3 text-left transition-colors hover:bg-muted"
                      onClick={() => handleCardAtencaoClick(card)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{card.numero}</p>
                          <p className="text-xs text-muted-foreground">{card.cliente}</p>
                        </div>
                        <Badge variant="outline">{card.prioridade}</Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm">{card.titulo}</p>
                      {cardPrecisaAtribuirWorkflow(card) ? (
                        <p className="mt-1 text-xs font-medium text-amber-800">
                          Aguardando workflow — clique para atribuir
                        </p>
                      ) : (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <IconClock className="h-3.5 w-3.5" />
                          {card.data_prazo || 'Sem prazo definido'}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </section>
          )}

          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-sm font-semibold">Atalhos do modo {nivel ? nivelLabel[nivel] : 'PCP'}</h2>
            <div className="mt-3 grid gap-2">
              {acoesPorNivel.map((acao) => (
                <Button key={acao.href} asChild variant="outline" className="justify-start">
                  <Link href={acao.href}>
                    {acao.icon}
                    <span className="ml-2">{acao.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <WorkflowAssignmentDialog
        open={Boolean(osSelecionadaAtribuir)}
        osId={osSelecionadaAtribuir?.id}
        osNumero={osNumeroAtribuir}
        onClose={fecharDialogAtribuirWorkflow}
        onAssigned={() => void handleWorkflowAtribuido()}
      />

      {nivel === 'COMPLETO' && (
        <Dialog open={cargaModalAberto} onOpenChange={setCargaModalAberto}>
          <DialogContent fullscreen showCloseButton>
            <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
              <DialogTitle>Carga produtiva</DialogTitle>
              <DialogDescription>
                Horas programadas por setor e ocupação por máquina — consulta
                gerencial, separada da posição das OS.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <CargaProdutivaSetores
                data={capacidadeSetores}
                loading={loadingCapacidade}
                error={erroCapacidade}
              />
              <OcupacaoMaquinas
                data={capacidadeMaquinas}
                loading={loadingCapacidade}
                error={erroCapacidade}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function FiltrosKanbanSetores({
  filtros,
  onChange,
  onClear,
  setoresVisiveis,
  onSetoresVisiveisChange,
  onMarcarTodosSetores,
  setores,
  operadores,
}: {
  filtros: FiltrosSetores;
  onChange: <K extends keyof FiltrosSetores>(
    campo: K,
    valor: FiltrosSetores[K],
  ) => void;
  onClear: () => void;
  setoresVisiveis: string[];
  onSetoresVisiveisChange: (setores: string[]) => void;
  onMarcarTodosSetores: () => void;
  setores: Array<{ id: string; nome: string }>;
  operadores: Array<{ id: string; nome: string }>;
}) {
  const todosAtivos = setoresVisiveis.length === 0;
  const [buscaSetor, setBuscaSetor] = useState('');

  function alternarSetor(setorId: string) {
    onSetoresVisiveisChange(
      alternarSetoresVisiveis(setoresVisiveis, setorId),
    );
  }

  const setoresFiltrados = setores.filter((setor) =>
    setor.nome.toLowerCase().includes(buscaSetor.toLowerCase()),
  );

  const resumoSelecao = resumoSelecaoSetores(setoresVisiveis, setores.length);

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 justify-between px-3 text-sm font-normal"
            >
              <span>
                Colunas visiveis ({resumoSelecao})
              </span>
              <IconChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel>Selecione os setores</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 pb-2">
              <input
                type="text"
                value={buscaSetor}
                onChange={(e) => setBuscaSetor(e.target.value)}
                placeholder="Buscar setor..."
                className="h-8 w-full rounded-md border px-2 text-sm"
              />
            </div>
            <DropdownMenuCheckboxItem
              checked={setoresVisiveis.length === 0}
              onCheckedChange={() => onMarcarTodosSetores()}
            >
              Todas as colunas
            </DropdownMenuCheckboxItem>
            {setoresFiltrados.map((setor) => (
              <DropdownMenuCheckboxItem
                key={setor.id}
                checked={setoresVisiveis.includes(setor.id)}
                onCheckedChange={() => alternarSetor(setor.id)}
              >
                {setor.nome}
              </DropdownMenuCheckboxItem>
            ))}
            {setoresFiltrados.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Nenhum setor encontrado.
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <select
          value={filtros.operadorId}
          onChange={(e) => onChange('operadorId', e.target.value)}
          className="h-9 rounded-md border px-2 text-sm"
        >
          <option value="">Todos os operadores</option>
          {operadores.map((operador) => (
            <option key={operador.id} value={operador.id}>
              {operador.nome}
            </option>
          ))}
        </select>

        <select
          value={filtros.prioridade}
          onChange={(e) => onChange('prioridade', e.target.value)}
          className="h-9 rounded-md border px-2 text-sm"
        >
          <option value="">Todas as prioridades</option>
          <option value="URGENTE">Urgente</option>
          <option value="CRITICA">Critica</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Media</option>
          <option value="NORMAL">Normal</option>
          <option value="BAIXA">Baixa</option>
        </select>

        <select
          value={filtros.prazoBucket}
          onChange={(e) =>
            onChange('prazoBucket', e.target.value as FiltrosSetores['prazoBucket'])
          }
          className="h-9 rounded-md border px-2 text-sm"
        >
          <option value="">Prazo (todos)</option>
          <option value="atrasados">Atrasados</option>
          <option value="vence_hoje">Vence hoje</option>
          <option value="esta_semana">Esta semana</option>
          <option value="sem_prazo">Sem prazo</option>
        </select>

        <input
          type="date"
          value={filtros.dataInicial}
          onChange={(e) => onChange('dataInicial', e.target.value)}
          className="h-9 rounded-md border px-2 text-sm"
        />

        <input
          type="date"
          value={filtros.dataFinal}
          onChange={(e) => onChange('dataFinal', e.target.value)}
          className="h-9 rounded-md border px-2 text-sm"
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Button type="button" size="sm" variant="outline" onClick={onClear}>
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}

function ProducaoSemSetoresPCP({
  cards,
  onReatribuirWorkflow,
}: {
  cards: OSCard[];
  onReatribuirWorkflow: (card: OSCard) => void;
}) {
  return (
    <section className="rounded-lg border border-orange-200 bg-orange-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-orange-950">
            Em produção sem setores
          </h3>
          <p className="mt-1 text-xs text-orange-900">
            Estas OS já têm workflow, mas o template não possui setores produtivos
          vinculados. Reatribua o workflow com a opção <strong>Forçar</strong> para
          sincronizar os setores da loja e liberar a fila nos setores.
          </p>
        </div>
        <Badge variant="secondary">{cards.length}</Badge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className="rounded-md border border-orange-200 bg-white p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{card.numero}</p>
                <p className="text-xs text-muted-foreground">{card.cliente}</p>
              </div>
              <Badge variant="outline">{card.prioridade}</Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm">{card.titulo}</p>
            {card.workflow_nome && (
              <div className="mt-2">
                <WorkflowCardInfo
                  compact
                  workflowId={card.workflow_id}
                  workflowNome={card.workflow_nome}
                  setoresNomes={card.workflow_setores_nomes}
                />
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline" className="h-8">
                <Link href="/pcp/workflows">Abrir workflows</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8"
                onClick={() => onReatribuirWorkflow(card)}
              >
                Reatribuir workflow
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FilaEntradaPCP({
  cards,
  loading,
  onCardClick,
}: {
  cards: OSCard[];
  loading: boolean;
  onCardClick: (card: OSCard) => void;
}) {
  if (loading && cards.length === 0) {
    return (
      <section className="rounded-lg border bg-white p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconRefresh className="h-4 w-4 animate-spin" />
          Carregando fila de entrada...
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Aguardando para produzir</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            OS na fila do PCP — atribua workflow se necessário; depois entram nos
            setores abaixo.
          </p>
        </div>
        <Badge variant="secondary">{cards.length}</Badge>
      </div>

      {cards.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nenhuma OS aguardando na fila de entrada.
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const aguardandoWorkflow = cardPrecisaAtribuirWorkflow(card);

            return (
              <button
                key={card.id}
                type="button"
                className={`rounded-md border p-3 text-left transition-colors hover:bg-muted ${
                  aguardandoWorkflow
                    ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-50'
                    : ''
                }`}
                onClick={() => onCardClick(card)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{card.numero}</p>
                    <p className="text-xs text-muted-foreground">{card.cliente}</p>
                  </div>
                  <Badge variant="outline">{card.prioridade}</Badge>
                </div>

                <p className="mt-2 line-clamp-2 text-sm">{card.titulo}</p>

                {card.workflow_nome && (
                  <div className="mt-2" onClick={(event) => event.stopPropagation()}>
                    <WorkflowCardInfo
                      compact
                      workflowId={card.workflow_id}
                      workflowNome={card.workflow_nome}
                      setoresNomes={card.workflow_setores_nomes}
                    />
                  </div>
                )}

                {aguardandoWorkflow ? (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-900">
                    <IconAlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    Aguardando workflow — clique para atribuir
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Workflow atribuído — aguardando início nos setores
                  </p>
                )}

                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <IconClock className="h-3.5 w-3.5" />
                  {card.data_prazo || 'Sem prazo definido'}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CargaProdutivaSetores({
  data,
  loading,
  error,
}: {
  data: CapacidadeSetoresResponse | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading && !data) {
    return (
      <section className="rounded-lg border bg-white p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconRefresh className="h-4 w-4 animate-spin" />
          Carregando carga produtiva
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </section>
    );
  }

  const setores = data?.setores ?? [];

  if (setores.length === 0) {
    return (
      <section className="rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold">Carga produtiva por setor</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Nenhum setor ativo encontrado para calcular capacidade.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Carga produtiva por setor</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Horas previstas comparadas com a capacidade diaria configurada.
          </p>
        </div>
        {data?.gerado_em && (
          <span className="text-xs text-muted-foreground">
            {new Date(data.gerado_em).toLocaleTimeString('pt-BR')}
          </span>
        )}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {setores.map((setor) => {
          const ocupacao = Math.min(Math.max(setor.ocupacao_percent, 0), 100);

          return (
            <div key={setor.setor_id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: setor.cor || '#71717a' }}
                  />
                  <span className="truncate text-sm font-medium">{setor.nome}</span>
                </div>
                <Badge
                  variant="outline"
                  className={statusCargaClassName(setor.status_carga)}
                >
                  {statusCargaLabel(setor.status_carga)}
                </Badge>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full',
                    statusCargaBarClassName(setor.status_carga),
                  )}
                  style={{ width: `${ocupacao}%` }}
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <ResumoCarga label="Carga" valor={`${setor.horas_programadas}h`} />
                <ResumoCarga label="Disp." valor={`${setor.horas_disponiveis}h`} />
                <ResumoCarga label="Ocup." valor={`${setor.ocupacao_percent}%`} />
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Livre: {setor.horas_livres}h | Itens: {setor.itens_programados.length}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ResumoCarga({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-md bg-muted px-2 py-1.5">
      <p className="font-semibold tabular-nums">{valor}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function OcupacaoMaquinas({
  data,
  loading,
  error,
}: {
  data: CapacidadeMaquinasResponse | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading && !data) {
    return null;
  }

  if (error || !data) {
    return null;
  }

  const maquinasComCarga = [...data.maquinas]
    .sort((a, b) => (b.ocupacao_percent ?? 0) - (a.ocupacao_percent ?? 0))
    .slice(0, 6);
  const semMaquina = data.sem_maquina_definida;

  if (maquinasComCarga.length === 0 && !semMaquina?.itens_programados.length) {
    return null;
  }

  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Ocupacao por maquina</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Maquinas ordenadas por maior ocupacao programada.
          </p>
        </div>
        {semMaquina && semMaquina.itens_programados.length > 0 && (
          <Badge variant="outline" className="border-amber-200 text-amber-700">
            {semMaquina.itens_programados.length} sem maquina
          </Badge>
        )}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {maquinasComCarga.map((maquina) => {
          const status = maquina.status_carga ?? 'normal';
          const ocupacao = Math.min(
            Math.max(Number(maquina.ocupacao_percent ?? 0), 0),
            100,
          );

          return (
            <div key={maquina.maquina_id ?? maquina.nome} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{maquina.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {maquina.setor?.nome ?? 'Sem setor'}
                  </p>
                </div>
                <Badge variant="outline" className={statusCargaClassName(status)}>
                  {statusCargaLabel(status)}
                </Badge>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', statusCargaBarClassName(status))}
                  style={{ width: `${ocupacao}%` }}
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <ResumoCarga label="Prog." valor={`${maquina.horas_programadas}h`} />
                <ResumoCarga label="Disp." valor={`${maquina.horas_disponiveis ?? 0}h`} />
                <ResumoCarga label="Ocup." valor={`${maquina.ocupacao_percent ?? 0}%`} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function KanbanPorSetores({
  data,
  loading,
  error,
  setoresVisiveis,
  onMoverItem,
  onCardClick,
}: {
  data: KanbanPorSetoresResponse | null;
  loading: boolean;
  error: string | null;
  setoresVisiveis: string[];
  onMoverItem: (instanciaSetorId: string, setorDestinoId: string) => Promise<void>;
  onCardClick: (osId: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid min-h-[360px] place-items-center rounded-lg border bg-white">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconRefresh className="h-4 w-4 animate-spin" />
          Carregando setores produtivos
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data || data.colunas.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-sm font-semibold">Nenhum setor produtivo cadastrado</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          O modo Completo usa setores para mostrar onde cada item está rodando.
        </p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/centros-de-trabalho/setores-produtivos">Cadastrar setores</Link>
        </Button>
      </div>
    );
  }

  const colunasFiltradas =
    setoresVisiveis.length === 0
      ? data.colunas
      : data.colunas.filter((coluna) => setoresVisiveis.includes(coluna.setor_id));

  if (colunasFiltradas.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-sm font-semibold">Nenhuma coluna selecionada</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Marque pelo menos um setor no filtro "Colunas visiveis" para exibir o Kanban.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-2">
      <div className={gridColunasSetoresClass(colunasFiltradas.length)}>
        {colunasFiltradas.map((coluna) => (
          <section key={coluna.id} className="rounded-lg border bg-white">
            <div className="border-b p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: coluna.cor || '#71717a' }}
                  />
                  <h3 className="truncate text-sm font-semibold">{coluna.titulo}</h3>
                </div>
                <Badge variant="secondary">{coluna.total}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                <ResumoSetor label="Fila" valor={coluna.pendentes} />
                <ResumoSetor label="Rodando" valor={coluna.em_andamento} />
                <ResumoSetor label="Pausado" valor={coluna.pausadas} />
                <ResumoSetor label="Atrasado" valor={coluna.atrasadas} />
              </div>
            </div>

            <div className="max-h-[620px] space-y-3 overflow-y-auto p-3">
              {coluna.cards.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Sem itens neste setor
                </div>
              ) : (
                coluna.cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className="block w-full rounded-md border p-3 text-left transition-colors hover:bg-muted"
                    onClick={() => onCardClick(card.os_id ?? card.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{card.numero}</p>
                        <p className="truncate text-xs text-muted-foreground">{card.cliente}</p>
                      </div>
                      <Badge variant="outline" className={prioridadeClassName(card.prioridade)}>
                        {card.prioridade}
                      </Badge>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm">{card.titulo}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{statusSetorLabel(card.status)}</Badge>
                      {card.operador_atual && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <IconUser className="h-3.5 w-3.5" />
                          {card.operador_atual}
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
                      {(() => {
                        const destinosPermitidos = filtrarDestinosMovimento(
                          card,
                          coluna,
                          data.colunas,
                        );

                        if (destinosPermitidos.length === 0) {
                          return null;
                        }

                        return (
                      <select
                        className="h-8 w-full rounded-md border px-2 text-xs"
                        defaultValue=""
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const select = e.currentTarget;
                          const setorDestinoId = select.value;
                          if (!setorDestinoId) return;
                          select.value = '';
                          void onMoverItem(
                            card.instancia_setor_id ?? card.id,
                            setorDestinoId,
                          ).catch((moveError) => {
                            console.error('Erro ao mover item de setor:', moveError);
                            toast.error(
                              moveError instanceof Error
                                ? moveError.message
                                : 'Nao foi possivel mover o item.',
                            );
                          });
                        }}
                      >
                        <option value="">Mover para setor...</option>
                        {destinosPermitidos.map((destino) => (
                            <option key={`${card.id}-${destino.setor_id}`} value={destino.setor_id}>
                              {destino.titulo}
                            </option>
                          ))}
                      </select>
                        );
                      })()}
                    </div>

                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <IconClock className="h-3.5 w-3.5" />
                      {card.data_prazo || 'Sem prazo definido'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function filtrarDestinosMovimento(
  card: KanbanSetorCard,
  coluna: KanbanSetorColuna,
  colunas: KanbanSetorColuna[],
) {
  if (card.proximos_setores_ids?.length) {
    return colunas.filter((destino) =>
      card.proximos_setores_ids!.includes(destino.setor_id),
    );
  }

  return colunas.filter((destino) => destino.setor_id !== coluna.setor_id);
}

function gridColunasSetoresClass(totalColunas: number): string {
  if (totalColunas <= 1) {
    return 'grid grid-cols-1 gap-4';
  }

  if (totalColunas === 2) {
    return 'grid grid-cols-1 gap-4 lg:grid-cols-2';
  }

  if (totalColunas === 3) {
    return 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3';
  }

  if (totalColunas === 4) {
    return 'grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4';
  }

  return 'grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';
}

function ResumoSetor({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-md bg-muted px-2 py-1.5">
      <p className="font-semibold">{valor}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function statusSetorLabel(status: string) {
  const labels: Record<string, string> = {
    PENDENTE: 'Na fila',
    EM_ANDAMENTO: 'Em andamento',
    PAUSADA: 'Pausado',
  };

  return labels[status] ?? status;
}

function prioridadeClassName(prioridade: KanbanSetorCard['prioridade']) {
  const classes: Record<KanbanSetorCard['prioridade'], string> = {
    URGENTE: 'border-fuchsia-200 text-fuchsia-700',
    BAIXA: 'border-zinc-200 text-zinc-700',
    MEDIA: 'border-blue-200 text-blue-700',
    NORMAL: 'border-slate-200 text-slate-700',
    ALTA: 'border-amber-200 text-amber-700',
    CRITICA: 'border-red-200 text-red-700',
  };

  return classes[prioridade];
}

function statusCargaLabel(status: CapacidadeSetor['status_carga']) {
  const labels: Record<CapacidadeSetor['status_carga'], string> = {
    normal: 'Normal',
    atencao: 'Atencao',
    cheia: 'Cheia',
    sobrecarregada: 'Sobrecarregada',
  };

  return labels[status];
}

function statusCargaClassName(status: CapacidadeSetor['status_carga']) {
  const classes: Record<CapacidadeSetor['status_carga'], string> = {
    normal: 'border-emerald-200 text-emerald-700',
    atencao: 'border-amber-200 text-amber-700',
    cheia: 'border-orange-200 text-orange-700',
    sobrecarregada: 'border-red-200 text-red-700',
  };

  return classes[status];
}

function statusCargaBarClassName(status: CapacidadeSetor['status_carga']) {
  const classes: Record<CapacidadeSetor['status_carga'], string> = {
    normal: 'bg-emerald-500',
    atencao: 'bg-amber-500',
    cheia: 'bg-orange-500',
    sobrecarregada: 'bg-red-500',
  };

  return classes[status];
}

function Indicador({
  label,
  valor,
  detalhe,
  destaque = false,
}: {
  label: string;
  valor: number;
  detalhe: string;
  destaque?: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${destaque ? 'border-red-200 bg-red-50' : ''}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
    </div>
  );
}
