'use client';

import { Building2, Grid3X3, List, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FornecedorCard } from '@/components/ui/fornecedor-card';
import { useIsMobile } from '@/hooks/use-media-query';
import { fornecedoresApi } from '@/lib/api-client';
import { createColumns, Fornecedor } from './columns';

export default function FornecedoresConfigPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    fornecedor?: Fornecedor;
  }>({ open: false });

  const carregarFornecedores = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const data = await fornecedoresApi.getAll(token);
      setFornecedores(data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarFornecedores();
  }, [carregarFornecedores]);

  const abrirExclusao = useCallback((fornecedor: Fornecedor) => {
    setDeleteDialog({ open: true, fornecedor });
  }, []);

  const columns = useMemo(() => createColumns(abrirExclusao), [abrirExclusao]);

  const excluirFornecedor = async () => {
    const fornecedor = deleteDialog.fornecedor;
    if (!fornecedor) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await fornecedoresApi.delete(fornecedor.id, token);
      toast.success('Fornecedor excluído com sucesso.');
      setDeleteDialog({ open: false });
      await carregarFornecedores();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao excluir fornecedor.',
      );
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores e parceiros</h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie fornecedores de insumos e parceiros de produção terceirizada.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!isMobile && (
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
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
            <Link href="/fornecedores/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo fornecedor
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Carregando fornecedores...</p>
      ) : fornecedores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Nenhum fornecedor cadastrado</h2>
            <p className="mb-5 mt-1 max-w-md text-sm text-muted-foreground">
              Cadastre seu primeiro fornecedor para vinculá-lo a insumos ou
              serviços terceirizados.
            </p>
            <Button asChild>
              <Link href="/fornecedores/novo">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar fornecedor
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : isMobile || viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fornecedores.map((fornecedor) => (
            <FornecedorCard
              key={fornecedor.id}
              fornecedor={fornecedor}
              onDelete={abrirExclusao}
            />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={fornecedores} />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Excluir fornecedor"
        description={`Tem certeza que deseja excluir o fornecedor "${deleteDialog.fornecedor?.nome ?? ''}"? Se ele possuir vínculos, prefira inativá-lo.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={excluirFornecedor}
        onCancel={() => setDeleteDialog({ open: false })}
      />
    </div>
  );
}
