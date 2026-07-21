'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useFieldArray, useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const itemSchema = z.object({
  tipo: z.enum(['DESPESA', 'SERVICO', 'MATERIAL']),
  descricao: z.string().trim().min(1, 'Informe a descrição.'),
  quantidade: z.coerce.number().positive('Quantidade deve ser positiva.'),
  unidade: z.string().trim().min(1, 'Informe a unidade.'),
  insumo_id: z.string().optional(),
});

export const solicitacaoFormSchema = z.object({
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']),
  origem_tipo: z.enum([
    'MANUAL',
    'ORDEM_SERVICO',
    'ITEM_OS',
    'ORDEM_TERCEIRIZACAO',
    'ESTOQUE',
    'MANUTENCAO',
    'ADMINISTRATIVO',
  ]),
  justificativa: z.string().optional(),
  itens: z.array(itemSchema).min(1, 'Informe ao menos um item.'),
});

export type SolicitacaoFormValues = z.infer<typeof solicitacaoFormSchema>;

export interface SolicitacaoFormData extends Partial<SolicitacaoFormValues> {
  prioridade: SolicitacaoFormValues['prioridade'];
  origem_tipo: SolicitacaoFormValues['origem_tipo'];
  itens: SolicitacaoFormValues['itens'];
}

interface SolicitacaoFormProps {
  onSave: (values: SolicitacaoFormValues) => Promise<void>;
  initialData?: SolicitacaoFormData;
  loading?: boolean;
  readOnly?: boolean;
}

export function SolicitacaoForm({
  onSave,
  initialData,
  loading = false,
  readOnly = false,
}: SolicitacaoFormProps) {
  const form = useForm<SolicitacaoFormValues>({
    resolver: zodResolver(solicitacaoFormSchema),
    defaultValues: {
      prioridade: initialData?.prioridade ?? 'NORMAL',
      origem_tipo: initialData?.origem_tipo ?? 'MANUAL',
      justificativa: initialData?.justificativa ?? '',
      itens: initialData?.itens?.length
        ? initialData.itens
        : [
            {
              tipo: 'DESPESA',
              descricao: '',
              quantidade: 1,
              unidade: 'UN',
            },
          ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens',
  });

  const submit = form.handleSubmit(async (values) => {
    await onSave({
      ...values,
      justificativa: values.justificativa?.trim() || undefined,
      itens: values.itens.map((item) => ({
        ...item,
        descricao: item.descricao.trim(),
        unidade: item.unidade.trim(),
        insumo_id: item.insumo_id?.trim() || undefined,
      })),
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados da solicitação</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="prioridade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select
                    disabled={readOnly}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BAIXA">Baixa</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="ALTA">Alta</SelectItem>
                      <SelectItem value="URGENTE">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="origem_tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origem</FormLabel>
                  <Select
                    disabled={readOnly}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="ORDEM_SERVICO">Ordem de serviço</SelectItem>
                      <SelectItem value="ESTOQUE">Estoque</SelectItem>
                      <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                      <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="justificativa"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Justificativa</FormLabel>
                  <FormControl>
                    <Textarea rows={3} disabled={readOnly} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Itens</CardTitle>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    tipo: 'DESPESA',
                    descricao: '',
                    quantidade: 1,
                    unidade: 'UN',
                  })
                }
              >
                Adicionar item
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                <FormField
                  control={form.control}
                  name={`itens.${index}.tipo`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        disabled={readOnly}
                        value={itemField.value}
                        onValueChange={itemField.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DESPESA">Despesa</SelectItem>
                          <SelectItem value="SERVICO">Serviço</SelectItem>
                          <SelectItem value="MATERIAL">Material</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`itens.${index}.descricao`}
                  render={({ field: itemField }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input disabled={readOnly} {...itemField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`itens.${index}.insumo_id`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Insumo ID (material)</FormLabel>
                      <FormControl>
                        <Input
                          disabled={readOnly}
                          placeholder="Obrigatório se MATERIAL"
                          {...itemField}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`itens.${index}.quantidade`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          min="0.001"
                          disabled={readOnly}
                          {...itemField}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`itens.${index}.unidade`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Unidade</FormLabel>
                      <FormControl>
                        <Input disabled={readOnly} {...itemField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!readOnly && fields.length > 1 && (
                  <div className="flex items-end sm:col-span-2 lg:col-span-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => remove(index)}
                    >
                      Remover item
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {!readOnly && (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" asChild>
              <Link href="/compras/solicitacoes">Voltar</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
