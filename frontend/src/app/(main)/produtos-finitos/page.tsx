'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import {
  Edit,
  Grid3X3,
  List,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { CrudPage } from '@/components/crud/CrudPage';
import { DataTable } from '@/components/data-table/data-table';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-media-query';
import { produtosFinitosApi } from '@/lib/api-client';
import { catalogoModuleNav } from '@/lib/module-nav';
import { ProdutoFinitoThumb } from '@/components/produtos-finitos/ProdutoFinitoThumb';
import { ProdutoFinitoCard } from './components/produto-finito-card';
import { formatCurrency } from '@/lib/utils';

type ProdutoFinito = {
  id: string;
  nome: string;
  sku: string;
  preco_venda: number | string;
  preco_promocional?: number | string | null;
  estoque_atual: number;
  ativo: boolean;
  categoria?: { id: string; nome: string } | null;
  imagens?: Array<{ id: string; url_imagem: string; ordem: number }>;
};

export default function ProdutosFinitosPage() {
  const [itens, setItens] = useState<ProdutoFinito[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [toDelete, setToDelete] = useState<ProdutoFinito | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();

  const carregar = async () => {
    setCarregando(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const resposta = (await produtosFinitosApi.getAll(token, {
        limit: 100,
        ativo: true,
      })) as { data?: ProdutoFinito[] };
      setItens(resposta.data || []);
    } catch {
      toast.error('Erro ao carregar produtos.');
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
      [item.nome, item.sku, item.categoria?.nome]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [itens, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await produtosFinitosApi.delete(id, token);
      setItens((prev) => prev.filter((item) => item.id !== id));
      toast.success('Produto inativado com sucesso.');
    } catch {
      toast.error('Erro ao inativar produto.');
    }
  };

  const columns = useMemo<ColumnDef<ProdutoFinito>[]>(
    () => [
      {
        id: 'produto',
        header: 'Produto',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <ProdutoFinitoThumb
              url={row.original.imagens?.[0]?.url_imagem}
              alt={row.original.nome}
              className="h-10 w-10 shrink-0"
            />
            <span className="font-medium">{row.original.nome}</span>
          </div>
        ),
      },
      { accessorKey: 'sku', header: 'SKU' },
      {
        id: 'categoria',
        header: 'Categoria',
        cell: ({ row }) => row.original.categoria?.nome || '-',
      },
      {
        id: 'preco',
        header: 'Preço',
        cell: ({ row }) => formatCurrency(Number(row.original.preco_venda)),
      },
      {
        id: 'estoque',
        header: 'Estoque',
        cell: ({ row }) => row.original.estoque_atual,
      },
      {
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Link href={`/produtos-finitos/editar/${row.original.id}`}>
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
      title="Produtos"
      subtitle="Gerencie o catálogo de produtos de prateleira da sua loja."
      backHref="/catalogo"
      actions={
        <Link href="/produtos-finitos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
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
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {!isMobile && (
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="mr-1 h-4 w-4" />
            Tabela
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <Grid3X3 className="mr-1 h-4 w-4" />
            Cards
          </Button>
        </div>
      )}
    </div>
  );

  const emptyState = (
    <Card>
      <CardContent className="py-10 text-center text-muted-foreground">
        <Package className="mx-auto mb-3 h-8 w-8" />
        Nenhum produto cadastrado.
      </CardContent>
    </Card>
  );

  const cards = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((item) => (
        <ProdutoFinitoCard
          key={item.id}
          produto={item}
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
              <DataTable<ProdutoFinito, unknown> columns={columns} data={filtered} />
            )
          ) : (
            emptyState
          )
        }
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Inativar produto"
        description={
          toDelete
            ? `Tem certeza que deseja inativar "${toDelete.nome}"?`
            : ''
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
