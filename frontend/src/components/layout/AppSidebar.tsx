'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { IconGripVertical, IconArrowsSort } from '@tabler/icons-react';
import { SidebarBody } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarIconWithBadge } from '@/components/layout/SidebarIconWithBadge';
import {
  buildSidebarNavItems,
  type SidebarMenuContadores,
  type SidebarMenuPermissions,
  type SidebarNavItem,
} from '@/lib/sidebar-menu';
import { useSidebarMenuOrder } from '@/hooks/use-sidebar-menu-order';
import { cn } from '@/lib/utils';
import {
  expandirItensAchatados,
  idsModulosAchatados,
} from '@/lib/sidebar-achatamento';
import { SIDEBAR_ICON_CLASS } from '@/lib/sidebar-menu';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { Star } from 'lucide-react';

interface AppSidebarProps {
  userId: string;
  permissions: SidebarMenuPermissions;
  contadores: SidebarMenuContadores;
}

function SortableNavRow({
  item,
  reorderMode,
}: {
  item: SidebarNavItem;
  reorderMode: boolean;
}) {
  const { open, animate, setOpen } = useSidebar();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !reorderMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const iconComBadge = (
    <SidebarIconWithBadge count={item.badgeCount}>
      {item.icon}
    </SidebarIconWithBadge>
  );

  const content = (
    <>
      {reorderMode && (
        <button
          type="button"
          className="touch-none text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          aria-label={`Reordenar ${item.label}`}
          {...attributes}
          {...listeners}
        >
          <IconGripVertical className="h-4 w-4 shrink-0" />
        </button>
      )}
      {iconComBadge}
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="truncate text-sm text-neutral-700 transition duration-150 group-hover/sidebar:translate-x-0.5 dark:text-neutral-200"
      >
        {item.label}
      </motion.span>
    </>
  );

  if (reorderMode) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex items-center gap-2 rounded-md px-1 py-1.5',
          isDragging && 'z-10 bg-neutral-200/80 shadow-sm dark:bg-neutral-800',
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={() => setOpen(false)}
      className="group/sidebar flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/80"
    >
      {content}
    </Link>
  );
}

function AppSidebarContent({
  userId,
  permissions,
  contadores,
}: AppSidebarProps) {
  const [reorderMode, setReorderMode] = useState(false);
  const { open, animate, setOpen } = useSidebar();

  const navItems = useMemo(() => {
    const base = buildSidebarNavItems(permissions, contadores);
    const achatados = idsModulosAchatados(permissions);
    return expandirItensAchatados(base, achatados, SIDEBAR_ICON_CLASS);
  }, [permissions, contadores]);
  const { destinos: favoritos } = useFavoritos();

  const { orderedItems, order, saveOrder, salvando } = useSidebarMenuOrder(
    userId,
    navItems,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    void saveOrder(arrayMove(order, oldIndex, newIndex));
  }

  return (
    <SidebarBody className="min-h-0 flex-1 gap-2">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden pr-0.5">
              {favoritos.length > 0 && !reorderMode && (
                <div className="mb-2 space-y-0.5">
                  {open && (
                    <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Favoritos
                    </p>
                  )}
                  {favoritos.map((destino) => (
                    <Link
                      key={destino.id}
                      href={destino.href}
                      onClick={() => setOpen(false)}
                      className="group/sidebar flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/80"
                    >
                      <Star className="h-[18px] w-[18px] shrink-0 fill-amber-400 text-amber-400" />
                      <motion.span
                        animate={{
                          display: animate
                            ? open
                              ? 'inline-block'
                              : 'none'
                            : 'inline-block',
                          opacity: animate ? (open ? 1 : 0) : 1,
                        }}
                        className="truncate text-sm text-neutral-700 dark:text-neutral-200"
                      >
                        {destino.label}
                      </motion.span>
                    </Link>
                  ))}
                </div>
              )}
              {orderedItems.map((item) => (
                <SortableNavRow
                  key={item.id}
                  item={item}
                  reorderMode={reorderMode}
                />
              ))}
            </nav>
          </SortableContext>
        </DndContext>

        <div className="mt-2 shrink-0 border-t border-neutral-200/80 pt-2 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setReorderMode((v) => !v)}
            disabled={salvando}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm transition-colors',
              reorderMode
                ? 'bg-primary/10 text-primary'
                : 'text-neutral-600 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:bg-neutral-800/80',
              salvando && 'opacity-60',
            )}
          >
            <IconArrowsSort className="h-[18px] w-[18px] shrink-0" />
            <motion.span
              animate={{
                display: animate
                  ? open
                    ? 'inline-block'
                    : 'none'
                  : 'inline-block',
                opacity: animate ? (open ? 1 : 0) : 1,
              }}
              className="truncate"
            >
              {reorderMode ? 'Concluir ordenação' : 'Ordenar menu'}
            </motion.span>
          </button>
          {reorderMode && open && (
            <p className="mt-1 px-1 text-[11px] leading-snug text-muted-foreground">
              Arraste os itens. A ordem é salva na sua conta.
            </p>
          )}
        </div>
      </div>
    </SidebarBody>
  );
}

export function AppSidebar(props: AppSidebarProps) {
  // Provider fica no layout (main) para o MainHeader abrir o drawer mobile.
  return <AppSidebarContent {...props} />;
}
