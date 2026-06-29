'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const INSUMOS_OPCOES = ['ARQUIVO', 'TEXTO', 'VETOR'] as const;

const faixaSchema = z.object({
  min: z.string().min(1, 'Informe o mínimo.'),
  max: z.string().optional(),
  preco: z.string().min(1, 'Informe o preço.'),
});

const formSchema = z.object({
  nome: z.string().min(2, 'Informe o nome do processo.'),
  codigo: z.string().max(50).optional(),
  descricao: z.string().optional(),
  exige_arte_aprovada: z.boolean(),
  insumos_aceitos: z
    .array(z.enum(INSUMOS_OPCOES))
    .min(1, 'Selecione ao menos um insumo aceito.'),
  preco_base: z.string().optional(),
  custo_setup: z.string().optional(),
  setor_pcp_sugerido: z.string().max(120).optional(),
  ativo: z.boolean(),
  faixas_preco: z.array(faixaSchema).optional(),
});

export type ProcessoDecoracaoFormValues = z.infer<typeof formSchema>;

interface ProcessoDecoracaoFormProps {
  onSave: (data: ProcessoDecoracaoFormValues) => Promise<void>;
  initialData?: Partial<ProcessoDecoracaoFormValues>;
  loading?: boolean;
}

const parseNumero = (valor?: string) => {
  if (!valor) return undefined;
  const n = Number(String(valor).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};

export function serializarProcessoDecoracao(data: ProcessoDecoracaoFormValues) {
  return {
    nome: data.nome.trim(),
    codigo: data.codigo?.trim() || undefined,
    descricao: data.descricao?.trim() || undefined,
    exige_arte_aprovada: data.exige_arte_aprovada,
    insumos_aceitos: data.insumos_aceitos,
    preco_base: parseNumero(data.preco_base),
    custo_setup: parseNumero(data.custo_setup),
    setor_pcp_sugerido: data.setor_pcp_sugerido?.trim() || undefined,
    ativo: data.ativo,
    faixas_preco: (data.faixas_preco ?? [])
      .filter((f) => f.min && f.preco)
      .map((f) => ({
        min: Number(f.min),
        max: f.max ? Number(f.max) : null,
        preco: parseNumero(f.preco) ?? 0,
      })),
  };
}

export function ProcessoDecoracaoForm({
  onSave,
  initialData,
  loading = false,
}: ProcessoDecoracaoFormProps) {
  const form = useForm<ProcessoDecoracaoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: initialData?.nome ?? '',
      codigo: initialData?.codigo ?? '',
      descricao: initialData?.descricao ?? '',
      exige_arte_aprovada: initialData?.exige_arte_aprovada ?? false,
      insumos_aceitos: initialData?.insumos_aceitos ?? ['TEXTO'],
      preco_base: initialData?.preco_base ?? '',
      custo_setup: initialData?.custo_setup ?? '',
      setor_pcp_sugerido: initialData?.setor_pcp_sugerido ?? '',
      ativo: initialData?.ativo ?? true,
      faixas_preco: initialData?.faixas_preco ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'faixas_preco',
  });

  return (
    <div className="w-full max-w-none">
      <div className="mb-6">
        <Link
          href="/catalogo/personalizacao"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Personalização
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-6" id="processo-decoracao-form">
          <Card>
            <CardHeader>
              <CardTitle>
                {initialData?.nome ? 'Editar processo de decoração' : 'Novo processo de decoração'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Silk 1 cor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código interno</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: SILK-1C" {...field} />
                      </FormControl>
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
                      <Textarea placeholder="Detalhes operacionais do processo..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="preco_base"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço base (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="custo_setup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo de setup (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="setor_pcp_sugerido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor PCP sugerido</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Serigrafia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="insumos_aceitos"
                render={() => (
                  <FormItem>
                    <FormLabel>Insumos aceitos</FormLabel>
                    <div className="flex flex-wrap gap-4">
                      {INSUMOS_OPCOES.map((insumo) => (
                        <FormField
                          key={insumo}
                          control={form.control}
                          name="insumos_aceitos"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(insumo)}
                                  onCheckedChange={(checked) => {
                                    const atual = field.value ?? [];
                                    field.onChange(
                                      checked
                                        ? [...atual, insumo]
                                        : atual.filter((v) => v !== insumo),
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="m-0 font-normal">{insumo}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="exige_arte_aprovada"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 rounded-md border p-3">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel className="m-0">Exige arte aprovada</FormLabel>
                        <FormDescription className="text-xs">
                          Bloqueia produção até aprovação no módulo de arte.
                        </FormDescription>
                      </div>
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
                      <FormLabel className="m-0">Processo ativo</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Faixas de preço (quantity breaks)</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ min: '', max: '', preco: '' })}
              >
                <Plus className="mr-1 h-4 w-4" />
                Adicionar faixa
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma faixa cadastrada. O preço base será usado quando aplicável.
                </p>
              ) : (
                fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 items-end gap-3 rounded-md border p-3 md:grid-cols-4"
                  >
                    <FormField
                      control={form.control}
                      name={`faixas_preco.${index}.min`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Qtd. mínima</FormLabel>
                          <FormControl>
                            <Input placeholder="1" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`faixas_preco.${index}.max`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Qtd. máxima</FormLabel>
                          <FormControl>
                            <Input placeholder="Vazio = sem teto" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`faixas_preco.${index}.preco`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Preço unit. (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="0,00" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href="/catalogo/personalizacao">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar processo'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
