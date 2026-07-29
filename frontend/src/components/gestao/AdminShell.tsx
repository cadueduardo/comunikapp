'use client';

import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { BrandLogo, BRAND_LOGO_HEIGHT } from '@/components/brand/BrandLogo';
import { AdminThemeToggle } from '@/components/gestao/AdminThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/contexts/AdminContext';
import { ADMIN_ROLE_LABELS } from '@/lib/gestao/admin-labels';
import { cn } from '@/lib/utils';

interface AdminNavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
  disabled?: boolean;
}

const NAVIGATION: readonly AdminNavigationItem[] = [
  {
    href: '/gestao',
    label: 'Visão geral',
    icon: LayoutDashboard,
  },
  {
    href: '/gestao/lojas',
    label: 'Lojas',
    icon: Building2,
  },
  {
    href: '/gestao/administradores',
    label: 'Administradores',
    icon: Users,
    superAdminOnly: true,
  },
  {
    href: '/gestao/novidades',
    label: 'Novidades',
    icon: Megaphone,
  },
  {
    href: '/gestao/auditoria',
    label: 'Auditoria',
    icon: ClipboardList,
    disabled: true,
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { admin, loading, logout } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !admin) {
      router.replace('/gestao/login');
    }
  }, [admin, loading, router]);

  if (loading || !admin) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-6">
        <div className="text-center">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">
            Validando sessão administrativa...
          </p>
        </div>
      </div>
    );
  }

  const visibleNavigation = NAVIGATION.filter(
    (item) => !item.superAdminOnly || admin.role === 'SUPER_ADMIN',
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/gestao/login');
  };

  return (
    <div className="flex min-h-dvh bg-muted/20">
      <aside className="hidden w-72 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <div className="border-b px-6 py-5">
          <Link href="/gestao" aria-label="Gestão ComunikApp">
            <BrandLogo
              variant="logoPlatform"
              heightPx={BRAND_LOGO_HEIGHT.platformFull}
              maxWidthPx={210}
            />
          </Link>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Gestão da plataforma
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Gestão">
          {visibleNavigation.map((item) => {
            const active =
              item.href === '/gestao'
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60"
                  aria-disabled="true"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    Em breve
                  </Badge>
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 min-w-0">
            <p className="truncate text-sm font-medium">{admin.nome}</p>
            <p className="truncate text-xs text-muted-foreground">
              {ADMIN_ROLE_LABELS[admin.role]}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <AdminThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-semibold">Gestão ComunikApp</span>
            </div>
            <div className="flex items-center gap-1">
              <AdminThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <nav
            className="flex gap-2 overflow-x-auto px-4 pb-3"
            aria-label="Gestão mobile"
          >
            {visibleNavigation
              .filter((item) => !item.disabled)
              .map((item) => {
                const active =
                  item.href === '/gestao'
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    asChild
                    size="sm"
                    variant={active ? 'default' : 'outline'}
                    className="shrink-0"
                  >
                    <Link href={item.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
