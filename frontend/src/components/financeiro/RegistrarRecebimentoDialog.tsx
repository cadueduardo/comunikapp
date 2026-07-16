'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CobrancaResumo,
  RecebimentoMetodo,
} from '@/lib/financeiro-api';
import { registrarRecebimento } from '@/lib/financeiro-api';
import {
  formatarMoeda,
} from '@/lib/financeiro/financeiro-format';
import { solicitarAtualizacaoBadgesSidebar } from '@/lib/sidebar-badge-refresh';

interface Props {
  cobranca: CobrancaResumo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /**
   * Quando `true`, o modal abre marcando o checkbox "Forcar recebimento total":
   * - liquida o saldo restante em uma unica acao
   * - registra log com `tipo_acao = FORCADA_LIQUIDACAO`
   *
   * Acao sensivel: exige confirmacao explicita via checkbox e gera entrada
   * de auditoria (regra do plano operacional).
   */
  modoForcado?: boolean;
}

function formatarDataParcela(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
}

function calcularValorSugeridoRecebimento(
  cobranca: CobrancaResumo,
  modoForcado: boolean,
): number {
  if (cobranca.pode_registrar_recebimento === false) {
    return 0;
  }
  if (modoForcado) {
    const recebivel = cobranca.proxima_parcela_recebivel;
    if (recebivel) {
      return Math.max(
        0,
        Number(recebivel.valor_previsto) - Number(recebivel.valor_recebido),
      );
    }
    return Number(cobranca.valor_saldo ?? 0);
  }
  const proxima =
    cobranca.proxima_parcela_recebivel ?? cobranca.proxima_parcela;
  if (proxima) {
    return Math.max(
      0,
      Number(proxima.valor_previsto) - Number(proxima.valor_recebido),
    );
  }
  return Number(cobranca.valor_saldo ?? 0);
}

const METODOS: { value: RecebimentoMetodo; label: string }[] = [
  { value: 'PIX', label: 'PIX' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de débito' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de crédito' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'OUTRO', label: 'Outro' },
];

export function RegistrarRecebimentoDialog({
  cobranca,
  open,
  onOpenChange,
  onSuccess,
  modoForcado = false,
}: Props) {
  const proximaRecebivel =
    cobranca?.proxima_parcela_recebivel ?? cobranca?.proxima_parcela ?? null;
  const proximaExibicao = cobranca?.proxima_parcela ?? null;
  const bloqueado = cobranca?.pode_registrar_recebimento === false;
  const saldoParcelaAberta = proximaRecebivel
    ? Number(proximaRecebivel.valor_previsto) -
      Number(proximaRecebivel.valor_recebido)
    : Number(cobranca?.valor_saldo ?? 0);

  const [valor, setValor] = useState<string>('0');
  const [dataRecebimento, setDataRecebimento] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [metodo, setMetodo] = useState<RecebimentoMetodo>('PIX');
  const [observacoes, setObservacoes] = useState<string>('');
  const [forcado, setForcado] = useState<boolean>(modoForcado);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !cobranca) return;
    const sugerido = calcularValorSugeridoRecebimento(cobranca, modoForcado);
    setValor(String(sugerido));
    setDataRecebimento(new Date().toISOString().slice(0, 10));
    setMetodo('PIX');
    setObservacoes('');
    setForcado(modoForcado);
  }, [open, cobranca, modoForcado]);

  const handleSubmit = async () => {
    if (!cobranca) return;
    if (bloqueado) {
      toast.error(
        cobranca.motivo_bloqueio_recebimento ??
          'Não há parcela em aberto para receber',
      );
      return;
    }
    const valorNumerico = Number.parseFloat(valor);
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      toast.error('Informe um valor válido maior que zero');
      return;
    }
    if (!dataRecebimento) {
      toast.error('Informe a data do recebimento');
      return;
    }

    setSubmitting(true);
    try {
      await registrarRecebimento(cobranca.id, {
        valor: valorNumerico,
        data_recebimento: new Date(dataRecebimento).toISOString(),
        metodo,
        observacoes: observacoes || undefined,
        forcado,
      });
      toast.success(
        forcado ? 'Recebimento forçado registrado' : 'Recebimento registrado',
      );
      solicitarAtualizacaoBadgesSidebar();
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao registrar recebimento';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!cobranca) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {modoForcado ? 'Forçar recebimento total' : 'Registrar recebimento'}
          </DialogTitle>
          <DialogDescription>
            Cobrança <strong>{cobranca.orcamento_numero}</strong> &middot;{' '}
            {cobranca.cliente_nome ?? 'cliente não informado'}
            <br />
            Saldo atual:{' '}
            <strong>{formatarMoeda(Number(cobranca.valor_saldo))}</strong>
            {proximaExibicao && (
              <>
                <br />
                Próxima parcela (
                {proximaExibicao.tipo === 'ENTRADA'
                  ? 'entrada'
                  : proximaExibicao.tipo === 'SALDO'
                    ? 'saldo'
                    : `#${proximaExibicao.ordem}`}
                ):{' '}
                <strong>
                  {formatarDataParcela(proximaExibicao.data_vencimento)}
                </strong>
                {' · '}
                <strong>{formatarMoeda(saldoParcelaAberta)}</strong>
                {bloqueado && (
                  <>
                    <br />
                    <span className="text-amber-800">
                      {cobranca.motivo_bloqueio_recebimento}
                    </span>
                  </>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {bloqueado && (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <AlertDescription className="text-amber-900 text-xs">
              {cobranca.motivo_bloqueio_recebimento ??
                'Não há parcela elegível para recebimento no momento.'}
            </AlertDescription>
          </Alert>
        )}

        {modoForcado && (
          <Alert className="border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900 text-xs">
              Ação sensível: forçar recebimento total liquida o saldo independente
              do real recebimento. Será registrado log com sua identidade.
            </AlertDescription>
          </Alert>
        )}

        <div className={cn('space-y-3', bloqueado && 'pointer-events-none opacity-50')}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="valor">Valor</Label>
              <CustomCurrencyInput
                id="valor"
                value={valor}
                onValueChange={setValor}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={dataRecebimento}
                onChange={(e) => setDataRecebimento(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="metodo">Método</Label>
            <Select
              value={metodo}
              onValueChange={(v) => setMetodo(v as RecebimentoMetodo)}
            >
              <SelectTrigger id="metodo">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {METODOS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Opcional (ex.: comprovante PIX, referência interna...)"
              rows={2}
            />
          </div>

          {!modoForcado && (
            <div className="flex items-start gap-2 rounded-md border bg-amber-50/40 p-2">
              <Checkbox
                id="forcado"
                checked={forcado}
                onCheckedChange={(v) => setForcado(v === true)}
              />
              <Label
                htmlFor="forcado"
                className="text-xs text-amber-900 leading-tight cursor-pointer"
              >
                Forçar recebimento total (registra como{' '}
                <code>FORCADA_LIQUIDACAO</code> no log de auditoria)
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || bloqueado}>
            {submitting ? 'Registrando...' : 'Registrar recebimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
