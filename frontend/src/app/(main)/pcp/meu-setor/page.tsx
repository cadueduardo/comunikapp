'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FilaOperador } from '@/components/pcp/FilaOperador';
import { useMeuSetor } from '@/hooks/useMeuSetor';
import { filtrarFilaPorStatus, type FiltroStatusFila } from '@/lib/pcp/pcp.utils';
import {
  IconBuilding,
  IconRefresh,
  IconAlertTriangle,
  IconArrowLeft,
} from '@tabler/icons-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

function StatPill({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'warn' | 'muted';
}) {
  return (
    <div className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span
        className={cn(
          'text-base font-semibold tabular-nums leading-none',
          tone === 'warn' && 'text-orange-600',
          tone === 'muted' && 'text-muted-foreground',
          tone === 'default' && 'text-foreground',
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function MeuSetorPage() {
  const router = useRouter();
  const [pcpNivel, setPcpNivel] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusFila>('TODOS');

  const {
    setor,
    fila,
    loading,
    error,
    lastRefresh,
    setoresDisponiveis,
    setoresParaMovimento,
    isAdministrador,
    setorSelecionadoId,
    selecionarSetor,
    refreshData,
    iniciarProducao,
    concluirEtapa,
    pausarProducao,
    moverItemSetor,
    filtrarSomenteMinhaFila,
    setFiltrarSomenteMinhaFila,
  } = useMeuSetor();

  useEffect(() => {
    const carregarNivelPcp = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch('/api/pcp/configuracao', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) return;

        const data = (await response.json()) as { pcp_nivel?: string };
        setPcpNivel(data.pcp_nivel ?? null);
      } catch {
        // opcional
      }
    };

    carregarNivelPcp();
  }, []);

  const filaFiltrada = useMemo(
    () => filtrarFilaPorStatus(fila, filtroStatus),
    [fila, filtroStatus],
  );

  const setoresDestino = useMemo(
    () =>
      setoresParaMovimento.map((setorOption) => ({
        id: setorOption.id,
        nome: setorOption.nome,
      })),
    [setoresParaMovimento],
  );

  const titulo = isAdministrador ? 'Supervisão de Setores' : 'Meu Setor';

  const setorSelect =
    (isAdministrador && setoresDisponiveis.length > 0) ||
    (!isAdministrador && setoresDisponiveis.length > 1) ? (
      <Select
        value={setorSelecionadoId ?? undefined}
        onValueChange={(value) => selecionarSetor(value)}
      >
        <SelectTrigger className="h-8 w-[min(180px,40vw)] text-xs">
          <SelectValue placeholder="Setor" />
        </SelectTrigger>
        <SelectContent>
          {setoresDisponiveis.map((setorOption) => (
            <SelectItem key={setorOption.id} value={setorOption.id}>
              {setorOption.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : null;

  const itensPendentes = fila.filter((item) => item.status === 'PENDENTE').length;
  const itensEmAndamento = fila.filter(
    (item) => item.status === 'EM_ANDAMENTO',
  ).length;
  const itensPausados = fila.filter((item) => item.status === 'PAUSADA').length;
  const itensAtrasados = fila.filter((item) => {
    if (!item.data_prazo) return false;
    return new Date(item.data_prazo) < new Date() && item.status !== 'CONCLUIDA';
  }).length;

  const chipsStatus: { id: FiltroStatusFila; label: string; count: number }[] = [
    { id: 'TODOS', label: 'Todos', count: fila.length },
    { id: 'PENDENTE', label: 'Pendentes', count: itensPendentes },
    { id: 'EM_ANDAMENTO', label: 'Rodando', count: itensEmAndamento },
    { id: 'PAUSADA', label: 'Pausados', count: itensPausados },
  ];

  if (loading && !setor) {
    return (
      <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
        <div className="h-10 animate-pulse rounded-md bg-muted" />
        <div className="h-12 animate-pulse rounded-md bg-muted" />
        <div className="flex-1 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if ((error && !setor) || !setor) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8 text-center">
        <IconBuilding className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{titulo}</h1>
        <p className="text-sm text-muted-foreground">
          {error ||
            (isAdministrador
              ? 'Nenhum setor cadastrado ou selecionado.'
              : 'Nenhum setor atribuído ao seu usuário.')}
        </p>
        <div className="flex justify-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/pcp">
              <IconArrowLeft className="mr-1 h-4 w-4" />
              Voltar ao PCP
            </Link>
          </Button>
          {error && (
            <Button size="sm" variant="outline" onClick={() => refreshData()}>
              <IconRefresh className="mr-1 h-4 w-4" />
              Tentar de novo
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[480px] flex-col gap-2">
      {/* Cabeçalho compacto */}
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-lg font-semibold">{titulo}</h1>
          {pcpNivel && (
            <Badge variant="outline" className="h-5 shrink-0 text-[10px] font-normal">
              {pcpNivel}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <Link href="/pcp">
              <IconArrowLeft className="mr-1 h-3.5 w-3.5" />
              PCP
            </Link>
          </Button>
          {setorSelect}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => refreshData()}
            disabled={loading}
          >
            <IconRefresh
              className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
            />
          </Button>
        </div>
      </header>

      {/* Barra de contexto: setor + métricas + opções */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: setor.cor || '#71717a' }}
          />
          <span className="truncate font-medium">{setor.nome}</span>
          {setor.descricao && (
            <span className="hidden truncate text-xs text-muted-foreground lg:inline">
              — {setor.descricao}
            </span>
          )}
        </div>

        <div className="hidden h-4 w-px bg-border sm:block" />

        <div className="flex flex-wrap items-center gap-3">
          <StatPill label="fila" value={fila.length} />
          <StatPill label="pend." value={itensPendentes} tone="muted" />
          <StatPill label="rodando" value={itensEmAndamento} />
          <StatPill label="atras." value={itensAtrasados} tone="warn" />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {isAdministrador && (
            <div className="flex items-center gap-1.5">
              <Switch
                id="filtrar-minha-fila"
                className="scale-90"
                checked={filtrarSomenteMinhaFila}
                onCheckedChange={setFiltrarSomenteMinhaFila}
              />
              <Label
                htmlFor="filtrar-minha-fila"
                className="cursor-pointer text-xs text-muted-foreground"
              >
                Só minha fila
              </Label>
            </div>
          )}
          <span className="text-[11px] text-muted-foreground">
            {lastRefresh.toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Alertas inline (sem card grande) */}
      {(itensAtrasados > 0 || itensPausados > 0) && (
        <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-orange-800">
          <IconAlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {itensAtrasados > 0 && (
            <span>
              <strong>{itensAtrasados}</strong> atrasado(s)
            </span>
          )}
          {itensAtrasados > 0 && itensPausados > 0 && <span>·</span>}
          {itensPausados > 0 && (
            <span>
              <strong>{itensPausados}</strong> pausado(s)
            </span>
          )}
        </div>
      )}

      {pcpNivel && pcpNivel !== 'COMPLETO' && (
        <p className="text-xs text-muted-foreground">
          Modo Completo habilita movimentação entre setores na fila.
        </p>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Fila — ocupa o restante da tela */}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Fila de produção</span>
            <Badge variant="secondary" className="h-5 text-[10px]">
              {filaFiltrada.length}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1">
            {chipsStatus.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFiltroStatus(chip.id)}
                className={cn(
                  'rounded-md px-2 py-1 text-xs transition-colors',
                  filtroStatus === chip.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {chip.label} ({chip.count})
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <FilaOperador
            fila={filaFiltrada}
            loading={loading}
            setorAtualId={setor.id}
            setoresDestino={pcpNivel === 'COMPLETO' ? setoresDestino : []}
            onIniciarProducao={iniciarProducao}
            onConcluirEtapa={concluirEtapa}
            onPausarProducao={pausarProducao}
            onMoverItem={pcpNivel === 'COMPLETO' ? moverItemSetor : undefined}
            onAbrirOs={(osId) => router.push(`/os/${osId}`)}
          />
        </div>
      </section>
    </div>
  );
}
