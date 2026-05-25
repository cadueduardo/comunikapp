'use client';

import Link from 'next/link';
import {
  AlertCircle,
  ArrowUpRight,
  DollarSign,
  Factory,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useKpisDashboard } from '@/hooks/use-home-operacional';
import type { CorKPI, IconeKPI, KPI } from '@/lib/home-operacional-api';

/**
 * Bloco de KPIs do topo do dashboard.
 *
 * 4 cards estatisticos em grid responsivo:
 * - mobile: 2x2
 * - md+: 4x1
 *
 * Cores pastel para nao competir com o resto da UI; o card de "Alertas
 * criticos" muda para vermelho quando ha pendencias criticas.
 */
export function DashboardKPIs() {
  const { resumo, loading, erro } = useKpisDashboard();

  if (loading && !resumo) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px] w-full" />
        ))}
      </div>
    );
  }

  if (erro || !resumo) {
    return (
      <Card className="p-4">
        <p className="text-sm text-red-600">
          Não foi possível carregar os indicadores
          {erro ? `: ${erro}` : '.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {resumo.kpis.map((kpi) => (
        <KPICard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}

// -------------------------------------------------------------------
// Card individual
// -------------------------------------------------------------------

interface TemaCor {
  borda: string;
  fundo: string;
  iconeFundo: string;
  iconeFg: string;
  valorFg: string;
}

const TEMAS: Record<CorKPI, TemaCor> = {
  zinc: {
    borda: 'border-zinc-200',
    fundo: 'bg-white',
    iconeFundo: 'bg-zinc-100',
    iconeFg: 'text-zinc-600',
    valorFg: 'text-zinc-900',
  },
  blue: {
    borda: 'border-blue-200',
    fundo: 'bg-blue-50/50',
    iconeFundo: 'bg-blue-100',
    iconeFg: 'text-blue-600',
    valorFg: 'text-blue-900',
  },
  amber: {
    borda: 'border-amber-200',
    fundo: 'bg-amber-50/50',
    iconeFundo: 'bg-amber-100',
    iconeFg: 'text-amber-700',
    valorFg: 'text-amber-900',
  },
  emerald: {
    borda: 'border-emerald-200',
    fundo: 'bg-emerald-50/50',
    iconeFundo: 'bg-emerald-100',
    iconeFg: 'text-emerald-700',
    valorFg: 'text-emerald-900',
  },
  red: {
    borda: 'border-red-200',
    fundo: 'bg-red-50/60',
    iconeFundo: 'bg-red-100',
    iconeFg: 'text-red-600',
    valorFg: 'text-red-900',
  },
};

const ICONES: Record<IconeKPI, React.ReactNode> = {
  orcamento: <FileText className="h-5 w-5" />,
  dinheiro: <DollarSign className="h-5 w-5" />,
  producao: <Factory className="h-5 w-5" />,
  alerta: <AlertCircle className="h-5 w-5" />,
};

function formatarValor(kpi: KPI): string {
  if (kpi.formato === 'moeda') {
    try {
      return kpi.valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return `R$ ${kpi.valor.toFixed(2)}`;
    }
  }
  return kpi.valor.toLocaleString('pt-BR');
}

function KPICard({ kpi }: { kpi: KPI }) {
  const tema = TEMAS[kpi.cor];
  const icone = ICONES[kpi.icone];

  const conteudo = (
    <div
      className={`rounded-lg border p-4 h-full flex flex-col justify-between transition-shadow ${tema.borda} ${tema.fundo} ${
        kpi.link ? 'hover:shadow-sm cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {kpi.label}
          </p>
          {kpi.hint && (
            <p className="text-[10px] text-muted-foreground/80">{kpi.hint}</p>
          )}
        </div>
        <div
          className={`flex-shrink-0 h-9 w-9 rounded-md flex items-center justify-center ${tema.iconeFundo} ${tema.iconeFg}`}
        >
          {icone}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 mt-2">
        <p
          className={`text-2xl font-bold leading-tight tabular-nums ${tema.valorFg}`}
        >
          {formatarValor(kpi)}
        </p>
        {kpi.link && (
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-0.5 group-hover:text-foreground">
            {kpi.link.label}
            <ArrowUpRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </div>
  );

  if (kpi.link) {
    return (
      <Link
        href={kpi.link.href}
        className="group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        {conteudo}
      </Link>
    );
  }
  return conteudo;
}
