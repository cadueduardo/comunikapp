'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Warehouse, 
  Package, 
  AlertTriangle, 
  Activity,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ModuleHubCards } from '@/components/layout/ModuleHubCards';
import { estoqueModuleNav } from '@/lib/module-nav';

interface DashboardData {
  totalLocalizacoes: number;
  totalItens: number;
  totalMovimentacoes: number;
  itensAbaixoMinimo: number;
  valorTotalEstoque: number;
  ultimasMovimentacoes: Array<Record<string, unknown>>;
  estatisticas: {
    entradas: number;
    saidas: number;
    ajustes: number;
    transferencias: number;
  };
}

export default function EstoquePage() {
  const { user, loading: userLoading } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!userLoading && user) {
      fetchDashboardData();
    }
  }, [userLoading, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de acesso não encontrado');
      }

      // Chamada real para o backend com headers de tenant/roles centralizados
      const response = await apiRequest('/api/estoque/itens/dashboard');

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
      
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      
      // Fallback para dados mockados em caso de erro
      const mockData: DashboardData = {
        totalLocalizacoes: 24,
        totalItens: 150,
        totalMovimentacoes: 156,
        itensAbaixoMinimo: 3,
        valorTotalEstoque: 45000,
        ultimasMovimentacoes: [],
        estatisticas: {
          entradas: 89,
          saidas: 67,
          ajustes: 0,
          transferencias: 0
        }
      };
      
      setDashboardData(mockData);
      setError('Usando dados de demonstração - Backend não disponível');
      toast.warning('Usando dados de demonstração');
      
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (!userLoading && user) {
      await fetchDashboardData();
    }
    setRefreshing(false);
    toast.success('Dashboard atualizado!');
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardData} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={estoqueModuleNav}
        title="Visão geral"
        subtitle="Gerencie seu estoque de forma eficiente e organizada"
        icon={<Warehouse className="h-7 w-7 sm:h-8 sm:w-8" />}
        actions={
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        }
      />

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Localizações</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalLocalizacoes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Localizações ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalItens || 0}</div>
            <p className="text-xs text-muted-foreground">
              Itens em estoque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(dashboardData?.valorTotalEstoque || 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor em estoque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações Hoje</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalMovimentacoes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Movimentações totais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estatísticas de Movimentação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Estatísticas de Movimentação
            </CardTitle>
            <CardDescription>
              Resumo das movimentações do estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData?.estatisticas.entradas || 0}
                </div>
                <p className="text-sm text-gray-600">Entradas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {dashboardData?.estatisticas.saidas || 0}
                </div>
                <p className="text-sm text-gray-600">Saídas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {dashboardData?.estatisticas.ajustes || 0}
                </div>
                <p className="text-sm text-gray-600">Ajustes</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {dashboardData?.estatisticas.transferencias || 0}
                </div>
                <p className="text-sm text-gray-600">Transferências</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itens Abaixo do Mínimo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Itens Abaixo do Mínimo
            </CardTitle>
            <CardDescription>
              Itens que precisam de reposição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {dashboardData?.itensAbaixoMinimo || 0}
              </div>
              <p className="text-sm text-gray-600">Itens com estoque baixo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opções de Navegação */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recursos</h2>
        <ModuleHubCards
          nav={estoqueModuleNav}
          gridClassName="lg:grid-cols-4"
        />
      </div>

      {/* Informações do Sistema */}
      <div className="text-xs text-gray-500 text-center">
        Última atualização: {new Date().toLocaleString('pt-BR')}
      </div>
    </div>
  );
} 