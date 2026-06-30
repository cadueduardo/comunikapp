'use client';

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProdutoFinitoThumb } from '@/components/produtos-finitos/ProdutoFinitoThumb';
import { cn } from '@/lib/utils';

export type GaleriaItemSalva = {
  kind: 'salva';
  id: string;
  url: string;
};

export type GaleriaItemPendente = {
  kind: 'pendente';
  id: string;
  preview: string;
  file: File;
};

export type GaleriaItem = GaleriaItemSalva | GaleriaItemPendente;

interface ProdutoFinitoGaleriaImagensProps {
  itens: GaleriaItem[];
  onReorder: (itens: GaleriaItem[]) => void;
  onRemover: (id: string) => void;
  reordenando?: boolean;
}

function SortableThumb({
  item,
  index,
  onRemover,
  reordenando,
}: {
  item: GaleriaItem;
  index: number;
  onRemover: (id: string) => void;
  reordenando?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: reordenando });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-background',
        isDragging && 'z-10 opacity-80 shadow-lg ring-2 ring-primary/40',
        item.kind === 'pendente' && 'border-primary/30',
      )}
    >
      {index === 0 ? (
        <Badge className="absolute left-0.5 top-0.5 z-10 px-1 py-0 text-[9px]">
          Capa
        </Badge>
      ) : null}

      {item.kind === 'salva' ? (
        <ProdutoFinitoThumb
          url={item.url}
          alt=""
          className="h-full w-full rounded-md"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.preview} alt="" className="h-full w-full object-cover" />
      )}

      {item.kind === 'pendente' ? (
        <Badge
          variant="secondary"
          className="absolute bottom-0.5 right-0.5 px-1 py-0 text-[9px]"
        >
          Nova
        </Badge>
      ) : null}

      <button
        type="button"
        className="absolute right-0.5 top-0.5 z-10 rounded-full bg-black/60 p-0.5 text-white"
        onClick={() => onRemover(item.id)}
        aria-label="Remover imagem"
      >
        <X className="h-3 w-3" />
      </button>

      {!reordenando ? (
        <button
          type="button"
          className="absolute bottom-0.5 left-0.5 z-10 rounded bg-black/50 p-0.5 text-white"
          aria-label="Arrastar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

export function ProdutoFinitoGaleriaImagens({
  itens,
  onReorder,
  onRemover,
  reordenando = false,
}: ProdutoFinitoGaleriaImagensProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  if (itens.length === 0) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = itens.findIndex((item) => item.id === active.id);
    const newIndex = itens.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder(arrayMove(itens, oldIndex, newIndex));
  };

  return (
    <div className="space-y-2">
      {itens.length > 1 ? (
        <p className="text-xs text-muted-foreground">
          Arraste para definir a ordem. A primeira imagem é a capa do produto.
        </p>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={itens.map((item) => item.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-2">
            {itens.map((item, index) => (
              <SortableThumb
                key={item.id}
                item={item}
                index={index}
                onRemover={onRemover}
                reordenando={reordenando}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
