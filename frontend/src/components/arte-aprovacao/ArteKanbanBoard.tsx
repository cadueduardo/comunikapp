'use client';

import { useMemo, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { atualizarStatusArteItem, assumirItemFilaArte, type FilaArteItem } from '@/lib/arte-fila-api';
import { AnexoGeometriaThumb } from '@/components/shared/AnexoGeometriaThumb';
import { AnexoGeometriaAbrirButton } from '@/components/shared/AnexoGeometriaAbrirButton';
import { ArteWorkspaceModal } from './ArteWorkspaceModal';
import { statusArteParaColunaKanban } from '@/lib/arte-fila-utils';

export interface ArteKanbanColuna {
  id: string;
  title: string;
  status: string;
  color: string;
}

export const COLUNAS_ARTE_KANBAN: ArteKanbanColuna[] = [
  {
    id: 'a-fazer',
    title: 'A fazer',
    status: 'AGUARDANDO_INICIO',
    color: 'border-slate-200 bg-slate-50',
  },
  {
    id: 'em-criacao',
    title: 'Em criação',
    status: 'EM_CRIACAO',
    color: 'border-blue-200 bg-blue-50',
  },
  {
    id: 'aguardando-cliente',
    title: 'Aguardando cliente',
    status: 'AGUARDANDO_CLIENTE',
    color: 'border-amber-200 bg-amber-50',
  },
  {
    id: 'revisao',
    title: 'Revisão',
    status: 'REVISAO_SOLICITADA',
    color: 'border-orange-200 bg-orange-50',
  },
  {
    id: 'aprovada',
    title: 'Aprovada',
    status: 'APROVADA',
    color: 'border-green-200 bg-green-50',
  },
];

const RESPONSABILIDADE_LABEL: Record<string, string> = {
  EMPRESA_CRIA: 'Criar',
  EMPRESA_ADAPTA: 'Adaptar',
  CLIENTE_FORNECE: 'Arquivo cliente',
};

interface ArteKanbanBoardProps {
  itens: FilaArteItem[];
  loading?: boolean;
  onRefresh?: () => void;
}

export function ArteKanbanBoard({
  itens,
  loading = false,
  onRefresh,
}: ArteKanbanBoardProps) {
  const [movendo, setMovendo] = useState(false);
  const [workspaceItem, setWorkspaceItem] = useState<FilaArteItem | null>(null);

  const colunasAgrupadas = useMemo(() => {
    return COLUNAS_ARTE_KANBAN.map((coluna) => ({
      ...coluna,
      itens: itens.filter(
        (item) => statusArteParaColunaKanban(item.status_arte) === coluna.status,
      ),
    }));
  }, [itens]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || movendo) return;
    if (result.source.droppableId === result.destination.droppableId) return;

    const itemId = result.draggableId;
    const destStatus = result.destination.droppableId;
    const item = itens.find((i) => i.item_id === itemId);
    if (!item || item.status_arte === destStatus) return;

    setMovendo(true);
    try {
      if (
        destStatus === 'EM_CRIACAO' &&
        (item.status_arte === 'AGUARDANDO_INICIO' ||
          item.status_arte === 'AGUARDANDO_ARQUIVO_CLIENTE' ||
          item.status_arte === 'ARQUIVO_RECEBIDO')
      ) {
        await assumirItemFilaArte(itemId);
      } else {
        await atualizarStatusArteItem(itemId, destStatus);
      }
      toast.success('Status atualizado');
      onRefresh?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível mover o card',
      );
    } finally {
      setMovendo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={(r) => void handleDragEnd(r)}>
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[480px]">
          {colunasAgrupadas.map((coluna) => (
            <div key={coluna.id} className="w-72 shrink-0">
              <Card className={`${coluna.color} border-2 mb-2`}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{coluna.title}</span>
                    <Badge variant="secondary">{coluna.itens.length}</Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              <Droppable droppableId={coluna.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[120px] rounded-lg p-1 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-muted/60' : ''
                    }`}
                  >
                    {coluna.itens.map((item, index) => (
                      <Draggable
                        key={item.item_id}
                        draggableId={item.item_id}
                        index={index}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <Card
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`cursor-pointer shadow-sm transition-shadow hover:shadow-md ${
                              dragSnapshot.isDragging ? 'ring-2 ring-primary/40' : ''
                            }`}
                            onClick={() => setWorkspaceItem(item)}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex gap-2">
                                {item.referencia_url && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                  >
                                    <AnexoGeometriaThumb
                                      referenciaUrl={item.referencia_url}
                                      geometriaOrigem={item.geometria_origem}
                                    />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-1">
                                    <p className="text-xs text-muted-foreground">
                                      OS #{item.os_numero}
                                    </p>
                                    {(item.mensagens_nao_lidas ?? 0) > 0 && (
                                      <div
                                        className="relative shrink-0"
                                        title={`${item.mensagens_nao_lidas} mensagem(ns) nova(s) do cliente`}
                                      >
                                        <MessageSquare className="h-4 w-4 text-amber-600" />
                                        <Badge
                                          variant="destructive"
                                          className="absolute -right-2 -top-2 h-4 min-w-4 px-1 text-[9px] leading-none"
                                        >
                                          {item.mensagens_nao_lidas! > 9
                                            ? '9+'
                                            : item.mensagens_nao_lidas}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  <p className="font-medium text-sm truncate">
                                    {item.produto_nome}
                                  </p>
                                  {item.cliente_nome && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {item.cliente_nome}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1">
                                <Badge variant="outline" className="text-[10px]">
                                  {RESPONSABILIDADE_LABEL[item.responsabilidade_arte] ||
                                    item.responsabilidade_arte}
                                </Badge>
                                {item.status_arte === 'AGUARDANDO_ARQUIVO_CLIENTE' && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Aguardando arquivo
                                  </Badge>
                                )}
                                {item.designer_atribuido?.nome && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {item.designer_atribuido.nome}
                                  </Badge>
                                )}
                                {item.referencia_url && (
                                  <div
                                    className="ml-auto"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <AnexoGeometriaAbrirButton
                                      referenciaUrl={item.referencia_url}
                                      label="Ref."
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs px-2"
                                    />
                                  </div>
                                )}
                              </div>

                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>

        {movendo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {onRefresh && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        )}
      </DragDropContext>

      {workspaceItem && (
        <ArteWorkspaceModal
          open={Boolean(workspaceItem)}
          onClose={() => {
            setWorkspaceItem(null);
            onRefresh?.();
          }}
          osId={workspaceItem.os_id}
          itemId={workspaceItem.item_id}
          osNumero={workspaceItem.os_numero}
          osNome={workspaceItem.os_nome_servico || workspaceItem.produto_nome}
          produtoNome={workspaceItem.produto_nome}
          onRefreshKanban={onRefresh}
        />
      )}

    </>
  );
}
