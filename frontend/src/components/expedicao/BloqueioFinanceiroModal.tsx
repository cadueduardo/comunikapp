import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BloqueioFinanceiroConflictBody } from '@/lib/expedicao/expedicao.types';
import { IconAlertTriangle } from '@tabler/icons-react';

export interface BloqueioFinanceiroModalProps {
  open: boolean;
  dados: BloqueioFinanceiroConflictBody | null;
  onClose: () => void;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function BloqueioFinanceiroModal({
  open,
  dados,
  onClose,
}: BloqueioFinanceiroModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <IconAlertTriangle className="h-5 w-5" />
            Entrega bloqueada pelo financeiro
          </DialogTitle>
          <DialogDescription>
            Regularize as parcelas pendentes antes de concluir a entrega.
          </DialogDescription>
        </DialogHeader>

        {dados && (
          <div className="space-y-3">
            <Alert className="border-red-200 bg-red-50 text-red-800">
              <AlertDescription>{dados.message}</AlertDescription>
            </Alert>

            {dados.parcelas?.length > 0 && (
              <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3 text-sm">
                {dados.parcelas.map((parcela) => (
                  <li
                    key={parcela.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100 pb-2 last:border-0 last:pb-0"
                  >
                    <span>
                      {parcela.tipo} — {parcela.status}
                    </span>
                    <span className="font-medium">
                      {formatarMoeda(parcela.valor_saldo)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {dados?.link_financeiro && (
            <Button asChild>
              <Link href={dados.link_financeiro}>Ir para financeiro</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
