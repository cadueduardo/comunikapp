'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Grid3X3, List, Search, Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-media-query';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatLocalizacaoDisplay } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

interface ItemEstoque {
  id: string;
  insumoId: string;
  insumoNome: string;
  localizacaoId: string;
  localizacaoCodigo: string;
  localizacaoCompleta?: string;
  quantidadeAtual: number;
  quantidadeReservada: number;
  estoqueMinimo: number;
  estoqueMaximo?: number;
  unidadeCompra: string;
  valorUnitario: number;
  dataUltimaMov: string;
  createdAt: string;
  updatedAt: string;
}

export default function ItensEstoquePage() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<ItemEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    itemId: string | null;
    itemNome: string;
  }>({
    open: false,
    itemId: null,
    itemNome: '',
  });

  const fetchItens = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/estoque/itens');
      if (response.ok) {
        const result = await response.json();
        setData(result.data || result);
      } else {
        toast.error("Falha ao buscar itens de estoque.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao buscar itens de estoque.");
      console.error("Ocorreu um erro ao buscar itens de estoque:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiRequest(`/api/estoque/itens/${id}`, { method: 'DELETE' });

      if (response.ok) {
        toast.success('Item de estoque excluído com sucesso!');
        fetchItens();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Erro ao excluir item de estoque';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao excluir item de estoque:', error);
      toast.error('Erro ao excluir item de estoque');
    }
  };

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({
      open: true,
      itemId: id,
      itemNome: nome,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      itemId: null,
      itemNome: '',
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.itemId) {
      await handleDelete(deleteDialog.itemId);
      closeDeleteDialog();
    }
  };

  const filteredData = data.filter(item =>
    item.insumoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.localizacaoCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.unidadeCompra.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!userLoading && user) {
      fetchItens();
    }
  }, [userLoading, user]);

  const getEstoqueStatus = (quantidade: number, minimo: number) => {
    if (quantidade <= 0) return { status: 'SEM ESTOQUE', variant: 'destructive' as const };
    if (quantidade <= minimo) return { status: 'BAIXO', variant: 'secondary' as const };
    return { status: 'NORMAL', variant: 'default' as const };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando itens de estoque...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estoque">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-8 w-8" />
              Itens de Estoque
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os itens armazenados no seu estoque
            </p>
          </div>
        </div>
        <Link href="/estoque/itens/novo">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Item
          </Button>
        </Link>
      </div>

      {/* Filtros e Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, localização..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
        
        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4 mr-2" />
              Tabela
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Cards
            </Button>
          </div>
        )}
      </div>

      {/* Lista de Itens */}
      {viewMode === 'table' ? (
        <div className="crud-table-shell">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Última Mov.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const { status, variant } = getEstoqueStatus(item.quantidadeAtual, item.estoqueMinimo);
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium">
                            {item.insumoNome}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {item.insumoId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {(() => {
                            const { deposito, detalhes } = formatLocalizacaoDisplay(item);
                            return (
                              <div>
                                <div className="font-medium">{deposito}</div>
                                {detalhes && (
                                  <div className="text-xs text-muted-foreground">{detalhes}</div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {item.quantidadeAtual} {item.unidadeCompra}
                        </div>
                        {item.quantidadeReservada > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Reservado: {item.quantidadeReservada}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={variant}>{status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {formatCurrency(item.valorUnitario)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total: {formatCurrency(item.valorUnitario * item.quantidadeAtual)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {item.dataUltimaMov ? new Date(item.dataUltimaMov).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/estoque/itens/editar/${item.id}`}>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(item.id, item.insumoNome)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((item) => {
            const { status, variant } = getEstoqueStatus(item.quantidadeAtual, item.estoqueMinimo);
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.insumoNome}</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        {(() => {
                          const { deposito, detalhes } = formatLocalizacaoDisplay(item);
                          return (
                            <div>
                              <div className="font-medium">{deposito}</div>
                              {detalhes && (
                                <div className="text-xs text-gray-400">{detalhes}</div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <Badge variant={variant}>{status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Quantidade:</span>
                      <span className="text-sm font-medium">
                        {item.quantidadeAtual} {item.unidadeCompra}
                      </span>
                    </div>
                    {item.quantidadeReservada > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Reservado:</span>
                        <span className="text-sm font-medium text-orange-600">
                          {item.quantidadeReservada} {item.unidadeCompra}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor Unitário:</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(item.valorUnitario)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor Total:</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(item.valorUnitario * item.quantidadeAtual)}
                      </span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex gap-2">
                        <Link href={`/estoque/itens/editar/${item.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Editar
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(item.id, item.insumoNome)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchTerm ? 'Nenhum item encontrado' : 'Nenhum item de estoque'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? 'Tente ajustar os termos de busca'
              : 'Comece adicionando seu primeiro item de estoque'
            }
          </p>
          {!searchTerm && (
            <Link href="/estoque/itens/novo">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Primeiro Item
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Dialog de Confirmação */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Excluir Item de Estoque"
        description={`Tem certeza que deseja excluir "${deleteDialog.itemNome}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}
