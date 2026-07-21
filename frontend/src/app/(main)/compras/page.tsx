'use client';

import Link from 'next/link';
import { ClipboardList, PackageCheck, ShoppingCart } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Home de Compras — mesma linha visual da home Financeiro (cards de recurso).
 * Contas a pagar fica só em Financeiro.
 */
const comprasOptions = [
  {
    title: 'Solicitações',
    description:
      'Necessidades internas, aprovação e conversão em pedidos de compra.',
    icon: ClipboardList,
    href: '/compras/solicitacoes',
  },
  {
    title: 'Pedidos',
    description:
      'Pedidos formais com fornecedor, preços, envio e acompanhamento.',
    icon: ShoppingCart,
    href: '/compras/pedidos',
  },
  {
    title: 'Recebimentos e aceites',
    description:
      'Confirme material no estoque e aceite de serviços pelo pedido.',
    icon: PackageCheck,
    href: '/compras/pedidos',
    hint: 'Abra um pedido ENVIADO para receber ou aceitar.',
  },
] as const;

export default function ComprasHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
        <p className="mt-1 text-muted-foreground">
          Solicitações, pedidos, recebimento de material e aceite de serviço.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {comprasOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Link key={option.title} href={option.href} className="block">
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{option.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {option.description}
                        {'hint' in option && option.hint ? (
                          <span className="mt-1 block text-xs">
                            {option.hint}
                          </span>
                        ) : null}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
