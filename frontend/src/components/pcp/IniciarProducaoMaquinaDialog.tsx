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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { pcpApi } from '@/lib/api-client';

interface MaquinaOpcao {
  maquina_id: string;
  nome: string;
}

interface IniciarProducaoMaquinaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setorId: string;
  itemTitulo?: string;
  onConfirm: (maquinaId: string) => Promise<void>;
}

export function IniciarProducaoMaquinaDialog({
  open,
  onOpenChange,
  setorId,
  itemTitulo,
  onConfirm,
}: IniciarProducaoMaquinaDialogProps) {
  const [maquinas, setMaquinas] = useState<MaquinaOpcao[]>([]);
  const [maquinaId, setMaquinaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !setorId) return;

    const carregar = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const res = (await pcpApi.getCapacidadeMaquinas(token, {
          setorId,
        })) as { maquinas?: Array<{ maquina_id: string; nome: string }> };
        setMaquinas(
          (res.maquinas ?? []).map((m) => ({
            maquina_id: m.maquina_id,
            nome: m.nome,
          })),
        );
      } catch (error) {
        console.error(error);
        setMaquinas([]);
      } finally {
        setLoading(false);
      }
    };

    void carregar();
  }, [open, setorId]);

  const handleConfirm = async () => {
    if (!maquinaId) return;
    setSubmitting(true);
    try {
      await onConfirm(maquinaId);
      onOpenChange(false);
      setMaquinaId('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecionar máquina</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {itemTitulo
            ? `O item "${itemTitulo}" não tem máquina prevista. Informe a máquina para iniciar.`
            : 'Informe a máquina para iniciar a produção.'}
        </p>
        <div className="space-y-2">
          <Label>Máquina do setor</Label>
          <Select value={maquinaId} onValueChange={setMaquinaId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? 'Carregando...' : 'Selecione a máquina'} />
            </SelectTrigger>
            <SelectContent>
              {maquinas.map((m) => (
                <SelectItem key={m.maquina_id} value={m.maquina_id}>
                  {m.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!loading && maquinas.length === 0 && (
            <p className="text-xs text-amber-700">
              Nenhuma máquina com PCP ativo neste setor. Cadastre em Centros de Trabalho → Máquinas.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!maquinaId || submitting}
            onClick={() => void handleConfirm()}
          >
            Iniciar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
