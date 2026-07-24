'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, FormInput, Plus, Search, Trash2 } from 'lucide-react';
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
  ConjuntoCamposCard,
  type ConjuntoCamposCardItem,
} from '@/components/ui/conjunto-campos-card';
import { ViewToggle } from '@/components/ui/shared/view-toggle';
import { useIsMobile } from '@/hooks/use-media-query';
import { catalogoConjuntosCamposApi } from '@/lib/api-client';
import { catalogoModuleNav } from '@/lib/module-nav';

type ConjuntoCampos = ConjuntoCamposCardItem;

export default function ConjuntosCamposPage() {
  const [itens, setItens] = useState<ConjuntoCampos[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [toDelete, setToDelete] = useState<ConjuntoCampos | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();

  const carregar = async () => {
    setCarregando(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const resposta = await catalogoConjuntosCamposApi.getAll(token, { ativo: true });
      setItens(Array.isArray(resposta) ? resposta : []);
    } catch {
      toast.error('Erro ao carregar conjuntos de campos.');
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
      [item.nome, item.descricao]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [itens, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await catalogoConjuntosCamposApi.delete(id, token);
      setItens((prev) => prev.filter((item) => item.id !== id));
      toast.success('Conjunto inativado com sucesso.');
    } catch {
      toast.error('Erro ao inativar conjunto.');
    }
  };

  const columns = useMemo<ColumnDef<ConjuntoCampos>[]>(
    () => [
      {
        accessorKey: 'nome',
        header: 'Nome',
        cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
      },
      {
        id: 'campos',
        header: 'Campos',
        cell: ({ row }) => row.original.campos?.length ?? 0,
      },
      {
        id: 'estampas',
        header: 'Estampas',
        cell: ({ row }) => row.original._count?.estampas ?? 0,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.ativo ? 'default' : 'secondary'}>
            {row.original.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        ),
      },
      {
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Link href={`/catalogo/conjuntos-campos/editar/${row.original.id}`}>
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
      title="Conjuntos de campos"
      subtitle="Defina campos variáveis reutilizáveis nas personalizações."
      backHref="/catalogo"
      actions={
        <Link href="/catalogo/conjuntos-campos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo conjunto
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
          placeholder="Buscar conjunto..."
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
        <FormInput className="mx-auto mb-3 h-8 w-8" />
        Nenhum conjunto cadastrado.
      </CardContent>
    </Card>
  );

  const cards = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((item) => (
        <ConjuntoCamposCard key={item.id} conjunto={item} onDelete={setToDelete} />
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
              <DataTable<ConjuntoCampos, unknown> columns={columns} data={filtered} />
            )
          ) : (
            emptyState
          )
        }
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Inativar conjunto"
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
