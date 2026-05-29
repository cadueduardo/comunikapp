'use client';

import { CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlertasOperacionais } from '@/hooks/use-home-operacional';
import { AlertaCard } from './AlertaCard';

/**
 * Bloco "Alertas operacionais" da Home.
 *
 * Suporta duas variantes:
 * - `default` (padrao em mobile/sm/md): bloco em largura completa, sem
 *   altura maxima, todos os alertas visiveis em linha.
 * - `sidebar` (lg+): coluna estreita com scroll interno e header
 *   compacto com chips de contagem. Usado quando o componente ocupa a
 *   coluna lateral fixa do dashboard.
 *
 * Hierarquia visual: critico (vermelho) -> atencao (ambar) -> info
 * (zinco). Ordenacao ja vem do backend.
 */
export interface AlertasOperacionaisProps {
  variant?: 'default' | 'sidebar';
}

export function AlertasOperacionais({
  variant = 'default',
}: AlertasOperacionaisProps = {}) {
  const { resumo, loading, erro, recarregar } = useAlertasOperacionais();
  const ehSidebar = variant === 'sidebar';

  if (loading && !resumo) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">
            Não foi possível carregar os alertas operacionais: {erro}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void recarregar({ forcar: true })}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!resumo) return null;

  const semAlertas = resumo.total === 0;

  return (
    <Card className={ehSidebar ? 'lg:sticky lg:top-4' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">Alertas operacionais</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {semAlertas ? 'Nada precisa de atenção agora.' : 'Por nível:'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={() => void recarregar({ forcar: true })}
            title="Atualizar agora"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>

        {!semAlertas && (
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            {resumo.por_nivel.critico > 0 && (
              <ChipContagem
                cor="red"
                rotulo={`${resumo.por_nivel.critico} crítico${resumo.por_nivel.critico === 1 ? '' : 's'}`}
              />
            )}
            {resumo.por_nivel.atencao > 0 && (
              <ChipContagem
                cor="amber"
                rotulo={`${resumo.por_nivel.atencao} atenção`}
              />
            )}
            {resumo.por_nivel.informativo > 0 && (
              <ChipContagem
                cor="zinc"
                rotulo={`${resumo.por_nivel.informativo} info`}
              />
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {semAlertas ? (
          <div className="rounded-md border border-dashed bg-zinc-50 p-4 text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Tudo em ordem por enquanto.</span>
          </div>
        ) : (
          <div
            className={
              ehSidebar
                ? 'space-y-2 max-h-[60vh] lg:max-h-[calc(100vh-22rem)] overflow-y-auto pr-1'
                : 'space-y-2'
            }
          >
            {resumo.alertas.map((alerta) => (
              <AlertaCard
                key={alerta.id}
                alerta={alerta}
                onAcaoConcluida={() => void recarregar({ forcar: true })}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChipContagem({
  cor,
  rotulo,
}: {
  cor: 'red' | 'amber' | 'zinc';
  rotulo: string;
}) {
  const classes: Record<typeof cor, string> = {
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    zinc: 'bg-zinc-100 text-zinc-700',
  };
  return (
    <span
      className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${classes[cor]}`}
    >
      {rotulo}
    </span>
  );
}
