'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ExternalLink, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  InstalacaoWorkspacePanel,
  type InstalacaoWorkspacePanelHandle,
} from './InstalacaoWorkspacePanel';

interface InstalacaoWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  osId: string;
  osNumero: string;
  nomeServico: string;
  clienteNome: string | null;
  onMutacao?: () => void;
  loteInicialId?: string | null;
  abrirEdicaoInicial?: boolean;
  onLoteInicialConsumido?: () => void;
}

export function InstalacaoWorkspaceModal({
  open,
  onClose,
  osId,
  osNumero,
  nomeServico,
  clienteNome,
  onMutacao,
  loteInicialId,
  abrirEdicaoInicial,
  onLoteInicialConsumido,
}: InstalacaoWorkspaceModalProps) {
  const href = `/os/${osId}?tab=instalacao`;
  const painelRef = useRef<InstalacaoWorkspacePanelHandle>(null);

  const handleFechar = () => {
    if (painelRef.current?.voltarUmNivel()) return;
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[94vh] w-[98vw] max-w-[1600px] flex-col overflow-hidden border-border bg-card p-0 sm:max-w-[1600px]"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base font-semibold text-foreground">
              {nomeServico}
            </DialogTitle>
            <p className="truncate text-sm text-muted-foreground">
              OS {osNumero}
              {clienteNome ? ` — ${clienteNome}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={href} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir na OS
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFechar}
              aria-label="Fechar workspace"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <InstalacaoWorkspacePanel
            ref={painelRef}
            osId={osId}
            onMutacao={onMutacao}
            loteInicialId={loteInicialId}
            abrirEdicaoInicial={abrirEdicaoInicial}
            onLoteInicialConsumido={onLoteInicialConsumido}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
