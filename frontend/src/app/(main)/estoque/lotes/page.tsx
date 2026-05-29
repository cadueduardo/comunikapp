'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-media-query';
import { Grid3X3, List, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  Plus, 
  Search, 
  
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

interface Lote {
  id: string;
  numeroLote: string;
  itemNome: string;
  insumoNome: string;
  localizacaoCodigo: string;
  quantidadeLote: number;
  dataFabricacao?: string;
  dataValidade?: string;
  status: string;
  diasRestantes?: number;
  unidadeCompra: string;
  criadoEm: string;
}

export default function LotesPage() {
  const { user, loading: userLoading } = useUser();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();

  const fetchLotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const qs = params.toString();
      const endpoint = `/api/estoque/lotes${qs ? `?${qs}` : ''}`;
      const response = await apiRequest(endpoint);

      if (response.ok) {
        const data = await response.json();
        const rows = (data.data || []) as Array<Record<string, unknown>>;
        const normalized: Lote[] = rows.map((r) => ({
          id: String(r.id ?? ''),
          numeroLote: String(r.numeroLote ?? r.numero_lote ?? ''),
          itemNome: String(r.itemNome ?? r.item_nome ?? r.itemCodigo ?? ''),
          insumoNome: String(r.insumoNome ?? r.insumo_nome ?? ''),
          localizacaoCodigo: String(r.localizacaoCodigo ?? r.localizacao_codigo ?? ''),
          quantidadeLote: Number(r.quantidadeLote ?? r.quantidade_lote ?? 0),
          dataFabricacao: r.dataFabricacao ? String(r.dataFabricacao) : (r.data_fabricacao ? String(r.data_fabricacao) : undefined),
          dataValidade: r.dataValidade ? String(r.dataValidade) : (r.data_validade ? String(r.data_validade) : undefined),
          status: String(r.status ?? 'ATIVO'),
          diasRestantes: (r.diasRestantes ?? r.dias_restantes ?? undefined) as number | undefined,
          unidadeCompra: String(r.unidadeCompra ?? r.unidade_compra ?? ''),
          criadoEm: String(r.criado_em ?? r.createdAt ?? ''),
        }));
        setLotes(normalized);
      } else {
        toast.error("Erro ao carregar lotes");
      }
    } catch (error) {
      toast.error("Erro ao carregar lotes");
      console.error("Erro ao carregar lotes:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchLotes();
    }
  }, [fetchLotes, userLoading, user]);

  const handleRefresh = async () => {
    await fetchLotes();
    toast.success('Lotes atualizados!');
  };

  const getStatusInfo = (status: string, diasRestantes?: number) => {
    switch (status) {
      case 'ATIVO':
        if (diasRestantes && diasRestantes <= 0) {
          return { label: 'VENCIDO', variant: 'destructive' as const, icon: XCircle };
        }
        if (diasRestantes && diasRestantes <= 7) {
          return { label: 'ATENÇÃO', variant: 'destructive' as const, icon: AlertTriangle };
        }
        if (diasRestantes && diasRestantes <= 30) {
          return { label: 'ATENÇÃO', variant: 'secondary' as const, icon: Clock };
        }
        return { label: 'ATIVO', variant: 'default' as const, icon: CheckCircle };
      case 'CONSUMIDO':
        return { label: 'CONSUMIDO', variant: 'secondary' as const, icon: CheckCircle };
      case 'VENCIDO':
        return { label: 'VENCIDO', variant: 'destructive' as const, icon: XCircle };
      case 'BLOQUEADO':
        return { label: 'BLOQUEADO', variant: 'destructive' as const, icon: XCircle };
      default:
        return { label: status, variant: 'default' as const, icon: Package };
    }
  };

  const filteredLotes = lotes.filter((lote) => {
    const q = (searchTerm || '').toLowerCase();
    if (!q) return true;
    const toLow = (v?: string) => (v || '').toLowerCase();
    return [lote.numeroLote, lote.itemNome, lote.insumoNome, lote.localizacaoCodigo]
      .some((v) => toLow(v).includes(q));
  });

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando lotes...</p>
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
              Lotes de Estoque
            </h1>
            <p className="text-muted-foreground mt-1">Controle de lotes e validades do estoque</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
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
          <Link href="/estoque/lotes/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lote
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por número do lote, item, insumo ou localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativo</option>
            <option value="CONSUMIDO">Consumido</option>
            <option value="VENCIDO">Vencido</option>
            <option value="BLOQUEADO">Bloqueado</option>
          </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lotes</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{lotes.length}</div>
            <p className="text-xs text-muted-foreground">
              Lotes registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {lotes.filter(l => l.status === 'ATIVO').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Lotes disponíveis
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos do Vencimento</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {lotes.filter(l => l.status === 'ATIVO' && l.diasRestantes && l.diasRestantes <= 30).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Vencem em 30 dias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lotes.filter(l => l.status === 'VENCIDO' || (l.diasRestantes && l.diasRestantes <= 0)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Lotes vencidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Lotes */}
      {viewMode === 'table' ? (
      <div className="crud-table-shell">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Lote
                </th>
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
                  Fabricação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Validade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLotes.map((lote) => {
                const statusInfo = getStatusInfo(lote.status, lote.diasRestantes);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={lote.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {lote.numeroLote}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium">
                          {lote.itemNome}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {lote.insumoNome}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{lote.localizacaoCodigo || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {lote.quantidadeLote} {lote.unidadeCompra}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {lote.dataFabricacao 
                          ? new Date(lote.dataFabricacao).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {lote.dataValidade 
                          ? new Date(lote.dataValidade).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <InfoTooltip
                        content={
                          lote.status === 'VENCIDO'
                            ? 'Lote venceu (dias restantes <= 0).'
                            : lote.status === 'ATIVO' && typeof lote.diasRestantes === 'number'
                              ? lote.diasRestantes <= 7
                                ? `Vence em ${lote.diasRestantes} dia(s).`
                                : lote.diasRestantes <= 30
                                  ? `Vence em ${lote.diasRestantes} dia(s) (atenção).`
                                  : 'Dentro da validade.'
                              : 'Status do lote.'
                        }
                      >
                        <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </InfoTooltip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Link href={`/estoque/lotes/${lote.id}`}>
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </Link>
                        <Link href={`/estoque/lotes/${lote.id}/editar`}>
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </Link>
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
          {filteredLotes.map((lote) => {
            const statusInfo = getStatusInfo(lote.status, lote.diasRestantes);
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={lote.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Lote {lote.numeroLote}</CardTitle>
                      <div className="text-sm text-muted-foreground">{lote.itemNome}</div>
                    </div>
                    <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" /> {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Localização:</span><span>{lote.localizacaoCodigo || '-'}</span></div>
                    <div className="flex justify-between"><span>Quantidade:</span><span>{lote.quantidadeLote} {lote.unidadeCompra}</span></div>
                    <div className="flex justify-between"><span>Fabricação:</span><span>{lote.dataFabricacao ? new Date(lote.dataFabricacao).toLocaleDateString('pt-BR') : '-'}</span></div>
                    <div className="flex justify-between"><span>Validade:</span><span>{lote.dataValidade ? new Date(lote.dataValidade).toLocaleDateString('pt-BR') : '-'}</span></div>
                    <div className="pt-3 border-t flex gap-2">
                      <Link href={`/estoque/lotes/${lote.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full">Ver</Button></Link>
                      <Link href={`/estoque/lotes/${lote.id}/editar`} className="flex-1"><Button variant="outline" size="sm" className="w-full">Editar</Button></Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Estado vazio */}
      {filteredLotes.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum lote encontrado
          </h3>
          <p className="text-muted-foreground mb-4">
            {lotes.length === 0 
              ? 'Não há lotes registrados no sistema'
              : 'Nenhum lote corresponde aos filtros aplicados'
            }
          </p>
          {lotes.length === 0 && (
            <Link href="/estoque/lotes/novo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Lote
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
