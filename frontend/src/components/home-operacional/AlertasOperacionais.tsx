'use client';

import { CheckCircle2, Info, RefreshCw } from 'lucide-react';
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
 * Bloco "Alertas operacionais" da Home (Fase 5).
 *
 * Regras de exibicao (plano-mae secao "Bloco 3"):
 * - Ordenacao: critico -> atencao -> informativo (vem ordenado do back).
 * - Se nao houver nenhum alerta: mostrar um estado neutro discreto em
 *   vez de esconder por completo, para o usuario saber que o bloco esta
 *   funcionando (e nao foi um erro).
 * - O 7o alerta previsto (trabalho pronto sem recebimento ha mais de N
 *   dias) depende da Fase 6 (modulo financeiro). Hoje aparece uma nota
 *   discreta avisando que esse alerta sera habilitado em breve.
 */
export function AlertasOperacionais() {
  const { resumo, loading, erro, recarregar } = useAlertasOperacionais();

  if (loading && !resumo) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Alertas operacionais</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {semAlertas
                ? 'Nada precisa de atenção agora.'
                : descreverContagens(resumo.por_nivel)}
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
      </CardHeader>

      <CardContent>
        {semAlertas ? (
          <div className="rounded-md border border-dashed bg-zinc-50 p-4 text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Tudo em ordem. Os alertas aparecem aqui quando houver pendências.
          </div>
        ) : (
          <div className="space-y-2">
            {resumo.alertas.map((alerta) => (
              <AlertaCard
                key={alerta.id}
                alerta={alerta}
                onAcaoConcluida={() => void recarregar({ forcar: true })}
              />
            ))}
          </div>
        )}

        <div className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            O alerta &quot;trabalho pronto sem recebimento&quot; será
            habilitado quando o módulo financeiro (Fase 6) for liberado.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function descreverContagens(porNivel: {
  critico: number;
  atencao: number;
  informativo: number;
}): string {
  const partes: string[] = [];
  if (porNivel.critico > 0) {
    partes.push(`${porNivel.critico} crítico${porNivel.critico === 1 ? '' : 's'}`);
  }
  if (porNivel.atencao > 0) {
    partes.push(`${porNivel.atencao} atenção${porNivel.atencao === 1 ? '' : ''}`);
  }
  if (porNivel.informativo > 0) {
    partes.push(
      `${porNivel.informativo} informativo${porNivel.informativo === 1 ? '' : 's'}`,
    );
  }
  if (partes.length === 0) return 'Tudo em ordem.';
  return partes.join(' · ');
}
