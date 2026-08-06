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
import { Tag, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface OcorrenciaAditivo {
  id: string;
  os_pai_id: string;
  os_numero: string;
  cliente_nome: string;
  tipo: string;
  descricao: string;
  quantidade: number;
  custo_sugerido: number;
  preco_sugerido: number;
  valor_cobrado: number | null;
  status_financeiro: string;
  criado_em: string;
}

interface AditivosTableProps {
  data: OcorrenciaAditivo[];
  onPrecificar: (item: OcorrenciaAditivo) => void;
  onGerarOsAditiva: (osPaiId: string, ocorrenciaId: string) => void;
}

export function AditivosTable({
  data,
  onPrecificar,
  onGerarOsAditiva,
}: AditivosTableProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Nenhuma ocorrência operacional pendente de aditivo comercial.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>OS Pai</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo de Ocorrência</TableHead>
            <TableHead>Qtd</TableHead>
            <TableHead>Sugerido (BRL)</TableHead>
            <TableHead>Valor Cobrado</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const isPrecificado = item.status_financeiro === 'PRECIFICADO';
            const isAbonado = item.status_financeiro === 'ABONADO';

            return (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-foreground">
                  {item.os_numero}
                </TableCell>
                <TableCell className="text-foreground">{item.cliente_nome}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-xs text-foreground">{item.tipo}</span>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                      {item.descricao}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{item.quantidade}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatCurrency(item.preco_sugerido)}
                </TableCell>
                <TableCell className="font-bold text-foreground">
                  {item.valor_cobrado !== null ? formatCurrency(item.valor_cobrado) : '—'}
                </TableCell>
                <TableCell>
                  {isPrecificado ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                      Precificado
                    </Badge>
                  ) : isAbonado ? (
                    <Badge variant="secondary">Abonado</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                      Pendente
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPrecificar(item)}
                  >
                    <Tag className="mr-1 h-3.5 w-3.5" />
                    Precificar
                  </Button>
                  {isPrecificado && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                      onClick={() => onGerarOsAditiva(item.os_pai_id, item.id)}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Gerar OS Aditiva
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
