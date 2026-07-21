'use client';

import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Calculator,
  Wallet,
} from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Home do módulo Financeiro — padrão de navegação por cards (igual Estoque).
 * Novos recursos entram nesta grade; o menu lateral aponta para cá.
 */
const financeiroOptions = [
  {
    title: 'Contas a receber',
    description:
      'Cobranças de clientes, parcelas, vencimentos e recebimentos.',
    icon: ArrowDownLeft,
    href: '/financeiro/recebimentos',
  },
  {
    title: 'Contas a pagar',
    description:
      'Obrigações com fornecedores, parcelas, pagamentos e estornos.',
    icon: ArrowUpRight,
    href: '/financeiro/contas-pagar',
  },
  {
    title: 'Pós-cálculo (OS)',
    description:
      'Previsto × real por ordem de serviço, margens e fechamento financeiro.',
    icon: Calculator,
    href: '/financeiro/pos-calculo',
  },
  {
    title: 'Relatórios',
    description:
      'Visões consolidadas de caixa, inadimplência e compromissos.',
    icon: BarChart3,
    href: '/financeiro/relatorios',
    emBreve: true,
  },
] as const;

export default function FinanceiroHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="mt-1 text-muted-foreground">
          Contas a receber e a pagar, pós-cálculo de OS e visão financeira da
          operação.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {financeiroOptions.map((option) => {
          const Icon = option.icon;
          const emBreve = 'emBreve' in option && option.emBreve;

          const card = (
            <Card
              className={
                emBreve
                  ? 'h-full opacity-70'
                  : 'h-full cursor-pointer transition-shadow hover:shadow-md'
              }
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {option.title}
                      {emBreve ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Em breve
                        </span>
                      ) : null}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {option.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );

          if (emBreve) {
            return (
              <div key={option.href} aria-disabled="true">
                {card}
              </div>
            );
          }

          return (
            <Link key={option.href} href={option.href} className="block">
              {card}
            </Link>
          );
        })}
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Wallet className="h-3.5 w-3.5" />
        Novos recursos financeiros entram nesta home como cards de navegação.
      </p>
    </div>
  );
}
