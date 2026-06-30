'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const TIPOS_CAMPO = ['TEXTO', 'NUMERO', 'DATA'] as const;

const campoSchema = z.object({
  chave: z
    .string()
    .min(1, 'Informe a chave.')
    .regex(/^[a-z][a-z0-9_]*$/, 'Use snake_case (ex.: nome_cliente).'),
  label: z.string().min(1, 'Informe o rótulo.'),
  tipo: z.enum(TIPOS_CAMPO),
  obrigatorio: z.boolean(),
  max_caracteres: z.string().optional(),
  placeholder: z.string().optional(),
  ordem: z.string().optional(),
});

const formSchema = z.object({
  nome: z.string().min(2, 'Informe o nome do conjunto.'),
  descricao: z.string().optional(),
  ativo: z.boolean(),
  campos: z.array(campoSchema).min(1, 'Adicione ao menos um campo.'),
});

export type ConjuntoCamposFormValues = z.infer<typeof formSchema>;

interface ConjuntoCamposFormProps {
  onSave: (data: ConjuntoCamposFormValues) => Promise<void>;
  initialData?: Partial<ConjuntoCamposFormValues>;
  loading?: boolean;
  embedded?: boolean;
  onCancel?: () => void;
}

const parseInteiro = (valor?: string) => {
  if (!valor) return undefined;
  const n = Number(valor);
  return Number.isFinite(n) ? n : undefined;
};

export function serializarConjuntoCampos(data: ConjuntoCamposFormValues) {
  return {
    nome: data.nome.trim(),
    descricao: data.descricao?.trim() || undefined,
    ativo: data.ativo,
    campos: data.campos.map((campo, index) => ({
      chave: campo.chave.trim(),
      label: campo.label.trim(),
      tipo: campo.tipo,
      obrigatorio: campo.obrigatorio,
      max_caracteres: parseInteiro(campo.max_caracteres),
      placeholder: campo.placeholder?.trim() || undefined,
      ordem: parseInteiro(campo.ordem) ?? index,
    })),
  };
}

export function ConjuntoCamposForm({
  onSave,
  initialData,
  loading = false,
  embedded = false,
  onCancel,
}: ConjuntoCamposFormProps) {
  const form = useForm<ConjuntoCamposFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: initialData?.nome ?? '',
      descricao: initialData?.descricao ?? '',
      ativo: initialData?.ativo ?? true,
      campos: initialData?.campos?.length
        ? initialData.campos
        : [
            {
              chave: '',
              label: '',
              tipo: 'TEXTO',
              obrigatorio: true,
              max_caracteres: '',
              placeholder: '',
              ordem: '0',
            },
          ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'campos',
  });

  return (
    <div className={cn('w-full min-w-0', embedded && 'max-w-full')}>
      {!embedded ? (
        <div className="mb-6">
          <Link
            href="/catalogo/conjuntos-campos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Conjuntos de campos
          </Link>
        </div>
      ) : null}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSave)}
          className={cn(embedded ? 'space-y-4' : 'space-y-6')}
        >
          <Card className={cn(embedded && 'border-0 shadow-none')}>
            {!embedded ? (
              <CardHeader>
                <CardTitle>
                  {initialData?.nome ? 'Editar conjunto de campos' : 'Novo conjunto de campos'}
                </CardTitle>
              </CardHeader>
            ) : null}
            <CardContent className={cn('space-y-6', embedded && 'p-0')}>
              <div
                className={cn(
                  'grid grid-cols-1 gap-6',
                  !embedded && 'lg:grid-cols-2',
                )}
              >
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Nome + Mensagem" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 rounded-md border p-3">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="m-0">Conjunto ativo</FormLabel>
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
                      <Textarea placeholder="Uso interno do conjunto..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className={cn(embedded && 'border-0 shadow-none')}>
            <CardHeader
              className={cn(
                'flex flex-row items-center justify-between',
                embedded && 'px-0',
              )}
            >
              <CardTitle>Campos variáveis</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    chave: '',
                    label: '',
                    tipo: 'TEXTO',
                    obrigatorio: false,
                    max_caracteres: '',
                    placeholder: '',
                    ordem: String(fields.length),
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Adicionar campo
              </Button>
            </CardHeader>
            <CardContent className={cn('space-y-4', embedded && 'px-0')}>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-4 rounded-md border p-4"
                >
                  <div
                    className={cn(
                      'grid grid-cols-1 gap-4',
                      !embedded && 'md:grid-cols-2 lg:grid-cols-3',
                    )}
                  >
                    <FormField
                      control={form.control}
                      name={`campos.${index}.chave`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Chave (snake_case)</FormLabel>
                          <FormControl>
                            <Input placeholder="nome" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`campos.${index}.label`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Rótulo</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`campos.${index}.tipo`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select value={f.value} onValueChange={f.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIPOS_CAMPO.map((tipo) => (
                                <SelectItem key={tipo} value={tipo}>
                                  {tipo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div
                    className={cn(
                      'grid grid-cols-1 gap-4',
                      !embedded && 'md:grid-cols-3',
                    )}
                  >
                    <FormField
                      control={form.control}
                      name={`campos.${index}.placeholder`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Placeholder</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o nome" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`campos.${index}.max_caracteres`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Máx. caracteres</FormLabel>
                          <FormControl>
                            <Input placeholder="50" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`campos.${index}.obrigatorio`}
                      render={({ field: f }) => (
                        <FormItem className="flex items-center gap-3 rounded-md border p-3">
                          <FormControl>
                            <Switch checked={f.value} onCheckedChange={f.onChange} />
                          </FormControl>
                          <FormLabel className="m-0">Obrigatório</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  {fields.length > 1 ? (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remover campo
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            {embedded ? (
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancelar
              </Button>
            ) : (
              <Link href="/catalogo/conjuntos-campos">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
            )}
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar conjunto'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
