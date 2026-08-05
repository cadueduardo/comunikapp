'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Atividade } from './atividades-columns';

export function AtividadeCard({
  atividade,
  onConcluir,
  podeGerenciar,
}: {
  atividade: Atividade;
  onConcluir: (atividade: Atividade) => void;
  podeGerenciar: boolean;
}) {
  const prazo = new Date(atividade.prazo);
  return (
    <Card className="border-border bg-card text-foreground">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{atividade.titulo}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{atividade.tipo}</Badge>
            {atividade.concluida_em ? (
              <Badge variant="outline">Concluída</Badge>
            ) : (
              <Badge>Aberta</Badge>
            )}
          </div>
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
              <Link href={`/vendas/atividades?id=${atividade.id}`}>Ver</Link>
            </DropdownMenuItem>
            {atividade.cliente_id ? (
              <DropdownMenuItem asChild>
                <Link href={`/clientes/${atividade.cliente_id}`}>Cliente</Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            {podeGerenciar && !atividade.concluida_em ? (
              <DropdownMenuItem onClick={() => onConcluir(atividade)}>
                Concluir
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {atividade.descricao ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {atividade.descricao}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Sem descrição.</p>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Prazo:{' '}
        {Number.isNaN(prazo.getTime()) ? '—' : prazo.toLocaleString('pt-BR')}
      </CardFooter>
    </Card>
  );
}
