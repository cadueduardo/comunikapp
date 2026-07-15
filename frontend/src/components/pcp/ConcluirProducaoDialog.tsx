'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ConcluirProducaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTitulo?: string;
  quantidadePadrao?: number;
  onConfirm: (
    observacoes?: string,
    quantidadeProduzida?: number,
    quantidadeRefugo?: number,
  ) => Promise<void>;
}

export function ConcluirProducaoDialog({
  open,
  onOpenChange,
  itemTitulo,
  quantidadePadrao = 1,
  onConfirm,
}: ConcluirProducaoDialogProps) {
  const [quantidadeProduzida, setQuantidadeProduzida] = useState<string>('');
  const [quantidadeRefugo, setQuantidadeRefugo] = useState<string>('0');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setQuantidadeProduzida(String(quantidadePadrao));
      setQuantidadeRefugo('0');
      setObservacoes('');
    }
  }, [open, quantidadePadrao]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const qtdP = quantidadeProduzida ? Number(quantidadeProduzida) : undefined;
      const qtdR = quantidadeRefugo ? Number(quantidadeRefugo) : undefined;
      await onConfirm(observacoes.trim() || undefined, qtdP, qtdR);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Concluir Etapa de Produção</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          {itemTitulo
            ? `Confirme os dados de produção para o item "${itemTitulo}".`
            : 'Confirme os dados para a conclusão desta etapa.'}
        </p>

        <div className="grid gap-4 py-3">
          <div className="grid gap-2">
            <Label htmlFor="qtd-produzida">Quantidade Produzida</Label>
            <Input
              id="qtd-produzida"
              type="number"
              step="any"
              min="0"
              value={quantidadeProduzida}
              onChange={(e) => setQuantidadeProduzida(e.target.value)}
              disabled={submitting}
              placeholder="Digite a quantidade produzida"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="qtd-refugo">
              Refugo / Perda de Insumos (%)
            </Label>
            <Input
              id="qtd-refugo"
              type="number"
              step="any"
              min="0"
              max="100"
              value={quantidadeRefugo}
              onChange={(e) => setQuantidadeRefugo(e.target.value)}
              disabled={submitting}
              placeholder="Ex: 10 para 10% de perda de material"
            />
            <span className="text-[10px] text-muted-foreground">
              Informe a perda percentual média de material ocorrida nesta etapa.
            </span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="obs-conclusao">Observações / Motivos de Perda</Label>
            <Textarea
              id="obs-conclusao"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              disabled={submitting}
              placeholder="Descreva observações da produção ou detalhes sobre as perdas, se houver."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => void handleConfirm()}
          >
            {submitting ? 'Salvando...' : 'Concluir Etapa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
