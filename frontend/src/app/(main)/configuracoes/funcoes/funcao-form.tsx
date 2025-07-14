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
import { useState, useEffect } from 'react';

const formSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  custo_hora: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) > 0, {
    message: 'O custo por hora deve ser maior que zero.',
  }),
  descricao: z.string().optional(),
  maquina_id: z.string().optional(),
});

export type FuncaoFormValues = z.infer<typeof formSchema>;

interface FuncaoFormProps {
  onSave: (data: FuncaoFormValues) => Promise<void>;
  initialData?: {
    nome: string;
    custo_hora: number;
    descricao?: string;
    maquina_id?: string;
  };
  loading?: boolean;
}

interface Maquina {
  id: string;
  nome: string;
  tipo: string;
}

export function FuncaoForm({ onSave, initialData, loading = false }: FuncaoFormProps) {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);

  const form = useForm<FuncaoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nome: '',
      custo_hora: '',
      descricao: '',
      maquina_id: 'null',
    },
  });

  useEffect(() => {
    fetchMaquinas();
  }, []);

  const fetchMaquinas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/maquinas', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMaquinas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error);
    }
  };

  const onSubmit = async (values: FuncaoFormValues) => {
    await onSave(values);
  };

  return (
    <div className="w-full max-w-none">
      <div className="mb-6">
        <Link href="/configuracoes/funcoes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Funções
        </Link>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {initialData ? 'Editar Função' : 'Nova Função'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Função</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Operador Plotter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="custo_hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo por Hora (R$)</FormLabel>
                      <FormControl>
                        <CustomCurrencyInput
                          placeholder="0,00"
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Custo operacional por hora de trabalho.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maquina_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máquina Vinculada (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma máquina (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">Nenhuma máquina</SelectItem>
                          {maquinas.map((maquina) => (
                            <SelectItem key={maquina.id} value={maquina.id}>
                              {maquina.nome} ({maquina.tipo})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Vincule esta função a uma máquina específica (opcional).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição da função, responsabilidades, etc..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Descrição detalhada da função e responsabilidades.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Link href="/configuracoes/funcoes">
                  <Button variant="outline" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Função'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 