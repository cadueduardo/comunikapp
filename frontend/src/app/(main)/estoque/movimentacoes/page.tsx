'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Grid3X3, List, Search, TrendingUp, ArrowUpRight, ArrowDownRight, RotateCcw, ArrowLeft } from 'lucide-react';
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

interface Movimentacao {
  id: string;
  estoqueId: string;
  insumoNome: string;
  localizacaoCodigo: string;
  localizacaoCompleta?: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'INVENTARIO' | 'TRANSFERENCIA';
  quantidade: number;
  quantidadeAnterior: number;
  quantidadePosterior: number;
  documentoRef?: string;
  orcamentoId?: string;
  usuarioId: string;
  usuarioNome: string;
  observacoes?: string;
  dataMovimentacao: string;
  createdAt: string;
}

export default function MovimentacoesPage() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const isMobile = useIsMobile();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    movimentacaoId: string | null;
    movimentacaoInfo: string;
  }>({
    open: false,
    movimentacaoId: null,
    movimentacaoInfo: '',
  });

  const fetchMovimentacoes = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/estoque/movimentacoes');
      if (response.ok) {
        const result = await response.json();
        setData(result.data || result);
      } else {
        toast.error("Falha ao buscar movimentações.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao buscar movimentações.");
      console.error("Ocorreu um erro ao buscar movimentações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiRequest(`/api/estoque/movimentacoes/${id}`, { method: 'DELETE' });

      if (response.ok) {
        toast.success('Movimentação excluída com sucesso!');
        fetchMovimentacoes();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Erro ao excluir movimentação';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error);
      toast.error('Erro ao excluir movimentação');
    }
  };

  const openDeleteDialog = (id: string, info: string) => {
    setDeleteDialog({
      open: true,
      movimentacaoId: id,
      movimentacaoInfo: info,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      movimentacaoId: null,
      movimentacaoInfo: '',
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.movimentacaoId) {
      await handleDelete(deleteDialog.movimentacaoId);
      closeDeleteDialog();
    }
  };

  const filteredData = data.filter(mov => {
    const matchesSearch = 
      mov.insumoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.localizacaoCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.usuarioNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mov.documentoRef && mov.documentoRef.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTipo = !filterTipo || mov.tipo === filterTipo;
    
    return matchesSearch && matchesTipo;
  });

  useEffect(() => {
    if (!userLoading && user) {
      fetchMovimentacoes();
    }
  }, [userLoading, user]);

  const getTipoInfo = (tipo: string) => {
    const tipos = {
      ENTRADA: { label: 'Entrada', icon: ArrowUpRight, variant: 'default' as const, color: 'text-green-600' },
      SAIDA: { label: 'Saída', icon: ArrowDownRight, variant: 'secondary' as const, color: 'text-red-600' },
      AJUSTE: { label: 'Ajuste', icon: RotateCcw, variant: 'outline' as const, color: 'text-blue-600' },
      INVENTARIO: { label: 'Inventário', icon: RotateCcw, variant: 'outline' as const, color: 'text-purple-600' },
      TRANSFERENCIA: { label: 'Transferência', icon: TrendingUp, variant: 'outline' as const, color: 'text-orange-600' },
    };
    return tipos[tipo as keyof typeof tipos] || tipos.AJUSTE;
  };



  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando movimentações...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              Movimentações
            </h1>
            <p className="text-gray-600 mt-1">
              Acompanhe todas as entradas, saídas e ajustes do estoque
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/estoque/movimentacoes/entrada">
            <Button variant="outline">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Entrada
            </Button>
          </Link>
          <Link href="/estoque/movimentacoes/saida">
            <Button variant="outline">
              <ArrowDownRight className="h-4 w-4 mr-2" />
              Saída
            </Button>
          </Link>
          <Link href="/estoque/movimentacoes/ajuste">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Ajuste
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros e Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por item, localização, usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos os tipos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
            <option value="AJUSTE">Ajuste</option>
            <option value="INVENTARIO">Inventário</option>
            <option value="TRANSFERENCIA">Transferência</option>
          </select>
          
          {!isMobile && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Lista de Movimentações */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((mov) => {
                  const tipoInfo = getTipoInfo(mov.tipo);
                  const TipoIcon = tipoInfo.icon;
                  return (
                    <tr key={mov.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(mov.dataMovimentacao).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(mov.dataMovimentacao).toLocaleTimeString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={tipoInfo.variant} className="flex items-center gap-1 w-fit">
                          <TipoIcon className="h-3 w-3" />
                          {tipoInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {mov.insumoNome}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(() => {
                            const { deposito, detalhes } = formatLocalizacaoDisplay(mov);
                            return (
                              <div>
                                <div className="font-medium">{deposito}</div>
                                {detalhes && (
                                  <div className="text-xs text-gray-500">{detalhes}</div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${tipoInfo.color}`}>
                          {mov.tipo === 'SAIDA' ? '-' : '+'}{Math.abs(mov.quantidade)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {mov.quantidadeAnterior} → {mov.quantidadePosterior}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {mov.usuarioNome}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {mov.documentoRef || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(mov.id, `${mov.tipo} - ${mov.insumoNome}`)}
                        >
                          Excluir
                        </Button>
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
          {filteredData.map((mov) => {
            const tipoInfo = getTipoInfo(mov.tipo);
            const TipoIcon = tipoInfo.icon;
            return (
              <Card key={mov.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{mov.insumoNome}</CardTitle>
                      <div className="text-sm text-gray-500 mt-1">
                        {(() => {
                          const { deposito, detalhes } = formatLocalizacaoDisplay(mov);
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
                    <Badge variant={tipoInfo.variant} className="flex items-center gap-1">
                      <TipoIcon className="h-3 w-3" />
                      {tipoInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Data:</span>
                      <span className="text-sm font-medium">
                        {new Date(mov.dataMovimentacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Quantidade:</span>
                      <span className={`text-sm font-medium ${tipoInfo.color}`}>
                        {mov.tipo === 'SAIDA' ? '-' : '+'}{Math.abs(mov.quantidade)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Usuário:</span>
                      <span className="text-sm font-medium">
                        {mov.usuarioNome}
                      </span>
                    </div>
                    {mov.documentoRef && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Documento:</span>
                        <span className="text-sm font-medium">
                          {mov.documentoRef}
                        </span>
                      </div>
                    )}
                    {mov.observacoes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600">{mov.observacoes}</p>
                      </div>
                    )}
                    <div className="pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(mov.id, `${mov.tipo} - ${mov.insumoNome}`)}
                        className="w-full"
                      >
                        Excluir
                      </Button>
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
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterTipo ? 'Nenhuma movimentação encontrada' : 'Nenhuma movimentação'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterTipo 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece registrando sua primeira movimentação'
            }
          </p>
          {!searchTerm && !filterTipo && (
            <div className="flex gap-2 justify-center">
              <Link href="/estoque/movimentacoes/entrada">
                <Button variant="outline">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Primeira Entrada
                </Button>
              </Link>
              <Link href="/estoque/movimentacoes/ajuste">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Primeiro Ajuste
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Dialog de Confirmação */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={closeDeleteDialog}
        title="Excluir Movimentação"
        description={`Tem certeza que deseja excluir a movimentação "${deleteDialog.movimentacaoInfo}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
