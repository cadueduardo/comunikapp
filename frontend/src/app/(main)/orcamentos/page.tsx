'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/data-table/data-table';
import { OrcamentoCard } from '@/components/ui/orcamento-card';
import { useIsMobile } from '@/hooks/use-media-query';
import { Plus, Table, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { createColumns, type Orcamento } from './columns';

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    orcamentoId: string | null;
    orcamentoNome: string;
  }>({
    open: false,
    orcamentoId: null,
    orcamentoNome: '',
  });

  useEffect(() => {
    fetchOrcamentos();
  }, []);

  const fetchOrcamentos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }

      const response = await fetch('http://localhost:3001/orcamentos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar orçamentos.');
      }

      const data = await response.json();
      setOrcamentos(data);
    } catch (error) {
      toast.error('Erro ao carregar orçamentos.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }

      const response = await fetch(`http://localhost:3001/orcamentos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Orçamento excluído com sucesso!');
        fetchOrcamentos();
      } else {
        // Tenta ler a mensagem de erro do backend
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Falha ao excluir orçamento.';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Erro ao excluir orçamento.');
      console.error(error);
    }
  };

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({
      open: true,
      orcamentoId: id,
      orcamentoNome: nome,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      orcamentoId: null,
      orcamentoNome: '',
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.orcamentoId) {
      await handleDelete(deleteDialog.orcamentoId);
      closeDeleteDialog();
    }
  };

  const handleShare = async (orcamento: Orcamento) => {
    try {
      const publicUrl = `${window.location.origin}/orcamento/${orcamento.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Orçamento ${orcamento.numero}`,
          text: `Confira o orçamento ${orcamento.nome_servico}`,
          url: publicUrl,
        });
      } else {
        // Fallback: copia para clipboard
        await navigator.clipboard.writeText(publicUrl);
        toast.success('Link público copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error('Erro ao compartilhar orçamento.');
    }
  };

  const columns = createColumns(openDeleteDialog, handleShare);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground">
            Gerencie seus orçamentos e propostas comerciais.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Switch de visualização - apenas para desktop */}
          {!isMobile && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                <Table className="h-4 w-4 mr-1" />
                Tabela
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 px-3"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Cards
              </Button>
            </div>
          )}
          <Link href="/orcamentos/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Orçamento
            </Button>
          </Link>
        </div>
      </div>

      <Separator className="mb-6" />

      {orcamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhum orçamento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro orçamento para testar o motor de cálculo.
              </p>
              <Link href="/orcamentos/novo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Orçamento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Renderização condicional baseada no dispositivo e modo de visualização */}
          {(isMobile || viewMode === 'cards') ? (
            // Cards para mobile ou quando viewMode é 'cards'
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orcamentos.map((orcamento) => (
                <OrcamentoCard
                  key={orcamento.id}
                  orcamento={orcamento}
                  onDelete={openDeleteDialog}
                  onShare={handleShare}
                />
              ))}
            </div>
          ) : (
            // Tabela para desktop quando viewMode é 'table'
            <DataTable columns={columns} data={orcamentos} />
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Excluir Orçamento"
        description={`Tem certeza que deseja excluir o orçamento "${deleteDialog.orcamentoNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
} 