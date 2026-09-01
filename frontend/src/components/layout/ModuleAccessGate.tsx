'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAcessoModulos } from '@/contexts/AcessoModulosContext';
import { chaveModuloExigidaNaRota } from '@/lib/modulo-rota';

export function ModuleAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const { pode, carregado } = useAcessoModulos();
  const chave = chaveModuloExigidaNaRota(pathname);

  if (!chave) {
    return children;
  }

  if (!carregado) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Verificando permissão…
      </p>
    );
  }

  if (pode(chave)) {
    return children;
  }

  return (
    <div
      className="mx-auto max-w-lg space-y-3 rounded-lg border border-border bg-card p-6"
      role="alert"
    >
      <div className="flex items-center gap-2 text-foreground">
        <ShieldOff className="h-5 w-5" aria-hidden />
        <h1 className="text-lg font-semibold">Acesso negado</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Seu perfil não tem permissão para abrir este módulo. Se precisar
        deste acesso, peça a um administrador da loja.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Voltar ao dashboard
      </Link>
    </div>
  );
}
