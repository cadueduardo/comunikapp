'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  nome: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
  descricao: z.string().optional(),
  ativo: z.boolean(),
  exige_endereco: z.boolean(),
  exige_valor: z.boolean(),
  permite_retirada: z.boolean(),
  valor_padrao: z.string().optional(),
  custo_padrao: z.string().optional(),
  prazo_padrao_dias: z.string().optional(),
  observacoes_padrao: z.string().optional(),
});

export type ModalidadeEntregaFormValues = z.infer<typeof formSchema>;

interface ModalidadeEntregaFormProps {
  onSave: (data: ModalidadeEntregaFormValues) => Promise<void>;
  initialData?: Partial<ModalidadeEntregaFormValues>;
  loading?: boolean;
}

export function ModalidadeEntregaForm({
  onSave,
  initialData,
  loading = false,
}: ModalidadeEntregaFormProps) {
  const form = useForm<ModalidadeEntregaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: initialData?.nome ?? '',
      descricao: initialData?.descricao ?? '',
      ativo: initialData?.ativo ?? true,
      exige_endereco: initialData?.exige_endereco ?? true,
      exige_valor: initialData?.exige_valor ?? false,
      permite_retirada: initialData?.permite_retirada ?? false,
      valor_padrao: initialData?.valor_padrao ?? '',
      custo_padrao: initialData?.custo_padrao ?? '',
      prazo_padrao_dias: initialData?.prazo_padrao_dias ?? '',
      observacoes_padrao: initialData?.observacoes_padrao ?? '',
    },
  });

  return (
    <div className="w-full max-w-none">
      <div className="mb-6">
        <Link
          href="/centros-de-trabalho/modalidades-entrega"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Modalidades de Entrega
        </Link>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {initialData ? 'Editar Modalidade de Entrega' : 'Nova Modalidade de Entrega'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Motoboy, Retirada, Transportadora" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prazo_padrao_dias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo padrão em dias</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex.: 2"
                          {...field}
                          onChange={(event) => field.onChange(event.target.value.replace(/[^0-9]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="valor_padrao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor padrão cobrado (R$)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0,00"
                          {...field}
                          onChange={(event) => field.onChange(event.target.value.replace(/[^0-9,.-]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="custo_padrao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo padrão estimado (R$)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0,00"
                          {...field}
                          onChange={(event) => field.onChange(event.target.value.replace(/[^0-9,.-]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['ativo', 'Ativa'],
                  ['exige_endereco', 'Exige endereço'],
                  ['exige_valor', 'Exige valor'],
                  ['permite_retirada', 'Permite retirada'],
                ].map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as keyof ModalidadeEntregaFormValues}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded border p-3">
                        <FormControl>
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="m-0">{label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detalhes internos sobre esta modalidade..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes_padrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações padrão</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Texto padrão para orçamentos..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Link href="/centros-de-trabalho/modalidades-entrega">
                  <Button variant="outline" type="button">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Modalidade'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
