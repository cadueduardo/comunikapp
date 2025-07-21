'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Grid3X3, List } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { TipoMaterial, createColumns } from './columns';
import { DataTable } from '@/components/data-table/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TipoMaterialCard } from '@/components/ui/tipo-material-card';
import { useIsMobile } from '@/hooks/use-media-query';

export default function TiposMaterialPage() {
  const [data, setData] = useState<TipoMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    tipoMaterialId: string | null;
    tipoMaterialNome: string;
  }>({
    open: false,
    tipoMaterialId: null,
    tipoMaterialNome: '',
  });

  const fetchTiposMaterial = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/tipos-material', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setData(await response.json());
      } else {
        toast.error("Falha ao buscar tipos de material.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao buscar tipos de material.");
      console.error("Ocorreu um erro ao buscar tipos de material:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/tipos-material/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Tipo de material excluído com sucesso!');
        fetchTiposMaterial();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Erro ao excluir tipo de material';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao excluir tipo de material:', error);
      toast.error('Erro ao excluir tipo de material');
    }
  };

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({
      open: true,
      tipoMaterialId: id,
      tipoMaterialNome: nome,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      tipoMaterialId: null,
      tipoMaterialNome: '',
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.tipoMaterialId) {
      await handleDelete(deleteDialog.tipoMaterialId);
      closeDeleteDialog();
    }
  };

  useEffect(() => {
    fetchTiposMaterial();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Tipos de Material</h1>
          <p className="text-gray-600">Configure os tipos de material para cálculo automático de consumo.</p>
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
          <Link href="/configuracoes/tipos-material/novo">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Tipo de Material
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p>Carregando tipos de material...</p>
      ) : (
        <>
          {/* Mobile sempre cards, desktop baseado no viewMode */}
          {(isMobile || viewMode === 'cards') ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((tipoMaterial) => (
                <TipoMaterialCard
                  key={tipoMaterial.id}
                  tipoMaterial={tipoMaterial}
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
        title="Excluir Tipo de Material"
        description={`Tem certeza que deseja excluir o tipo de material "${deleteDialog.tipoMaterialNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
} 