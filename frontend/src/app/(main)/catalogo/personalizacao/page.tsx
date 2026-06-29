'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Edit, Paintbrush, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CrudPage } from '@/components/crud/CrudPage';
import { DataTable } from '@/components/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import {
  ProcessoDecoracaoCard,
  type ProcessoDecoracaoCardItem,
} from '@/components/ui/processo-decoracao-card';
import { ViewToggle } from '@/components/ui/shared/view-toggle';
import { useIsMobile } from '@/hooks/use-media-query';
import { catalogoPersonalizacaoApi } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';

type ProcessoDecoracao = ProcessoDecoracaoCardItem;

export default function PersonalizacaoPage() {
  const [itens, setItens] = useState<ProcessoDecoracao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [toDelete, setToDelete] = useState<ProcessoDecoracao | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();

  const carregar = async () => {
    setCarregando(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const resposta = await catalogoPersonalizacaoApi.getAll(token, { ativo: true });
      setItens(Array.isArray(resposta) ? resposta : []);
    } catch {
      toast.error('Erro ao carregar processos de decoração.');
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
      [item.nome, item.codigo]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [itens, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await catalogoPersonalizacaoApi.delete(id, token);
      setItens((prev) => prev.filter((item) => item.id !== id));
      toast.success('Processo inativado com sucesso.');
    } catch {
      toast.error('Erro ao inativar processo.');
    }
  };

  const columns = useMemo<ColumnDef<ProcessoDecoracao>[]>(
    () => [
      {
        accessorKey: 'nome',
        header: 'Nome',
        cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
      },
      {
        id: 'codigo',
        header: 'Código',
        cell: ({ row }) => row.original.codigo || '-',
      },
      {
        id: 'setup',
        header: 'Setup',
        cell: ({ row }) => formatCurrency(Number(row.original.custo_setup ?? 0)),
      },
      {
        id: 'insumos',
        header: 'Insumos',
        cell: ({ row }) => row.original.insumos_aceitos?.join(', ') || '-',
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
            <Link href={`/catalogo/personalizacao/editar/${row.original.id}`}>
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
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <Link href="/catalogo">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Personalização</h1>
          <p className="text-muted-foreground">
            Processos de decoração, setup e faixas de preço por quantidade.
          </p>
        </div>
      </div>
      <Link href="/catalogo/personalizacao/novo">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo processo
        </Button>
      </Link>
    </div>
  );

  const toolbar = (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar processo..."
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
        <Paintbrush className="mx-auto mb-3 h-8 w-8" />
        Nenhum processo cadastrado.
      </CardContent>
    </Card>
  );

  const cards = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((item) => (
        <ProcessoDecoracaoCard
          key={item.id}
          processo={item}
          onDelete={setToDelete}
        />
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
              <DataTable<ProcessoDecoracao, unknown> columns={columns} data={filtered} />
            )
          ) : (
            emptyState
          )
        }
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Inativar processo"
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
