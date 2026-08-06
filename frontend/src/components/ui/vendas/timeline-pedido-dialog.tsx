'use client';

import { useCallback, useEffect, useState } from 'react';
import { getClientSessionToken } from '@/lib/session-auth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, CheckCircle2, FileText, ShoppingBag, ShieldCheck } from 'lucide-react';
import { PedidoComercial } from './pedidos-table';

export interface EventoTimeline {
  id: string;
  data: string;
  titulo: string;
  descricao: string;
  tipo: string;
  autor: string | null;
}

interface TimelinePedidoDialogProps {
  pedido: PedidoComercial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimelinePedidoDialog({
  pedido,
  open,
  onOpenChange,
}: TimelinePedidoDialogProps) {
  const [eventos, setEventos] = useState<EventoTimeline[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarTimeline = useCallback(async () => {
    if (!pedido) return;
    setLoading(true);
    try {
      const token = getClientSessionToken();
      if (!token) return;

      const res = await fetch(`/api/backend-proxy/vendas/pedidos/${pedido.id}/timeline`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Falha ao carregar linha do tempo comercial.');
      }

      const list = await res.json();
      setEventos(list);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar linha do tempo do pedido.');
    } finally {
      setLoading(false);
    }
  }, [pedido]);

  useEffect(() => {
    if (open && pedido) {
      carregarTimeline();
    }
  }, [open, pedido, carregarTimeline]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Linha do Tempo Comercial — {pedido?.numero}
          </DialogTitle>
          <DialogDescription>
            Histórico sequencial e auditável de eventos do pedido comercial.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando eventos...</span>
          </div>
        ) : eventos.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhum evento registrado na linha do tempo.
          </div>
        ) : (
          <div className="relative border-l border-border pl-6 space-y-6 my-2 max-h-[50vh] overflow-y-auto pr-2">
            {eventos.map((evt) => (
              <div key={evt.id} className="relative group">
                <div className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                  {evt.tipo === 'ACEITE' ? (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  ) : evt.tipo === 'HANDOFF' ? (
                    <ShoppingBag className="h-3.5 w-3.5" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{evt.titulo}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(evt.data).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{evt.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
