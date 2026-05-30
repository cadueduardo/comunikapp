'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DragStart,
  DragUpdate,
} from '@hello-pangea/dnd';
import {
  IconClipboardList,
  IconCircleCheck,
  IconHourglass,
  IconX,
  IconAlertTriangle,
  IconFlag,
  IconRefresh,
  IconFilter,
  IconSearch,
  IconPlayerPlay,
  IconPlayerPause,
  IconMaximize,
  IconBuilding,
  IconDownload,
  IconSettings
} from '@tabler/icons-react';
import { WorkflowCardInfo } from '@/components/pcp/WorkflowCardInfo';

// Interfaces
export interface OSCard {
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
  tem_workflow?: boolean;
  workflow_id?: string;
  workflow_nome?: string;
  workflow_setores_nomes?: string[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  statuses?: string[];
  color: string;
  icon: React.ReactNode;
}

interface KanbanBoardProps {
  data?: OSCard[];
  loading?: boolean;
  columns?: KanbanColumn[];
  onStatusChange?: (osId: string, newStatus: string) => void;
  onCardClick?: (card: OSCard) => void;
  onCardsChange?: (cards: OSCard[]) => void;
}

// Colunas do Kanban
const defaultColumns: KanbanColumn[] = [
  { id: 'fila', title: 'Fila', status: 'FILA', color: 'bg-gray-100', icon: <IconClipboardList className="h-4 w-4" /> },
  { id: 'producao', title: 'Em Produção', status: 'PRODUCAO', color: 'bg-blue-100', icon: <IconPlayerPlay className="h-4 w-4" /> },
  { id: 'concluida', title: 'Concluída', status: 'CONCLUIDA', color: 'bg-green-100', icon: <IconCircleCheck className="h-4 w-4" /> },
  { id: 'rejeitada', title: 'Rejeitada', status: 'REJEITADA', color: 'bg-red-100', icon: <IconX className="h-4 w-4" /> },
];

// Componente para card arrastável
function DraggableCard({ card, index, onCardClick, getPrioridadeColor, getAlertaIcon, getAlertaText }: {
  card: OSCard;
  index: number;
  onCardClick?: (card: OSCard) => void;
  getPrioridadeColor: (prioridade: string) => string;
  getAlertaIcon: (alerta: string) => React.ReactNode;
  getAlertaText: (alerta: string) => string;
}) {
  const aguardandoWorkflow =
    card.tem_workflow === false || card.alertas?.includes('sem_workflow');

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 ${snapshot.isDragging ? 'opacity-50' : ''}`}
        >
          <Card
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              aguardandoWorkflow
                ? 'border-amber-300 bg-amber-50/40 hover:border-amber-400'
                : ''
            } ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500' : ''}`}
            onClick={() => onCardClick?.(card)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header do card */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {card.numero}
                      </Badge>
                      <Badge className={getPrioridadeColor(card.prioridade)}>
                        {card.prioridade}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-base mb-1">{card.titulo}</h3>
                    <p className="text-sm text-gray-600 mb-2">{card.cliente}</p>
                  </div>
                </div>

                {aguardandoWorkflow && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-950">
                    <div className="flex items-center gap-1.5 font-medium">
                      <IconAlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                      Aguardando workflow
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-amber-900">
                      Clique para atribuir o workflow e liberar a produção.
                    </p>
                  </div>
                )}

                {card.workflow_nome && (
                  <WorkflowCardInfo
                    compact
                    workflowId={card.workflow_id}
                    workflowNome={card.workflow_nome}
                    setoresNomes={card.workflow_setores_nomes}
                  />
                )}

