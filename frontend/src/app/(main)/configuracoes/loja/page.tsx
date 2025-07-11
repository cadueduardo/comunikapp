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
import { ImageUpload } from '@/components/ui/ImageUpload';
import { formatCurrency, parseCurrency } from '@/lib/utils';

const formSchema = z.object({
  logo_url: z.string().optional(),
  cabecalho_orcamento: z.string().optional(),
  custo_maodeobra_hora: z.string().optional(),
  custo_maquinaria_hora: z.string().optional(),
  custos_indiretos_mensais: z.string().optional(),
  margem_lucro_padrao: z.string().optional(),
  impostos_padrao: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ConfiguracoesLojaPage() {
  const { user, refetchUser, loading } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      const initialValues = {
        logo_url: loja.logo_url ?? '',
        cabecalho_orcamento: loja.cabecalho_orcamento ?? '',
        custo_maodeobra_hora: formatCurrency(loja.custo_maodeobra_hora, true, true),
        custo_maquinaria_hora: formatCurrency(loja.custo_maquinaria_hora, true, true),
        custos_indiretos_mensais: formatCurrency(loja.custos_indiretos_mensais, true, true),
        margem_lucro_padrao: formatCurrency(loja.margem_lucro_padrao, false, true),
        impostos_padrao: formatCurrency(loja.impostos_padrao, false, true),
      };
      form.reset(initialValues);
    }
  }, [user?.loja, form.reset]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    let newLogoUrl: string | null = null;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }

      // Etapa 1: Se um novo logo foi selecionado, faça o upload primeiro.
      if (selectedFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', selectedFile);

        const uploadResponse = await fetch('http://localhost:3001/lojas/logo', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: logoFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Falha ao fazer upload do logo.');
        }

        const uploadResult = await uploadResponse.json();
        newLogoUrl = uploadResult.logo_url;
      }

      // Etapa 2: Prepare e salve todas as outras configurações.
      const payload: Partial<FormValues> = {
        cabecalho_orcamento: values.cabecalho_orcamento,
        custo_maodeobra_hora: String(parseCurrency(values.custo_maodeobra_hora)),
        custo_maquinaria_hora: String(parseCurrency(values.custo_maquinaria_hora)),
        custos_indiretos_mensais: String(parseCurrency(values.custos_indiretos_mensais)),
        margem_lucro_padrao: String(parseCurrency(values.margem_lucro_padrao)),
        impostos_padrao: String(parseCurrency(values.impostos_padrao)),
      };
      
      // Se tivermos uma nova URL do logo, adicione-a ao payload.
      if (newLogoUrl) {
        payload.logo_url = newLogoUrl;
      }

      const settingsResponse = await fetch('http://localhost:3001/lojas/configuracoes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!settingsResponse.ok) {
        const errorData = await settingsResponse.json();
        throw new Error(errorData.message || 'Falha ao salvar as configurações da loja.');
      }
      
      await refetchUser();
      toast.success("Configurações da loja salvas com sucesso!");

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar as configurações.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }
  
  if (loading) {
    return (
      <div className="p-10">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-96 w-full" />
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
                  <FormLabel>Logo da Empresa</FormLabel>
                  <FormControl>
                    <ImageUpload 
                      onFileSelect={setSelectedFile} 
                      currentImageUrl={field.value}
                    />
                  </FormControl>
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
                      <Input 
                        placeholder="R$ 50,00" 
                        {...field}
                        onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                      />
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
                       <Input 
                        placeholder="R$ 120,00" 
                        {...field}
                        onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                      />
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
                       <Input 
                        placeholder="R$ 5.000,00" 
                        {...field}
                        onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                      />
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
                    <Input 
                      placeholder="100,00 %" 
                      {...field} 
                      onChange={(e) => field.onChange(formatCurrency(e.target.value, false))}
                    />
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
                    <Input 
                      placeholder="10,00 %" 
                      {...field} 
                      onChange={(e) => field.onChange(formatCurrency(e.target.value, false))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </Form>
    </div>
  );
} 