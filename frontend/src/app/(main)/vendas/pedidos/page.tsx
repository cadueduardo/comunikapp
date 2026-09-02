'use client';

import { useCallback, useEffect, useState } from 'react';
import { getClientSessionToken } from '@/lib/session-auth';
import { toast } from 'sonner';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ViewToggle } from '@/components/ui/shared/view-toggle';
import { useIsMobile } from '@/hooks/use-media-query';
import { useVendasNavFiltrado } from '@/hooks/use-vendas-nav-filtrado';
import { PedidosTable, PedidoComercial } from '@/components/ui/vendas/pedidos-table';
import { PedidosCards } from '@/components/ui/vendas/pedidos-cards';
import { TimelinePedidoDialog } from '@/components/ui/vendas/timeline-pedido-dialog';

export default function VendasPedidosPage() {
  const { nav } = useVendasNavFiltrado();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [data, setData] = useState<PedidoComercial[]>([]);
  const [loading, setLoading] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<PedidoComercial | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setViewMode('cards');
    }
  }, [isMobile]);

  const carregarPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const token = getClientSessionToken();
      if (!token) return;

      const res = await fetch('/api/vendas/pedidos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Falha ao carregar pedidos comerciais.');
      }

      const list = await res.json();
      setData(list);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar pedidos comerciais.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  const handleVerTimeline = (item: PedidoComercial) => {
    setPedidoSelecionado(item);
    setTimelineOpen(true);
  };

  const effectiveView = isMobile ? 'cards' : viewMode;

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
      <ModuleHeader
        nav={nav}
        title="Pedidos Comerciais & Acompanhamento"
        subtitle="Projeção comercial consolidada e acompanhamento read-only em tempo real"
        icon={<ShoppingBag className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />}
        actions={
          !isMobile ? (
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          ) : null
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando pedidos comerciais...</span>
        </div>
      ) : effectiveView === 'table' ? (
        <PedidosTable data={data} onVerTimeline={handleVerTimeline} />
      ) : (
        <PedidosCards data={data} onVerTimeline={handleVerTimeline} />
      )}

      <TimelinePedidoDialog
        pedido={pedidoSelecionado}
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
      />
    </div>
  );
}
