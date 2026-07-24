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

  // Em modo editar, mostrar cliente fixo quando já vinculado; senão permitir seleção (rascunho sem cliente).
  if (mode === 'editar') {
    const clienteId = form.watch('cliente_id');
    if (clienteId) {
      const cliente = clientes.find(c => c.id === clienteId);
      return (
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-gray-50 rounded-md border">
              <p className="font-medium text-gray-900">{cliente ? cliente.nome : 'Carregando cliente...'}</p>
              <p className="text-sm text-gray-600 mt-1">Cliente fixo - não pode ser alterado</p>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // Em modo novo ou rascunho sem cliente, permitir seleção
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
              <Select
                onValueChange={field.onChange}
                value={field.value ? String(field.value) : undefined}
              >
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