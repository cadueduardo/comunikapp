'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { CobrancaResumo } from '@/lib/financeiro-api';
import { cancelarCobranca } from '@/lib/financeiro-api';

interface Props {
  cobranca: CobrancaResumo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CancelarCobrancaDialog({
  cobranca,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!cobranca) return;
    if (motivo.trim().length < 5) {
      toast.error('Informe um motivo (minimo 5 caracteres)');
      return;
    }
    setSubmitting(true);
    try {
      await cancelarCobranca(cobranca.id, motivo.trim());
      toast.success('Cobranca cancelada');
      onSuccess();
      onOpenChange(false);
      setMotivo('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao cancelar';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!cobranca) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar cobranca</DialogTitle>
          <DialogDescription>
            Cobranca <strong>{cobranca.orcamento_numero}</strong> &middot;{' '}
            {cobranca.cliente_nome ?? 'cliente nao informado'}
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900 text-xs">
            Acao sensivel: cancela a cobranca e marca todas as parcelas em aberto
            como canceladas. Esta acao nao pode ser desfeita e fica registrada no
            log de auditoria.
          </AlertDescription>
        </Alert>

        <div className="space-y-1.5">
          <Label htmlFor="motivo">Motivo do cancelamento</Label>
          <Textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Descreva o motivo (sera registrado no log)"
            rows={3}
            required
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || motivo.trim().length < 5}
          >
            {submitting ? 'Cancelando...' : 'Confirmar cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
