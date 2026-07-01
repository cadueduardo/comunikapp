'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InstalacaoLoteDetalhePanel } from '@/components/instalacao/InstalacaoLoteDetalhePanel';
import { montarEnderecoResumido } from '@/lib/instalacao/instalacao-lote-utils';
import type { LotePainelOs, OcorrenciaGestao } from '@/lib/instalacao/instalacao.types';

interface InstalacaoLoteDetalheModalProps {
  lote: LotePainelOs | null;
  indiceLote?: number;
  nomeServicoOs?: string | null;
  ocorrencias?: OcorrenciaGestao[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstalacaoLoteDetalheModal({
  lote,
  indiceLote,
  nomeServicoOs,
  ocorrencias = [],
  open,
  onOpenChange,
}: InstalacaoLoteDetalheModalProps) {
  if (!lote) return null;

  const servico =
    lote.item_os.produto_servico?.trim() ||
    nomeServicoOs?.trim() ||
    'Instalação em campo';
  const rotuloLote =
    indiceLote != null ? `Lote ${indiceLote}` : 'Lote de entrega';
  const rotuloLoteCompleto = `${rotuloLote} — ${montarEnderecoResumido(lote)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-4 py-4 sm:px-6">
          <DialogTitle className="text-left text-base">
            {rotuloLote} — {servico}
          </DialogTitle>
          <DialogDescription className="text-left">
            {montarEnderecoResumido(lote)}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <InstalacaoLoteDetalhePanel
            lote={lote}
            ocorrencias={ocorrencias}
            rotuloLote={rotuloLoteCompleto}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
