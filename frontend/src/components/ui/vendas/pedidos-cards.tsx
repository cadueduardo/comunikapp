'use client';

import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText } from 'lucide-react';
import { PedidoComercial } from './pedidos-table';

interface PedidosCardsProps {
  data: PedidoComercial[];
  onVerTimeline: (item: PedidoComercial) => void;
}

export function PedidosCards({ data, onVerTimeline }: PedidosCardsProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Nenhum pedido comercial confirmado até o momento.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((item) => (
        <Card key={item.id} className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                {item.numero}
              </CardTitle>
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                Confirmado
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Cliente: {item.cliente_nome}</p>
          </CardHeader>

          <CardContent className="space-y-2 text-xs">
            <div>
              <span className="font-semibold text-foreground">Serviço: </span>
              <span className="text-muted-foreground">{item.nome_servico}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">OS Principal: </span>
              <span className="font-mono text-muted-foreground">{item.os_principal_numero ?? '—'}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <div>
                <span className="text-muted-foreground">Operação: </span>
                <span className="font-medium text-foreground">{item.status_operacao}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Valor: </span>
                <span className="font-bold text-foreground">{formatCurrency(item.valor_total)}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onVerTimeline(item)}
            >
              <Clock className="mr-1 h-3.5 w-3.5" />
              Linha do Tempo
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
