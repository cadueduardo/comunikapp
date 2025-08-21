'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { tiposMaterialApi } from '@/lib/api-client';
import { TipoMaterial } from './columns';

const formSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  descricao: z.string().optional(),
  logica_consumo: z.enum(["area", "perimetro", "quantidade_fixa", "custom"]),
  parametros_padrao: z.object({
    tipo_calculo: z.string().optional(),
    espacamento: z.number().optional(),
    quantidade_por_m2: z.number().optional(),
    multiplicador: z.number().optional(),
    quantidade_fixa: z.number().optional(),
  }).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TipoMaterialFormProps {
  defaultValues?: Partial<TipoMaterial>;
}

export function TipoMaterialForm({ defaultValues }: TipoMaterialFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logicaSelecionada, setLogicaSelecionada] = useState(defaultValues?.logica_consumo || 'area');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: defaultValues?.nome || "",
      descricao: defaultValues?.descricao || "",
      logica_consumo: (defaultValues?.logica_consumo as "area" | "perimetro" | "quantidade_fixa" | "custom") || "area",
      parametros_padrao: {
        tipo_calculo: defaultValues?.parametros_padrao?.tipo_calculo || "",
        espacamento: defaultValues?.parametros_padrao?.espacamento || undefined,
        quantidade_por_m2: defaultValues?.parametros_padrao?.quantidade_por_m2 || undefined,
        multiplicador: defaultValues?.parametros_padrao?.multiplicador || undefined,
        quantidade_fixa: defaultValues?.parametros_padrao?.quantidade_fixa || undefined,
      },
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error("Token de acesso não encontrado.");
        return;
      }

      if (defaultValues?.id) {
        // Atualizar
        await tiposMaterialApi.update(defaultValues.id, values, token);
        toast.success('Tipo de material atualizado com sucesso!');
      } else {
        // Criar
        await tiposMaterialApi.create(values, token);
        toast.success('Tipo de material criado com sucesso!');
      }
      
      router.push('/configuracoes/tipos-material');
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao conectar ao servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getParametrosFields = () => {
    switch (logicaSelecionada) {
      case "custom":
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">🎯 Escolha o tipo de cálculo:</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div>• <strong>Espaçamento:</strong> Para ilhós, parafusos, etc. (ex: a cada 30cm)</div>
                <div>• <strong>Quantidade por m²:</strong> Para arrebites, pregos, etc. (ex: 4 por m²)</div>
                <div>• <strong>Multiplicador:</strong> Para fita adesiva, etc. (ex: 2x o perímetro)</div>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="parametros_padrao.tipo_calculo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cálculo Específico</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de cálculo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="espacamento">Espaçamento (ilhós, parafusos)</SelectItem>
                      <SelectItem value="quantidade_por_m2">Quantidade por m² (arrebites, pregos)</SelectItem>
                      <SelectItem value="multiplicador">Multiplicador (fita adesiva)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("parametros_padrao.tipo_calculo") === "espacamento" && (
              <FormField
                control={form.control}
                name="parametros_padrao.espacamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Espaçamento (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="30"
                        value={field.value ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      💡 Exemplo: 30cm = 1 item a cada 30cm do perímetro
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {form.watch("parametros_padrao.tipo_calculo") === "quantidade_por_m2" && (
              <FormField
                control={form.control}
                name="parametros_padrao.quantidade_por_m2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade por m²</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="4"
                        value={field.value ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      💡 Exemplo: 4 = 4 itens por cada m² de área
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {form.watch("parametros_padrao.tipo_calculo") === "multiplicador" && (
              <FormField
                control={form.control}
                name="parametros_padrao.multiplicador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Multiplicador</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="2"
                        value={field.value ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      💡 Exemplo: 2 = 2x o valor base (perímetro, área, etc.)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        );
      case "quantidade_fixa":
        return (
          <FormField
            control={form.control}
            name="parametros_padrao.quantidade_fixa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade Fixa</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="10"
                    value={field.value ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  💡 Quantidade fixa independente da área/perímetro
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case "area":
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              ✅ <strong>Área (m²):</strong> A quantidade será calculada automaticamente baseada na área do produto.
            </p>
          </div>
        );
      case "perimetro":
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              ✅ <strong>Perímetro (m):</strong> A quantidade será calculada automaticamente baseada no perímetro do produto.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Tipo de Material</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ilhós, Arrebites, Fita Adesiva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ex: Aplicar a cada 15cm do perímetro" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lógica de Consumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="logica_consumo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lógica de Consumo</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setLogicaSelecionada(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a lógica de consumo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="area">Área (m²)</SelectItem>
                        <SelectItem value="perimetro">Perímetro (m)</SelectItem>
                        <SelectItem value="quantidade_fixa">Quantidade Fixa</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {getParametrosFields()}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/configuracoes/tipos-material')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Salvando...' : (defaultValues ? 'Atualizar' : 'Salvar')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 