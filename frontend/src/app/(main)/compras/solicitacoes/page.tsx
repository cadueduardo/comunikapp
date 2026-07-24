'use client';

import { ClipboardList, Grid3X3, List, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SolicitacaoCompraCard } from '@/components/ui/solicitacao-compra-card';
import { useIsMobile } from '@/hooks/use-media-query';
import { comprasApi } from '@/lib/api-client';
import { comprasModuleNav } from '@/lib/module-nav';
import { createColumns, SolicitacaoCompra } from './columns';

export default function SolicitacoesListPage() {
  const [itens, setItens] = useState<SolicitacaoCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();
  const columns = useMemo(() => createColumns(), []);

  const carregar = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const data = await comprasApi.listSolicitacoes(token);
      setItens(data);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao carregar solicitações.',
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
      <div className="mb-8">
        <ModuleHeader
          nav={comprasModuleNav}
          title="Solicitações de compra"
          subtitle="Necessidades internas antes do pedido ao fornecedor."
          backHref="/compras"
          actions={
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
                <Link href="/compras/solicitacoes/nova">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova solicitação
                </Link>
              </Button>
            </div>
          }
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando solicitações...</p>
      ) : itens.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Nenhuma solicitação cadastrada
            </h2>
            <p className="mb-5 mt-1 max-w-md text-sm text-muted-foreground">
              Registre a primeira necessidade de compra para iniciar o fluxo.
            </p>
            <Button asChild>
              <Link href="/compras/solicitacoes/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nova solicitação
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : isMobile || viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {itens.map((item) => (
            <SolicitacaoCompraCard key={item.id} solicitacao={item} />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={itens} />
      )}
    </div>
  );
}
