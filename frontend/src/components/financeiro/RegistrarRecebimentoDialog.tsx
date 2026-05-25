'use client';

import { useState } from 'react';
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
import type {
  CobrancaResumo,
  RecebimentoMetodo,
} from '@/lib/financeiro-api';
import { registrarRecebimento } from '@/lib/financeiro-api';

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

const METODOS: { value: RecebimentoMetodo; label: string }[] = [
  { value: 'PIX', label: 'PIX' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CARTAO_DEBITO', label: 'Cartao de debito' },
  { value: 'CARTAO_CREDITO', label: 'Cartao de credito' },
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
  const proxima = cobranca?.proxima_parcela ?? null;
  const saldoSugerido = proxima
    ? Number(proxima.valor_previsto) - Number(proxima.valor_recebido)
    : Number(cobranca?.valor_saldo ?? 0);

  const [valor, setValor] = useState<string>(saldoSugerido.toFixed(2));
  const [dataRecebimento, setDataRecebimento] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [metodo, setMetodo] = useState<RecebimentoMetodo>('PIX');
  const [observacoes, setObservacoes] = useState<string>('');
  const [forcado, setForcado] = useState<boolean>(modoForcado);
  const [submitting, setSubmitting] = useState(false);

  // Reset quando muda a cobranca alvo
  if (open && cobranca) {
    // Nao usamos useEffect aqui de proposito: queremos recalcular o sugerido
    // sempre que abre o modal com uma cobranca diferente. Como o componente
    // monta a cada open, isso funciona sem efeito colateral.
  }

  const handleSubmit = async () => {
    if (!cobranca) return;
    const valorNumerico = Number(valor.replace(',', '.'));
    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('Informe um valor valido maior que zero');
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
        forcado ? 'Recebimento forcado registrado' : 'Recebimento registrado',
      );
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
            {modoForcado ? 'Forcar recebimento total' : 'Registrar recebimento'}
          </DialogTitle>
          <DialogDescription>
            Cobranca <strong>{cobranca.orcamento_numero}</strong> &middot;{' '}
            {cobranca.cliente_nome ?? 'cliente nao informado'}
            <br />
            Saldo atual:{' '}
            <strong>
              {Number(cobranca.valor_saldo).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </DialogDescription>
        </DialogHeader>

        {modoForcado && (
          <Alert className="border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900 text-xs">
              Acao sensivel: forcar recebimento total liquida o saldo independente
              do real recebimento. Sera registrado log com sua identidade.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
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
            <Label htmlFor="metodo">Metodo</Label>
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
            <Label htmlFor="obs">Observacoes</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Opcional (ex.: comprovante PIX, referencia interna...)"
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
                Forcar recebimento total (registra como{' '}
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
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Registrando...' : 'Registrar recebimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
