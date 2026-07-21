'use client';

import { Grid3X3, List, Plus, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PedidoCompraCard } from '@/components/ui/pedido-compra-card';
import { useIsMobile } from '@/hooks/use-media-query';
import { comprasApi } from '@/lib/api-client';
import { createColumns, PedidoCompra } from './columns';

export default function PedidosListPage() {
  const [itens, setItens] = useState<PedidoCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();
  const columns = useMemo(() => createColumns(), []);

  const carregar = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const data = await comprasApi.listPedidos(token);
      setItens(data);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao carregar pedidos.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos de compra</h1>
          <p className="mt-1 text-muted-foreground">
            Documentos formais com fornecedor e preços negociados.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!isMobile && (
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                <List className="mr-1 h-4 w-4" />
                Tabela
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 px-3"
              >
                <Grid3X3 className="mr-1 h-4 w-4" />
                Cards
              </Button>
            </div>
          )}
          <Button asChild>
            <Link href="/compras/pedidos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo pedido
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando pedidos...</p>
      ) : itens.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Nenhum pedido cadastrado</h2>
            <p className="mb-5 mt-1 max-w-md text-sm text-muted-foreground">
              Crie o primeiro pedido vinculando um fornecedor e os itens.
            </p>
            <Button asChild>
              <Link href="/compras/pedidos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo pedido
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : isMobile || viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {itens.map((item) => (
            <PedidoCompraCard key={item.id} pedido={item} />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={itens} />
      )}
    </div>
  );
}
