'use client';

import {
  Activity,
  Building2,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/lib/gestao/admin-api';
import {
  formatAdminDate,
  STORE_STATUS_LABELS,
} from '@/lib/gestao/admin-labels';
import { AdminDashboardSummary, StoreStatus } from '@/lib/gestao/admin-types';

const PERIOD_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
] as const;

function MetricCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: string | number;
  description?: string;
  href?: string;
}) {
  const content = (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      )}
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block transition-opacity hover:opacity-90">
      {content}
    </Link>
  );
}

export function AdminDashboard() {
  const [days, setDays] = useState('30');
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(
        await adminApi.getDashboardSummary<AdminDashboardSummary>(
          Number(days),
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar o dashboard.',
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxNewStores = Math.max(
    1,
    ...(summary?.series.newStoresByDay.map((point) => point.count) || [0]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão geral"
        subtitle="Contagens operacionais a partir das entidades existentes."
        icon={<ShieldCheck className="h-7 w-7" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[180px]" aria-label="Período">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => void load()}>
              Atualizar
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !summary ? (
        <Card>
          <CardContent className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : summary ? (
        <>
          <p className="text-sm text-muted-foreground">
            Período de {formatAdminDate(summary.period.from)} até{' '}
            {formatAdminDate(summary.period.to)} ({summary.timezone}).
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Lojas totais"
              value={summary.stores.total}
              description="Todas as lojas cadastradas"
              href="/gestao/lojas"
            />
            <MetricCard
              title="Lojas ativas"
              value={summary.stores.byStatus.ATIVO}
              description="status = ATIVO"
              href="/gestao/lojas?status=ATIVO"
            />
            <MetricCard
              title="Novas no período"
              value={summary.stores.newInPeriod}
              description={`Últimos ${summary.period.days} dias`}
            />
            <MetricCard
              title="Usuários ativos"
              value={summary.users.activeTotal}
              description={summary.definitions.activeUser}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(
              Object.keys(STORE_STATUS_LABELS) as StoreStatus[]
            ).map((status) => (
              <MetricCard
                key={status}
                title={STORE_STATUS_LABELS[status]}
                value={summary.stores.byStatus[status]}
                href={`/gestao/lojas?status=${status}`}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Trial e assinatura
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Assinatura ativa</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {summary.stores.withSubscription}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trials em andamento</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {summary.stores.trialsInProgress}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trials vencendo em 7 dias</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {summary.stores.trialsExpiringIn7Days}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  Atividade operacional
                </CardTitle>
                <CardDescription>
                  {summary.definitions.activeStoreWindow}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Ativas em 7 dias</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {summary.stores.activeInLast7Days}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativas em 30 dias</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {summary.stores.activeInLast30Days}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sem atividade 7d</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {summary.stores.withoutActivity7Days}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sem atividade 30d</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {summary.stores.withoutActivity30Days}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <MetricCard
              title="Orçamentos no período"
              value={summary.volume.orcamentosInPeriod}
              description={`Lojas com atividade: ${summary.volume.storesWithActivityInPeriod}`}
            />
            <MetricCard
              title="OS no período"
              value={summary.volume.ordensServicoInPeriod}
            />
            <MetricCard
              title="Taxa de ativação"
              value={`${summary.activation.ratePercent}%`}
              description={`${summary.activation.activatedInPeriod} de ${summary.activation.newStoresInPeriod} novas lojas`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Novas lojas por dia
              </CardTitle>
              <CardDescription>
                Série diária no fuso {summary.timezone}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary.series.newStoresByDay.every((point) => point.count === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma loja nova neste período.
                </p>
              ) : (
                <svg
                  className="h-40 w-full text-primary"
                  viewBox={`0 0 ${summary.series.newStoresByDay.length * 10} 100`}
                  role="img"
                  aria-label="Novas lojas por dia no período"
                >
                  {summary.series.newStoresByDay.map((point, index) => {
                    const height = Math.max(
                      point.count > 0 ? 6 : 1,
                      (point.count / maxNewStores) * 100,
                    );
                    return (
                      <rect
                        key={point.date}
                        x={index * 10 + 1}
                        y={100 - height}
                        width={8}
                        height={height}
                        className="fill-current opacity-80"
                      >
                        <title>
                          {point.date}: {point.count}
                        </title>
                      </rect>
                    );
                  })}
                </svg>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Atalhos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/gestao/lojas">Abrir lojas</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/gestao/novidades">Novidades</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
