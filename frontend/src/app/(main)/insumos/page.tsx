'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  BulkImportDialog,
  type BulkImportResult,
} from '@/components/crud/BulkImportDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MatrizFornecedoresCard,
  type MatrizFornecedorApi,
} from './editar/[id]/matriz-fornecedores-card';

type StatusFilter = 'ativos' | 'inativos' | 'todos';

export default function InsumosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const criadoId = searchParams.get('criado');
  const [data, setData] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ativos');
  const isMobile = useIsMobile();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [matrizInsumo, setMatrizInsumo] = useState<Insumo | null>(null);
  const [inactivateDialog, setInactivateDialog] = useState<{
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
        const data = (await insumosApi.getAll(token)) as Insumo[];
        setData(data);
      }
    } catch (error) {
      toast.error('Ocorreu um erro ao buscar insumos.');
      console.error('Ocorreu um erro ao buscar insumos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (statusFilter === 'todos') return data;
    if (statusFilter === 'ativos') {
      return data.filter((item) => Boolean(item.ativo));
    }
    return data.filter((item) => !Boolean(item.ativo));
  }, [data, statusFilter]);

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
    const result = (await insumosApi.importar(file, token)) as BulkImportResult;
    toast.success('Importação finalizada. Verifique os resultados.');
    await fetchInsumos();
    return result;
  };

  const handleInactivate = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await insumosApi.delete(id, token);
        toast.success('Insumo inativado com sucesso!');
        fetchInsumos();
      }
    } catch (error) {
      console.error('Erro ao inativar insumo:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao inativar insumo',
      );
    }
  };

  const handleReactivate = async (id: string, nome: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Você precisa estar autenticado.');
        return;
      }
      await insumosApi.reativar(id, token);
      toast.success(`Insumo "${nome}" reativado.`);
      fetchInsumos();
    } catch (error) {
      console.error('Erro ao reativar insumo:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao reativar insumo',
      );
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

  const openInactivateDialog = (id: string, nome: string) => {
    setInactivateDialog({
      open: true,
      insumoId: id,
      insumoNome: nome,
    });
  };

  const closeInactivateDialog = () => {
    setInactivateDialog({
      open: false,
      insumoId: null,
      insumoNome: '',
    });
  };

  const confirmInactivate = async () => {
    if (inactivateDialog.insumoId) {
      await handleInactivate(inactivateDialog.insumoId);
      closeInactivateDialog();
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Insumos</h1>
          <p className="text-gray-600">
            Adicione, edite ou inative os insumos do seu negócio.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
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
          {isMobile || viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData.map((insumo) => (
                <InsumoCard
                  key={insumo.id}
                  insumo={insumo}
                  onInactivate={openInactivateDialog}
                  onReactivate={handleReactivate}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={createColumns(
                openInactivateDialog,
                handleReactivate,
                handleDuplicate,
                setMatrizInsumo,
              )}
              data={filteredData}
              getRowClassName={(insumo) =>
                insumo.id === criadoId
                  ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-400 dark:bg-emerald-950/30'
                  : undefined
              }
              onRowClick={(insumo) =>
                router.push(`/insumos/editar/${insumo.id}`)
              }
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={inactivateDialog.open}
        title="Inativar Insumo"
        description={`Tem certeza que deseja inativar o insumo "${inactivateDialog.insumoNome}"? Ele deixa de aparecer nas listas ativas, mas o histórico é preservado.`}
        confirmText="Inativar"
        cancelText="Cancelar"
        onConfirm={confirmInactivate}
        onCancel={closeInactivateDialog}
      />

      <Dialog
        open={Boolean(matrizInsumo)}
        onOpenChange={(open) => !open && setMatrizInsumo(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Fornecedores de {matrizInsumo?.nome}</DialogTitle>
            <DialogDescription>
              Inclua uma alternativa, atualize preços ou altere o fornecedor padrão sem abrir o cadastro completo.
            </DialogDescription>
          </DialogHeader>
          {matrizInsumo && (
            <MatrizFornecedoresCard
              insumoId={matrizInsumo.id}
              initialRows={
                (matrizInsumo.fornecedores_associados ?? []) as MatrizFornecedorApi[]
              }
              onSaved={(result) => {
                const padrao = result.fornecedores.find((item) => item.padrao);
                setData((current) =>
                  current.map((item) =>
                    item.id === matrizInsumo.id
                      ? {
                          ...item,
                          fornecedor: padrao?.fornecedor ?? item.fornecedor,
                          custo_unitario: result.custo_unitario,
                          fornecedores_associados: result.fornecedores,
                        }
                      : item,
                  ),
                );
                setMatrizInsumo((current) =>
                  current
                    ? {
                        ...current,
                        fornecedor: padrao?.fornecedor ?? current.fornecedor,
                        custo_unitario: result.custo_unitario,
                        fornecedores_associados: result.fornecedores,
                      }
                    : null,
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>

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
