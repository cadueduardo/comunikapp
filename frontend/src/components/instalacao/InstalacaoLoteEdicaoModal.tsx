'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnderecoInstalacaoForm } from '@/components/instalacao/EnderecoInstalacaoForm';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import { montarEnderecoResumido } from '@/lib/instalacao/instalacao-lote-utils';
import type { EnderecoLoteForm, LotePainelOs } from '@/lib/instalacao/instalacao.types';
import {
  loteParaEnderecoForm,
  montarPayloadAgendaLote,
} from '@/lib/instalacao/instalacao.types';
import {
  INSTALACAO_DIALOG_BODY_CLASS,
  INSTALACAO_DIALOG_FORM_CLASS,
  INSTALACAO_DIALOG_HEADER_CLASS,
} from '@/lib/instalacao/instalacao-modal-classes';
import { IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';

interface InstalacaoLoteEdicaoModalProps {
  open: boolean;
  onClose: () => void;
  osId: string;
  loteId: string;
  osNumero?: string;
  onMutacao?: () => void;
}

export function InstalacaoLoteEdicaoModal({
  open,
  onClose,
  osId,
  loteId,
  osNumero,
  onMutacao,
}: InstalacaoLoteEdicaoModalProps) {
  const [lote, setLote] = useState<LotePainelOs | null>(null);
  const [quantidadeMaxima, setQuantidadeMaxima] = useState<number | undefined>();
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    if (!open || !osId || !loteId) return;

    setCarregando(true);
    try {
      const painel = await instalacaoApi.obterPainelOs(osId);
      const loteEncontrado = painel.lotes.find((item) => item.id === loteId);
      if (!loteEncontrado) {
        toast.error('Lote de instalação não encontrado nesta OS.');
        onClose();
        return;
      }

      const itemSaldo = painel.itens_saldo?.find(
        (item) => item.item_os_id === loteEncontrado.item_os_id,
      );
      setLote(loteEncontrado);
      setQuantidadeMaxima(
        (itemSaldo?.saldo_disponivel ?? 0) + loteEncontrado.quantidade_alocada,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Falha ao carregar o lote.',
      );
      onClose();
    } finally {
      setCarregando(false);
    }
  }, [open, osId, loteId, onClose]);

  useEffect(() => {
    if (!open) {
      setLote(null);
      return;
    }
    void carregar();
  }, [open, carregar]);

  async function handleSalvar(dados: EnderecoLoteForm) {
    if (!lote) return;

    await instalacaoApi.atualizarLote(lote.id, {
      cep: dados.cep,
      logradouro: dados.logradouro,
      numero: dados.numero,
      complemento: dados.complemento || undefined,
      bairro: dados.bairro,
      cidade: dados.cidade,
      uf: dados.uf,
      quantidade_alocada: dados.quantidade_alocada,
      ...montarPayloadAgendaLote(dados),
    });

    toast.success('Lote atualizado.');
    onMutacao?.();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={INSTALACAO_DIALOG_FORM_CLASS}>
        <DialogHeader className={INSTALACAO_DIALOG_HEADER_CLASS}>
          <DialogTitle className="text-left">
            {lote
              ? `Editar lote — ${montarEnderecoResumido(lote)}`
              : 'Carregando lote...'}
          </DialogTitle>
          {osNumero && (
            <p className="text-sm text-muted-foreground">OS {osNumero}</p>
          )}
        </DialogHeader>

        <div className={INSTALACAO_DIALOG_BODY_CLASS}>
          {carregando || !lote ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
              Carregando dados do lote...
            </div>
          ) : (
            <EnderecoInstalacaoForm
              key={lote.id}
              valorInicial={loteParaEnderecoForm(lote)}
              buscarCep={(cep) => instalacaoApi.buscarCep(cep)}
              exibirQuantidade
              exibirAgenda
              quantidadeMaxima={quantidadeMaxima ?? lote.quantidade_alocada}
              rotuloSalvar="Salvar alterações"
              onSalvar={handleSalvar}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
