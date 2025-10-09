'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KanbanBoard } from '@/components/ui/kanban-board';
import { FullscreenKanban } from '@/components/ui/fullscreen-kanban';

// Importar o tipo OSCard do KanbanBoard
interface OSCard {
  id: string;
  numero: string;
  titulo: string;
  cliente: string;
  status: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  responsavel: string;
  data_prazo: string;
  progresso: number;
  alertas: string[];
}
import { 
  IconBuilding, 
  IconRefresh, 
  IconDownload,
  IconSettings,
  IconFilter,
  IconSearch,
  IconMaximize,
  IconX
} from '@tabler/icons-react';

interface KanbanStats {
  total: number;
  fila: number;
  producao: number;
  concluida: number;
  rejeitada: number;
  atrasadas: number;
  criticas: number;
}

export default function KanbanPage() {
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [kanbanData, setKanbanData] = useState<OSCard[]>([]);
  const [stats, setStats] = useState<KanbanStats>({
    total: 0,
    fila: 0,
    producao: 0,
    concluida: 0,
    rejeitada: 0,
    atrasadas: 0,
    criticas: 0
  });

  // Simular carregamento de dados
  useEffect(() => {
    fetchKanbanData();
  }, []);

  const fetchKanbanData = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      
      // Buscar OSs liberadas para PCP
      const response = await fetch('/api/os/liberadas-para-pcp', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar OSs liberadas para PCP');
      }

      const ossLiberadas = await response.json();
      
      // Converter dados da API para formato do Kanban
      const kanbanData: OSCard[] = ossLiberadas.map((os: any) => ({
        id: os.id,
        numero: os.numero,
        titulo: os.nome_servico,
        cliente: os.cliente?.nome || 'Cliente não informado',
        status: os.status,
        prioridade: os.prioridade || 'MEDIA',
        responsavel: os.responsavel_id || 'Não atribuído',
        data_prazo: os.data_prazo ? new Date(os.data_prazo).toISOString().split('T')[0] : '',
        progresso: os.workflow_progresso || 0,
        alertas: os.alertas_estoque || []
      }));

      setKanbanData(kanbanData);
      
      // Calcular estatísticas
      const stats: KanbanStats = {
        total: kanbanData.length,
        fila: kanbanData.filter(os => os.status === 'LIBERADA_PARA_PCP').length,
        producao: kanbanData.filter(os => os.status === 'EM_WORKFLOW').length,
        concluida: kanbanData.filter(os => os.status === 'FINALIZADA').length,
        rejeitada: kanbanData.filter(os => os.status === 'REJEITADA').length,
        atrasadas: kanbanData.filter(os => {
          if (!os.data_prazo) return false;
          return new Date(os.data_prazo) < new Date() && os.status !== 'FINALIZADA';
        }).length,
        criticas: kanbanData.filter(os => os.prioridade === 'CRITICA').length
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Erro ao buscar dados do Kanban:', error);
      
      // Fallback para dados mock em caso de erro
      const mockData: OSCard[] = [
        {
          id: '1',
          numero: 'OS-2024-001',
          titulo: 'Banner Promocional',
          cliente: 'Empresa ABC',
          status: 'LIBERADA_PARA_PCP',
          prioridade: 'ALTA',
          responsavel: 'João Silva',
          data_prazo: '2024-01-15',
          progresso: 0,
          alertas: []
        }
      ];
      
      setKanbanData(mockData);
      setStats({
        total: 1,
        fila: 1,
        producao: 0,
        concluida: 0,
        rejeitada: 0,
        atrasadas: 0,
        criticas: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (osId: string, newStatus: string) => {
    console.log(`Mudando OS ${osId} para status ${newStatus}`);
    // TODO: Implementar mudança de status via API
  };

  const handleCardsChange = (cards: OSCard[]) => {
    setKanbanData(cards);
  };

  const handleCardClick = (osId: string) => {
    console.log(`Clicando na OS ${osId}`);
    // TODO: Navegar para detalhes da OS
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simular refresh
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    console.log('Exportando dados do Kanban');
    // TODO: Implementar exportação
  };

  const handleSettings = () => {
    console.log('Abrindo configurações do Kanban');
    // TODO: Implementar configurações
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Se estiver em fullscreen, renderizar KanbanBoard em modo fullscreen
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Kanban PCP - Monitoramento de Produção
          </h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsFullscreen(false)}
          >
            <IconX className="h-4 w-4 mr-2" />
            Sair do Fullscreen
          </Button>
        </div>
        <KanbanBoard
          data={kanbanData}
          loading={loading}
          onStatusChange={handleStatusChange}
          onCardClick={handleCardClick}
          onCardsChange={handleCardsChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconBuilding className="h-6 w-6" />
            Kanban PCP
          </h1>
          <p className="text-gray-600">
            Visualização em tempo real do fluxo de produção
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <IconDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={handleSettings}>
            <IconSettings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={toggleFullscreen}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <IconMaximize className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
        </div>
      </div>

      {/* Estatísticas resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total de OS</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{stats.atrasadas}</div>
              <div className="text-sm text-gray-600">Atrasadas</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.criticas}</div>
              <div className="text-sm text-gray-600">Críticas</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.concluida}</div>
              <div className="text-sm text-gray-600">Concluídas</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas importantes */}
      {(stats.atrasadas > 0 || stats.criticas > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="text-orange-600">⚠️</div>
              <div>
                <h3 className="font-semibold text-orange-800">Atenção necessária</h3>
                <p className="text-sm text-orange-700">
                  {stats.atrasadas > 0 && `${stats.atrasadas} OS atrasadas`}
                  {stats.atrasadas > 0 && stats.criticas > 0 && ' • '}
                  {stats.criticas > 0 && `${stats.criticas} OS críticas`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Fluxo de Produção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KanbanBoard
            data={kanbanData}
            loading={loading}
            onStatusChange={handleStatusChange}
            onCardClick={handleCardClick}
            onCardsChange={handleCardsChange}
          />
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <IconSearch className="h-6 w-6" />
              <span>Buscar OS</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <IconRefresh className="h-6 w-6" />
              <span>Atualizar Status</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <IconSettings className="h-6 w-6" />
              <span>Configurar Workflow</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
