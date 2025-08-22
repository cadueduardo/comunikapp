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

const formSchema = z.object({
  nome: z.string().min(2, 'Informe o nome.'),
  tipo_calculo: z.enum(['ACOMPANHA_MAQUINA', 'POR_M2', 'POR_UNIDADE', 'MANUAL']).default('MANUAL'),
  horas_por_m2: z.any().optional(),
  horas_por_unidade: z.any().optional(),
  eficiencia_percent: z.any().optional(),
  custo_hora: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) >= 0, {
    message: 'Informe um custo válido (pode ser 0 para preço base em outro lugar).',
  }),
  descricao: z.string().optional(),
});

export type ServicoManualFormValues = z.infer<typeof formSchema>;

export default function ServicoManualForm({ onSave, initialData, loading = false }: { onSave: (data: ServicoManualFormValues) => Promise<void>; initialData?: Partial<ServicoManualFormValues>; loading?: boolean; }) {
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
    },
  });

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


