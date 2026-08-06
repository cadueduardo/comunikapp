'use client';

import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, FileText } from 'lucide-react';

export interface PedidoComercial {
  id: string;
  numero: string;
  nome_servico: string;
  cliente_id: string | null;
  cliente_nome: string;
  valor_total: number;
  data_aceite: string | null;
  status_comercial: string;
  status_arte: string;
  status_operacao: string;
  status_financeiro: string;
  os_principal_numero: string | null;
  total_aditivos: number;
  criado_em: string;
}

interface PedidosTableProps {
  data: PedidoComercial[];
  onVerTimeline: (item: PedidoComercial) => void;
}

export function PedidosTable({ data, onVerTimeline }: PedidosTableProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Nenhum pedido comercial confirmado até o momento.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Serviço / Produto</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>OS Principal</TableHead>
            <TableHead>Operação</TableHead>
            <TableHead>Financeiro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-semibold text-foreground">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  {item.numero}
                </div>
              </TableCell>
              <TableCell className="text-foreground font-medium">{item.cliente_nome}</TableCell>
              <TableCell className="text-muted-foreground">{item.nome_servico}</TableCell>
              <TableCell className="font-bold text-foreground">
                {formatCurrency(item.valor_total)}
              </TableCell>
              <TableCell>
                {item.os_principal_numero ? (
                  <Badge variant="outline" className="font-mono">
                    {item.os_principal_numero}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  {item.status_operacao}
                </Badge>
              </TableCell>
              <TableCell>
                {item.status_financeiro === 'LIQUIDADO' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    Liquidado
                  </Badge>
                ) : (
                  <Badge variant="secondary">Em Aberto</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVerTimeline(item)}
                >
                  <Clock className="mr-1 h-3.5 w-3.5" />
                  Linha do Tempo
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
