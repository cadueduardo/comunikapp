'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormContext } from 'react-hook-form';
import { Cliente } from '../../shared/types/common.types';

interface ClienteSectionProps {
  clientes: Cliente[];
  mode: 'novo' | 'editar' | 'template';
}

export function ClienteSection({ clientes, mode }: ClienteSectionProps) {
  const form = useFormContext();

  if (mode === 'template') {
    return null;
  }

  if (mode === 'editar') {
    const clienteId = form.watch('cliente_id');
    if (clienteId) {
      const cliente = clientes.find((c) => c.id === clienteId);
      return (
        <Card flatOnMobile>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-gray-50 p-3">
              <p className="font-medium text-gray-900">
                {cliente ? cliente.nome : 'Carregando cliente...'}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Cliente fixo - não pode ser alterado
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <Card flatOnMobile>
      <CardHeader>
        <CardTitle>Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="cliente_id"
          render={({ field }) => {
            const valorNaLista =
              field.value &&
              clientes.some((c) => String(c.id) === String(field.value))
                ? String(field.value)
                : undefined;

            return (
              <FormItem>
                <FormLabel>Selecione o Cliente</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  {...(valorNaLista !== undefined
                    ? { value: valorNaLista }
                    : {})}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={String(cliente.id)}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </CardContent>
    </Card>
  );
}
