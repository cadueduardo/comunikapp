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
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import {
  STATUS_FINANCEIRO_OCORRENCIA_LABEL,
  TIPO_OCORRENCIA_LABEL,
} from '@/lib/instalacao/instalacao-labels';
import type { FilaPrecificacaoItem } from '@/lib/instalacao/instalacao.types';
import { formatarMoeda } from '@/lib/financeiro/financeiro-format';
import { IconLoader2 } from '@tabler/icons-react';

interface PrecificarOcorrenciaDialogProps {
  item: FilaPrecificacaoItem | null;
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  onSucesso: () => void;
  podeAbonar?: boolean;
}

function valorNumericoMoeda(valor: string): number {
  const numero = Number.parseFloat(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function valorInicialMoeda(valor: number | null | undefined): string {
  if (valor == null || Number.isNaN(valor) || valor <= 0) {
    return '';
  }
  return String(valor);
}

export function PrecificarOcorrenciaDialog({
  item,
  aberto,
  onAbertoChange,
  onSucesso,
  podeAbonar = false,
}: PrecificarOcorrenciaDialogProps) {
  const [custoInterno, setCustoInterno] = useState('');
  const [precoCliente, setPrecoCliente] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [modoAbono, setModoAbono] = useState(false);

  useEffect(() => {
    if (!item || !aberto) return;
    setCustoInterno(
      valorInicialMoeda(item.custo_interno ?? item.custo_sugerido),
    );
    setPrecoCliente(
      valorInicialMoeda(item.preco_cliente ?? item.preco_sugerido),
    );
    setObservacao('');
    setModoAbono(false);
  }, [item, aberto]);

  async function handlePrecificar() {
    if (!item) return;
    const custo = valorNumericoMoeda(custoInterno);
    const preco = valorNumericoMoeda(precoCliente);
    if (preco <= 0) {
      toast.error('Informe o preço ao cliente maior que zero.');
      return;
    }
    if (preco < custo) {
      toast.error('O preço ao cliente não pode ser menor que o custo interno.');
      return;
    }
    setSalvando(true);
    try {
      await instalacaoApi.precificarOcorrencia(item.id, {
        custo_interno: custo,
        preco_cliente: preco,
        versao: item.versao,
        observacao_gestor: observacao.trim() || undefined,
      });
      toast.success('Ocorrência precificada com sucesso.');
      onAbertoChange(false);
      onSucesso();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Falha ao precificar ocorrência.',
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleAbonar() {
    if (!item) return;
    if (observacao.trim().length < 10) {
      toast.error('Informe o motivo do abono (mínimo 10 caracteres).');
      return;
    }
    setSalvando(true);
    try {
      await instalacaoApi.abonarOcorrencia(item.id, {
        versao: item.versao,
        observacao_gestor: observacao.trim(),
      });
      toast.success('Ocorrência abonada — sem cobrança ao cliente.');
      onAbertoChange(false);
      onSucesso();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Falha ao abonar ocorrência.',
      );
    } finally {
      setSalvando(false);
    }
  }

  if (!item) return null;

  const endereco = item.item_instalacao
    ? `${item.item_instalacao.logradouro}, ${item.item_instalacao.numero} — ${item.item_instalacao.cidade}`
    : null;

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {modoAbono ? 'Abonar ocorrência' : 'Precificar ocorrência'}
          </DialogTitle>
          <DialogDescription>
            OS {item.os_numero}
            {item.cliente_nome ? ` — ${item.cliente_nome}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
            <p className="font-medium text-foreground">
              {TIPO_OCORRENCIA_LABEL[item.tipo] ?? item.tipo}
            </p>
            <p className="text-muted-foreground">{item.descricao}</p>
            {endereco && (
              <p className="text-xs text-muted-foreground">{endereco}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Status:{' '}
              {STATUS_FINANCEIRO_OCORRENCIA_LABEL[item.status_financeiro] ??
                item.status_financeiro}
            </p>
            {(item.custo_sugerido != null || item.preco_sugerido != null) && (
              <p className="text-xs text-muted-foreground">
                Sugestão do instalador: custo{' '}
                {formatarMoeda(item.custo_sugerido ?? 0)} · cliente{' '}
                {formatarMoeda(item.preco_sugerido ?? 0)}
              </p>
            )}
          </div>

          {!modoAbono ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="custo-interno">Custo interno</Label>
                <CustomCurrencyInput
                  id="custo-interno"
                  value={custoInterno}
                  onValueChange={setCustoInterno}
                  placeholder="R$ 0,00"
                  className="border-border bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco-cliente">Preço ao cliente</Label>
                <CustomCurrencyInput
                  id="preco-cliente"
                  value={precoCliente}
                  onValueChange={setPrecoCliente}
                  placeholder="R$ 0,00"
                  className="border-border bg-card"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              O abono encerra a cobrança desta ocorrência sem gerar OS Aditiva.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacao-gestor">
              {modoAbono ? 'Motivo do abono' : 'Observação (opcional)'}
            </Label>
            <Textarea
              id="observacao-gestor"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              className="border-border bg-card resize-none"
              placeholder={
                modoAbono
                  ? 'Descreva o motivo comercial ou operacional do abono...'
                  : 'Notas internas sobre a precificação...'
              }
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            {podeAbonar && !modoAbono && (
              <Button
                type="button"
                variant="outline"
                disabled={salvando}
                onClick={() => setModoAbono(true)}
              >
                Abonar
              </Button>
            )}
            {modoAbono && (
              <Button
                type="button"
                variant="outline"
                disabled={salvando}
                onClick={() => setModoAbono(false)}
              >
                Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={salvando}
              onClick={() => onAbertoChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={salvando}
              onClick={() =>
                void (modoAbono ? handleAbonar() : handlePrecificar())
              }
            >
              {salvando ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : modoAbono ? (
                'Confirmar abono'
              ) : (
                'Salvar precificação'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
