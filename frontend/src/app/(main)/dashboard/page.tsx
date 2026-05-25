'use client';

import { useUser } from '@/contexts/UserContext';
import { AlertasOperacionais } from '@/components/home-operacional/AlertasOperacionais';
import { FluxoTrabalho } from '@/components/home-operacional/FluxoTrabalho';
import { OnboardingChecklist } from '@/components/home-operacional/OnboardingChecklist';
import { SystemStateBanner } from '@/components/home-operacional/SystemStateBanner';

export default function DashboardPage() {
  const { user, loading, getFirstName } = useUser();

  return (
    <div className="space-y-6">
      <SystemStateBanner />

      <header>
        <h1 className="text-2xl md:text-3xl font-bold">
          {loading ? 'Bem-vindo' : `Olá, ${getFirstName()}`}
        </h1>
        <p className="text-muted-foreground mt-1">
          {user?.loja?.nome
            ? `Visão geral da ${user.loja.nome}.`
            : 'Visão geral da sua loja.'}
        </p>
      </header>

      <OnboardingChecklist />

      <FluxoTrabalho />

      <AlertasOperacionais />

      {/* Próxima seção (Fase 6):
         - ResumoFinanceiroSimples (sensível a permissão) */}
    </div>
  );
}
