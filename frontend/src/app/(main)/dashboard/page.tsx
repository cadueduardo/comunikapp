'use client';

import { useUser } from '@/contexts/UserContext';
import { AlertasOperacionais } from '@/components/home-operacional/AlertasOperacionais';
import { DashboardKPIs } from '@/components/home-operacional/DashboardKPIs';
import { FluxoTrabalho } from '@/components/home-operacional/FluxoTrabalho';
import { OnboardingChecklist } from '@/components/home-operacional/OnboardingChecklist';
import { ResumoFinanceiroSimples } from '@/components/home-operacional/ResumoFinanceiroSimples';
import { SystemStateBanner } from '@/components/home-operacional/SystemStateBanner';

/**
 * Dashboard operacional - layout reorganizado em 2026-05-25:
 *
 * - SystemStateBanner full-width no topo (so aparece se houver mensagem).
 * - Header curto com saudacao.
 * - Em lg+: layout em 2 colunas via grid-cols-12 (principal 8/12 +
 *   alertas 4/12 como sidebar). KPIs + onboarding + fluxo ficam na
 *   coluna principal; alertas ficam na coluna lateral fixa com scroll
 *   interno.
 * - Em mobile/sm/md: tudo empilha em 1 coluna (alertas vao para o final).
 */
export default function DashboardPage() {
  const { user, loading, getFirstName } = useUser();

  return (
    <div className="space-y-4">
      <SystemStateBanner />

      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {loading ? 'Bem-vindo' : `Olá, ${getFirstName()}`}
        </h1>
        <p className="text-muted-foreground mt-0.5">
          {user?.loja?.nome
            ? `Visão geral da ${user.loja.nome}.`
            : 'Visão geral da sua loja.'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4 min-w-0">
          <DashboardKPIs />

          {/* Fase 6.C - Resumo financeiro (renderiza apenas com permissao) */}
          <ResumoFinanceiroSimples />

          <OnboardingChecklist />

          <FluxoTrabalho />
        </div>

        <aside className="lg:col-span-4 min-w-0">
          <AlertasOperacionais variant="sidebar" />
        </aside>
      </div>
    </div>
  );
}
