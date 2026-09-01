'use client';

import { type ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { configuracoesModuleNav } from '@/lib/module-nav';
import { useAcessoModulos } from '@/contexts/AcessoModulosContext';

export default function ConfiguracoesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { pode, carregado } = useAcessoModulos();
  const podeConfiguracoes = pode('configuracoes');
  const soSeguranca =
    carregado && !podeConfiguracoes && pathname === '/configuracoes';

  useEffect(() => {
    if (!carregado) return;
    if (podeConfiguracoes) return;
    if (pathname !== '/configuracoes') {
      router.replace('/configuracoes#seguranca-2fa');
    }
  }, [carregado, podeConfiguracoes, pathname, router]);

  if (!carregado) {
    return children;
  }

  if (soSeguranca) {
    return children;
  }

  if (!podeConfiguracoes) {
    return null;
  }

  return (
    <ModuleLayoutShell nav={configuracoesModuleNav}>{children}</ModuleLayoutShell>
  );
}
