'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, EyeOff, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { OnboardingEtapaEstado, OnboardingStatus } from '@/lib/home-operacional-api';
import { useOnboarding } from '@/hooks/use-home-operacional';
import { AplicarConfiguracaoRecomendadaDialog } from './AplicarConfiguracaoRecomendadaDialog';

function badgeStatus(status: OnboardingStatus): { label: string; className: string } {
  switch (status) {
    case 'concluido':
      return { label: 'Concluído', className: 'bg-emerald-100 text-emerald-700' };
    case 'ignorado':
      return { label: 'Ignorado', className: 'bg-zinc-100 text-zinc-600' };
    case 'atencao':
      return { label: 'Atenção', className: 'bg-amber-100 text-amber-700' };
    default:
      return { label: 'Pendente', className: 'bg-blue-100 text-blue-700' };
  }
}

/**
 * Checklist do onboarding operacional na Home. Mostra etapas com
 * indicacao visual de status e atalho para concluir cada uma.
 *
 * O usuario pode ignorar etapas opcionais e reativar etapas ignoradas
 * sem perder o progresso.
 */
export function OnboardingChecklist() {
  const { resumo, loading, erro, ignorarStep, reativarStep, recarregar, aplicarConfiguracaoRecomendada } =
    useOnboarding();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [aplicando, setAplicando] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">
            Não foi possível carregar o checklist: {erro}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void recarregar()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!resumo) return null;

  // Se 100% concluído (apenas obrigatórias), nao exibir o card (a Home fica
  // mais limpa). O usuario continua podendo aplicar configuracao via banner.
  if (resumo.progresso_pct === 100 && resumo.etapas.every((e) => e.status !== 'pendente')) {
    return null;
  }

  async function confirmarAplicacao(sobrescrever: boolean) {
    setAplicando(true);
    try {
      await aplicarConfiguracaoRecomendada({ sobrescrever_existentes: sobrescrever });
      setDialogAberto(false);
    } finally {
      setAplicando(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Primeiros passos</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {resumo.obrigatorias_concluidas} de {resumo.total_obrigatorias} etapas obrigatórias concluídas.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setDialogAberto(true)}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              Aplicar configuração recomendada
            </Button>
          </div>
          <div className="mt-3">
            <Progress value={resumo.progresso_pct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{resumo.progresso_pct}%</p>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <ul className="divide-y">
            {resumo.etapas.map((etapa) => (
              <ItemEtapa
                key={etapa.step_id}
                etapa={etapa}
                onIgnorar={() => void ignorarStep(etapa.step_id)}
                onReativar={() => void reativarStep(etapa.step_id)}
              />
            ))}
          </ul>
        </CardContent>
      </Card>

      <AplicarConfiguracaoRecomendadaDialog
        aberto={dialogAberto}
        aplicando={aplicando}
        onConfirmar={confirmarAplicacao}
        onCancelar={() => setDialogAberto(false)}
      />
    </>
  );
}

function ItemEtapa({
  etapa,
  onIgnorar,
  onReativar,
}: {
  etapa: OnboardingEtapaEstado;
  onIgnorar: () => void;
  onReativar: () => void;
}) {
  const badge = badgeStatus(etapa.status);
  const concluido = etapa.status === 'concluido';
  const ignorado = etapa.status === 'ignorado';

  return (
    <li className="flex items-start gap-3 py-3">
      <div
        aria-hidden
        className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
          concluido
            ? 'bg-emerald-500 text-white'
            : ignorado
              ? 'bg-zinc-200 text-zinc-500'
              : 'border-2 border-zinc-300 text-zinc-300'
        }`}
      >
        {concluido && <Check className="h-3 w-3" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={`text-sm font-medium ${concluido || ignorado ? 'text-muted-foreground' : 'text-foreground'}`}
          >
            {etapa.titulo}
            {!etapa.obrigatoria && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">(opcional)</span>
            )}
          </p>
          <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        {!concluido && (
          <p className="text-xs text-muted-foreground mt-0.5">{etapa.descricao_curta}</p>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {!concluido && !ignorado && (
          <Button asChild size="sm" variant="ghost">
            <Link href={etapa.acao_href}>
              {etapa.acao_label}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        )}
        {!concluido && !ignorado && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={onIgnorar}
            title="Ignorar esta etapa"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </Button>
        )}
        {ignorado && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={onReativar}
            title="Reativar esta etapa"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </li>
  );
}
