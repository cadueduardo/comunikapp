'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ModuleHubCards } from '@/components/layout/ModuleHubCards';
import { comprasModuleNav } from '@/lib/module-nav';

/**
 * Home de Compras — cards derivados de comprasModuleNav.
 * Contas a pagar fica só em Financeiro.
 */
export default function ComprasHomePage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={comprasModuleNav}
        title="Visão geral"
        subtitle="Solicitações, pedidos, recebimento de material e aceite de serviço."
        icon={<ShoppingCart className="h-7 w-7 sm:h-8 sm:w-8" />}
      />

      <ModuleHubCards nav={comprasModuleNav} />

      <p className="text-xs text-muted-foreground">
        Dica: em um pedido com status ENVIADO, use as ações de receber material ou
        aceitar serviço.{' '}
        <Link href="/compras/pedidos" className="underline underline-offset-2">
          Abrir pedidos
        </Link>
        .
      </p>
    </div>
  );
}
