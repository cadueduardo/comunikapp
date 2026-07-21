'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import {
  ContaPagar,
  statusContaPagarLabel,
} from '@/app/(main)/financeiro/contas-pagar/columns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ContaPagarCardProps {
  conta: ContaPagar;
}

function proximoVencimento(conta: ContaPagar) {
  const parcelas = conta.parcelas ?? [];
  if (parcelas.length === 0) return undefined;
  return parcelas.reduce((min, p) => {
    const d = new Date(p.data_vencimento).getTime();
    return d < min ? d : min;
  }, new Date(parcelas[0].data_vencimento).getTime());
}

export function ContaPagarCard({ conta }: ContaPagarCardProps) {
  const vencimento = proximoVencimento(conta);

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">{conta.numero_documento}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {conta.fornecedor?.nome ?? conta.fornecedor_id}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/financeiro/contas-pagar/${conta.id}`}>Abrir</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {statusContaPagarLabel[conta.status] ?? conta.status}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {Number(conta.valor_total).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </span>
        {vencimento && (
          <span className="text-muted-foreground">
            Vence {new Date(vencimento).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
}
