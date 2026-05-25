'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Grid3X3, List } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Produto, createColumns } from './columns';
import { DataTable } from '@/components/data-table/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProdutoCard } from './components/produto-card';
import { useIsMobile } from '@/hooks/use-media-query';
import { produtosApi } from '@/lib/api-client';

export default function ProdutosPage() {
  const [data, setData] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    produtoId: string | null;
    produtoNome: string;
  }>({
    open: false,
    produtoId: null,
    produtoNome: '',
  });

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error("Token de autenticação não encontrado.");
        return;
      }
      
      const data = await produtosApi.getAll(token);
      setData(data);
    } catch (error) {
      toast.error("Ocorreu um erro ao buscar produtos.");
      console.error("Ocorreu um erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error("Token de autenticação não encontrado.");
        return;
      }
      
      await produtosApi.delete(id, token);
      toast.success('Produto excluído com sucesso!');
      fetchProdutos();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({
      open: true,
      produtoId: id,
      produtoNome: nome,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      produtoId: null,
      produtoNome: '',
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.produtoId) {
      await handleDelete(deleteDialog.produtoId);
      closeDeleteDialog();
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
          <p className="text-gray-600">Adicione, edite ou remova os templates de produtos do seu negócio.</p>
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
          <Link href="/produtos/novo">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p>Carregando produtos...</p>
      ) : (
        <>
          {/* Mobile sempre cards, desktop baseado no viewMode */}
          {(isMobile || viewMode === 'cards') ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((produto) => (
                <ProdutoCard
                  key={produto.id}
                  produto={produto}
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
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir o produto "${deleteDialog.produtoNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
} 