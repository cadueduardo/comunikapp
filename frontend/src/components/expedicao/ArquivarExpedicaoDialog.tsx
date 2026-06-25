'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconArchive } from '@tabler/icons-react';

export interface ArquivarExpedicaoDialogProps {
  open: boolean;
  osNumero?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (observacoes?: string) => Promise<void>;
}

export function ArquivarExpedicaoDialog({
  open,
  osNumero,
  loading = false,
  onClose,
  onConfirm,
}: ArquivarExpedicaoDialogProps) {
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (!open) setObservacoes('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <IconArchive className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-left">
                Arquivar expedição — OS {osNumero ?? '...'}
              </DialogTitle>
              <DialogDescription className="text-left">
                Move o card para o arquivo morto após a entrega concluída.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="obs-arquivar">Observações (opcional)</Label>
          <Textarea
            id="obs-arquivar"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            maxLength={5000}
            placeholder="Motivo do arquivamento ou notas de auditoria"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => void onConfirm(observacoes.trim() || undefined)}
          >
            {loading ? 'Arquivando...' : 'Confirmar arquivamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
