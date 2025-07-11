'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/contexts/UserContext';

const formSchema = z.object({
  logo_url: z.string().url({ message: 'URL inválida.' }).optional().or(z.literal('')),
  cabecalho_orcamento: z.string().optional(),
  custo_maodeobra_hora: z.string().optional(),
  custo_maquinaria_hora: z.string().optional(),
  custos_indiretos_mensais: z.string().optional(),
  margem_lucro_padrao: z.string().optional(),
  impostos_padrao: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ConfiguracoesLojaPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      logo_url: '',
      cabecalho_orcamento: '',
      custo_maodeobra_hora: '',
      custo_maquinaria_hora: '',
      custos_indiretos_mensais: '',
      margem_lucro_padrao: '',
      impostos_padrao: '',
    },
  });

  useEffect(() => {
    if (user?.loja) {
      const { loja } = user;
      form.reset({
        logo_url: loja.logo_url ?? '',
        cabecalho_orcamento: loja.cabecalho_orcamento ?? '',
        custo_maodeobra_hora: loja.custo_maodeobra_hora ?? '',
        custo_maquinaria_hora: loja.custo_maquinaria_hora ?? '',
        custos_indiretos_mensais: loja.custos_indiretos_mensais ?? '',
        margem_lucro_padrao: loja.margem_lucro_padrao ?? '',
        impostos_padrao: loja.impostos_padrao ?? '',
      });
    }
  }, [user, form]);

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Converte strings numéricas para números antes de enviar
      const payload = {
        ...data,
        custo_maodeobra_hora: data.custo_maodeobra_hora ? parseFloat(data.custo_maodeobra_hora) : undefined,
        custo_maquinaria_hora: data.custo_maquinaria_hora ? parseFloat(data.custo_maquinaria_hora) : undefined,
        custos_indiretos_mensais: data.custos_indiretos_mensais ? parseFloat(data.custos_indiretos_mensais) : undefined,
        margem_lucro_padrao: data.margem_lucro_padrao ? parseFloat(data.margem_lucro_padrao) : undefined,
        impostos_padrao: data.impostos_padrao ? parseFloat(data.impostos_padrao) : undefined,
      };

      const response = await fetch('http://localhost:3001/lojas/configuracoes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar as configurações.');
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro ao salvar as configurações.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </div>
        <Separator />
        <div className="space-y-8">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full" />
            <Separator />
            <Skeleton className="h-20 w-full" />
            <Separator />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Configurações da Loja
        </h1>
        <p className="text-muted-foreground">
          Gerencie os dados da sua empresa, custos e parâmetros de negócio.
        </p>
      </div>
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Dados da Empresa</h2>
            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Logo</FormLabel>
                  <FormControl>
                    <Input placeholder="https://exemplo.com/logo.png" {...field} />
                  </FormControl>
                  <FormDescription>
                    O logo que aparecerá nos seus orçamentos.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cabecalho_orcamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cabeçalho para Orçamentos</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Nome da Empresa - Rua Exemplo, 123 - (11) 99999-9999"
                      className="resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Este texto aparecerá no topo de todos os seus orçamentos.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Custos Operacionais</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="custo_maodeobra_hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Mão de Obra (por hora)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="custo_maquinaria_hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Maquinário (por hora)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="120.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="custos_indiretos_mensais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custos Indiretos (mensal)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Parâmetros de Negócio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="margem_lucro_padrao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Margem de Lucro Padrão (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="impostos_padrao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impostos Padrão (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </Form>
    </div>
  );
} 