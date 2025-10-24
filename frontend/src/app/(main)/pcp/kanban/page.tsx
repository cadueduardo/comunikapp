'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/ui/kanban-board';
import { KanbanFilters, KanbanFilters as KanbanFiltersType } from '@/components/pcp/KanbanFilters';
import { KanbanStats } from '@/components/pcp/KanbanStats';
import { useKanbanData } from '@/hooks/useKanbanData';
import { 
  IconBuilding, 
  IconRefresh, 
  IconDownload,
  IconSettings,
  IconMaximize,
  IconX
} from '@tabler/icons-react';

export default function KanbanPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const {
    cards,
    stats,
    loading,
    error,
    filters,
    isFullscreen: hookFullscreen,
    lastRefresh,
    setFilters,
    refreshData,
    toggleFullscreen,
    handleStatusChange,
    handleCardClick
  } = useKanbanData();

  const handleFiltersChange = (newFilters: KanbanFiltersType) => {
    setFilters(newFilters);
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  const handleToggleFullscreen = () => {
    toggleFullscreen();
    setIsFullscreen(!isFullscreen);
  };

  const handleExport = () => {
    console.log('Exportando dados do Kanban');
    // TODO: Implementar exportação
  };

  const handleSettings = () => {
    console.log('Abrindo configurações do Kanban');
    // TODO: Implementar configurações
  };

  // Se estiver em fullscreen, renderizar KanbanBoard em modo fullscreen
  if (isFullscreen || hookFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Kanban PCP - Monitoramento de Produção
          </h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              toggleFullscreen();
              setIsFullscreen(false);
            }}
          >
            <IconX className="h-4 w-4 mr-2" />
            Sair do Fullscreen
          </Button>
        </div>
        
        <KanbanBoard
          data={cards}
          loading={loading}
          onStatusChange={handleStatusChange}
          onCardClick={handleCardClick}
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
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
            onClick={handleToggleFullscreen}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <IconMaximize className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <KanbanFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        loading={loading}
        stats={stats}
      />

      {/* Estatísticas */}
      <KanbanStats stats={stats} loading={loading} />

      {/* Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="text-red-600">⚠️</div>
              <div>
                <h3 className="font-semibold text-red-800">Erro ao carregar dados</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fluxo de Produção</span>
            <div className="text-sm text-gray-500">
              Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KanbanBoard
            data={cards}
            loading={loading}
            onStatusChange={handleStatusChange}
            onCardClick={handleCardClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}
