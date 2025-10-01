'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  IconX, 
  IconMaximize, 
  IconRefresh,
  IconAlertTriangle,
  IconClock,
  IconCheck,
  IconX as IconXCircle,
  IconUser,
  IconCalendar,
  IconSettings
} from '@tabler/icons-react';

interface OSCard {
  id: string;
  numero: string;
  cliente: string;
  status: string;
  responsavel?: string;
  prazo: string;
  diasRestantes: number;
  alertas: string[];
  prioridade: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  dataCriacao: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  count: number;
  cards: OSCard[];
  color: string;
  icon: React.ReactNode;
}

interface FullscreenKanbanProps {
  data?: OSCard[];
  loading?: boolean;
  onStatusChange?: (osId: string, newStatus: string) => void;
  onCardClick?: (osId: string) => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // em segundos
}

export function FullscreenKanban({ 
  data = [], 
  loading = false, 
  onStatusChange, 
  onCardClick,
  autoRefresh = true,
  refreshInterval = 30
}: FullscreenKanbanProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showControls, setShowControls] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Usar os mesmos dados do KanbanBoard
  const mockData: OSCard[] = data.length > 0 ? data : [
    {
      id: '1',
      numero: 'OS-2024-001',
      cliente: 'Empresa ABC Ltda',
      status: 'FILA',
      responsavel: 'João Silva',
      prazo: '2024-01-15',
      diasRestantes: 3,
      alertas: ['estoque_baixo'],
      prioridade: 'ALTA',
      dataCriacao: '2024-01-10'
    },
    {
      id: '2',
      numero: 'OS-2024-002',
      cliente: 'Comércio XYZ',
      status: 'PRODUCAO',
      responsavel: 'Maria Santos',
      prazo: '2024-01-18',
      diasRestantes: 6,
      alertas: ['prazo_proximo'],
      prioridade: 'NORMAL',
      dataCriacao: '2024-01-12'
    },
    {
      id: '3',
      numero: 'OS-2024-003',
      cliente: 'Indústria DEF',
      status: 'CONCLUIDA',
      responsavel: 'Pedro Costa',
      prazo: '2024-01-20',
      diasRestantes: 0,
      alertas: [],
      prioridade: 'BAIXA',
      dataCriacao: '2024-01-08'
    }
  ];

  const columns: KanbanColumn[] = [
    {
      id: 'fila',
      title: 'Fila',
      status: 'FILA',
      count: 0,
      cards: [],
      color: 'bg-blue-50 border-blue-300',
      icon: <IconClock className="h-5 w-5 text-blue-600" />
    },
    {
      id: 'producao',
      title: 'Produção',
      status: 'PRODUCAO',
      count: 0,
      cards: [],
      color: 'bg-yellow-50 border-yellow-300',
      icon: <IconAlertTriangle className="h-5 w-5 text-yellow-600" />
    },
    {
      id: 'concluida',
      title: 'Concluída',
      status: 'CONCLUIDA',
      count: 0,
      cards: [],
      color: 'bg-green-50 border-green-300',
      icon: <IconCheck className="h-5 w-5 text-green-600" />
    },
    {
      id: 'rejeitada',
      title: 'Rejeitada',
      status: 'REJEITADA',
      count: 0,
      cards: [],
      color: 'bg-red-50 border-red-300',
      icon: <IconXCircle className="h-5 w-5 text-red-600" />
    }
  ];

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // TODO: Implementar refresh real da API
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Esconder controles após 5 segundos em fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Mostrar controles ao mover mouse
  const handleMouseMove = () => {
    if (isFullscreen) {
      setShowControls(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Filtrar dados
  const filteredData = (data.length > 0 ? data : mockData).filter(card => {
    const matchesSearch = card.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Agrupar cards por status
  const groupedColumns = columns.map(column => ({
    ...column,
    cards: filteredData.filter(card => card.status === column.status),
    count: filteredData.filter(card => card.status === column.status).length
  }));

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'URGENTE': return 'bg-red-100 text-red-800 border-red-300';
      case 'ALTA': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'NORMAL': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'BAIXA': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAlertaIcon = (alerta: string) => {
    switch (alerta) {
      case 'estoque_baixo': return <IconAlertTriangle className="h-4 w-4 text-red-500" />;
      case 'prazo_proximo': return <IconClock className="h-4 w-4 text-orange-500" />;
      case 'dados_faltantes': return <IconXCircle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getAlertaText = (alerta: string) => {
    switch (alerta) {
      case 'estoque_baixo': return 'Estoque baixo';
      case 'prazo_proximo': return 'Prazo próximo';
      case 'dados_faltantes': return 'Dados faltantes';
      default: return alerta;
    }
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-white p-6 overflow-auto"
    : "space-y-6";

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Carregando Kanban...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} onMouseMove={handleMouseMove}>
      {/* Header com controles */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Kanban PCP - Monitoramento de Produção
              </h1>
              <Badge variant="outline" className="text-sm">
                {lastRefresh.toLocaleTimeString()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSettings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar OS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Button variant="outline" size="sm" onClick={() => setLastRefresh(new Date())}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleFullscreen}
                className={isFullscreen ? 'bg-blue-100 text-blue-800' : ''}
              >
                <IconMaximize className="h-4 w-4 mr-2" />
                {isFullscreen ? 'Sair' : 'Fullscreen'}
              </Button>
              
              {isFullscreen && (
                <Button variant="outline" size="sm" onClick={() => document.exitFullscreen()}>
                  <IconX className="h-4 w-4 mr-2" />
                  Fechar
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estatísticas resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredData.length}</div>
              <div className="text-sm text-gray-600">Total de OS</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredData.filter(card => card.diasRestantes <= 1 && card.diasRestantes > 0).length}
              </div>
              <div className="text-sm text-gray-600">Atrasadas</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredData.filter(card => card.prioridade === 'URGENTE').length}
              </div>
              <div className="text-sm text-gray-600">Críticas</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredData.filter(card => card.status === 'CONCLUIDA').length}
              </div>
              <div className="text-sm text-gray-600">Concluídas</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colunas do Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
        {groupedColumns.map((column) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Header da coluna */}
            <Card className={`${column.color} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    {column.icon}
                    {column.title}
                  </div>
                  <Badge variant="secondary" className="text-sm font-bold">
                    {column.count}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Cards da coluna */}
            <div className="space-y-3 min-h-[400px]">
              <AnimatePresence>
                {column.cards.map((card) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2"
                      onClick={() => onCardClick?.(card.id)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header do card */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-lg">{card.numero}</h4>
                              <p className="text-sm text-gray-600 truncate">{card.cliente}</p>
                            </div>
                            <Badge 
                              className={`text-xs font-semibold ${getPrioridadeColor(card.prioridade)}`}
                            >
                              {card.prioridade}
                            </Badge>
                          </div>

                          {/* Responsável */}
                          {card.responsavel && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <IconUser className="h-4 w-4" />
                              {card.responsavel}
                            </div>
                          )}

                          {/* Prazo */}
                          <div className="flex items-center gap-2 text-sm">
                            <IconCalendar className="h-4 w-4 text-gray-500" />
                            <span className={card.diasRestantes <= 1 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                              {card.diasRestantes <= 0 ? 'Vencida' : `${card.diasRestantes} dias restantes`}
                            </span>
                          </div>

                          {/* Alertas */}
                          {card.alertas.length > 0 && (
                            <div className="space-y-1">
                              {card.alertas.map((alerta, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 text-xs bg-red-50 text-red-700 px-2 py-1 rounded border"
                                >
                                  {getAlertaIcon(alerta)}
                                  {getAlertaText(alerta)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Estado vazio */}
              {column.cards.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-lg font-medium">Nenhuma OS</p>
                  <p className="text-sm">neste status</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer com informações */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 text-center text-sm text-gray-500"
          >
            <p>
              Última atualização: {lastRefresh.toLocaleString('pt-BR')} | 
              Total de OS: {filteredData.length} | 
              {autoRefresh && `Auto-refresh: ${refreshInterval}s`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
