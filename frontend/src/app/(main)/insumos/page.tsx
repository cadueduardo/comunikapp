'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Grid3X3, List } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Insumo, createColumns } from './columns';
import { DataTable } from '@/components/data-table/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { InsumoCard } from '@/components/ui/insumo-card';
import { useIsMobile } from '@/hooks/use-media-query';

export default function InsumosPage() {
  const [data, setData] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    insumoId: string | null;
    insumoNome: string;
  }>({
    open: false,
    insumoId: null,
    insumoNome: '',
  });

  const fetchInsumos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/insumos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setData(await response.json());
      } else {
        toast.error("Falha ao buscar insumos.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao buscar insumos.");
      console.error("Ocorreu um erro ao buscar insumos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/insumos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Insumo excluído com sucesso!');
        fetchInsumos();
      } else {
        // Tenta ler a mensagem de erro do backend
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Erro ao excluir insumo';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao excluir insumo:', error);
      toast.error('Erro ao excluir insumo');
    }
  };

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({
      open: true,
      insumoId: id,
      insumoNome: nome,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      insumoId: null,
      insumoNome: '',
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.insumoId) {
      await handleDelete(deleteDialog.insumoId);
      closeDeleteDialog();
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Insumos</h1>
          <p className="text-gray-600">Adicione, edite ou remova os insumos do seu negócio.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Switch de visualização apenas no desktop */}
          {!isMobile && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4 mr-1" />
                Tabela
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 px-3"
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Cards
              </Button>
            </div>
          )}
          <Link href="/insumos/novo">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Insumo
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p>Carregando insumos...</p>
      ) : (
        <>
          {/* Mobile sempre cards, desktop baseado no viewMode */}
          {(isMobile || viewMode === 'cards') ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((insumo) => (
                <InsumoCard
                  key={insumo.id}
                  insumo={insumo}
                  onDelete={openDeleteDialog}
                />
              ))}
            </div>
          ) : (
            <DataTable columns={createColumns(openDeleteDialog)} data={data} />
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Excluir Insumo"
        description={`Tem certeza que deseja excluir o insumo "${deleteDialog.insumoNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
} 