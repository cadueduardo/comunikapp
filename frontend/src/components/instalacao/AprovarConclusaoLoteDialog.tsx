'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EvidenciaFotosUpload } from '@/components/instalacao/EvidenciaFotosUpload';
import { MOTIVOS_SEM_ASSINATURA_OPCOES } from '@/lib/instalacao/instalacao-labels';
import type {
  LotePainelOs,
  MotivoSemAssinaturaLote,
} from '@/lib/instalacao/instalacao.types';
import { normalizarFotos } from '@/lib/instalacao/instalacao.types';
import {
  INSTALACAO_DIALOG_BODY_CLASS,
  INSTALACAO_DIALOG_FOOTER_CLASS,
  INSTALACAO_DIALOG_FORM_CLASS,
  INSTALACAO_DIALOG_HEADER_CLASS,
} from '@/lib/instalacao/instalacao-modal-classes';
import { IconCircleCheck, IconLoader2 } from '@tabler/icons-react';

export interface AprovarConclusaoLoteDialogProps {
  open: boolean;
  lote: LotePainelOs | null;
  loading?: boolean;
  onClose: () => void;
  onUploadAnexo: (arquivo: File) => Promise<{ url: string }>;
  onConfirm: (dados: {
    fotos_evidencia?: string[];
    motivo_sem_assinatura?: MotivoSemAssinaturaLote;
    observacao_conclusao_gestao?: string;
    assinatura_url?: string;
  }) => Promise<void>;
}

export function AprovarConclusaoLoteDialog({
  open,
  lote,
  loading = false,
  onClose,
  onUploadAnexo,
  onConfirm,
}: AprovarConclusaoLoteDialogProps) {
  const [fotos, setFotos] = useState<string[]>([]);
  const [motivo, setMotivo] = useState<MotivoSemAssinaturaLote | ''>('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const temAssinatura = Boolean(lote?.assinatura_url);

  useEffect(() => {
    if (!open) {
      setFotos([]);
      setMotivo('');
      setObservacao('');
      setErro(null);
    } else if (lote) {
      setFotos(normalizarFotos(lote.fotos_evidencia));
    }
  }, [open, lote]);

  async function handleConfirm() {
    if (!lote) return;
    setErro(null);

    if (!temAssinatura && !motivo) {
      setErro('Selecione o motivo da conclusão sem assinatura.');
      return;
    }

    if (
      !temAssinatura &&
      motivo === 'OUTROS' &&
      observacao.trim().length < 10
    ) {
      setErro('Descreva a justificativa (mínimo 10 caracteres).');
      return;
    }

    try {
      await onConfirm({
        fotos_evidencia: fotos.length > 0 ? fotos : undefined,
        ...(!temAssinatura && motivo
          ? {
              motivo_sem_assinatura: motivo,
              observacao_conclusao_gestao: observacao.trim() || undefined,
            }
          : observacao.trim()
            ? { observacao_conclusao_gestao: observacao.trim() }
            : {}),
        ...(lote.assinatura_url
          ? { assinatura_url: lote.assinatura_url }
          : {}),
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao aprovar conclusão');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={INSTALACAO_DIALOG_FORM_CLASS}>
        <DialogHeader className={`${INSTALACAO_DIALOG_HEADER_CLASS} space-y-2`}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <IconCircleCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-left text-base font-bold sm:text-lg">
                Aprovar conclusão do lote
              </DialogTitle>
              <DialogDescription className="text-left text-xs sm:text-sm">
                Confira ocorrências e evidências. Sem assinatura do recebedor,
                informe o motivo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className={`${INSTALACAO_DIALOG_BODY_CLASS} space-y-5`}>
          {!temAssinatura && (
            <div className="space-y-2">
              <Label htmlFor="motivo-sem-assinatura">
                Motivo da conclusão sem assinatura *
              </Label>
              <Select
                value={motivo}
                onValueChange={(valor) =>
                  setMotivo(valor as MotivoSemAssinaturaLote)
                }
              >
                <SelectTrigger id="motivo-sem-assinatura" className="w-full">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_SEM_ASSINATURA_OPCOES.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacao-conclusao">
              {motivo === 'OUTROS' && !temAssinatura
                ? 'Descrição da justificativa *'
                : 'Observações (opcional)'}
            </Label>
            <Textarea
              id="observacao-conclusao"
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              placeholder={
                motivo === 'OUTROS' && !temAssinatura
                  ? 'Descreva o motivo da conclusão sem assinatura...'
                  : 'Complemento para auditoria interna...'
              }
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Fotos de evidência (opcional)
            </p>
            <EvidenciaFotosUpload
              fotos={fotos}
              onChange={setFotos}
              onUpload={onUploadAnexo}
              disabled={loading}
            />
          </div>

          {erro && (
            <p className="break-words text-sm text-destructive">{erro}</p>
          )}
        </div>

        <DialogFooter
          className={`${INSTALACAO_DIALOG_FOOTER_CLASS} flex-col gap-2 sm:flex-row`}
        >
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full sm:w-auto"
            disabled={loading}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-11 w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto dark:bg-emerald-700 dark:hover:bg-emerald-600"
            disabled={loading}
            onClick={() => void handleConfirm()}
          >
            {loading ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Aprovando...
              </>
            ) : (
              'Aprovar conclusão'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
