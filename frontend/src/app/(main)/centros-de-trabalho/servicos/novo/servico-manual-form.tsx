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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { TimeInput, parseTimeValue } from '@/components/ui/time-input';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const formSchema = z.object({
  nome: z.string().min(2, 'Informe o nome.'),
  tipo_calculo: z.enum(['ACOMPANHA_MAQUINA', 'POR_M2', 'POR_UNIDADE', 'POR_PECA_COM_CATEGORIA', 'MANUAL']).default('MANUAL'),
  horas_por_m2: z.any().optional(),
  horas_por_unidade: z.any().optional(),
  eficiencia_percent: z.any().optional(),
  custo_hora: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) >= 0, {
    message: 'Informe um custo válido (pode ser 0 para preço base em outro lugar).',
  }),
  descricao: z.string().optional(),
  // Novos campos para ranges
  setup_min: z.string().optional(),
  categorias: z.array(z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    ate_m2: z.number().min(0.1, 'Área deve ser maior que 0'),
    tempo_min: z.string().min(1, 'Tempo é obrigatório')
  })).optional(),
});

export type ServicoManualFormValues = z.infer<typeof formSchema>;

export default function ServicoManualForm({ onSave, initialData, loading = false }: { onSave: (data: ServicoManualFormValues) => Promise<void>; initialData?: Partial<ServicoManualFormValues>; loading?: boolean; }) {
  const [categorias, setCategorias] = useState<Array<{nome: string; ate_m2: number; tempo_min: string}>>([]);

  const form = useForm<ServicoManualFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      tipo_calculo: (initialData?.tipo_calculo as any) || 'MANUAL',
      horas_por_m2: initialData?.horas_por_m2 || '',
      horas_por_unidade: initialData?.horas_por_unidade || '',
      eficiencia_percent: initialData?.eficiencia_percent || '',
      custo_hora: initialData?.custo_hora || '',
      descricao: initialData?.descricao || '',
      setup_min: initialData?.setup_min || '',
      categorias: initialData?.categorias || [],
    },
  });

  // Sincronizar categorias com o form
  useEffect(() => {
    if (initialData?.categorias) {
      setCategorias(initialData.categorias);
      form.setValue('categorias', initialData.categorias);
    }
  }, [initialData]);

  const tipo = form.watch('tipo_calculo');
  const custoHora = form.watch('custo_hora');
  const horasM2 = form.watch('horas_por_m2');
  const horasUn = form.watch('horas_por_unidade');
  const eficiencia = form.watch('eficiencia_percent');

  const toNumber = (v: any): number => {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return v;
    const unified = String(v).trim().replace(/\s+/g, '').replace(',', '.');
    const clean = unified.replace(/[^0-9.\-]/g, '');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  const preview = useMemo(() => {
    const ch = toNumber(custoHora);
    const eff = Math.max(toNumber(eficiencia) / 100 || 1, 0.01);
    if (tipo === 'POR_M2') {
      const hm2 = toNumber(horasM2);
      const custoPorM2 = ch * (hm2 / eff);
      return { label: 'Custo estimado por m²', valor: custoPorM2 };
    }
    if (tipo === 'POR_UNIDADE') {
      const hun = toNumber(horasUn);
      const custoPorUn = ch * (hun / eff);
      return { label: 'Custo estimado por unidade', valor: custoPorUn };
    }
    return null;
  }, [tipo, custoHora, horasM2, horasUn, eficiencia]);
  useEffect(() => {
    // Limpa campos não relacionados quando muda o tipo
    if (tipo !== 'POR_M2') {
      form.setValue('horas_por_m2', '' as any);
    }
    if (tipo !== 'POR_UNIDADE') {
      form.setValue('horas_por_unidade', '' as any);
    }
    if (tipo !== 'POR_PECA_COM_CATEGORIA') {
      form.setValue('setup_min', '' as any);
      form.setValue('categorias', [] as any);
      setCategorias([]);
    }
  }, [tipo]);

  const onSubmit = async (values: ServicoManualFormValues) => {
    await onSave(values);
  };

  return (
    <div className="w-full max-w-none">
      <div className="mb-6">
        <Link href="/centros-de-trabalho/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Serviços Manuais
        </Link>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Novo Serviço Manual</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem>
                    <InfoTooltip content="Nome do serviço manual (ex.: Montagem, Instalação, Acabamento).">
                      <FormLabel>Nome</FormLabel>
                    </InfoTooltip>
                    <FormControl>
                      <Input placeholder="Ex: Montagem" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="custo_hora" render={({ field }) => (
                  <FormItem>
                    <InfoTooltip content="Custo por hora do serviço. Pode ser 0 quando o preço é fechado por unidade/m² e calculado em outro campo.">
                      <FormLabel>Custo por Hora (R$)</FormLabel>
                    </InfoTooltip>
                    <FormControl>
                      <CustomCurrencyInput placeholder="0,00" value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField control={form.control} name="tipo_calculo" render={({ field }) => (
                  <FormItem>
                    <InfoTooltip content="Como o tempo é obtido: Acompanha Máquina, Por m², Por unidade, ou Manual. Em MANUAL, as horas são informadas diretamente no orçamento/produto ao adicionar o serviço (campo 'horas_trabalhadas'). Em POR_M2/UNIDADE, as horas são calculadas automaticamente a partir dos parâmetros abaixo.">
                      <FormLabel>Tipo de Cálculo</FormLabel>
                    </InfoTooltip>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACOMPANHA_MAQUINA">Acompanha Máquina</SelectItem>
                        <SelectItem value="POR_M2">Por m²</SelectItem>
                        <SelectItem value="POR_UNIDADE">Por unidade</SelectItem>
                        <SelectItem value="POR_PECA_COM_CATEGORIA">Por peça com categoria</SelectItem>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="eficiencia_percent" render={({ field }) => (
                  <FormItem>
                    <InfoTooltip content="Percentual de rendimento da equipe no serviço manual (ex.: 85%).">
                      <FormLabel>Eficiência (%)</FormLabel>
                    </InfoTooltip>
                    <FormControl>
                      <Input placeholder="Ex: 85" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tipo === 'POR_M2' && (
                  <FormField control={form.control} name="horas_por_m2" render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Horas de trabalho por metro quadrado (h/m²). Fórmula automática no orçamento: horas = área_total × horas_por_m2 ÷ (eficiência%/100); custo_total = horas × custo_hora. Ex.: custo_hora=20, horas_por_m2=0,05, eficiência=80% → custo por m² ≈ 20 × (0,05/0,8) = 1,25.">
                        <FormLabel>Horas por m²</FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <Input placeholder="Ex: 0.05" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                {tipo === 'POR_UNIDADE' && (
                  <FormField control={form.control} name="horas_por_unidade" render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Horas por unidade produzida (h/un). Fórmula automática no orçamento: horas = quantidade_produto × horas_por_unidade ÷ (eficiência%/100); custo_total = horas × custo_hora.">
                        <FormLabel>Horas por unidade</FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <Input placeholder="Ex: 0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>

              {/* Campos específicos para POR_PECA_COM_CATEGORIA */}
              {tipo === 'POR_PECA_COM_CATEGORIA' && (
                <div className="space-y-6">
                  {/* Campo Setup */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="setup_min"
                      render={({ field }) => (
                        <FormItem>
                          <InfoTooltip content="Tempo de preparação antes de iniciar o serviço. Ex: 30 = 00:30 (30 minutos).">
                            <FormLabel>Setup (HH:MM)</FormLabel>
                          </InfoTooltip>
                          <FormControl>
                            <TimeInput 
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Ex: 30 → 00:30"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Grid de Categorias */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium">Categorias por Tamanho</h4>
                        <p className="text-sm text-gray-600">Defina faixas de área e tempo específico para cada categoria</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const novaCategoria = { nome: '', ate_m2: 0, tempo_min: '' };
                          const novasCategorias = [...categorias, novaCategoria];
                          setCategorias(novasCategorias);
                          form.setValue('categorias', novasCategorias);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Categoria
                      </Button>
                    </div>

                    {categorias.length > 0 && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 pb-2 border-b">
                          <div>Nome da Categoria</div>
                          <div>Até (m²)</div>
                          <div>Tempo (HH:MM)</div>
                          <div className="text-center">Ações</div>
                        </div>
                        
                        {categorias.map((categoria, index) => (
                          <div key={index} className="grid grid-cols-4 gap-4 items-end">
                            <Input
                              placeholder="Ex: Pequeno"
                              value={categoria.nome}
                              onChange={(e) => {
                                const novasCategorias = [...categorias];
                                novasCategorias[index].nome = e.target.value;
                                setCategorias(novasCategorias);
                                form.setValue('categorias', novasCategorias);
                              }}
                            />
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Ex: 2.0"
                              value={categoria.ate_m2 || ''}
                              onChange={(e) => {
                                const novasCategorias = [...categorias];
                                novasCategorias[index].ate_m2 = parseFloat(e.target.value) || 0;
                                setCategorias(novasCategorias);
                                form.setValue('categorias', novasCategorias);
                              }}
                            />
                            <TimeInput
                              value={categoria.tempo_min}
                              onChange={(value) => {
                                const novasCategorias = [...categorias];
                                novasCategorias[index].tempo_min = value;
                                setCategorias(novasCategorias);
                                form.setValue('categorias', novasCategorias);
                              }}
                              placeholder="Ex: 15 → 00:15"
                            />
                            <div className="flex justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const novasCategorias = categorias.filter((_, i) => i !== index);
                                  setCategorias(novasCategorias);
                                  form.setValue('categorias', novasCategorias);
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {categorias.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>Nenhuma categoria configurada</p>
                        <p className="text-sm">Clique em "Adicionar Categoria" para começar</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {preview && (
                <div className="rounded-md border p-3 bg-gray-50 text-sm">
                  <span className="text-gray-600 mr-2">{preview.label}:</span>
                  <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preview.valor || 0)}</span>
                </div>
              )}

              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes do serviço manual..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end space-x-4">
                <Link href="/centros-de-trabalho/servicos">
                  <Button variant="outline" type="button">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Serviço'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}


