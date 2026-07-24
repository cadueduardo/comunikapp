'use client';

import { useCallback, useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Scale,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { ApiClient } from '@/lib/api-client';
import { financeiroModuleNav } from '@/lib/module-nav';
import { formatarMoeda } from '@/lib/financeiro/financeiro-format';

export interface FinanceiroDashboardKpis {
  periodo: { inicio: string; fim: string; rotulo: string };
  a_receber_saldo: number;
  a_pagar_saldo: number;
  vencido_receber: number;
  vencido_pagar: number;
  recebido_periodo: number;
  pago_periodo: number;
  saldo_liquido_periodo: number;
  pendencias_criticas: number;
  contagens: {
    cobrancas_abertas: number;
    cobrancas_vencidas: number;
    contas_abertas: number;
    contas_vencidas: number;
  };
}

export default function FinanceiroHomePage() {
  const [kpis, setKpis] = useState<FinanceiroDashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const data = await ApiClient.get<FinanceiroDashboardKpis>(
        '/financeiro/dashboard',
        token,
      );
      setKpis(data);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao carregar panorama financeiro.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const handleRefresh = () => {
    setRefreshing(true);
    void carregar();
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={financeiroModuleNav}
        title="Visão geral"
        subtitle="Panorama de caixa, obrigações e atalhos para cada recurso da área."
        icon={<Wallet className="h-7 w-7 sm:h-8 sm:w-8" />}
        actions={
          <Button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            variant="outline"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
        }
      />

      {/* KPIs — linha 1: saldos e vencidos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="A receber"
          value={loading ? '…' : formatarMoeda(kpis?.a_receber_saldo ?? 0)}
          hint={
            kpis
              ? `${kpis.contagens.cobrancas_abertas} cobrança(s) em aberto`
              : 'Saldo em aberto de clientes'
          }
          icon={ArrowDownLeft}
        />
        <KpiCard
          title="A pagar"
          value={loading ? '…' : formatarMoeda(kpis?.a_pagar_saldo ?? 0)}
          hint={
            kpis
              ? `${kpis.contagens.contas_abertas} conta(s) em aberto`
              : 'Saldo em aberto com fornecedores'
          }
          icon={ArrowUpRight}
        />
        <KpiCard
          title="Vencido a receber"
          value={loading ? '…' : formatarMoeda(kpis?.vencido_receber ?? 0)}
          hint={
            kpis
              ? `${kpis.contagens.cobrancas_vencidas} cobrança(s) vencida(s)`
              : 'Inadimplência'
          }
          icon={AlertTriangle}
          tone="warning"
        />
        <KpiCard
          title="Vencido a pagar"
          value={loading ? '…' : formatarMoeda(kpis?.vencido_pagar ?? 0)}
          hint={
            kpis
              ? `${kpis.contagens.contas_vencidas} parcela(s) vencida(s)`
              : 'Obrigações atrasadas'
          }
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      {/* KPIs — linha 2: movimento do mês */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Movimento — {kpis?.periodo.rotulo ?? 'mês atual'}
            </CardTitle>
            <CardDescription>Entradas e saídas confirmadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Recebido</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {loading ? '…' : formatarMoeda(kpis?.recebido_periodo ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pago</p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {loading ? '…' : formatarMoeda(kpis?.pago_periodo ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo líquido do período
            </CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (kpis?.saldo_liquido_periodo ?? 0) >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {loading
                ? '…'
                : formatarMoeda(kpis?.saldo_liquido_periodo ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Recebido − pago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendências críticas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {loading ? '…' : (kpis?.pendencias_criticas ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cobranças + parcelas vencidas
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/financeiro/recebimentos?status=VENCIDO">
                  Ver a receber
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/financeiro/contas-pagar?status=VENCIDA">
                  Ver a pagar
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recursos */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recursos</h2>
        <ModuleHubCards
          nav={financeiroModuleNav}
          gridClassName="lg:grid-cols-4"
        />
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Wallet className="h-3.5 w-3.5" />
        Novos recursos financeiros entram nesta home como cards de navegação.
      </p>
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  tone?: 'warning';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon
          className={`h-4 w-4 ${
            tone === 'warning'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-muted-foreground'
          }`}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
