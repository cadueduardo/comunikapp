'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkflowAssignmentDialog } from '@/components/pcp/WorkflowAssignmentDialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  alternarSetoresVisiveis,
  cardPrecisaAtribuirWorkflow,
  montarQueryKanbanPorSetores,
  montarTopGargalos,
  nivelGargaloClassName,
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
  setor_atual?: string;
  operador_atual?: string;
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
    setErroSetores(null);
  }, [carregarKanbanPorSetores, nivel]);

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
    () => cards.filter((card) => card.status === 'FILA'),
    [cards],
  );

  const opcoesSetores = useMemo(() => {
    return (kanbanSetores?.colunas ?? []).map((coluna) => ({
      id: coluna.setor_id,
      nome: coluna.titulo,
    }));
  }, [kanbanSetores]);

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
          <Button variant="outline" size="sm" onClick={atualizar} disabled={loading || loadingDashboard || loadingSetores}>
            <IconRefresh className={`mr-2 h-4 w-4 ${loading || loadingSetores ? 'animate-spin' : ''}`} />
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

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          label="Na fila"
          valor={statsExibir.fila}
          detalhe={
            osAguardandoWorkflow > 0
              ? `${osAguardandoWorkflow} aguardando workflow`
              : 'Aguardando produção'
          }
        />
        <Indicador label="Em produção" valor={statsExibir.producao} detalhe="Em andamento" />
        <Indicador label="Atrasadas" valor={statsExibir.atrasadas} detalhe="Precisam de ação" destaque={statsExibir.atrasadas > 0} />
        <Indicador label="Prontas" valor={statsExibir.concluida} detalhe="Concluídas no PCP" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {nivel === 'COMPLETO'
                  ? 'Visão de produção'
                  : 'Quadro de produção'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
              </p>
              {nivel === 'COMPLETO' && statsExibir.fila > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {statsExibir.fila} OS na fila de entrada
                  {osAguardandoWorkflow > 0
                    ? ` — ${osAguardandoWorkflow} aguardando workflow`
                    : ''}
                  .
                </p>
              )}
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

              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold">Produção por setores</h3>
                  <p className="text-sm text-muted-foreground">
                    Itens já em execução, distribuídos pelos setores produtivos.
                  </p>
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
                onMoverItem={async (itemOsId, setorDestinoId) => {
                  const token = localStorage.getItem('access_token');
                  const response = await fetch(
                    `/api/pcp/kanban/mover-setor/${itemOsId}`,
                    {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ setorDestinoId }),
                    },
                  );

                  const payload = (await response.json()) as {
                    error?: string;
                    message?: string;
                  };

                  if (!response.ok) {
                    throw new Error(payload.error || 'Falha ao mover item de setor');
                  }

                  toast.success(payload.message || 'Item movido com sucesso');
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
          {nivel === 'COMPLETO' && (dashboard?.gargalos?.length ?? 0) > 0 && (
            <section className="rounded-lg border bg-white p-4">
              <h2 className="text-sm font-semibold">Gargalos por setor</h2>
              <div className="mt-3 space-y-2">
                {dashboard!.gargalos.map((gargalo) => (
                  <div
                    key={gargalo.setor_id}
                    className="rounded-md border px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{gargalo.titulo}</span>
                      <Badge
                        variant="outline"
                        className={nivelGargaloClassName(gargalo.nivel_gargalo)}
                      >
                        {gargalo.nivel_gargalo}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      Score {gargalo.score_gargalo} · Fila {gargalo.pendentes} ·
                      Pausado {gargalo.pausadas} · Atrasado {gargalo.atrasadas}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-sm font-semibold">Precisa de atenção</h2>
            <div className="mt-3 space-y-3">
              {cardsAtencao.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma OS crítica no momento.</p>
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
          <h3 className="text-sm font-semibold">Fila de entrada</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            OS liberadas para o PCP. Atribua o workflow aqui antes de distribuir
            nos setores.
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
  onMoverItem: (itemOsId: string, setorDestinoId: string) => Promise<void>;
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

  const gargalos = montarTopGargalos(colunasFiltradas, 3);

  return (
    <div className="space-y-3 pb-2">
      {gargalos.length > 0 && (
        <section className="rounded-lg border bg-white p-3">
          <h3 className="text-sm font-semibold">Gargalos por setor</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {gargalos.map((coluna) => (
              <div key={`gargalo-${coluna.id}`} className="rounded-md border p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{coluna.titulo}</p>
                  <Badge
                    variant="outline"
                    className={nivelGargaloClassName(coluna.nivel_gargalo)}
                  >
                    {coluna.nivel_gargalo}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Score: {coluna.score_gargalo} | Fila: {coluna.pendentes} | Pausado:{' '}
                  {coluna.pausadas} | Atrasado: {coluna.atrasadas}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

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
              <div className="mt-2 flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={nivelGargaloClassName(coluna.nivel_gargalo)}
                >
                  Gargalo {coluna.nivel_gargalo}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Score {coluna.score_gargalo}
                </span>
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
                      <select
                        className="h-8 w-full rounded-md border px-2 text-xs"
                        defaultValue=""
                        onClick={(e) => e.stopPropagation()}
                        onChange={async (e) => {
                          const setorDestinoId = e.target.value;
                          if (!setorDestinoId) return;
                          try {
                            await onMoverItem(card.id, setorDestinoId);
                            e.currentTarget.value = '';
                          } catch (moveError) {
                            console.error('Erro ao mover item de setor:', moveError);
                            toast.error(
                              moveError instanceof Error
                                ? moveError.message
                                : 'Nao foi possivel mover o item.',
                            );
                          }
                        }}
                      >
                        <option value="">Mover para setor...</option>
                        {data.colunas
                          .filter((destino) => destino.setor_id !== coluna.setor_id)
                          .map((destino) => (
                            <option key={`${card.id}-${destino.setor_id}`} value={destino.setor_id}>
                              {destino.titulo}
                            </option>
                          ))}
                      </select>
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
