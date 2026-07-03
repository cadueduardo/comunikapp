'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnderecoInstalacaoForm } from '@/components/instalacao/EnderecoInstalacaoForm';
import type {
  EnderecoLoteForm,
  LotePainelOs,
  ResultadoBuscaCep,
} from '@/lib/instalacao/instalacao.types';
import { loteParaEnderecoForm } from '@/lib/instalacao/instalacao.types';
import {
  INSTALACAO_DIALOG_BODY_CLASS,
  INSTALACAO_DIALOG_FORM_CLASS,
  INSTALACAO_DIALOG_HEADER_CLASS,
} from '@/lib/instalacao/instalacao-modal-classes';
import { IconEdit } from '@tabler/icons-react';

interface EditarEnderecoLoteDialogProps {
  lote: LotePainelOs;
  buscarCep: (cep: string) => Promise<ResultadoBuscaCep>;
  onSalvar: (dados: EnderecoLoteForm) => Promise<void>;
  quantidadeMaxima?: number;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
  /** Modo controlado — evita perder o painel do lote ao fechar (dialog aninhado). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  ocultarBotao?: boolean;
}

export function EditarEnderecoLoteDialog({
  lote,
  buscarCep,
  onSalvar,
  quantidadeMaxima,
  variant = 'outline',
  size = 'sm',
  open: openControlado,
  onOpenChange,
  ocultarBotao = false,
}: EditarEnderecoLoteDialogProps) {
  const [abertoInterno, setAbertoInterno] = useState(false);
  const controlado = openControlado !== undefined;
  const aberto = controlado ? openControlado : abertoInterno;

  const setAberto = (valor: boolean) => {
    if (controlado) {
      onOpenChange?.(valor);
    } else {
      setAbertoInterno(valor);
    }
  };

  if (lote.status_instalacao === 'CONCLUIDO') {
    return null;
  }

  return (
    <>
      {!ocultarBotao && (
        <Button
          type="button"
          variant={variant}
          size={size}
          onClick={() => setAberto(true)}
        >
          <IconEdit className="mr-1.5 h-4 w-4" />
          Editar lote
        </Button>
      )}

      <Dialog open={aberto} onOpenChange={setAberto} modal>
        <DialogContent
          className={INSTALACAO_DIALOG_FORM_CLASS}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          <DialogHeader className={INSTALACAO_DIALOG_HEADER_CLASS}>
            <DialogTitle className="text-left">
              Endereço e agenda do lote
            </DialogTitle>
          </DialogHeader>
          <div className={INSTALACAO_DIALOG_BODY_CLASS}>
            <EnderecoInstalacaoForm
              key={lote.id}
              valorInicial={loteParaEnderecoForm(lote)}
              buscarCep={buscarCep}
              exibirQuantidade
              exibirAgenda
              quantidadeMaxima={quantidadeMaxima ?? lote.quantidade_alocada}
              rotuloSalvar="Salvar alterações"
              onSalvar={async (dados) => {
                await onSalvar(dados);
                setAberto(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
