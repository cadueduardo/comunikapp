import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { Textarea } from './textarea';
import { Label } from './label';

interface DeleteOrcamentoDialogProps {
  open: boolean;
  orcamentoNome?: string;
  onConfirm: (motivo: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteOrcamentoDialog({
  open,
  orcamentoNome,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteOrcamentoDialogProps) {
  const [motivo, setMotivo] = React.useState('');

  const handleConfirm = () => {
    onConfirm(motivo.trim());
  };

  const handleCancel = () => {
    setMotivo('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir orçamento</DialogTitle>
          <DialogDescription>
            {orcamentoNome 
              ? `Tem certeza que deseja excluir o orçamento "${orcamentoNome}"?`
              : 'Tem certeza que deseja excluir este orçamento?'
            }
            <br />
            <span className="text-sm text-gray-500 mt-2 block">
              Esta ação não pode ser desfeita. O orçamento será movido para a lixeira.
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="motivo">Motivo da exclusão (opcional)</Label>
            <Textarea
              id="motivo"
              placeholder="Explique brevemente o motivo da exclusão..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading}
            variant="destructive"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
