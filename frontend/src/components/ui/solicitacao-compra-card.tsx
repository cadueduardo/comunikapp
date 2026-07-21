'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import {
  prioridadeLabel,
  SolicitacaoCompra,
  statusSolicitacaoLabel,
} from '@/app/(main)/compras/solicitacoes/columns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SolicitacaoCompraCardProps {
  solicitacao: SolicitacaoCompra;
}

export function SolicitacaoCompraCard({
  solicitacao,
}: SolicitacaoCompraCardProps) {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">{solicitacao.numero}</h3>
          <p className="truncate text-sm text-muted-foreground">
            Origem {solicitacao.origem_tipo}
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
              <Link href={`/compras/solicitacoes/editar/${solicitacao.id}`}>
                Abrir
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {statusSolicitacaoLabel[solicitacao.status] ?? solicitacao.status}
        </Badge>
        <Badge variant="outline">
          {prioridadeLabel[solicitacao.prioridade] ?? solicitacao.prioridade}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        {solicitacao.itens?.length ?? 0} item(ns)
      </p>
    </div>
  );
}
