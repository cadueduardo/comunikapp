'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BriefcaseBusiness,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ModuleHubCards } from '@/components/layout/ModuleHubCards';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVendasNavFiltrado } from '@/hooks/use-vendas-nav-filtrado';
import { getClientSessionToken } from '@/lib/session-auth';

type ItemPrioridade = {
  id: string;
  titulo: string;
  tipo: string;
  prazo: string;
  responsavel_id: string;
  cliente_id: string | null;
};

type VendasHomeData = {
  prioridades: {
    vencidas: ItemPrioridade[];
    hoje: ItemPrioridade[];
    proximas: ItemPrioridade[];
  };
  propostas_aguardando: {
    disponivel: boolean;
    items: Array<{
      id: string;
      numero: number | null;
      nome: string | null;
      status_comercial: string;
      enviado_em: string | null;
    }>;
  };
  kpis: {
    disponivel: boolean;
    enviadas_periodo: number | null;
    aguardando_cliente: number | null;
    aprovadas_periodo: number | null;
  };
  mensagens_nao_lidas: { disponivel: boolean; total: number | null };
  links: {
    atividades: string;
    atendimento: string;
    carteira: string;
  };
};

function formatarData(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
}

function ListaPrioridade({
  titulo,
  items,
  variante,
}: {
  titulo: string;
  items: ItemPrioridade[];
  variante?: 'destructive' | 'outline';
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{titulo}</CardTitle>
          <Badge variant={variante ?? 'secondary'}>{items.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum item.</p>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {a.titulo}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.tipo} · {formatarData(a.prazo)}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/vendas/atividades?id=${a.id}`}>Abrir</Link>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardDescription>Carregando…</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">—</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

/**
 * Acesso já é garantido pelo VendasAccessGate no layout — esta página
 * só carrega o painel e não rebloqueia com “Carregando Vendas…”.
 */
export default function VendasHomePage() {
  const {
    nav: navFiltrado,
    loading: loadingConfig,
    recarregar: recarregarConfig,
  } = useVendasNavFiltrado();

  const [homeData, setHomeData] = useState<VendasHomeData | null>(null);
  const [loadingHome, setLoadingHome] = useState(true);
  const [erroHome, setErroHome] = useState<string | null>(null);

  const carregarHome = useCallback(async () => {
    const token = getClientSessionToken();
    if (!token) {
      setErroHome('Sessão inválida');
      setLoadingHome(false);
      return;
    }
    setLoadingHome(true);
    setErroHome(null);
    try {
      const resp = await fetch('/api/vendas/home', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      if (!resp.ok) {
        setErroHome('Não foi possível carregar o painel.');
        return;
      }
      setHomeData((await resp.json()) as VendasHomeData);
    } catch {
      setErroHome('Não foi possível carregar o painel.');
    } finally {
      setLoadingHome(false);
    }
  }, []);

  useEffect(() => {
    void carregarHome();
  }, [carregarHome]);

  const atualizar = () => {
    void recarregarConfig();
    void carregarHome();
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={navFiltrado}
        title="Visão geral"
        subtitle="O que fazer primeiro: prioridades, propostas e atalhos."
        icon={<BriefcaseBusiness className="h-7 w-7 sm:h-8 sm:w-8" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/vendas/atendimento">
                <UserPlus className="mr-2 h-4 w-4" />
                Novo atendimento
              </Link>
            </Button>
            <Button
              onClick={atualizar}
              disabled={loadingHome}
              variant="outline"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loadingHome ? 'animate-spin' : ''}`}
              />
              Atualizar
            </Button>
          </div>
        }
      />

      {erroHome ? (
        <Card role="alert">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <CardTitle>Painel parcial</CardTitle>
                <CardDescription>{erroHome}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={atualizar}>Tentar de novo</Button>
          </CardContent>
        </Card>
      ) : null}

      {loadingHome && !homeData ? <KpiSkeleton /> : null}

      {homeData ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Enviadas (30 dias)</CardDescription>
                <CardTitle className="text-2xl">
                  {homeData.kpis.disponivel
                    ? (homeData.kpis.enviadas_periodo ?? '—')
                    : 'Indisponível'}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Aguardando cliente</CardDescription>
                <CardTitle className="text-2xl">
                  {homeData.kpis.disponivel
                    ? (homeData.kpis.aguardando_cliente ?? '—')
                    : 'Indisponível'}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Aprovadas (30 dias)</CardDescription>
                <CardTitle className="text-2xl">
                  {homeData.kpis.disponivel
                    ? (homeData.kpis.aprovadas_periodo ?? '—')
                    : 'Indisponível'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ListaPrioridade
              titulo="Vencidas"
              items={homeData.prioridades.vencidas}
              variante="destructive"
            />
            <ListaPrioridade
              titulo="Hoje"
              items={homeData.prioridades.hoje}
            />
            <ListaPrioridade
              titulo="Próximas"
              items={homeData.prioridades.proximas}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={homeData.links.atividades}>
                Ver todas as atividades
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={homeData.links.carteira}>Minha carteira</Link>
            </Button>
            {homeData.mensagens_nao_lidas.disponivel ? (
              <Badge variant="secondary">
                Mensagens não lidas: {homeData.mensagens_nao_lidas.total ?? 0}
              </Badge>
            ) : null}
          </div>

          {homeData.propostas_aguardando.disponivel ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Propostas aguardando ação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {homeData.propostas_aguardando.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma proposta aguardando.
                  </p>
                ) : (
                  homeData.propostas_aguardando.items.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          #{p.numero ?? '—'} {p.nome ?? ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.status_comercial}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/orcamentos-v2/${p.id}`}>Abrir</Link>
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Atalhos do módulo
          {loadingConfig ? (
            <span className="ml-2 text-xs font-normal">(atualizando…)</span>
          ) : null}
        </h2>
        <ModuleHubCards nav={navFiltrado} gridClassName="lg:grid-cols-4" />
      </div>
    </div>
  );
}
