'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  tipo: z.string().min(1, 'Selecione um tipo de máquina.'),
  custo_hora: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) > 0, {
    message: 'O custo por hora deve ser maior que zero.',
  }),
  status: z.string().min(1, 'Selecione um status.'),
  capacidade: z.string().optional(),
  observacoes: z.string().optional(),
});

export type MaquinaFormValues = z.infer<typeof formSchema>;

interface MaquinaFormProps {
  onSave: (data: MaquinaFormValues) => Promise<void>;
  initialData?: {
    nome: string;
    tipo: string;
    custo_hora: number;
    status: string;
    capacidade?: string;
    observacoes?: string;
  };
  loading?: boolean;
}

export function MaquinaForm({ onSave, initialData, loading = false }: MaquinaFormProps) {
  const form = useForm<MaquinaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nome: '',
      tipo: '',
      custo_hora: '',
      status: 'ATIVA',
      capacidade: '',
      observacoes: '',
    },
  });

  const onSubmit = async (values: MaquinaFormValues) => {
    await onSave(values);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/configuracoes/maquinas" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Máquinas
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {initialData ? 'Editar Máquina' : 'Nova Máquina'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Máquina</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Plotter HP 1200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Máquina</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PLOTTER">Plotter</SelectItem>
                          <SelectItem value="ROUTER">Router</SelectItem>
                          <SelectItem value="IMPRESSORA">Impressora</SelectItem>
                          <SelectItem value="CORTE">Corte</SelectItem>
                          <SelectItem value="OUTROS">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ATIVA">Ativa</SelectItem>
                          <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                          <SelectItem value="INATIVA">Inativa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="custo_hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo por Hora</FormLabel>
                    <FormControl>
                      <CustomCurrencyInput
                        placeholder="0,00"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Custo operacional por hora de uso da máquina.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1200x800mm, 2x1m" {...field} />
                    </FormControl>
                    <FormDescription>
                      Dimensões máximas ou capacidade da máquina.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais sobre a máquina..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Máquina'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 