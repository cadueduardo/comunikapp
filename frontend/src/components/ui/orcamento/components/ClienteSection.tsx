'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormContext } from 'react-hook-form';
import { Cliente } from '../../shared/types/common.types';

interface ClienteSectionProps {
  clientes: Cliente[];
  mode: 'novo' | 'editar' | 'template';
}

/**
 * Select nativo de propósito: o Radix Select + FormControl/RHF entrava em
 * Maximum update depth neste campo (default cliente_id ''). Não usar o
 * Select de @/components/ui/select aqui até o padrão Form+Select estar estável.
 */
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
            <div className="rounded-md border border-border bg-muted/40 p-3">
              <p className="font-medium text-foreground">
                {cliente ? cliente.nome : 'Carregando cliente...'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Selecione o Cliente</FormLabel>
              <FormControl>
                <select
                  id={field.name}
                  name={field.name}
                  ref={field.ref}
                  value={field.value ? String(field.value) : ''}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Escolha um cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={String(cliente.id)}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
