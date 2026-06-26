'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import type { KanbanColumn } from '@/components/ui/kanban-board';
import type { ExpedicaoCardKanban } from '@/lib/expedicao/expedicao.types';
import { STATUS_EXPEDICAO_KANBAN_PATCH } from '@/lib/expedicao/expedicao-columns';
import { obterEstiloCardExpedicao } from '@/lib/expedicao/expedicao-card-styles';
import type { StatusExpedicao } from '@/lib/expedicao/expedicao.types';
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconClockExclamation,
  IconPackage,
  IconRefresh,
} from '@tabler/icons-react';

interface ExpedicaoKanbanBoardProps {
  cards: ExpedicaoCardKanban[];
  loading?: boolean;
  columns: KanbanColumn[];
  onStatusChange?: (expedicaoId: string, newStatus: string) => void;
  onCardClick?: (card: ExpedicaoCardKanban) => void;
  onDevolver?: (card: ExpedicaoCardKanban) => void;
}

const STATUS_DEVOLVER_BLOQUEADO = new Set<StatusExpedicao>([
  'DEVOLVIDA',
  'ENTREGUE_FINALIZADO',
  'ARQUIVADO',
]);

function pararPropagacaoDrag(event: React.SyntheticEvent) {
  event.stopPropagation();
}

function ExpedicaoCard({
  card,
  index,
  onCardClick,
  onDevolver,
}: {
  card: ExpedicaoCardKanban;
  index: number;
  onCardClick?: (card: ExpedicaoCardKanban) => void;
  onDevolver?: (card: ExpedicaoCardKanban) => void;
}) {
  const podeDevolver = !STATUS_DEVOLVER_BLOQUEADO.has(card.status);
  const dragBloqueado = card.bloqueado_financeiro === true;
  const estilo = obterEstiloCardExpedicao(card);

  const botaoDevolverClass = card.retrabalho
    ? 'border-fuchsia-300 bg-white/80 text-fuchsia-900 hover:bg-fuchsia-100'
    : card.bloqueado_financeiro
      ? 'border-amber-300 bg-white/80 text-amber-900 hover:bg-amber-100'
      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <Draggable
      draggableId={card.id}
      index={index}
      isDragDisabled={dragBloqueado}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...(dragBloqueado ? {} : provided.dragHandleProps)}
          className={`mb-2 ${snapshot.isDragging ? 'opacity-50' : ''} ${
            dragBloqueado ? 'cursor-default' : ''
          }`}
        >
          <Card
            className={`transition-shadow hover:shadow-md ${estilo.cardClass} ${
              dragBloqueado ? 'cursor-default' : 'cursor-pointer'
            } ${snapshot.isDragging ? `shadow-2xl ring-2 ${estilo.dragRingClass}` : ''}`}
            onClick={() => onCardClick?.(card)}
          >
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {card.os_numero}
                  </Badge>
                  {estilo.badgeRetrabalho && (
                    <Badge className="border-fuchsia-200 bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-100">
                      Retrabalho
                    </Badge>
                  )}
                </div>
                <IconPackage className="h-5 w-5 shrink-0 text-slate-400" />
              </div>
              <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
                {card.titulo}
              </h3>
              <p className="mt-1 line-clamp-1 text-xs uppercase tracking-wide text-slate-500">
                {card.cliente}
              </p>

              {estilo.alerta && (
                card.bloqueado_financeiro && card.link_financeiro ? (
                  <div
                    onClick={pararPropagacaoDrag}
                    onPointerDown={pararPropagacaoDrag}
                  >
                    <Link
                      href={card.link_financeiro}
                      className={`mt-2 flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline ${estilo.alerta.classe}`}
                    >
                      {card.retrabalho ? (
                        <IconRefresh className="h-3.5 w-3.5" />
                      ) : (
                        <IconAlertTriangle className="h-3.5 w-3.5" />
                      )}
                      {estilo.alerta.texto} — ver financeiro
                    </Link>
                  </div>
                ) : (
                  <p
                    className={`mt-2 flex items-center gap-1 text-xs font-medium ${estilo.alerta.classe}`}
                  >
                    {card.retrabalho ? (
                      <IconRefresh className="h-3.5 w-3.5" />
                    ) : card.bloqueado_financeiro ? (
                      <IconAlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                      <IconClockExclamation className="h-3.5 w-3.5" />
                    )}
                    {estilo.alerta.texto}
                  </p>
                )
              )}

              {podeDevolver && onDevolver && (
                <div
                  className="mt-3 border-t border-slate-100 pt-3"
                  onClick={pararPropagacaoDrag}
                  onPointerDown={pararPropagacaoDrag}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`h-9 w-full gap-2 font-medium ${botaoDevolverClass}`}
                    onClick={() => onDevolver(card)}
                  >
                    <IconArrowBackUp className="h-4 w-4" />
                    Devolver para Produção
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}

