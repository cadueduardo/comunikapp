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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/contexts/UserContext';
import type { ExpedicaoDetalhe } from '@/lib/expedicao/expedicao.types';
import { expedicaoApi } from '@/lib/expedicao/expedicao-api';
import {
  AssinaturaCanvas,
  type AssinaturaCanvasHandle,
} from '@/components/expedicao/AssinaturaCanvas';
import { IconAlertTriangle, IconCircleCheck, IconLock } from '@tabler/icons-react';

const MOTIVO_BLOQUEIO_LABEL: Record<string, string> = {
  PARCELAS_EM_ABERTO: 'Existem parcelas em aberto ou vencidas que impedem a entrega.',
  SEM_COBRANCA: 'Cobrança não encontrada — contate o financeiro.',
  SEM_ORCAMENTO: 'OS sem orçamento vinculado.',
};

function obterTextoBloqueio(detalhe: ExpedicaoDetalhe): string {
  const motivo = detalhe.bloqueio_financeiro?.motivo;
  if (motivo && MOTIVO_BLOQUEIO_LABEL[motivo]) {
    return MOTIVO_BLOQUEIO_LABEL[motivo];
  }
  return 'Pendência financeira detectada. Regularize o recebimento antes de concluir.';
}

export interface ConcluirEntregaDialogProps {
  open: boolean;
  detalhe: ExpedicaoDetalhe | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (dados: {
    recebedor_nome: string;
    recebedor_doc?: string;
    url_assinatura?: string;
    observacoes?: string;
    override_financeiro?: boolean;
    motivo_override_financeiro?: string;
  }) => Promise<void>;
}

