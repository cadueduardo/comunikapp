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
import { VendasAcessoProvider } from '@/contexts/VendasAcessoContext';
import {
  AcessoModulosProvider,
  useAcessoModulos,
} from '@/contexts/AcessoModulosContext';
import { MainHeader } from '@/components/ui/main-header';
import { usuariosApi } from '@/lib/api-client';
import { BetaFeedbackButton } from '@/components/feedback/BetaFeedbackButton';
import { SidebarBadgeSync } from '@/components/layout/SidebarBadgeSync';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { useSidebarContadores } from '@/hooks/use-sidebar-contadores';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useVendasAcesso } from '@/hooks/use-vendas-acesso';
import { ModuleAccessGate } from '@/components/layout/ModuleAccessGate';
import { FavoritosProvider } from '@/contexts/FavoritosContext';
import { ModulosAchatadosProvider } from '@/contexts/ModulosAchatadosContext';
import { idsModulosAchatados } from '@/lib/sidebar-achatamento';

type AuthUser = {
  id: string;
  funcao: string;
};

function AuthenticatedShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [twoFactorReminderOpen, setTwoFactorReminderOpen] = useState(false);
  const { contadores, recarregar } = useSidebarContadores(true, user.id);
  // Deny-by-default enquanto `/vendas/acesso` não responder (estado compartilhado).
  const { acesso: vendasAcesso } = useVendasAcesso();
  const { pode, carregado } = useAcessoModulos();

  const permissions = useMemo(() => {
    const flag = (chave: string, fallback: boolean) =>
      carregado ? pode(chave) : fallback;
    return {
      podeVerVendas: carregado
        ? pode('vendas')
        : vendasAcesso.pode_acessar_modulo === true,
      podeVerFinanceiro: flag(
        'financeiro',
        false,
      ),
      podeVerExpedicao: flag('expedicao', false),
      podeVerInstalacaoGestao: flag('instalacao', false),
      podeVerInsumos: flag('insumos', false),
      podeVerFornecedores: flag('fornecedores', false),
      podeVerCompras: flag('compras', false),
      podeVerEstoque: flag('estoque', false),
      podeVerModelos: flag('modelos', false),
      podeVerCatalogo: flag('catalogo', false),
      podeVerOs: flag('os', false),
      podeVerArte: flag('arte', false),
      podeVerPcp: flag('pcp', false),
      podeVerCentrosTrabalho: flag('centros-trabalho', false),
      podeVerUsuarios: flag('usuarios', false),
    };
  }, [vendasAcesso.pode_acessar_modulo, pode, carregado]);

  const modulosAchatados = useMemo(
    () => idsModulosAchatados(permissions),
    [permissions],
  );

  useEffect(() => {
    const loadTwoFactorStatus = async () => {
      if (typeof window === 'undefined') return;

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
  }, [user.id]);

  const closeTwoFactorReminder = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`comunikapp:2fa-reminder-seen:${user.id}`, '1');
    }
    setTwoFactorReminderOpen(false);
  };

  const goToTwoFactorSettings = () => {
    closeTwoFactorReminder();
    router.push('/configuracoes?security=2fa#seguranca-2fa');
  };

  return (
    <ModulosAchatadosProvider ids={modulosAchatados}>
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
            <ModuleAccessGate>{children}</ModuleAccessGate>
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
    </ModulosAchatadosProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
    <VendasAcessoProvider enabled userId={user.id}>
      <AcessoModulosProvider userId={user.id}>
        <FavoritosProvider userId={user.id}>
          <AuthenticatedShell user={user}>{children}</AuthenticatedShell>
        </FavoritosProvider>
      </AcessoModulosProvider>
    </VendasAcessoProvider>
  );
}
