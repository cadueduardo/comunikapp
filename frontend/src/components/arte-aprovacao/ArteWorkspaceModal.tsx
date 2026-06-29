'use client';

import Link from 'next/link';
import { ExternalLink, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArteWorkspacePanel } from './ArteWorkspacePanel';

interface ArteWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  osId: string;
  itemId: string;
  osNumero: string;
  osNome: string;
  produtoNome: string;
  onRefreshKanban?: () => void;
}

export function ArteWorkspaceModal({
  open,
  onClose,
  osId,
  itemId,
  osNumero,
  osNome,
  produtoNome,
  onRefreshKanban,
}: ArteWorkspaceModalProps) {
  const href = `/arte/trabalho/${osId}/${itemId}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[94vh] w-[98vw] max-w-[1600px] flex-col overflow-hidden p-0 sm:max-w-[1600px]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base font-semibold">
              {produtoNome}
            </DialogTitle>
            <p className="truncate text-sm text-muted-foreground">
              OS #{osNumero} — {osNome}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={href} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir em nova aba
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ArteWorkspacePanel
            osId={osId}
            itemId={itemId}
            osNumero={osNumero}
            onMutacao={onRefreshKanban}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
