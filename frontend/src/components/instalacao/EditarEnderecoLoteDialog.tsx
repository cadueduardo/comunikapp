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
import { IconEdit } from '@tabler/icons-react';

interface EditarEnderecoLoteDialogProps {
  lote: LotePainelOs;
  buscarCep: (cep: string) => Promise<ResultadoBuscaCep>;
  onSalvar: (dados: EnderecoLoteForm) => Promise<void>;
  quantidadeMaxima?: number;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
}

export function EditarEnderecoLoteDialog({
  lote,
  buscarCep,
  onSalvar,
  quantidadeMaxima,
  variant = 'outline',
  size = 'sm',
}: EditarEnderecoLoteDialogProps) {
  const [aberto, setAberto] = useState(false);

  if (lote.status_instalacao === 'CONCLUIDO') {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setAberto(true)}
      >
        <IconEdit className="mr-1.5 h-4 w-4" />
        Editar endereço
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="flex max-h-[90vh] w-[calc(100vw-1rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full">
          <DialogHeader className="border-b border-border px-4 py-4 sm:px-6">
            <DialogTitle className="text-left">
              Endereço do lote de instalação
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <EnderecoInstalacaoForm
              key={lote.id}
              valorInicial={loteParaEnderecoForm(lote)}
              buscarCep={buscarCep}
              exibirQuantidade
              quantidadeMaxima={quantidadeMaxima ?? lote.quantidade_alocada}
              rotuloSalvar="Salvar endereço"
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
