'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KanbanBoard } from '@/components/ui/kanban-board';
import type { KanbanColumn } from '@/components/ui/kanban-board';
import { useKanbanData } from '@/hooks/useKanbanData';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBuildingFactory,
  IconCheck,
  IconClipboardList,
  IconClock,
  IconRefresh,
  IconSettings,
  IconUser,
} from '@tabler/icons-react';

type NivelPCP = 'ESSENCIAL' | 'ORGANIZADO' | 'COMPLETO';

interface ConfiguracaoPCP {
  nivel: NivelPCP | null;
  definido: boolean;
}

interface KanbanSetorCard {
  id: string;
  os_id?: string;
  numero: string;
  titulo: string;
  cliente: string;
  status: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
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
  cards: KanbanSetorCard[];
}

interface KanbanPorSetoresResponse {
  colunas: KanbanSetorColuna[];
  total: number;
  gerado_em: string;
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
  const [configuracao, setConfiguracao] = useState<ConfiguracaoPCP | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [kanbanSetores, setKanbanSetores] = useState<KanbanPorSetoresResponse | null>(null);
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

  const carregarConfiguracao = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/pcp/configuracao', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar configuração do PCP');
      }

      const data = (await response.json()) as ConfiguracaoPCP;
      setConfiguracao(data);
    } catch (configError) {
      console.error('Erro ao carregar configuração do PCP:', configError);
      toast.error('Não foi possível carregar a configuração do PCP.');
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const carregarKanbanPorSetores = useCallback(async () => {
    setLoadingSetores(true);
    setErroSetores(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/pcp/kanban/por-setores', {
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
  }, []);

  useEffect(() => {
    void carregarConfiguracao();
  }, [carregarConfiguracao]);

  const nivel = configuracao?.nivel ?? null;

  useEffect(() => {
    if (nivel === 'COMPLETO') {
      void carregarKanbanPorSetores();
      return;
    }

    setKanbanSetores(null);
    setErroSetores(null);
  }, [carregarKanbanPorSetores, nivel]);

  const cardsAtencao = useMemo(() => {
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
  }, [cards]);

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
      carregarConfiguracao(),
      nivel === 'COMPLETO' ? carregarKanbanPorSetores() : Promise.resolve(),
    ]);
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
          <Button variant="outline" size="sm" onClick={atualizar} disabled={loading || loadingConfig || loadingSetores}>
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

      {!loadingConfig && !nivel && (
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
        <Indicador label="Na fila" valor={stats.fila} detalhe="Aguardando produção" />
        <Indicador label="Em produção" valor={stats.producao} detalhe="Em andamento" />
        <Indicador label="Atrasadas" valor={stats.atrasadas} detalhe="Precisam de ação" destaque={stats.atrasadas > 0} />
        <Indicador label="Prontas" valor={stats.concluida} detalhe="Concluídas no PCP" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {nivel === 'COMPLETO' ? 'Produção por setores' : 'Quadro de produção'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
              </p>
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
            <KanbanPorSetores
              data={kanbanSetores}
              loading={loadingSetores}
              error={erroSetores}
              onCardClick={(osId) => router.push(`/os/${osId}`)}
            />
          ) : (
            <KanbanBoard
              data={cards}
              loading={loading}
              columns={colunasKanban}
              onStatusChange={handleStatusChange}
              onCardClick={(osId) => router.push(`/os/${osId}`)}
            />
          )}
        </div>

        <aside className="space-y-4">
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
                    onClick={() => router.push(`/os/${card.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{card.numero}</p>
                        <p className="text-xs text-muted-foreground">{card.cliente}</p>
                      </div>
                      <Badge variant="outline">{card.prioridade}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm">{card.titulo}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <IconClock className="h-3.5 w-3.5" />
                      {card.data_prazo || 'Sem prazo definido'}
                    </p>
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
    </div>
  );
}

function KanbanPorSetores({
  data,
  loading,
  error,
  onCardClick,
}: {
  data: KanbanPorSetoresResponse | null;
  loading: boolean;
  error: string | null;
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

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[920px] auto-cols-[minmax(280px,1fr)] grid-flow-col gap-4">
        {data.colunas.map((coluna) => (
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
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <ResumoSetor label="Fila" valor={coluna.pendentes} />
                <ResumoSetor label="Rodando" valor={coluna.em_andamento} />
                <ResumoSetor label="Pausado" valor={coluna.pausadas} />
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
    BAIXA: 'border-zinc-200 text-zinc-700',
    MEDIA: 'border-blue-200 text-blue-700',
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
