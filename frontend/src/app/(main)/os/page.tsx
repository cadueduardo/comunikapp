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
import { OSCard } from '@/components/ui/os-card';
import { AprovarOSModal } from '@/components/ui/os/AprovarOSModal';
import { createColumns, type OrdemServico } from './columns';
import { solicitarAtualizacaoBadgesSidebar } from '@/lib/sidebar-badge-refresh';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FiltroAtivoOS = 'ativas' | 'inativas' | 'todas';

export default function OSPage() {
  const { user, loading: userLoading } = useUser();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroAtivoOS>('ativas');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [aprovarTarget, setAprovarTarget] = useState<OrdemServico | null>(null);
  const [aprovarModalOpen, setAprovarModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Configurar view mode baseado no dispositivo
  useEffect(() => {
    setViewMode(isMobile ? 'cards' : 'table');
  }, [isMobile]);

  // Carregar dados quando usuário estiver disponível
  useEffect(() => {
    if (!userLoading && user) {
      fetchOrdens();
      fetchEstatisticas();
    }
  }, [userLoading, user, filtroAtivo]);

  const fetchOrdens = async () => {
    try {
      setLoading(true);
      const ativoParam =
        filtroAtivo === 'inativas'
          ? 'false'
          : filtroAtivo === 'todas'
            ? 'all'
            : 'true';
      const response = await apiRequest(`/os?ativo=${ativoParam}`);

      if (response.ok) {
        const data = await response.json();
        setOrdens(data.data || []);
      } else {
        throw new Error('Erro ao carregar OS');
      }
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
      toast.error('Erro ao carregar ordens de serviço');
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstatisticas = async () => {
    try {
      const response = await apiRequest('/os/estatisticas');
      if (response.ok) {
        const data = await response.json();
        setEstatisticas(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOrdens(), fetchEstatisticas()]);
    setRefreshing(false);
    toast.success('Dados atualizados!');
  };


  const handleInativar = async (id: string, motivo: string) => {
    try {
      const response = await apiRequest(`/os/${id}/inativar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || 'Erro ao inativar OS');
      }

      toast.success('OS inativada com sucesso');
      solicitarAtualizacaoBadgesSidebar();
      await Promise.all([fetchOrdens(), fetchEstatisticas()]);
    } catch (error) {
      console.error('Erro ao inativar OS:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao inativar ordem de serviço');
      throw error;
    }
  };

  const handleReativar = async (id: string) => {
    try {
      const response = await apiRequest(`/os/${id}/reativar`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || 'Erro ao reativar OS');
      }

      toast.success('OS reativada com sucesso');
      solicitarAtualizacaoBadgesSidebar();
      await Promise.all([fetchOrdens(), fetchEstatisticas()]);
    } catch (error) {
      console.error('Erro ao reativar OS:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao reativar ordem de serviço');
      throw error;
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
      title="Ordens de Serviço"
      backHref="/dashboard"
      icon={<ClipboardList className="h-8 w-8" />}
      subtitle="Gerencie ordens de serviço e acompanhe a produção"
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
          placeholder="Buscar por número, serviço ou cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-96"
        />
      </div>

      <Select
        value={filtroAtivo}
        onValueChange={(value) => setFiltroAtivo(value as FiltroAtivoOS)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Visibilidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ativas">Somente ativas</SelectItem>
          <SelectItem value="inativas">Somente inativas</SelectItem>
          <SelectItem value="todas">Todas</SelectItem>
        </SelectContent>
      </Select>

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
          <p className="mt-2 text-gray-600">Carregando ordens de serviço...</p>
        </div>
      </CardContent>
    </Card>
  ) : filteredOrdens.length === 0 ? (
    <Card>
      <CardContent className="flex items-center justify-center h-32">
        <div className="text-center">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma ordem de serviço encontrada</p>
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
      columns={createColumns(
        handleInativar,
        handleReativar,
        (os: OrdemServico) => {
          setAprovarTarget(os);
          setAprovarModalOpen(true);
        },
      )}
      data={filteredOrdens}
    />
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredOrdens.map((os) => (
        <OSCard 
          key={os.id} 
          os={os} 
          onDelete={() => handleInativar(os.id, 'Inativação via visualização em cards')}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {header}
      {kpis}
      {toolbar}
      {content}

      <AprovarOSModal
        osId={aprovarTarget?.id ?? null}
        osNumero={aprovarTarget?.numero ?? null}
        osStatus={aprovarTarget?.status ?? null}
        open={aprovarModalOpen}
        onOpenChange={(open) => {
          setAprovarModalOpen(open);
          if (!open) setAprovarTarget(null);
        }}
        onAprovado={() => {
          fetchOrdens();
          fetchEstatisticas();
        }}
      />
    </div>
  );
}
