'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  ArrowRight,
  Calendar,
  Package,
  MapPin,
  RefreshCw,
  ArrowLeft,
  List,
  Grid3X3,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-media-query';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

interface Transferencia {
  id: string;
  itemId: string;
  itemCodigo: string;
  itemNome: string;
  localizacaoOrigemId: string;
  localizacaoOrigemCodigo: string;
  localizacaoDestinoId: string;
  localizacaoDestinoCodigo: string;
  quantidade: number;
  observacoes?: string;
  dataTransferencia: string;
  status: string;
}

export default function TransferenciasPage() {
  const { user, loading: userLoading } = useUser();
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!userLoading && user) {
      fetchTransferencias();
    }
  }, [userLoading, user]);

  useEffect(() => {
    setViewMode(isMobile ? 'cards' : 'table');
  }, [isMobile]);

  const fetchTransferencias = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/estoque/transferencias');

      if (response.ok) {
        const data = await response.json();
        setTransferencias(data.data || []);
      } else {
        throw new Error('Erro ao carregar transferências');
      }
    } catch (error) {
      console.error('Erro ao carregar transferências:', error);
      toast.error('Erro ao carregar transferências');
      setTransferencias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransferencias();
    setRefreshing(false);
    toast.success('Transferências atualizadas!');
  };

  const filteredTransferencias = transferencias.filter(transferencia =>
    transferencia.itemNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transferencia.itemCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transferencia.localizacaoOrigemCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transferencia.localizacaoDestinoCodigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'CONCLUIDA': { variant: 'default' as const, text: 'Concluída' },
      'PENDENTE': { variant: 'secondary' as const, text: 'Pendente' },
      'CANCELADA': { variant: 'destructive' as const, text: 'Cancelada' },
      'EM_ANDAMENTO': { variant: 'outline' as const, text: 'Em Andamento' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando transferências...</p>
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
              Transferências de Estoque
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie as transferências de itens entre localizações</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Link href="/estoque/transferencias/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transferência
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI no topo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{transferencias.length}</div>
              <p className="text-sm text-muted-foreground">Total de Transferências</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {transferencias.filter((t) => t.status === 'CONCLUIDA').length}
              </div>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {transferencias.filter((t) => t.status === 'PENDENTE').length}
              </div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por item, código ou localização..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-96"
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

      {/* Lista de Transferências */}
      {filteredTransferencias.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma transferência encontrada</p>
              <Link href="/estoque/transferencias/nova">
                <Button className="mt-2" variant="outline">
                  Criar primeira transferência
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <div className="crud-table-shell">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    De
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Para
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransferencias.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{t.itemNome}</span>
                        <Badge variant="outline">{t.itemCodigo}</Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.localizacaoOrigemCodigo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.localizacaoDestinoCodigo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.quantidade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(t.dataTransferencia).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(t.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransferencias.map((transferencia) => (
            <Card key={transferencia.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold">{transferencia.itemNome}</span>
                        <Badge variant="outline">{transferencia.itemCodigo}</Badge>
                      </div>
                      {getStatusBadge(transferencia.status)}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>De: {transferencia.localizacaoOrigemCodigo}</span>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Para: {transferencia.localizacaoDestinoCodigo}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Quantidade:</span>
                        <span>{transferencia.quantidade}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(transferencia.dataTransferencia).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    {transferencia.observacoes && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">Observações:</span> {transferencia.observacoes}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
