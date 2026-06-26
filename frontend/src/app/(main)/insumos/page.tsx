'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, Grid3X3, List, Upload } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Insumo, createColumns } from './columns';
import { DataTable } from '@/components/data-table/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { InsumoCard } from '@/components/ui/insumo-card';
import { useIsMobile } from '@/hooks/use-media-query';
import { insumosApi, duplicarInsumo } from '@/lib/api-client';
import { BulkImportDialog } from '@/components/crud/BulkImportDialog';

export default function InsumosPage() {
  const router = useRouter();
  const [data, setData] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
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
      if (token) {
        const data = await insumosApi.getAll(token);
        setData(data);
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao buscar insumos.");
      console.error("Ocorreu um erro ao buscar insumos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Você precisa estar autenticado para baixar o template.');
    }
    await insumosApi.downloadTemplate(token);
    toast.success('Template baixado com sucesso!');
  };

  const handleImportFile = async (file: File) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Você precisa estar autenticado para importar.');
    }
    const result = await insumosApi.importar(file, token);
    toast.success('Importação finalizada. Verifique os resultados.');
    await fetchInsumos();
    return result;
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await insumosApi.delete(id, token);
        toast.success('Insumo excluído com sucesso!');
        fetchInsumos();
      }
    } catch (error) {
      console.error('Erro ao excluir insumo:', error);
      toast.error('Erro ao excluir insumo');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Você precisa estar autenticado.');
        return;
      }
      const copia = await duplicarInsumo(id, token);
      toast.success('Insumo duplicado com sucesso!');
      if (copia?.id) {
        router.push(`/insumos/editar/${copia.id}`);
        return;
      }
      await fetchInsumos();
    } catch (error) {
      console.error('Erro ao duplicar insumo:', error);
      toast.error('Erro ao duplicar insumo');
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
    <div className="space-y-4">
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
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Excel
          </Button>
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
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={createColumns(openDeleteDialog, handleDuplicate)}
              data={data}
            />
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

      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Importar insumos via Excel"
        description="Selecione o arquivo Excel seguindo o template padrão para cadastrar insumos em massa."
        downloadTemplate={handleDownloadTemplate}
        onImport={handleImportFile}
      />
    </div>
  );
} 