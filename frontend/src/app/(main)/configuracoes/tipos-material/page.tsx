'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Grid3X3, List } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { TipoMaterial, createColumns } from './columns';
import { DataTable } from '@/components/data-table/data-table';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TipoMaterialCard } from '@/components/ui/tipo-material-card';
import { useIsMobile } from '@/hooks/use-media-query';
import { tiposMaterialApi } from '@/lib/api-client';
import { configuracoesModuleNav } from '@/lib/module-nav';

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
      if (!token) {
        toast.error("Token de acesso não encontrado.");
        return;
      }

      const tiposMaterial = await tiposMaterialApi.getAll(token);
      
      // Converter parametros_padrao de string JSON para objeto
      const tiposMaterialProcessados = (tiposMaterial as any[]).map((tipo: any) => ({
        ...tipo,
        parametros_padrao: tipo.parametros_padrao 
          ? JSON.parse(tipo.parametros_padrao) as {
              tipo_calculo?: string;
              espacamento?: number;
              quantidade_por_m2?: number;
              multiplicador?: number;
              quantidade_fixa?: number;
            }
          : undefined
      }));
      
      setData(tiposMaterialProcessados);
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
      if (!token) {
        toast.error("Token de acesso não encontrado.");
        return;
      }

      await tiposMaterialApi.delete(id, token);
      toast.success('Tipo de material excluído com sucesso!');
      fetchTiposMaterial();
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
    <div className="space-y-4">
      <ModuleHeader
        nav={configuracoesModuleNav}
        title="Gerenciar Tipos de Material"
        subtitle="Configure os tipos de material para cálculo automático de consumo."
        backHref="/configuracoes"
        actions={
          <div className="flex items-center gap-2">
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
        }
      />

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
            <DataTable columns={createColumns({ 
              onEdit: (tipoMaterial) => {
                // Redirecionar para edição
                window.location.href = `/configuracoes/tipos-material/editar/${tipoMaterial.id}`;
              },
              onDelete: openDeleteDialog
            })} data={data} />
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