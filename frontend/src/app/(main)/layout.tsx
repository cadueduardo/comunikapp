'use client';
import { getClientSessionToken } from '@/lib/session-auth';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShieldCheck } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { MainHeader } from '@/components/ui/main-header';
import { usuariosApi } from '@/lib/api-client';
import { BetaFeedbackButton } from '@/components/feedback/BetaFeedbackButton';
import { SidebarBadgeSync } from '@/components/layout/SidebarBadgeSync';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { useSidebarContadores } from '@/hooks/use-sidebar-contadores';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useVendasAcesso } from '@/hooks/use-vendas-acesso';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [twoFactorReminderOpen, setTwoFactorReminderOpen] = useState(false);
  const { contadores, recarregar } = useSidebarContadores(
    Boolean(user) && !loading,
    user?.id,
  );
  // Deny-by-default enquanto `/vendas/acesso` não responder.
  const { acesso: vendasAcesso } = useVendasAcesso(Boolean(user) && !loading);

  const permissions = useMemo(() => {
    const funcao = String(user?.funcao ?? '').toUpperCase();
    return {
      // Backend é a fonte de verdade; role sozinha não libera Vendas.
      podeVerVendas: vendasAcesso.pode_acessar_modulo === true,
      podeVerFinanceiro: ['ADMINISTRADOR', 'FINANCEIRO'].includes(funcao),
      podeVerExpedicao: ['ADMINISTRADOR', 'PRODUCAO', 'ESTOQUE'].includes(
        funcao,
      ),
      podeVerInstalacaoGestao: ['ADMINISTRADOR', 'FINANCEIRO', 'VENDAS'].includes(
        funcao,
      ),
    };
  }, [user?.funcao, vendasAcesso.pode_acessar_modulo]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadTwoFactorStatus = async () => {
      if (!user || typeof window === 'undefined') return;

      const reminderKey = `comunikapp:2fa-reminder-seen:${user.id}`;
      if (localStorage.getItem(reminderKey) === '1') return;

      const token = getClientSessionToken();
      if (!token) return;

      try {
        const status = (await usuariosApi.getTwoFactorStatus(token)) as {
          enabled: boolean;
        };
        if (!status.enabled) {
          setTwoFactorReminderOpen(true);
        }
      } catch (error) {
        console.error('Erro ao verificar status 2FA:', error);
      }
    };

    void loadTwoFactorStatus();
  }, [user]);

  const closeTwoFactorReminder = () => {
    if (user && typeof window !== 'undefined') {
      localStorage.setItem(`comunikapp:2fa-reminder-seen:${user.id}`, '1');
    }
    setTwoFactorReminderOpen(false);
  };

  const goToTwoFactorSettings = () => {
    closeTwoFactorReminder();
    router.push('/configuracoes?security=2fa#seguranca-2fa');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-neutral-800">
        <div className="text-center">
          <div className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-200">
            Carregando...
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Conectando ao servidor...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-neutral-800">
        <div className="text-center">
          <div className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-200">
            Redirecionando para login...
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="app-shell flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background lg:flex-row">
        <SidebarBadgeSync userId={user.id} onModuloVisto={recarregar} />
        <AppSidebar
          userId={user.id}
          permissions={permissions}
          contadores={contadores}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0">
            <MainHeader />
          </div>
          <div
            data-app-scroll-root
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 lg:px-8 lg:py-6"
          >
            {children}
          </div>
        </main>

        <Dialog
          open={twoFactorReminderOpen}
          onOpenChange={(open) => !open && closeTwoFactorReminder()}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <DialogTitle>Ative a segurança em dois fatores</DialogTitle>
              <DialogDescription>
                Proteja sua conta com um código temporário do Google
                Authenticator, Microsoft Authenticator ou 1Password.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeTwoFactorReminder}>
                Fazer depois
              </Button>
              <Button onClick={goToTwoFactorSettings}>Ativar 2FA</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <BetaFeedbackButton />
      </div>
    </SidebarProvider>
  );
}
