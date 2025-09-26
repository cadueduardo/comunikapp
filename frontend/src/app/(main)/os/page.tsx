'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  RefreshCw,
  List,
  Grid3X3,
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-media-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import { DataTable } from '@/components/data-table/data-table';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { OSCard } from './components/os-card';
import { createColumns, type OrdemServico } from './columns';

export default function OSPage() {
  const { user, loading: userLoading } = useUser();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const isMobile = useIsMobile();

  // Configurar view mode baseado no dispositivo
  useEffect(() => {
    setViewMode(isMobile ? 'cards' : 'table');
  }, [isMobile]);

  // Carregar dados quando usu├írio estiver dispon├¡vel
  useEffect(() => {
    if (!userLoading && user) {
      fetchOrdens();
      fetchEstatisticas();
    }
  }, [userLoading, user]);

  const fetchOrdens = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/os');

      if (response.ok) {
        const data = await response.json();
        setOrdens(data.data || []);
      } else {
        throw new Error('Erro ao carregar OS');
      }
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
      toast.error('Erro ao carregar ordens de servi├ºo');
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstatisticas = async () => {
    try {
      const response = await apiRequest('/api/os/estatisticas');
      if (response.ok) {
        const data = await response.json();
        setEstatisticas(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estat├¡sticas:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOrdens(), fetchEstatisticas()]);
    setRefreshing(false);
    toast.success('Dados atualizados!');
  };

  const handleDelete = async (id: string, numero: string) => {
    try {
      const response = await apiRequest(`/api/os/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`OS #${numero} exclu├¡da com sucesso`);
        fetchOrdens();
        fetchEstatisticas();
      } else {
        throw new Error('Erro ao excluir OS');
      }
    } catch (error) {
      console.error('Erro ao excluir OS:', error);
      toast.error('Erro ao excluir ordem de servi├ºo');
    }
  };

  // Filtrar ordens
  const filteredOrdens = ordens.filter(os => {
    const matchesSearch = 
      os.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.nome_servico.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (os.cliente_nome && os.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || os.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const header = (
    <PageHeader
      title="Ordens de Servi├ºo"
      backHref="/dashboard"
      icon={<ClipboardList className="h-8 w-8" />}
      subtitle="Gerencie ordens de servi├ºo e acompanhe a produ├º├úo"
      actions={
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Link href="/os/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova OS
            </Button>
          </Link>
        </div>
      }
    />
  );

  const kpis = estatisticas && (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{estatisticas.total}</div>
            <p className="text-sm text-gray-600">Total Ativas</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {estatisticas.por_status?.FINALIZADA || 0}
            </div>
            <p className="text-sm text-gray-600">Finalizadas</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{estatisticas.prazo_vencendo}</div>
            <p className="text-sm text-gray-600">Prazo Vencendo</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{estatisticas.atrasadas}</div>
            <p className="text-sm text-gray-600">Atrasadas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por n├║mero, servi├ºo ou cliente..."
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
  );

  const content = loading ? (
    <Card>
      <CardContent className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando ordens de servi├ºo...</p>
        </div>
      </CardContent>
    </Card>
  ) : filteredOrdens.length === 0 ? (
    <Card>
      <CardContent className="flex items-center justify-center h-32">
        <div className="text-center">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma ordem de servi├ºo encontrada</p>
          <Link href="/os/novo">
            <Button className="mt-2" variant="outline">
              Criar primeira OS
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  ) : viewMode === 'table' ? (
    <DataTable 
      columns={createColumns(handleDelete)} 
      data={filteredOrdens} 
    />
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredOrdens.map((os) => (
        <OSCard 
          key={os.id} 
          os={os} 
          onDelete={() => handleDelete(os.id, os.numero)}
        />
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {header}
      {kpis}
      {toolbar}
      {content}
    </div>
  );
}