export function ExpedicaoKanbanBoard({
  cards,
  loading = false,
  columns,
  onStatusChange,
  onCardClick,
  onDevolver,
}: ExpedicaoKanbanBoardProps) {
  const [localCards, setLocalCards] = useState<ExpedicaoCardKanban[]>([]);

  useEffect(() => {
    setLocalCards(cards);
  }, [cards]);

  const groupedColumns = useMemo(() => {
    return columns.map((column) => {
      const columnCards = localCards.filter((card) => card.status === column.status);
      return {
        ...column,
        cards: columnCards,
        count: columnCards.length,
      };
    });
  }, [columns, localCards]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const sourceColumn = columns.find((col) => col.id === source.droppableId);
      const destColumn = columns.find((col) => col.id === destination.droppableId);
      if (!sourceColumn || !destColumn) return;

      const card = localCards.find((item) => item.id === draggableId);
      if (card?.bloqueado_financeiro) {
        toast.error(
          'Movimento bloqueado — regularize a pendência financeira antes de avançar a expedição.',
        );
        return;
      }

      if (source.droppableId !== destination.droppableId) {
        if (!STATUS_EXPEDICAO_KANBAN_PATCH.has(destColumn.status as StatusExpedicao)) {
          return;
        }

        const newCards = [...localCards];
        const cardMovido = newCards.find((item) => item.id === draggableId);
        if (!cardMovido) return;

        cardMovido.status = destColumn.status as StatusExpedicao;
        setLocalCards(newCards);
        onStatusChange?.(draggableId, destColumn.status);
        return;
      }

      const newCards = [...localCards];
      const columnCards = newCards.filter((item) => item.status === sourceColumn.status);
      const [removed] = columnCards.splice(source.index, 1);
      columnCards.splice(destination.index, 0, removed);

      let cardIndex = 0;
      const updatedCards = newCards.map((item) => {
        if (item.status === sourceColumn.status) {
          return columnCards[cardIndex++];
        }
        return item;
      });

      setLocalCards(updatedCards);
    },
    [columns, localCards, onStatusChange],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {columns.map((column) => (
          <div key={column.id} className="space-y-3">
            <div className="h-12 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {groupedColumns.map((column) => (
          <div key={column.id} className="space-y-3">
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
                </CardTitle>
              </CardHeader>
            </Card>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[200px] rounded-lg border-2 border-dashed p-3 transition-colors duration-200 ${
                    snapshot.isDraggingOver
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {column.cards.map((card, index) => (
                    <ExpedicaoCard
                      key={card.id}
                      card={card}
                      index={index}
                      onCardClick={onCardClick}
                      onDevolver={onDevolver}
                    />
                  ))}
                  {provided.placeholder}

                  {column.cards.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <IconPackage className="mb-2 h-8 w-8 opacity-40" />
                      <p className="text-sm">Nenhuma expedição</p>
                      <p className="text-xs">neste status</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
