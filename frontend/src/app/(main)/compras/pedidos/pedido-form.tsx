'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { fornecedoresApi, type FornecedorApi } from '@/lib/api-client';

const itemSchema = z.object({
  tipo: z.enum(['DESPESA', 'SERVICO', 'MATERIAL']),
  descricao_snapshot: z.string().trim().min(1, 'Informe a descrição.'),
  quantidade: z.coerce.number<number>().positive('Quantidade deve ser positiva.'),
  unidade_snapshot: z.string().trim().min(1, 'Informe a unidade.'),
  preco_unitario: z.coerce
    .number<number>()
    .min(0, 'Preço não pode ser negativo.'),
  insumo_id: z.string().optional(),
});

export const pedidoFormSchema = z.object({
  fornecedor_id: z.string().min(1, 'Selecione o fornecedor.'),
  observacoes: z.string().optional(),
  fornecedor_fora_matriz_justificativa: z.string().optional(),
  itens: z.array(itemSchema).min(1, 'Informe ao menos um item.'),
});

type PedidoFormInput = z.input<typeof pedidoFormSchema>;
export type PedidoFormValues = z.output<typeof pedidoFormSchema>;

export interface PedidoFormData extends Partial<PedidoFormValues> {
  fornecedor_id: string;
  itens: PedidoFormValues['itens'];
}

interface PedidoFormProps {
  onSave: (values: PedidoFormValues) => Promise<void>;
  initialData?: PedidoFormData;
  loading?: boolean;
  readOnly?: boolean;
}

export function PedidoForm({
  onSave,
  initialData,
  loading = false,
  readOnly = false,
}: PedidoFormProps) {
  const [fornecedores, setFornecedores] = useState<FornecedorApi[]>([]);

  const form = useForm<PedidoFormInput, unknown, PedidoFormValues>({
    resolver: zodResolver(pedidoFormSchema),
    defaultValues: {
      fornecedor_id: initialData?.fornecedor_id ?? '',
      observacoes: initialData?.observacoes ?? '',
      fornecedor_fora_matriz_justificativa:
        initialData?.fornecedor_fora_matriz_justificativa ?? '',
      itens: initialData?.itens?.length
        ? initialData.itens
        : [
            {
              tipo: 'DESPESA',
              descricao_snapshot: '',
              quantidade: 1,
              unidade_snapshot: 'UN',
              preco_unitario: 0,
            },
          ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens',
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    void fornecedoresApi
      .getAll(token)
      .then((data) => setFornecedores(data.filter((f) => f.ativo !== false)))
      .catch((error) => {
        console.error(error);
        toast.error('Erro ao carregar fornecedores.');
      });
  }, []);

  const submit = form.handleSubmit(async (values) => {
    await onSave({
      ...values,
      observacoes: values.observacoes?.trim() || undefined,
      fornecedor_fora_matriz_justificativa:
        values.fornecedor_fora_matriz_justificativa?.trim() || undefined,
      itens: values.itens.map((item) => ({
        ...item,
        descricao_snapshot: item.descricao_snapshot.trim(),
        unidade_snapshot: item.unidade_snapshot.trim(),
        insumo_id: item.insumo_id?.trim() || undefined,
      })),
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do pedido</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fornecedor_id"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Fornecedor</FormLabel>
                  <Select
                    disabled={readOnly}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fornecedores.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={3} disabled={readOnly} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fornecedor_fora_matriz_justificativa"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    Justificativa (fornecedor fora da matriz)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      disabled={readOnly}
                      placeholder="Obrigatório se algum material não estiver na matriz do fornecedor"
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
                    descricao_snapshot: '',
                    quantidade: 1,
                    unidade_snapshot: 'UN',
                    preco_unitario: 0,
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
                className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-5"
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
                  name={`itens.${index}.descricao_snapshot`}
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
                  name={`itens.${index}.quantidade`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Qtd</FormLabel>
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
                  name={`itens.${index}.unidade_snapshot`}
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
                <FormField
                  control={form.control}
                  name={`itens.${index}.preco_unitario`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Preço unit.</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
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
                  name={`itens.${index}.insumo_id`}
                  render={({ field: itemField }) => (
                    <FormItem className="sm:col-span-2">
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
                {!readOnly && fields.length > 1 && (
                  <div className="flex items-end lg:col-span-5">
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
              <Link href="/compras/pedidos">Voltar</Link>
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
