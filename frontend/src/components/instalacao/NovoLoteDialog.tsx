'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { EnderecoInstalacaoForm } from '@/components/instalacao/EnderecoInstalacaoForm';
import type {
  CriarLoteInstalacaoPayload,
  EnderecoLoteForm,
  ItemSaldoInstalacao,
  ResultadoBuscaCep,
} from '@/lib/instalacao/instalacao.types';
import {
  ENDERECO_LOTE_VAZIO,
  montarPayloadAgendaLote,
} from '@/lib/instalacao/instalacao.types';
import {
  INSTALACAO_DIALOG_BODY_CLASS,
  INSTALACAO_DIALOG_FOOTER_CLASS,
  INSTALACAO_DIALOG_FORM_CLASS,
  INSTALACAO_DIALOG_HEADER_CLASS,
} from '@/lib/instalacao/instalacao-modal-classes';
import { IconLoader2, IconPlus } from '@tabler/icons-react';
import { toast } from 'sonner';

interface NovoLoteDialogProps {
  itensSaldo: ItemSaldoInstalacao[];
  buscarCep: (cep: string) => Promise<ResultadoBuscaCep>;
  onCriar: (dados: CriarLoteInstalacaoPayload) => Promise<void>;
  disabled?: boolean;
}

export function NovoLoteDialog({
  itensSaldo,
  buscarCep,
  onCriar,
  disabled = false,
}: NovoLoteDialogProps) {
  const itensComSaldo = useMemo(
    () => itensSaldo.filter((item) => item.saldo_disponivel > 0),
    [itensSaldo],
  );

  const [aberto, setAberto] = useState(false);
  const [itemOsId, setItemOsId] = useState('');
  const [salvando, setSalvando] = useState(false);

  const itemSelecionado = itensComSaldo.find((item) => item.item_os_id === itemOsId);

  useEffect(() => {
    if (!aberto) return;

    if (itensComSaldo.length === 1) {
      setItemOsId(itensComSaldo[0].item_os_id);
      return;
    }

    if (!itensComSaldo.some((item) => item.item_os_id === itemOsId)) {
      setItemOsId(itensComSaldo[0]?.item_os_id ?? '');
    }
  }, [aberto, itensComSaldo, itemOsId]);

  const valorInicialForm: EnderecoLoteForm = useMemo(
    () => ({
      ...ENDERECO_LOTE_VAZIO,
      quantidade_alocada: itemSelecionado?.saldo_disponivel ?? 1,
    }),
    [itemSelecionado?.saldo_disponivel],
  );

  function resetar() {
    setItemOsId(itensComSaldo[0]?.item_os_id ?? '');
  }

  async function handleSalvar(dados: EnderecoLoteForm) {
    if (!itemOsId) {
      toast.error('Selecione o produto para alocar o lote.');
      return;
    }

    setSalvando(true);
    try {
      await onCriar({
        item_os_id: itemOsId,
        quantidade_alocada: dados.quantidade_alocada,
        cep: dados.cep || undefined,
        logradouro: dados.logradouro,
        numero: dados.numero,
        complemento: dados.complemento || undefined,
        bairro: dados.bairro,
        cidade: dados.cidade,
        uf: dados.uf,
        ...montarPayloadAgendaLote(dados),
      });
      toast.success('Lote de instalação criado.');
      resetar();
      setAberto(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Falha ao criar lote de instalação',
      );
      throw err;
    } finally {
      setSalvando(false);
    }
  }

  const botaoDesabilitado = disabled || itensComSaldo.length === 0;

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="h-9 shrink-0"
        disabled={botaoDesabilitado}
        onClick={() => setAberto(true)}
      >
        <IconPlus className="mr-1.5 h-4 w-4" />
        Novo lote
      </Button>

      <Dialog
        open={aberto}
        onOpenChange={(open) => {
          setAberto(open);
          if (!open) resetar();
        }}
      >
        <DialogContent className={INSTALACAO_DIALOG_FORM_CLASS}>
          <DialogHeader className={INSTALACAO_DIALOG_HEADER_CLASS}>
            <DialogTitle className="text-left">Novo lote de instalação</DialogTitle>
          </DialogHeader>

          <div className={INSTALACAO_DIALOG_BODY_CLASS}>
            {itensComSaldo.length > 1 && (
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={itemOsId} onValueChange={setItemOsId}>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {itensComSaldo.map((item) => (
                      <SelectItem key={item.item_os_id} value={item.item_os_id}>
                        {item.produto_servico ?? 'Produto'} — {item.saldo_disponivel}{' '}
                        de {item.quantidade_total} un. pendentes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {itemSelecionado && (
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Quantidade disponível para este lote:{' '}
                <span className="font-semibold text-foreground">
                  {itemSelecionado.saldo_disponivel}
                </span>{' '}
                de {itemSelecionado.quantidade_total} un.
                {itemSelecionado.produto_servico && (
                  <>
                    {' '}
                    — {itemSelecionado.produto_servico}
                  </>
                )}
              </p>
            )}

            {itemSelecionado && (
              <EnderecoInstalacaoForm
                key={`${itemOsId}-${itemSelecionado.saldo_disponivel}`}
                valorInicial={valorInicialForm}
                buscarCep={buscarCep}
                exibirQuantidade
                exibirAgenda
                quantidadeMaxima={itemSelecionado.saldo_disponivel}
                rotuloSalvar="Criar lote"
                onSalvar={handleSalvar}
              />
            )}
          </div>

          <DialogFooter className={INSTALACAO_DIALOG_FOOTER_CLASS}>
            <Button
              type="button"
              variant="outline"
              disabled={salvando}
              onClick={() => setAberto(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
