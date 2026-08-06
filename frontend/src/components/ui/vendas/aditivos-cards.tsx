'use client';

import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, CheckCircle2 } from 'lucide-react';
import { OcorrenciaAditivo } from './aditivos-table';

interface AditivosCardsProps {
  data: OcorrenciaAditivo[];
  onPrecificar: (item: OcorrenciaAditivo) => void;
  onGerarOsAditiva: (osPaiId: string, ocorrenciaId: string) => void;
}

export function AditivosCards({
  data,
  onPrecificar,
  onGerarOsAditiva,
}: AditivosCardsProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Nenhuma ocorrência operacional pendente de aditivo comercial.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((item) => {
        const isPrecificado = item.status_financeiro === 'PRECIFICADO';
        const isAbonado = item.status_financeiro === 'ABONADO';

        return (
          <Card key={item.id} className="border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">
                  {item.os_numero}
                </CardTitle>
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
              </div>
              <p className="text-xs text-muted-foreground">Cliente: {item.cliente_nome}</p>
            </CardHeader>

            <CardContent className="space-y-2 text-xs">
              <div>
                <span className="font-semibold text-foreground">Tipo: </span>
                <span className="text-muted-foreground">{item.tipo}</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Descrição: </span>
                <span className="text-muted-foreground">{item.descricao}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <div>
                  <span className="text-muted-foreground">Sugerido: </span>
                  <span className="font-medium text-foreground">{formatCurrency(item.preco_sugerido)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cobrado: </span>
                  <span className="font-bold text-foreground">
                    {item.valor_cobrado !== null ? formatCurrency(item.valor_cobrado) : '—'}
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2 pt-2 border-t">
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
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
