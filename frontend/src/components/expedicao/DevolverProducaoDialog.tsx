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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MOTIVOS_DEVOLUCAO_EXPEDICAO } from '@/lib/expedicao/expedicao-columns';
import {
  IconArrowBackUp,
  IconArrowRight,
  IconAlertCircle,
} from '@tabler/icons-react';

export interface HistoricoDevolucaoItem {
  tipo: 'envio' | 'devolucao';
  texto: string;
}

export interface DevolverProducaoDialogProps {
  open: boolean;
  osNumero?: string;
  osTitulo?: string;
  historico?: HistoricoDevolucaoItem[];
  loading?: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
}

export function DevolverProducaoDialog({
  open,
  osNumero,
  osTitulo,
  historico = [],
  loading = false,
  onClose,
  onConfirm,
}: DevolverProducaoDialogProps) {
  const [motivoSelecionado, setMotivoSelecionado] = useState('');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    if (!open) {
      setMotivoSelecionado('');
      setDescricao('');
    }
  }, [open]);

  const motivoFinal = [motivoSelecionado, descricao.trim()]
    .filter(Boolean)
    .join(': ')
    .trim();

  const motivoValido = motivoFinal.length >= 10;

  async function handleConfirm() {
    if (!motivoValido) return;
    await onConfirm(motivoFinal);
    setMotivoSelecionado('');
    setDescricao('');
  }

  function handleClose() {
    setMotivoSelecionado('');
    setDescricao('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="space-y-3 border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <IconArrowBackUp className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Motivo da Devolução
            </DialogTitle>
          </div>
          {(osNumero || osTitulo) && (
            <p className="text-sm text-muted-foreground">
              OS:{' '}
              <span className="font-semibold text-foreground">
                {osNumero}
                {osTitulo ? ` — ${osTitulo}` : ''}
              </span>
            </p>
          )}
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="motivo-devolucao-select">Motivo</Label>
            <Select
              value={motivoSelecionado}
              onValueChange={setMotivoSelecionado}
            >
              <SelectTrigger id="motivo-devolucao-select" className="h-11">
                <SelectValue placeholder="Selecione um motivo..." />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_DEVOLUCAO_EXPEDICAO.map((motivo) => (
                  <SelectItem key={motivo} value={motivo}>
                    {motivo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo-devolucao-descricao">
              Descrição detalhada do problema
            </Label>
            <Textarea
              id="motivo-devolucao-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o que aconteceu..."
              rows={4}
              maxLength={2000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {motivoFinal.length}/2000 caracteres (mínimo 10 no total)
            </p>
          </div>

          {historico.length > 0 && (
            <div className="rounded-lg bg-violet-50 px-4 py-3">
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Histórico de Movimentações
              </p>
              <ul className="space-y-2">
                {historico.map((item, index) => (
                  <li
                    key={`${item.tipo}-${index}`}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    {item.tipo === 'envio' ? (
                      <IconArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    )}
                    <span>{item.texto}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t bg-slate-50 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="min-w-28"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!motivoValido || loading || !motivoSelecionado}
            onClick={() => void handleConfirm()}
            className="min-w-44 bg-blue-700 font-semibold hover:bg-blue-800"
          >
            {loading ? 'Devolvendo...' : 'Confirmar Retorno ao PCP'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
