'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cliente } from '../../shared/types/common.types';

interface ClienteSectionProps {
  clientes: Cliente[];
  mode: 'novo' | 'editar' | 'template';
}

export function ClienteSection({ clientes, mode }: ClienteSectionProps) {
  const form = useFormContext();

  // Não mostrar se for template (produto)
  if (mode === 'template') {
    return null;
  }

  return (
    <Card>
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
} 