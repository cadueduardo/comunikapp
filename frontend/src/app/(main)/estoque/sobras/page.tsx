'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Filter, Download, Eye, Edit, Trash2, ArrowLeft, RefreshCw, List, Grid3X3, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-media-query';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

interface Sobra {
  id: string;
  codigoSobra: string;
  descricao: string;
  dimensoes?: string;
  area?: number;
  quantidade: number;
  unidadeMedida: string;
  material: string;
  cor?: string;
  acabamento?: string;
  status: string;
  origem?: string;
  dataGeracao: string;
  quantidadeAproveitada: number;
  economiaGerada: number;
  estoque: {
    codigo: string;
    nome: string;
    localizacao: {
      codigo: string;
      nome: string;
    };
  };
}

interface Metricas {
  totalSobras: number;
  sobrasAproveitadas: number;
  economiaTotal: number;
  taxaAproveitamento: number;
}

export default function SobrasPage() {
  const [sobras, setSobras] = useState<Sobra[]>([]);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [materialFilter, setMaterialFilter] = useState('todos');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [refreshing, setRefreshing] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    carregarSobras();
    carregarMetricas();
  }, []);

  useEffect(() => {
    setViewMode(isMobile ? 'cards' : 'table');
  }, [isMobile]);

  const carregarSobras = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/estoque/sobras', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const raw = (data as any).data || data;
        const normalize = (s: any): Sobra => ({
          id: s.id,
          codigoSobra: s.codigoSobra ?? s.codigo_sobra ?? '',
          descricao: s.descricao ?? '',
          dimensoes: s.dimensoes ?? undefined,
          area: s.area != null ? Number(s.area) : undefined,
          quantidade: Number(s.quantidade ?? 0),
          unidadeMedida: s.unidadeMedida ?? s.unidade_medida ?? '',
          material: s.material ?? '',
          cor: s.cor ?? undefined,
          acabamento: s.acabamento ?? undefined,
          status: s.status ?? 'DISPONIVEL',
          origem: s.origem ?? undefined,
          dataGeracao: s.dataGeracao ?? s.data_geracao ?? s.created_at ?? new Date().toISOString(),
          quantidadeAproveitada: Number(s.quantidadeAproveitada ?? s.quantidade_aproveitada ?? 0),
          economiaGerada: Number(s.economiaGerada ?? s.economia_gerada ?? 0),
          estoque: {
            codigo: s.item_codigo ?? s.estoque?.codigo ?? '',
            nome: s.item_nome ?? s.estoque?.nome ?? '',
            localizacao: {
              codigo: s.localizacao_codigo ?? s.estoque?.localizacao?.codigo ?? '',
              nome: s.localizacao_nome ?? s.estoque?.localizacao?.nome ?? '',
            },
          },
        });
        setSobras(Array.isArray(raw) ? raw.map(normalize) : []);
      } else {
        console.error('Erro ao carregar sobras');
      }
    } catch (error) {
      console.error('Erro ao carregar sobras:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarMetricas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/estoque/sobras/metricas/economia', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetricas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([carregarSobras(), carregarMetricas()]);
    } finally {
      setRefreshing(false);
    }
  };

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; sobraId: string | null; sobraCodigo: string }>(
    { open: false, sobraId: null, sobraCodigo: '' }
  );

  const openDeleteDialog = (id: string, codigo: string) =>
    setDeleteDialog({ open: true, sobraId: id, sobraCodigo: codigo });

  const closeDeleteDialog = () =>
    setDeleteDialog({ open: false, sobraId: null, sobraCodigo: '' });

  const confirmDelete = async () => {
    if (!deleteDialog.sobraId) return;
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/estoque/sobras/${deleteDialog.sobraId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao excluir sobra');
      }
      toast.success('Sobra excluída com sucesso');
      await carregarSobras();
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message);
    } finally {
      closeDeleteDialog();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DISPONIVEL: { label: 'Disponível', variant: 'default' as const },
      APROVEITADA: { label: 'Aproveitada', variant: 'secondary' as const },
      VENCIDA: { label: 'Vencida', variant: 'destructive' as const },
      DESCARTADA: { label: 'Descartada', variant: 'outline' as const },
      RESERVADA: { label: 'Reservada', variant: 'default' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const sobrasFiltradas = sobras.filter((sobra) => {
    const lower = (v?: string) => (v ?? '').toLowerCase();
    const st = lower(searchTerm);
    const matchesSearch =
      lower(sobra.codigoSobra).includes(st) ||
      lower(sobra.descricao).includes(st) ||
      lower(sobra.material).includes(st) ||
      lower(sobra.estoque?.nome).includes(st) ||
      lower(sobra.estoque?.localizacao?.codigo).includes(st);

    const matchesStatus = statusFilter === 'todos' || sobra.status === statusFilter;
    const matchesMaterial = materialFilter === 'todos' || lower(sobra.material).includes(lower(materialFilter));

    return matchesSearch && matchesStatus && matchesMaterial;
  });

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando sobras...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
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
              <Package className="h-8 w-8" />
              Sobras e Retalhos
            </h1>
            <p className="text-gray-600 mt-1">Gestão de sobras e retalhos do setor de comunicação visual</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {!isMobile && (
            <>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4 mr-2" /> Tabela
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid3X3 className="h-4 w-4 mr-2" /> Cards
              </Button>
            </>
          )}
          <Link href="/estoque/sobras/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Sobra
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de Métricas */}
      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Sobras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricas.totalSobras}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aproveitadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricas.sobrasAproveitadas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Economia Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatarMoeda(metricas.economiaTotal)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Aproveitamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricas.taxaAproveitamento}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar sobras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="DISPONIVEL">Disponível</SelectItem>
                <SelectItem value="APROVEITADA">Aproveitada</SelectItem>
                <SelectItem value="VENCIDA">Vencida</SelectItem>
                <SelectItem value="DESCARTADA">Descartada</SelectItem>
                <SelectItem value="RESERVADA">Reservada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os materiais</SelectItem>
                <SelectItem value="PVC">PVC</SelectItem>
                <SelectItem value="ADESIVO">Adesivo</SelectItem>
                <SelectItem value="TECIDO">Tecido</SelectItem>
                <SelectItem value="LONA">Lona</SelectItem>
                <SelectItem value="PAPEL">Papel</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setStatusFilter('todos');
              setMaterialFilter('todos');
            }}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Sobras */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sobrasFiltradas.map((sobra) => (
            <Card key={sobra.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{sobra.codigoSobra}</CardTitle>
                    <p className="text-sm text-muted-foreground">{sobra.material}</p>
                  </div>
                  {getStatusBadge(sobra.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">{sobra.descricao}</p>
                  {sobra.dimensoes && (
                    <p className="text-sm text-muted-foreground">
                      Dimensões: {sobra.dimensoes}
                    </p>
                  )}
                  {sobra.area && (
                    <p className="text-sm text-muted-foreground">
                      Área: {sobra.area} m²
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Quantidade: {sobra.quantidade} {sobra.unidadeMedida}
                  </p>
                  {sobra.cor && (
                    <p className="text-sm text-muted-foreground">
                      Cor: {sobra.cor}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Localização: {sobra.estoque.localizacao.codigo}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Gerado em: {formatarData(sobra.dataGeracao)}
                  </p>
                  {sobra.economiaGerada > 0 && (
                    <p className="text-sm font-medium text-green-600">
                      Economia: {formatarMoeda(sobra.economiaGerada)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/estoque/sobras/${sobra.id}`}>
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/estoque/sobras/${sobra.id}/editar`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sobras ({sobrasFiltradas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Código</th>
                    <th className="text-left p-2">Descrição</th>
                    <th className="text-left p-2">Material</th>
                    <th className="text-left p-2">Dimensões</th>
                    <th className="text-left p-2">Quantidade</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Localização</th>
                    <th className="text-left p-2">Economia</th>
                    <th className="text-left p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sobrasFiltradas.map((sobra) => (
                    <tr key={sobra.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{sobra.codigoSobra}</td>
                      <td className="p-2">{sobra.descricao}</td>
                      <td className="p-2">{sobra.material}</td>
                      <td className="p-2">{sobra.dimensoes || '-'}</td>
                      <td className="p-2">
                        {sobra.quantidade} {sobra.unidadeMedida}
                      </td>
                      <td className="p-2">{getStatusBadge(sobra.status)}</td>
                      <td className="p-2">{sobra.estoque.localizacao.codigo}</td>
                      <td className="p-2">
                        {sobra.economiaGerada > 0 ? formatarMoeda(sobra.economiaGerada) : '-'}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/estoque/sobras/${sobra.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/estoque/sobras/${sobra.id}/editar`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                  <Button size="sm" variant="ghost" onClick={() => openDeleteDialog(sobra.id, sobra.codigoSobra)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {sobrasFiltradas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">Nenhuma sobra encontrada</p>
            <Link href="/estoque/sobras/novo">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Sobra
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={closeDeleteDialog}
        title="Excluir Sobra"
        description={`Tem certeza que deseja excluir a sobra "${deleteDialog.sobraCodigo}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
