'use client';

import { useMemo, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import {
  COLUNAS_INSTALACAO_KANBAN,
  STATUS_LOTE_KANBAN_SEM_DRAG,
} from '@/lib/instalacao/instalacao-kanban.constants';
import {
  formatarDataPrevisaoLote,
  montarEnderecoResumido,
} from '@/lib/instalacao/instalacao-lote-utils';
import type { LotePainelOs, StatusInstalacao } from '@/lib/instalacao/instalacao.types';
import { IconCalendar, IconUsers } from '@tabler/icons-react';

interface InstalacaoOsKanbanBoardProps {
  lotes: LotePainelOs[];
  onLoteSelecionado: (lote: LotePainelOs) => void;
  onAtualizado?: () => void;
}

export function InstalacaoOsKanbanBoard({
  lotes,
  onLoteSelecionado,
  onAtualizado,
}: InstalacaoOsKanbanBoardProps) {
  const [movendo, setMovendo] = useState(false);

  const colunasAgrupadas = useMemo(
    () =>
      COLUNAS_INSTALACAO_KANBAN.map((coluna) => ({
        ...coluna,
        lotes: lotes.filter((lote) => lote.status_instalacao === coluna.status),
      })),
    [lotes],
  );

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || movendo) return;
    if (result.source.droppableId === result.destination.droppableId) return;

    const loteId = result.draggableId;
    const novoStatus = result.destination.droppableId as StatusInstalacao;
    const lote = lotes.find((item) => item.id === loteId);

    if (!lote || lote.status_instalacao === novoStatus) return;

    if (novoStatus === 'CONCLUIDO') {
      toast.error(
        'A conclusão deve ser feita pelo aplicativo de campo, com evidências e assinatura.',
      );
      return;
    }

    setMovendo(true);
    try {
      await instalacaoApi.atualizarStatusLote(loteId, novoStatus);
      toast.success('Status do lote atualizado.');
      onAtualizado?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o status do lote.',
      );
    } finally {
      setMovendo(false);
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
        <div className="flex min-h-[420px] gap-3 overflow-x-auto pb-2">
          {colunasAgrupadas.map((coluna) => (
            <div key={coluna.id} className="w-72 shrink-0">
              <Card
                className={`mb-2 border-2 border-border bg-card ${coluna.headerClass}`}
              >
                <CardHeader className="px-4 py-3">
                  <CardTitle className="flex items-center justify-between text-sm text-foreground">
                    <span>{coluna.title}</span>
                    <Badge variant="secondary">{coluna.lotes.length}</Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              <Droppable
                droppableId={coluna.status}
                isDropDisabled={coluna.dropDisabled}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[120px] space-y-2 rounded-lg border border-dashed border-border p-1 transition-colors ${
                      snapshot.isDraggingOver
                        ? 'bg-muted/60'
                        : 'bg-transparent'
                    }`}
                  >
                    {coluna.lotes.map((lote, index) => {
                      const dragDesabilitado = STATUS_LOTE_KANBAN_SEM_DRAG.includes(
                        lote.status_instalacao,
                      );

                      return (
                        <Draggable
                          key={lote.id}
                          draggableId={lote.id}
                          index={index}
                          isDragDisabled={dragDesabilitado || movendo}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <Card
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`cursor-pointer border-border bg-card shadow-sm transition-shadow hover:shadow-md ${
                                dragSnapshot.isDragging
                                  ? 'ring-2 ring-primary/40'
                                  : ''
                              } ${dragDesabilitado ? 'cursor-default' : ''}`}
                              onClick={() => onLoteSelecionado(lote)}
                            >
                              <CardContent className="space-y-2 p-3">
                                <p className="line-clamp-2 text-sm font-medium text-foreground">
                                  {montarEnderecoResumido(lote)}
                                </p>
                                {lote.item_os.produto_servico && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {lote.item_os.produto_servico}
                                  </p>
                                )}
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <p className="flex items-center gap-1">
                                    <IconUsers className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">
                                      {lote.equipe_instalacao?.trim() ||
                                        'Equipe não definida'}
                                    </span>
                                  </p>
                                  <p className="flex items-center gap-1">
                                    <IconCalendar className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">
                                      {formatarDataPrevisaoLote(
                                        lote.data_previsao,
                                        lote.turno_previsao,
                                      )}
                                    </span>
                                  </p>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  {lote.quantidade_alocada} un. · Clique para
                                  ver evidências
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {movendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </>
  );
}
