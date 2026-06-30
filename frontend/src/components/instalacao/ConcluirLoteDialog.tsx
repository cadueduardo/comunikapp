'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AssinaturaCanvas,
  type AssinaturaCanvasHandle,
} from '@/components/expedicao/AssinaturaCanvas';
import { EvidenciaFotosUpload } from '@/components/instalacao/EvidenciaFotosUpload';
import type { LoteInstaladorDetalhe } from '@/lib/instalacao/instalacao.types';
import { normalizarFotos } from '@/lib/instalacao/instalacao.types';
import { IconCircleCheck, IconLoader2 } from '@tabler/icons-react';

export interface ConcluirLoteDialogProps {
  open: boolean;
  lote: LoteInstaladorDetalhe | null;
  loading?: boolean;
  onClose: () => void;
  onUploadAnexo: (arquivo: File) => Promise<{ url: string }>;
  onConfirm: (dados: {
    fotos_evidencia?: string[];
    assinatura_url?: string;
  }) => Promise<void>;
}

export function ConcluirLoteDialog({
  open,
  lote,
  loading = false,
  onClose,
  onUploadAnexo,
  onConfirm,
}: ConcluirLoteDialogProps) {
  const canvasRef = useRef<AssinaturaCanvasHandle>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [enviandoAssinatura, setEnviandoAssinatura] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFotos([]);
      setErro(null);
      canvasRef.current?.limpar();
    } else if (lote) {
      setFotos(normalizarFotos(lote.fotos_evidencia));
    }
  }, [open, lote]);

  async function resolverAssinatura(): Promise<string | undefined> {
    if (canvasRef.current?.isEmpty()) return undefined;

    const blob = await canvasRef.current?.exportarBlob();
    if (!blob) return undefined;

    setEnviandoAssinatura(true);
    try {
      const arquivo = new File([blob], 'assinatura.png', { type: 'image/png' });
      const resultado = await onUploadAnexo(arquivo);
      return resultado.url;
    } finally {
      setEnviandoAssinatura(false);
    }
  }

  async function handleConfirm() {
    setErro(null);

    try {
      const assinaturaUrl = await resolverAssinatura();
      if (!assinaturaUrl) {
        setErro('A assinatura do recebedor é obrigatória.');
        return;
      }

      await onConfirm({
        fotos_evidencia: fotos.length > 0 ? fotos : undefined,
        assinatura_url: assinaturaUrl,
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao concluir lote');
    }
  }

  const processando = loading || enviandoAssinatura;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-1rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="space-y-2 border-b border-border px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <IconCircleCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-left text-base font-bold sm:text-lg">
                Concluir instalação
              </DialogTitle>
              <DialogDescription className="text-left text-xs sm:text-sm">
                Registre evidências e assinatura do recebedor.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium text-foreground">Fotos de evidência</p>
            <EvidenciaFotosUpload
              fotos={fotos}
              onChange={setFotos}
              onUpload={onUploadAnexo}
              disabled={processando}
            />
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium text-foreground">
              Assinatura do recebedor *
            </p>
            <AssinaturaCanvas
              ref={canvasRef}
              disabled={processando}
              className="w-full min-w-0"
            />
          </div>

          {erro && (
            <p className="break-words text-sm text-destructive">{erro}</p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border px-4 py-4 sm:flex-row sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full min-w-0 sm:w-auto"
            disabled={processando}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-11 w-full min-w-0 sm:w-auto"
            disabled={processando}
            onClick={() => void handleConfirm()}
          >
            {processando ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Finalizando...
              </>
            ) : (
              'Concluir trabalho'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
