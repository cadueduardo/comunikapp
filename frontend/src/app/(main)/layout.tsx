'use client';
import { useEffect, useState } from 'react';
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
import { Sidebar, SidebarBody } from '@/components/ui/sidebar';
import {
  IconLayoutDashboard,
  IconFileText,
  IconUsers,
  IconSettings,
  IconLogout,
  IconBuildingWarehouse,
  IconPackage,
  IconTools,
  IconClipboardList,
  IconBuilding,
  IconCash,
  IconTruckDelivery,
  IconPalette,
  IconCategory,
} from '@tabler/icons-react';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSidebar } from '@/components/ui/sidebar';
import { useUser } from '@/contexts/UserContext';
import { MainHeader } from '@/components/ui/main-header';
import { SidebarThemeToggle } from '@/components/theme/SidebarThemeToggle';
import { usuariosApi } from '@/lib/api-client';
import { BetaFeedbackButton } from '@/components/feedback/BetaFeedbackButton';
import { SidebarIconWithBadge } from '@/components/layout/SidebarIconWithBadge';
import { SidebarBadgeSync } from '@/components/layout/SidebarBadgeSync';
import { useSidebarContadores } from '@/hooks/use-sidebar-contadores';

// Componente customizado para SidebarLink com Next.js Link
const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: {
    label: string;
    href: string;
    icon: React.JSX.Element | React.ReactNode;
    badgeCount?: number;
  };
  className?: string;
  onClick?: () => void;
}) => {
  const { open, animate, setOpen } = useSidebar();

  const closeMenu = () => setOpen(false);

  const iconComBadge = (
    <SidebarIconWithBadge count={link.badgeCount}>
      {link.icon}
    </SidebarIconWithBadge>
  );

  if (onClick) {
    return (
      <button
        onClick={() => {
          onClick();
          closeMenu();
        }}
        className={cn(
          "flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left",
          className
        )}
        {...props}
      >
        {iconComBadge}

        <motion.span
          animate={{
            display: animate ? (open ? "inline-block" : "none") : "inline-block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
        >
          {link.label}
        </motion.span>
      </button>
    );
  }

  return (
    <Link
      href={link.href}
      onClick={closeMenu}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      {...props}
    >
      {iconComBadge}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

// Logo e LogoIcon foram movidos para sidebar.tsx
// export const Logo = () => { ... };
// export const LogoIcon = () => { ... };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, getFirstName, logout, loading } = useUser();
  const router = useRouter();
  const [twoFactorReminderOpen, setTwoFactorReminderOpen] = useState(false);
  const { contadores, recarregar } = useSidebarContadores(
    Boolean(user) && !loading,
    user?.id,
  );

  useEffect(() => {
    // Se o carregamento terminou e não há usuário, redireciona para o login.
    // Isso é mais seguro do que fazer a lógica inversa.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadTwoFactorStatus = async () => {
      if (!user || typeof window === 'undefined') return;

      const reminderKey = `comunikapp:2fa-reminder-seen:${user.id}`;
      if (localStorage.getItem(reminderKey) === '1') return;

      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const status = await usuariosApi.getTwoFactorStatus(token) as { enabled: boolean };
        if (!status.enabled) {
          setTwoFactorReminderOpen(true);
        }
      } catch (error) {
        console.error('Erro ao verificar status 2FA:', error);
      }
    };

    loadTwoFactorStatus();
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

  // Enquanto estiver carregando, exibe uma tela de loading para evitar o "flicker"
  // ou redirecionamentos incorretos.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-neutral-800">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
            Carregando...
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Conectando ao servidor...
          </div>
        </div>
      </div>
    );
  }

  // Se, após o carregamento, ainda não houver usuário, não renderiza nada
  // pois o useEffect acima já terá iniciado o redirecionamento.
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-neutral-800">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
            Redirecionando para login...
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Você não está autenticado
          </div>
        </div>
      </div>
    );
  }
  
  // Funcoes que enxergam o modulo financeiro na sidebar.
  // Coerente com a regra usada na pagina /financeiro/recebimentos e no
  // bloco ResumoFinanceiroSimples (Fase 6).
  //
  // Alinhado ao enum oficial `usuario_funcao` em backend/prisma/schema.prisma:
  //   { ADMINISTRADOR, FINANCEIRO, PRODUCAO, VENDAS, ESTOQUE }
  // Hoje apenas ADMINISTRADOR e FINANCEIRO veem o bloco. Demais funcoes
  // ficam ocultas por design ("Permissao visivel").
  //
  // TODO Fase 6 follow-up: trocar por leitura real de perfil_permissao
  // (permissao `home-operacional.ver_resumo_financeiro`).
  const funcoesComVisaoFinanceira = new Set(['ADMINISTRADOR', 'FINANCEIRO']);
  const podeVerFinanceiro = funcoesComVisaoFinanceira.has(
    String(user?.funcao ?? '').toUpperCase(),
  );

  const funcoesExpedicao = new Set(['ADMINISTRADOR', 'PRODUCAO', 'ESTOQUE']);
  const podeVerExpedicao = funcoesExpedicao.has(
    String(user?.funcao ?? '').toUpperCase(),
  );

  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <IconLayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Orçamentos',
      href: '/orcamentos-v2',
      icon: (
        <IconFileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Clientes',
      href: '/clientes',
      icon: (
        <IconUsers className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Insumos',
      href: '/insumos',
      icon: (
        <IconBuildingWarehouse className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Estoque',
      href: '/estoque',
      icon: (
        <IconBuildingWarehouse className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Modelos de Orçamento',
      href: '/produtos',
      icon: (
        <IconPackage className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Catálogo de produtos',
      href: '/catalogo',
      icon: (
        <IconCategory className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Ordens de Serviço',
      href: '/os',
      badgeCount: contadores.os,
      icon: (
        <IconClipboardList className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Arte & Aprovação',
      href: '/arte',
      badgeCount: contadores.arte,
      icon: (
        <IconPalette className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    ...(podeVerFinanceiro
      ? [
          {
            label: 'Financeiro',
            href: '/financeiro/recebimentos',
            badgeCount: contadores.financeiro,
            icon: (
              <IconCash className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
          },
        ]
      : []),
    {
      label: 'PCP',
      href: '/pcp',
      badgeCount: contadores.pcp,
      icon: (
        <IconBuilding className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      submenu: [
        {
          label: 'Kanban',
          href: '/pcp/kanban',
        },
        {
          label: 'Workflows',
          href: '/pcp/workflows',
        },
        {
          label: 'Etapas',
          href: '/pcp/etapas',
        },
        {
          label: 'Apontamentos',
          href: '/pcp/apontamentos',
        },
        {
          label: 'Relatórios',
          href: '/pcp/relatorios',
        },
        {
          label: 'Configuração',
          href: '/pcp/configuracao',
        },
      ],
    },
    ...(podeVerExpedicao
      ? [
          {
            label: 'Expedição',
            href: '/expedicao',
            badgeCount: contadores.expedicao,
            icon: (
              <IconTruckDelivery className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
          },
        ]
      : []),
    {
      label: 'Centros de Trabalho',
      href: '/centros-de-trabalho',
      icon: (
        <IconTools className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Usuários',
      href: '/usuarios',
      icon: (
        <IconUsers className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Configurações',
      href: '/configuracoes',
      icon: (
        <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div className="app-shell flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background lg:flex-row">
      <SidebarBadgeSync userId={user.id} onModuloVisto={recarregar} />
      {/* O Sidebar agora gerencia seu próprio estado */}
      <Sidebar> 
        <SidebarBody className="justify-between gap-6">
          <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* O Logo é renderizado condicionalmente dentro do DesktopSidebar */}
            <div className="mt-2 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
              <SidebarThemeToggle />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <SidebarLink
              link={{
                label: getFirstName(),
                href: "#",
                icon: (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center">
                    <span className="text-neutral-700 dark:text-neutral-200 text-sm font-medium">
                      {getFirstName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                ),
              }}
            />
            <SidebarLink
              link={{
                label: "Sair",
                href: "#",
                icon: (
                  <IconLogout className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                ),
              }}
              onClick={logout}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      
      {/* Área de conteúdo principal: header fixo + uma única área com scroll */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <MainHeader />
        </div>
        {/*
          Padding lateral e vertical centralizado no layout para garantir
          respiro consistente em toda a plataforma. Páginas individuais
          NÃO devem mais adicionar `p-6` / `container mx-auto p-X` no
          root - basta usar `space-y-X` ou layout próprio dentro deste
          padding. Migração em massa feita em 2026-05-25.
        */}
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          {children}
        </div>
      </main>
      <Dialog open={twoFactorReminderOpen} onOpenChange={(open) => !open && closeTwoFactorReminder()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <DialogTitle>Ative a segurança em dois fatores</DialogTitle>
            <DialogDescription>
              Proteja sua conta com um código temporário do Google Authenticator, Microsoft Authenticator ou 1Password. Mesmo que sua senha vaze, o acesso continua protegido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeTwoFactorReminder}>
              Fazer depois
            </Button>
            <Button onClick={goToTwoFactorSettings}>
              Ativar 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <BetaFeedbackButton />
    </div>
  );
}
