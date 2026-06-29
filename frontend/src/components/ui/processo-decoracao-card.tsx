'use client';

import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export type ProcessoDecoracaoCardItem = {
  id: string;
  nome: string;
  codigo?: string | null;
  ativo: boolean;
  custo_setup?: number | string | null;
  insumos_aceitos?: string[];
};

interface ProcessoDecoracaoCardProps {
  processo: ProcessoDecoracaoCardItem;
  onDelete: (processo: ProcessoDecoracaoCardItem) => void;
}

export function ProcessoDecoracaoCard({
  processo,
  onDelete,
}: ProcessoDecoracaoCardProps) {
  const setup = Number(processo.custo_setup ?? 0);

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-semibold text-foreground" title={processo.nome}>
              {processo.nome}
            </h3>
            {processo.codigo ? (
              <p className="text-xs text-muted-foreground">Código: {processo.codigo}</p>
            ) : null}
          </div>
          <Badge variant={processo.ativo ? 'default' : 'secondary'}>
            {processo.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Setup</span>
            <span className="font-medium">{formatCurrency(setup)}</span>
          </div>
          {processo.insumos_aceitos?.length ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {processo.insumos_aceitos.map((insumo) => (
                <Badge key={insumo} variant="outline" className="text-xs">
                  {insumo}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex gap-2 pt-2">
          <Link href={`/catalogo/personalizacao/editar/${processo.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(processo)}
            aria-label={`Inativar ${processo.nome}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
