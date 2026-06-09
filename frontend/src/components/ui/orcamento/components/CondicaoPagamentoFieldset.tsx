'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';

/**
 * Fieldset de Condicao de Pagamento estruturada (Fase 6).
 *
 * Substitui o antigo input livre `forma_pagamento`. Os tipos seguem o enum
 * `CondicaoPagamentoTipo` do backend.
 *
 * Comportamento:
 * - Carrega defaults da loja (`loja.condicao_pagamento_padrao_*`) no novo orcamento.
 * - Mostra campos condicionais conforme o tipo selecionado.
 * - Para PERSONALIZADO, mostra um textarea de descricao livre.
 *
 * Decisao de produto (2026-05-25): mantemos `forma_pagamento` (texto livre)
 * deprecated; o backend deriva o texto a partir dos campos estruturados ao
 * gravar e ao gerar a cobranca.
 */
const OPCOES_TIPO = [
  { value: 'A_VISTA', label: 'A vista (na aprovacao)' },
  { value: 'ENTRADA_SALDO', label: 'Entrada + saldo na entrega' },
  { value: 'FATURADO_30', label: 'Faturado 30 dias' },
  { value: 'FATURADO_60', label: 'Faturado 60 dias' },
  { value: 'FATURADO_90', label: 'Faturado 90 dias' },
  { value: 'PARCELADO', label: 'Parcelado mensalmente' },
  { value: 'PERSONALIZADO', label: 'Personalizado (descrever)' },
] as const;

interface CondicaoPagamentoFieldsetProps {
  mode?: 'novo' | 'editar' | 'template';
}

export function CondicaoPagamentoFieldset({ mode = 'novo' }: CondicaoPagamentoFieldsetProps) {
  const form = useFormContext();
  const { user } = useUser();

  const tipoAtual = useWatch({ control: form.control, name: 'condicao_pagamento_tipo' });

  // Pre-preenche com o default da loja apenas em orcamento novo (nao sobrescreve edicao).
  useEffect(() => {
    if (mode === 'editar') return;
    const tipoForm = form.getValues('condicao_pagamento_tipo');
    if (!tipoForm && user?.loja?.condicao_pagamento_padrao_tipo) {
      form.setValue(
        'condicao_pagamento_tipo',
        user.loja.condicao_pagamento_padrao_tipo as
          | 'A_VISTA'
          | 'ENTRADA_SALDO'
          | 'FATURADO_30'
          | 'FATURADO_60'
          | 'FATURADO_90'
          | 'PARCELADO'
          | 'PERSONALIZADO',
      );
      if (user.loja.condicao_pagamento_padrao_entrada_pct) {
        const pct = Number(user.loja.condicao_pagamento_padrao_entrada_pct);
        if (!Number.isNaN(pct)) {
          form.setValue('condicao_pagamento_entrada_pct', String(pct));
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, user?.loja?.condicao_pagamento_padrao_tipo]);

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-800">Condicao de Pagamento</h4>
        <span className="text-xs text-muted-foreground">
          Sera gerada uma cobranca automatica ao aprovar
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="condicao_pagamento_tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ? String(field.value) : undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {OPCOES_TIPO.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {tipoAtual === 'ENTRADA_SALDO' && (
          <FormField
            control={form.control}
            name="condicao_pagamento_entrada_pct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Percentual de entrada (%) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    step={1}
                    placeholder="50"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Saldo restante e cobrado na entrega.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {tipoAtual === 'PARCELADO' && (
          <FormField
            control={form.control}
            name="condicao_pagamento_parcelas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numero de parcelas *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={2}
                    max={36}
                    step={1}
                    placeholder="3"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Parcelas mensais iguais a partir da aprovacao.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {(tipoAtual === 'PERSONALIZADO' || tipoAtual) && (
        <FormField
          control={form.control}
          name="condicao_pagamento_descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Descricao
                {tipoAtual === 'PERSONALIZADO' ? ' *' : ' (opcional)'}
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder={
                    tipoAtual === 'PERSONALIZADO'
                      ? 'Ex.: 30% em 7 dias, 40% em 30 dias, 30% na entrega'
                      : 'Sobrescreve a descricao automatica (opcional)'
                  }
                  maxLength={255}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
