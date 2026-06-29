'use client';

import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export type ConjuntoCamposCardItem = {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  campos?: Array<{ id: string; chave: string; label: string }>;
  _count?: { estampas?: number };
};

interface ConjuntoCamposCardProps {
  conjunto: ConjuntoCamposCardItem;
  onDelete: (conjunto: ConjuntoCamposCardItem) => void;
}

export function ConjuntoCamposCard({
  conjunto,
  onDelete,
}: ConjuntoCamposCardProps) {
  const qtdCampos = conjunto.campos?.length ?? 0;
  const qtdEstampas = conjunto._count?.estampas ?? 0;

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-semibold text-foreground" title={conjunto.nome}>
              {conjunto.nome}
            </h3>
            {conjunto.descricao ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {conjunto.descricao}
              </p>
            ) : null}
          </div>
          <Badge variant={conjunto.ativo ? 'default' : 'secondary'}>
            {conjunto.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Campos</span>
            <span className="font-medium">{qtdCampos}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estampas vinculadas</span>
            <span className="font-medium">{qtdEstampas}</span>
          </div>
        </div>

        <div className="mt-auto flex gap-2 pt-2">
          <Link href={`/catalogo/conjuntos-campos/editar/${conjunto.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(conjunto)}
            aria-label={`Inativar ${conjunto.nome}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