export function ConcluirEntregaDialog({
  open,
  detalhe,
  loading = false,
  onClose,
  onConfirm,
}: ConcluirEntregaDialogProps) {
  const { user } = useUser();
  const canvasRef = useRef<AssinaturaCanvasHandle>(null);
  const [recebedorNome, setRecebedorNome] = useState('');
  const [recebedorDoc, setRecebedorDoc] = useState('');
  const [urlAssinatura, setUrlAssinatura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [overrideFinanceiro, setOverrideFinanceiro] = useState(false);
  const [motivoOverride, setMotivoOverride] = useState('');
  const [enviandoAssinatura, setEnviandoAssinatura] = useState(false);
  const [erroAssinatura, setErroAssinatura] = useState<string | null>(null);

  const isAdmin =
    String(user?.funcao ?? '').toUpperCase() === 'ADMINISTRADOR';
  const assinaturaObrigatoria = !isAdmin;
  const isBloqueado = Boolean(detalhe?.bloqueio_financeiro?.bloqueado);
  const podeOverride = isBloqueado && isAdmin;
  const overrideValido =
    !overrideFinanceiro || motivoOverride.trim().length >= 10;
  const formValido = recebedorNome.trim().length > 0 && overrideValido;
  const bloqueioImpedeEnvio = isBloqueado && !podeOverride;

  useEffect(() => {
    if (!open) {
      setRecebedorNome('');
      setRecebedorDoc('');
      setUrlAssinatura('');
      setObservacoes('');
      setOverrideFinanceiro(false);
      setMotivoOverride('');
      setErroAssinatura(null);
      canvasRef.current?.limpar();
    }
  }, [open]);

  async function resolverUrlAssinatura(): Promise<string | undefined> {
    if (urlAssinatura.trim()) {
      return urlAssinatura.trim();
    }

    const blob = await canvasRef.current?.exportarBlob();
    if (!blob) return undefined;

    setEnviandoAssinatura(true);
    setErroAssinatura(null);
    try {
      const resultado = await expedicaoApi.uploadAssinatura(blob);
      setUrlAssinatura(resultado.url);
      return resultado.url;
    } catch (err) {
      const mensagem =
        err instanceof Error ? err.message : 'Falha ao enviar assinatura';
      setErroAssinatura(mensagem);
      throw err;
    } finally {
      setEnviandoAssinatura(false);
    }
  }

  async function handleConfirm() {
    if (!formValido || bloqueioImpedeEnvio) return;
    if (podeOverride && overrideFinanceiro && motivoOverride.trim().length < 10) {
      return;
    }

    let assinaturaFinal = urlAssinatura.trim() || undefined;
    if (!assinaturaFinal && !canvasRef.current?.isEmpty()) {
      assinaturaFinal = await resolverUrlAssinatura();
    }

    if (assinaturaObrigatoria && !assinaturaFinal) {
      const canvasVazio =
        !urlAssinatura.trim() &&
        (canvasRef.current?.isEmpty() ?? true);
      if (canvasVazio) {
        setErroAssinatura('A assinatura é obrigatória para concluir a entrega.');
        return;
      }
    }

    await onConfirm({
      recebedor_nome: recebedorNome.trim(),
      recebedor_doc: recebedorDoc.trim() || undefined,
      url_assinatura: assinaturaFinal,
      observacoes: observacoes.trim() || undefined,
      override_financeiro:
        podeOverride && overrideFinanceiro ? true : undefined,
      motivo_override_financeiro:
        podeOverride && overrideFinanceiro
          ? motivoOverride.trim()
          : undefined,
    });
  }

  const processando = loading || enviandoAssinatura;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="space-y-3 border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <IconCircleCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-left text-lg font-bold">
                Concluir entrega — OS {detalhe?.ordem_servico.numero ?? '...'}
              </DialogTitle>
              <DialogDescription className="text-left">
                Registre o recebedor e finalize a entrega logística.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
          {isBloqueado && detalhe && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
              <div className="flex items-start gap-3">
                <IconLock className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Entrega bloqueada</p>
                  <p className="mt-1 text-sm">{obterTextoBloqueio(detalhe)}</p>
                </div>
              </div>
            </div>
          )}

          {podeOverride && (
            <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="override-financeiro"
                  checked={overrideFinanceiro}
                  onCheckedChange={(v) => setOverrideFinanceiro(v === true)}
                  disabled={processando}
                />
                <Label
                  htmlFor="override-financeiro"
                  className="cursor-pointer text-sm font-medium leading-tight text-amber-950"
                >
                  Liberar entrega mesmo com pendência financeira (override
                  administrativo)
                </Label>
              </div>
              {overrideFinanceiro && (
                <div className="space-y-1.5">
                  <Label htmlFor="motivo-override" className="text-xs">
                    Motivo obrigatório (mín. 10 caracteres)
                  </Label>
                  <Textarea
                    id="motivo-override"
                    value={motivoOverride}
                    onChange={(e) => setMotivoOverride(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Ex.: Cliente pagou em dinheiro na retirada; acordo comercial..."
                    disabled={processando}
                  />
                </div>
              )}
            </div>
          )}

          {(!isBloqueado || (podeOverride && overrideFinanceiro)) && (
            <>
              <Alert>
                <IconAlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {isAdmin
                    ? 'Como administrador, a assinatura é opcional. A ausência será registrada no histórico da OS.'
                    : 'Desenhe a assinatura no canvas abaixo ou informe a URL de um arquivo já hospedado.'}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="recebedor-nome">Nome do recebedor *</Label>
                <Input
                  id="recebedor-nome"
                  value={recebedorNome}
                  onChange={(e) => setRecebedorNome(e.target.value)}
                  maxLength={150}
                  placeholder="Nome de quem recebeu o material"
                  disabled={processando}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recebedor-doc">Documento (opcional)</Label>
                <Input
                  id="recebedor-doc"
                  value={recebedorDoc}
                  onChange={(e) => setRecebedorDoc(e.target.value)}
                  maxLength={50}
                  placeholder="CPF ou RG"
                  disabled={processando}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Assinatura{assinaturaObrigatoria ? ' *' : ' (opcional)'}
                </Label>
                <AssinaturaCanvas
                  ref={canvasRef}
                  disabled={processando || Boolean(urlAssinatura)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url-assinatura">
                  URL da assinatura (alternativa)
                </Label>
                <Input
                  id="url-assinatura"
                  value={urlAssinatura}
                  onChange={(e) => setUrlAssinatura(e.target.value)}
                  maxLength={2048}
                  placeholder="Deixe em branco se usar o canvas acima"
                  disabled={processando}
                />
              </div>

              {erroAssinatura && (
                <Alert variant="destructive">
                  <AlertDescription>{erroAssinatura}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="obs-entrega">Observações</Label>
                <Textarea
                  id="obs-entrega"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  maxLength={5000}
                  disabled={processando}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 border-t bg-slate-50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={processando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={bloqueioImpedeEnvio || !formValido || processando}
            onClick={() => void handleConfirm()}
          >
            {bloqueioImpedeEnvio
              ? 'Bloqueado por financeiro'
              : processando
                ? 'Concluindo...'
                : overrideFinanceiro
                  ? 'Confirmar com override'
                  : 'Confirmar conclusão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
