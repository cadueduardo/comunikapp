'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { custosIndiretosApi } from '@/lib/api-client';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  valor_mensal: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) > 0, {
    message: 'O valor mensal deve ser maior que zero.',
  }),
  descricao: z.string().optional(),
  setor_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CustoIndiretoFormProps {
  custoIndireto?: {
    id: string;
    nome: string;
    categoria: string;
    valor_mensal: number;
    observacoes?: string;
    setor_id?: string | null;
  };
}

export default function CustoIndiretoForm({ custoIndireto }: CustoIndiretoFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isEditing = !!custoIndireto;

  const [setores, setSetores] = useState<Array<{ id: string; nome: string }>>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: custoIndireto?.nome || '',
      categoria: custoIndireto?.categoria || '',
      valor_mensal: custoIndireto?.valor_mensal ? custoIndireto.valor_mensal : '',
      descricao: custoIndireto?.observacoes || '',
      setor_id: custoIndireto?.setor_id || '',
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    fetch('/api/centros-de-trabalho/setores-produtivos?ativo=true', { headers })
      .then((r) => r.json())
      .then((data) => setSetores(Array.isArray(data) ? data : []))
      .catch(() => setSetores([]));
  }, []);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const requestData = {
        ...values,
        valor_mensal: parseFloat(String(values.valor_mensal).replace(/[^0-9,-]/g, '').replace(',', '.')),
        setor_id: values.setor_id || undefined,
      };

      if (isEditing) {
        await custosIndiretosApi.update(custoIndireto.id, requestData, token);
        toast.success('Custo indireto atualizado com sucesso!');
      } else {
        await custosIndiretosApi.create(requestData, token);
        toast.success('Custo indireto criado com sucesso!');
      }

      router.push('/centros-de-trabalho/custos-indiretos');
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar custo indireto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/centros-de-trabalho/custos-indiretos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Custo Indireto' : 'Novo Custo Indireto'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Custo Indireto</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Aluguel, Energia, Internet..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Infraestrutura, Serviços..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor_mensal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mensal</FormLabel>
                      <FormControl>
                        <CustomCurrencyInput
                          placeholder="0,00"
                          onValueChange={field.onChange}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="setor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor</FormLabel>
                      <Select value={field.value || 'geral'} onValueChange={(v) => field.onChange(v === 'geral' ? '' : v)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Geral (rateado entre setores)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="geral">Geral (rateado entre setores)</SelectItem>
                          {setores.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição detalhada do custo indireto..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 