'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Layers, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CrudPage } from '@/components/crud/CrudPage';
import { DataTable } from '@/components/data-table/data-table';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import {
  EstampaCard,
  type EstampaCardItem,
} from '@/components/ui/estampa-card';
import { ViewToggle } from '@/components/ui/shared/view-toggle';
import { ProdutoFinitoThumb } from '@/components/produtos-finitos/ProdutoFinitoThumb';
import { useIsMobile } from '@/hooks/use-media-query';
import { catalogoEstampasApi } from '@/lib/api-client';
import { catalogoModuleNav } from '@/lib/module-nav';
import { formatCurrency } from '@/lib/utils';

type Estampa = EstampaCardItem;

export default function EstampasPage() {
  const [itens, setItens] = useState<Estampa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [toDelete, setToDelete] = useState<Estampa | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();

  const carregar = async () => {
    setCarregando(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const resposta = await catalogoEstampasApi.getAll(token, { ativo: true });
      setItens(Array.isArray(resposta) ? resposta : []);
    } catch {
      toast.error('Erro ao carregar estampas.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return itens.filter((item) =>
      [item.nome, item.codigo, item.processo?.nome]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [itens, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await catalogoEstampasApi.delete(id, token);
      setItens((prev) => prev.filter((item) => item.id !== id));
      toast.success('Estampa inativada com sucesso.');
    } catch {
      toast.error('Erro ao inativar estampa.');
    }
  };

  const columns = useMemo<ColumnDef<Estampa>[]>(
    () => [
      {
        id: 'estampa',
        header: 'Estampa',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <ProdutoFinitoThumb
              url={row.original.arte_mestra_url}
              alt={row.original.nome}
              className="h-10 w-10 shrink-0"
            />
            <span className="font-medium">{row.original.nome}</span>
          </div>
        ),
      },
      {
        id: 'codigo',
        header: 'Código',
        cell: ({ row }) => row.original.codigo || '-',
      },
      {
        id: 'processo',
        header: 'Processo',
        cell: ({ row }) => row.original.processo?.nome || '-',
      },
      {
        id: 'preco',
        header: 'Preço adicional',
        cell: ({ row }) => formatCurrency(Number(row.original.preco_adicional ?? 0)),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.ativo ? 'default' : 'secondary'}>
            {row.original.ativo ? 'Ativa' : 'Inativa'}
          </Badge>
        ),
      },
      {
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Link href={`/catalogo/estampas/editar/${row.original.id}`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setToDelete(row.original)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const header = (
    <ModuleHeader
      nav={catalogoModuleNav}
      title="Estampas"
      subtitle="Gerencie estampas, arte-mestra e vínculos de personalização."
      backHref="/catalogo"
      actions={
        <Link href="/catalogo/estampas/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova estampa
          </Button>
        </Link>
      }
    />
  );

  const toolbar = (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar estampa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {!isMobile && (
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      )}
    </div>
  );

  const emptyState = (
    <Card>
      <CardContent className="py-10 text-center text-muted-foreground">
        <Layers className="mx-auto mb-3 h-8 w-8" />
        Nenhuma estampa cadastrada.
      </CardContent>
    </Card>
  );

  const cards = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((item) => (
        <EstampaCard key={item.id} estampa={item} onDelete={setToDelete} />
      ))}
    </div>
  );

  return (
    <>
      <CrudPage
        header={header}
        toolbar={toolbar}
        table={
          carregando ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground">
                Carregando...
              </CardContent>
            </Card>
          ) : filtered.length ? (
            isMobile || viewMode === 'cards' ? (
              cards
            ) : (
              <DataTable<Estampa, unknown> columns={columns} data={filtered} />
            )
          ) : (
            emptyState
          )
        }
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Inativar estampa"
        description={
          toDelete ? `Tem certeza que deseja inativar "${toDelete.nome}"?` : ''
        }
        confirmText="Inativar"
        cancelText="Cancelar"
        onConfirm={() => {
          if (toDelete) {
            void handleDelete(toDelete.id);
            setToDelete(null);
          }
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
