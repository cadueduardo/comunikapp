'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  aberto: boolean;
  aplicando: boolean;
  onConfirmar: (sobrescrever: boolean) => Promise<void> | void;
  onCancelar: () => void;
}

/**
 * Modal de confirmacao da acao "Aplicar configuracao recomendada".
 * Lista o que sera feito e oferece a opcao de sobrescrever valores ja
 * preenchidos. Defaults vem em docs/fase-0-home-operacional/08.
 */
export function AplicarConfiguracaoRecomendadaDialog({
  aberto,
  aplicando,
  onConfirmar,
  onCancelar,
}: Props) {
  const [sobrescrever, setSobrescrever] = useState(false);

  function handleOpenChange(novoAberto: boolean) {
    if (!novoAberto && !aplicando) onCancelar();
  }

  return (
    <Dialog open={aberto} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplicar configuração recomendada</DialogTitle>
          <DialogDescription>
            Vamos preencher valores iniciais para você começar a orçar. Você poderá
            ajustar tudo depois nas configurações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p className="font-medium">O que será feito:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Margem de lucro: 45% (markup)</li>
            <li>Impostos padrão: 6% (Simples Nacional inicial)</li>
            <li>Horas produtivas mensais: 352</li>
            <li>Condição de pagamento: 50% na assinatura + 50% na entrega</li>
            <li>Categorias iniciais (Acrílico, ACM, PVC, Lona, Vinil, Tinta, Acabamento, Outros)</li>
            <li>Tipos de material padrão (Chapa, Lona, Vinil, Unitário)</li>
            <li>Setores produtivos (Corte, Impressão, Acabamento, Montagem, Entrega)</li>
            <li>Modalidades de entrega padrão (retirada, entrega própria, motoboy, transportadora, Correios e outro)</li>
            <li>Tipos de instalação padrão, sem valores definidos, para ajuste no CRUD ou no orçamento</li>
            <li>Workflow padrão de OS (6 etapas)</li>
            <li>3 regras de validação básicas</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Categorias, tipos, setores, entrega, instalação e workflow só criam o que ainda não existir na loja.
          </p>
        </div>

        <label className="flex items-start gap-2 text-sm mt-2">
          <input
            type="checkbox"
            checked={sobrescrever}
            onChange={(e) => setSobrescrever(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Sobrescrever valores já preenchidos (margem, imposto e condição de pagamento)
            <span className="block text-xs text-muted-foreground">
              Por padrão, nada que você já configurou será alterado.
            </span>
          </span>
        </label>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onCancelar} disabled={aplicando}>
            Cancelar
          </Button>
          <Button onClick={() => void onConfirmar(sobrescrever)} disabled={aplicando}>
            {aplicando ? 'Aplicando…' : 'Aplicar agora'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
