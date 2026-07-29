'use client';

import { Loader2, ShieldAlert } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  STORE_STATUS_LABELS,
} from '@/lib/gestao/admin-labels';
import {
  AdminRole,
  AdminStore,
  StoreStatus,
} from '@/lib/gestao/admin-types';

const TRANSITIONS: Record<StoreStatus, StoreStatus[]> = {
  PENDENTE_VERIFICACAO: ['ATIVO', 'BLOQUEADO'],
  ATIVO: ['INATIVO', 'BLOQUEADO'],
  INATIVO: ['ATIVO'],
  BLOQUEADO: ['ATIVO'],
};

const CATEGORIES = [
  { value: 'SECURITY', label: 'Segurança' },
  { value: 'COMMERCIAL', label: 'Comercial' },
  { value: 'FINANCIAL', label: 'Financeiro' },
  { value: 'POLICY', label: 'Política de uso' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'OTHER', label: 'Outro' },
] as const;

interface AdminStoreStatusDialogProps {
  store: AdminStore | null;
  adminRole: AdminRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    status: StoreStatus;
    category: string;
    reason: string;
  }) => Promise<void>;
}

export function AdminStoreStatusDialog({
  store,
  adminRole,
  open,
  onOpenChange,
  onConfirm,
}: AdminStoreStatusDialogProps) {
  const [status, setStatus] = useState<StoreStatus | ''>('');
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allowedStatuses = useMemo(() => {
    if (!store) return [];
    return TRANSITIONS[store.status].filter((target) => {
      const involvesBlockedStore =
        target === 'BLOQUEADO' || store.status === 'BLOQUEADO';
      return !involvesBlockedStore || adminRole === 'SUPER_ADMIN';
    });
  }, [adminRole, store]);

  useEffect(() => {
    if (!open) {
      setStatus('');
      setCategory('');
      setReason('');
    }
  }, [open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!status || !category || reason.trim().length < 10) return;
    setSubmitting(true);
    try {
      await onConfirm({
        status,
        category,
        reason: reason.trim(),
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const isBlocking = status === 'BLOQUEADO' || status === 'INATIVO';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <DialogTitle>Alterar status da loja</DialogTitle>
            <DialogDescription>
              {store?.nome}. Estado atual:{' '}
              {store ? STORE_STATUS_LABELS[store.status] : '—'}.
              {isBlocking &&
                ' Usuários conectados perderão o acesso imediatamente.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-5">
            <div className="space-y-2">
              <Label htmlFor="target-store-status">Novo status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as StoreStatus)
                }
              >
                <SelectTrigger id="target-store-status">
                  <SelectValue placeholder="Selecione o novo status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((target) => (
                    <SelectItem key={target} value={target}>
                      {STORE_STATUS_LABELS[target]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-status-category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="store-status-category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-status-reason">
                Justificativa obrigatória
              </Label>
              <Textarea
                id="store-status-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={10}
                maxLength={1000}
                rows={4}
                placeholder="Explique o motivo e o contexto desta alteração."
                required
              />
              <p className="text-xs text-muted-foreground">
                A justificativa será preservada na auditoria.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={isBlocking ? 'destructive' : 'default'}
              disabled={
                submitting ||
                !status ||
                !category ||
                reason.trim().length < 10
              }
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar alteração
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
