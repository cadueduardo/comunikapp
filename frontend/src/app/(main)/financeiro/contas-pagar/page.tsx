'use client';

import { Banknote, Grid3X3, List } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContaPagarCard } from '@/components/ui/conta-pagar-card';
import { useIsMobile } from '@/hooks/use-media-query';
import { contasPagarApi } from '@/lib/api-client';
import { createColumns, ContaPagar } from './columns';

export default function ContasPagarListPage() {
  const searchParams = useSearchParams();
  const statusFiltro = searchParams.get('status') ?? undefined;
  const [itens, setItens] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();
  const columns = useMemo(() => createColumns(), []);

  const carregar = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const data = await contasPagarApi.list(token, {
        status: statusFiltro,
      });
      setItens(data);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao carregar contas a pagar.',
      );
    } finally {
      setLoading(false);
    }
  }, [statusFiltro]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas a pagar</h1>
          <p className="mt-1 text-muted-foreground">
            Obrigações financeiras com fornecedores e pagamentos registrados.
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
          <Button asChild variant="outline">
            <Link href="/financeiro">Voltar</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando contas a pagar...</p>
      ) : itens.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Banknote className="mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Nenhuma conta a pagar</h2>
            <p className="mb-5 mt-1 max-w-md text-sm text-muted-foreground">
              Gere uma conta a partir de um pedido de compra com recebimento ou
              aceite confirmado.
            </p>
            <Button asChild variant="outline">
              <Link href="/compras/pedidos">Ver pedidos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : isMobile || viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {itens.map((item) => (
            <ContaPagarCard key={item.id} conta={item} />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={itens} />
      )}
    </div>
  );
}