                {/* Informações do card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Responsável: {card.responsavel}</span>
                    <span>Prazo: {card.data_prazo || 'Sem prazo'}</span>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${card.progresso}%` }}
                    />
                  </div>
                  
                  {/* Alertas (exceto sem_workflow, já exibido acima) */}
                  {card.alertas?.filter((alerta) => alerta !== 'sem_workflow').length > 0 && (
                    <div className="flex items-center gap-1 text-red-600 text-xs">
                      {getAlertaIcon(card.alertas.find((a) => a !== 'sem_workflow')!)}
                      {getAlertaText(card.alertas.find((a) => a !== 'sem_workflow')!)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}

export function KanbanBoard({
  data = [],
  loading = false,
  columns = defaultColumns,
  onStatusChange,
  onCardClick,
  onCardsChange,
}: KanbanBoardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrioridade, setFilterPrioridade] = useState('all');
  const [filterResponsavel, setFilterResponsavel] = useState('all');
  const [localCards, setLocalCards] = useState<OSCard[]>([]);

  // Inicializar estado local apenas com os dados reais da API.
  useEffect(() => {
    setLocalCards(data);
  }, [data]);

  // Filtrar dados usando localCards com memoização
  const filteredData = useMemo(() => {
    return localCards.filter(card => {
      const matchesSearch = card.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.cliente.toLowerCase().includes(searchTerm.toLowerCase());
      const selectedColumn = columns.find((column) => column.status === filterStatus);
      const matchesStatus =
        filterStatus === 'all' ||
        (selectedColumn?.statuses ?? [filterStatus]).includes(card.status);
      const matchesPrioridade = filterPrioridade === 'all' || card.prioridade === filterPrioridade;
      const matchesResponsavel = filterResponsavel === 'all' || card.responsavel === filterResponsavel;

      return matchesSearch && matchesStatus && matchesPrioridade && matchesResponsavel;
    });
  }, [columns, localCards, searchTerm, filterStatus, filterPrioridade, filterResponsavel]);

  // Agrupar cards por status com memoização
  const groupedColumns = useMemo(() => {
    return columns.map(column => {
      const statuses = column.statuses ?? [column.status];
      const columnCards = filteredData.filter(card => statuses.includes(card.status));
      return {
        ...column,
        cards: columnCards,
        count: columnCards.length
      };
    });
  }, [columns, filteredData]);

  // Handler para drag end - baseado no fem-kanban
  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não há destino, não fazer nada
    if (!destination) return;

    // Se o card foi solto na mesma posição, não fazer nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // Se mudou de coluna
    if (source.droppableId !== destination.droppableId) {
      const newCards = [...localCards];
      const card = newCards.find(c => c.id === draggableId);
      
      if (card) {
        // Atualizar status do card
        card.status = destColumn.status;
        
        setLocalCards(newCards);
        onStatusChange?.(draggableId, destColumn.status);
        onCardsChange?.(newCards);
      }
    } else {
      // Reordenação na mesma coluna
      const newCards = [...localCards];
      const sourceStatuses = sourceColumn.statuses ?? [sourceColumn.status];
      const columnCards = newCards.filter(card => sourceStatuses.includes(card.status));
      
      // Remover o card da posição atual
      const [removed] = columnCards.splice(source.index, 1);
      
      // Inserir na nova posição
      columnCards.splice(destination.index, 0, removed);
      
      // Atualizar os cards da coluna
      let cardIndex = 0;
      const updatedCards = newCards.map(card => {
        if (sourceStatuses.includes(card.status)) {
          return columnCards[cardIndex++];
        }
        return card;
      });
      
      setLocalCards(updatedCards);
      onCardsChange?.(updatedCards);
    }
  }, [columns, localCards, onStatusChange, onCardsChange]);

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'URGENTE': return 'bg-red-100 text-red-800 border-red-200';
      case 'ALTA': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAIXA': return 'bg-green-100 text-green-800 border-green-200';
      case 'CRITICA': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertaIcon = (alerta: string) => {
    switch (alerta) {
      case 'sem_workflow': return <IconAlertTriangle className="h-3 w-3" />;
      case 'estoque_baixo': return <IconAlertTriangle className="h-3 w-3" />;
      case 'prazo_proximo': return <IconHourglass className="h-3 w-3" />;
      case 'dados_faltantes': return <IconFlag className="h-3 w-3" />;
      case 'Urgente': return <IconAlertTriangle className="h-3 w-3" />;
      case 'Material atrasado': return <IconAlertTriangle className="h-3 w-3" />;
      default: return <IconAlertTriangle className="h-3 w-3" />;
    }
  };

  const getAlertaText = (alerta: string) => {
    switch (alerta) {
      case 'sem_workflow': return 'Aguardando workflow';
      case 'estoque_baixo': return 'Estoque baixo';
      case 'prazo_proximo': return 'Prazo próximo';
      case 'dados_faltantes': return 'Dados faltantes';
      default: return alerta;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-24 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Header com filtros */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar OS..."
                className="pl-9 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {columns.map(col => (
                  <SelectItem key={col.id} value={col.status}>{col.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="CRITICA">Crítica</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="BAIXA">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <IconFilter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Colunas do Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groupedColumns.map((column) => (
            <div key={column.id} className="space-y-3">
              {/* Header da coluna */}
              <Card className={`${column.color} border-2`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {column.icon}
                      <span className="font-semibold">{column.title}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {column.count}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <IconSettings className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Cards da coluna com drag & drop */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] p-3 rounded-lg transition-colors duration-200 ${
                      snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    } border-2 border-dashed ${
                      snapshot.isDraggingOver ? 'border-blue-300' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {column.cards.map((card, index) => (
                      <DraggableCard
                        key={card.id}
                        card={card}
                        index={index}
                        onCardClick={onCardClick}
                        getPrioridadeColor={getPrioridadeColor}
                        getAlertaIcon={getAlertaIcon}
                        getAlertaText={getAlertaText}
                      />
                    ))}
                    {provided.placeholder}
                    
                    {/* Estado vazio */}
                    {column.cards.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📋</div>
                        <p className="text-sm">Nenhuma OS</p>
                        <p className="text-xs">neste status</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
}
