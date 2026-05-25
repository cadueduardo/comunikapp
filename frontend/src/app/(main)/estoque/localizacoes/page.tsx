'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Grid3X3, List, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Localizacao, createColumns } from './columns';
import { DataTable } from '@/components/data-table/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { LocalizacaoCard } from '@/components/ui/localizacao-card';
import { useIsMobile } from '@/hooks/use-media-query';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

export default function LocalizacoesPage() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<Localizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    localizacaoId: string | null;
    localizacaoNome: string;
  }>({
    open: false,
    localizacaoId: null,
    localizacaoNome: '',
  });

  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    localizacaoNome: string;
    totalItens: number;
    itens: Array<{ nome?: string; codigo?: string; quantidade: number }>;
  }>({
    open: false,
    localizacaoNome: '',
    totalItens: 0,
    itens: [],
  });

  const fetchLocalizacoes = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/estoque/localizacoes');
      if (response.ok) {
        const result = await response.json();
        setData(result.data || result);
      } else {
        toast.error("Falha ao buscar localizações.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao buscar localizações.");
      console.error("Ocorreu um erro ao buscar localizações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiRequest(`/api/estoque/localizacoes/${id}`, { method: 'DELETE' });

      if (response.ok) {
        toast.success('Localização excluída com sucesso!');
        fetchLocalizacoes();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Erro ao excluir localização';
        console.error('❌ Erro na exclusão:', errorData);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Erro ao excluir localização:', error);
      toast.error('Erro ao excluir localização');
    }
  };

  const openDeleteDialog = async (id: string, nome: string) => {
    try {
      const response = await apiRequest(`/api/estoque/localizacoes/${id}/verificar-exclusao`);

      if (response.ok) {
        const result = await response.json();
        
        if (result.podeExcluir) {
          // Pode excluir, mostrar diálogo de confirmação
          setDeleteDialog({
            open: true,
            localizacaoId: id,
            localizacaoNome: nome,
          });
        } else {
          // Não pode excluir, mostrar modal de alerta
          setAlertDialog({
            open: true,
            localizacaoNome: nome,
            totalItens: result.totalItens,
            itens: result.itens || [],
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na verificação:', errorData);
        toast.error(errorData.message || 'Erro ao verificar localização');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar localização:', error);
      toast.error('Erro ao verificar localização');
    }
  };

  const closeDeleteDialog = () => {
    console.log('🔒 Fechando diálogo de exclusão');
    setDeleteDialog({
      open: false,
      localizacaoId: null,
      localizacaoNome: '',
    });
  };

  const confirmDelete = async () => {
    console.log('✅ Confirmando exclusão:', deleteDialog.localizacaoId);
    if (deleteDialog.localizacaoId) {
      await handleDelete(deleteDialog.localizacaoId);
      closeDeleteDialog();
    }
  };

  const closeAlertDialog = () => {
    setAlertDialog({
      open: false,
      localizacaoNome: '',
      totalItens: 0,
      itens: [],
    });
  };

  const filteredData = data.filter(localizacao =>
    (localizacao.deposito?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (localizacao.codigo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (localizacao.corredor?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (localizacao.prateleira?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (localizacao.nivel?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (localizacao.posicao?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (localizacao.descricao?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!userLoading && user) {
      fetchLocalizacoes();
    }
  }, [userLoading, user]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estoque">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Localizações</h1>
            <p className="text-gray-600">Organize os locais físicos de armazenamento do seu estoque.</p>
          </div>
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
          <Link href="/estoque/localizacoes/novo">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Localização
            </Button>
          </Link>
        </div>
      </div>

      {/* Área de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar localizações por nome, código ou tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Carregando localizações...</p>
        </div>
      ) : (
        <>
          {filteredData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'Nenhuma localização encontrada para sua busca.' : 'Nenhuma localização cadastrada.'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile sempre cards, desktop baseado no viewMode */}
              {(isMobile || viewMode === 'cards') ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredData.map((localizacao) => (
                    <LocalizacaoCard
                      key={localizacao.id}
                      localizacao={localizacao}
                      onDelete={(id) => openDeleteDialog(id, localizacao.deposito)}
                    />
                  ))}
                </div>
              ) : (
                <DataTable columns={createColumns({ onDelete: openDeleteDialog })} data={filteredData} />
              )}
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Excluir Localização"
        description={`Tem certeza que deseja excluir a localização "${deleteDialog.localizacaoNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />

      {/* Modal de Alerta para Localizações com Itens */}
      <Dialog open={alertDialog.open} onOpenChange={(open) => { if (!open) closeAlertDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Não é possível excluir esta localização</span>
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p className="text-gray-700">
                  A localização <strong>&ldquo;{alertDialog.localizacaoNome}&rdquo;</strong> não pode ser excluída porque possui <strong>{alertDialog.totalItens} item(s)</strong> estocado(s).
                </p>
                
                {alertDialog.itens.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Itens na localização:</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {alertDialog.itens.map((item, index) => (
                        <div key={index} className="text-sm text-gray-600 flex justify-between">
                          <span className="truncate flex-1">
                            {item.nome || item.codigo || 'Item sem nome'}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {item.quantidade} un.
                          </span>
                        </div>
                      ))}
                    </div>
                    {alertDialog.totalItens > alertDialog.itens.length && (
                      <p className="text-xs text-gray-500 mt-2">
                        ... e mais {alertDialog.totalItens - alertDialog.itens.length} item(s)
                      </p>
                    )}
                  </div>
                )}
                
                <p className="text-sm text-gray-600">
                  Para excluir esta localização, você precisa primeiro mover ou remover todos os itens estocados.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={closeAlertDialog} className="w-full">
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 