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
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { maquinasApi } from '@/lib/api-client';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { TimeInput, parseTimeValue, formatTimeDisplay } from '@/components/ui/time-input';

const formSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  custo_hora: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) > 0, {
    message: 'O custo por hora deve ser maior que zero.',
  }),
  descricao: z.string().optional(),
  maquina_id: z.string().optional(),
  // Novos campos do CT
  tipo_calculo: z.enum(['ACOMPANHA_MAQUINA', 'POR_M2', 'POR_UNIDADE', 'MANUAL']).optional(),
  fator_acompanhamento: z.any().optional(),
  horas_por_m2: z.any().optional(),
  horas_por_unidade: z.any().optional(),
  eficiencia_percent: z.any().optional(),
  setup_min: z.any().optional(),
});

export type FuncaoFormValues = z.infer<typeof formSchema>;

interface FuncaoFormProps {
  onSave: (data: FuncaoFormValues) => Promise<void>;
  initialData?: {
    nome: string;
    custo_hora: number;
    descricao?: string;
    maquina_id?: string;
    tipo_calculo?: 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'MANUAL';
    fator_acompanhamento?: number | string;
    horas_por_m2?: number | string;
    horas_por_unidade?: number | string;
    eficiencia_percent?: number | string;
    setup_min?: number | string;
  };
  loading?: boolean;
}

interface Maquina {
  id: string;
  nome: string;
  tipo: string;
}

export function FuncaoForm({ onSave, initialData, loading = false }: FuncaoFormProps) {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);

  const form = useForm<FuncaoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nome: '',
      custo_hora: '',
      descricao: '',
      maquina_id: 'null',
      tipo_calculo: 'MANUAL',
      fator_acompanhamento: '',
      horas_por_m2: '',
      horas_por_unidade: '',
      eficiencia_percent: '',
      setup_min: '',
    },
  });

  const tipo = form.watch('tipo_calculo');
  const custoHora = form.watch('custo_hora');
  const horasM2 = form.watch('horas_por_m2');
  const horasUn = form.watch('horas_por_unidade');
  const eficiencia = form.watch('eficiencia_percent');

  useEffect(() => {
    if (tipo !== 'POR_M2') {
      form.setValue('horas_por_m2', '' as any);
    }
    if (tipo !== 'POR_UNIDADE') {
      form.setValue('horas_por_unidade', '' as any);
    }
  }, [tipo]);

  const toNumber = (v: any): number => {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return v;
    const unified = String(v).trim().replace(/\s+/g, '').replace(',', '.');
    const clean = unified.replace(/[^0-9.\-]/g, '');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  // Função para converter porcentagem (10 = 10%, não 0.10)
  const toPercent = (v: any): number => {
    const num = toNumber(v);
    return num; // Mantém como está (10 = 10%)
  };

  const effPercent = toPercent(eficiencia);

  const preview = (() => {
    const ch = toNumber(custoHora);
    
    // Validação de eficiência: mínimo 5% para evitar cálculos irreais
    const eff = effPercent > 0 ? Math.max(effPercent / 100, 0.05) : 1;
    
    if (tipo === 'POR_M2') {
      const hm2 = parseTimeValue(horasM2);
      // Lógica correta: horas necessárias considerando eficiência
      const horasReais = hm2 / eff; // Se eficiência é 50%, precisa de 2x mais tempo
      return { label: 'Custo estimado por m²', valor: ch * horasReais };
    }
    if (tipo === 'POR_UNIDADE') {
      const hun = parseTimeValue(horasUn);
      // Lógica correta: horas necessárias considerando eficiência  
      const horasReais = hun / eff; // Se eficiência é 50%, precisa de 2x mais tempo
      return { label: 'Custo estimado por unidade', valor: ch * horasReais };
    }
    return null;
  })();

  useEffect(() => {
    fetchMaquinas();
  }, []);

  const fetchMaquinas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const data = await maquinasApi.getAll(token);
      setMaquinas(data);
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error);
    }
  };

  const onSubmit = async (values: FuncaoFormValues) => {
    await onSave(values);
  };

  return (
    <div className="w-full max-w-none">
      <div className="mb-6">
        <Link href="/centros-de-trabalho/funcoes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Funções
        </Link>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {initialData ? 'Editar Função' : 'Nova Função'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Nome para identificar a função (ex.: Operador de Plotter, Acabador).">
                        <FormLabel>Nome da Função</FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <Input placeholder="Ex: Operador Plotter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="custo_hora"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Custo/hora desta função (salário + encargos + benefícios rateados).">
                        <FormLabel>Custo por Hora (R$)</FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <CustomCurrencyInput
                          placeholder="0,00"
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Custo operacional por hora de trabalho.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maquina_id"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Relacione a função a uma máquina quando ela acompanha a operação da máquina.">
                        <FormLabel>Máquina Vinculada (Opcional)</FormLabel>
                      </InfoTooltip>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma máquina (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">Nenhuma máquina</SelectItem>
                          {maquinas.map((maquina) => (
                            <SelectItem key={maquina.id} value={maquina.id}>
                              {maquina.nome} ({maquina.tipo})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Vincule esta função a uma máquina específica (opcional).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fator_acompanhamento"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Percentual de acompanhamento da máquina: 100% = igual às horas da máquina, 50% = metade, 200% = dobro, etc.">
                        <FormLabel>Fator de Acompanhamento (%)</FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <Input 
                          placeholder="Ex: 100" 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9,.-]/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Percentual de tempo que acompanha a máquina.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tipo de Cálculo */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="tipo_calculo"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Define como as horas da função são obtidas: Acompanha Máquina (proporcional), Por m², Por unidade, ou Manual (informado direto).">
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
                  )}
                />
                
                {tipo === 'POR_M2' && (
                  <FormField
                    control={form.control}
                    name="horas_por_m2"
                    render={({ field }) => (
                      <FormItem>
                        <InfoTooltip content="Tempo necessário para cada metro quadrado. Digite apenas números: 10 = 00:10, 150 = 01:50, 1230 = 12:30.">
                          <FormLabel>Horas por m² (HH:MM)</FormLabel>
                        </InfoTooltip>
                        <FormControl>
                          <TimeInput 
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {tipo === 'POR_UNIDADE' && (
                  <FormField
                    control={form.control}
                    name="horas_por_unidade"
                    render={({ field }) => (
                      <FormItem>
                        <InfoTooltip content="Tempo necessário para cada unidade. Digite apenas números: 10 = 00:10, 215 = 02:15, 1030 = 10:30.">
                          <FormLabel>Horas por unidade (HH:MM)</FormLabel>
                        </InfoTooltip>
                        <FormControl>
                          <TimeInput 
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="eficiencia_percent"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Percentual de rendimento da função. Ex.: 85% significa que 15% do tempo é consumido em atividades não produtivas.">
                        <FormLabel>Eficiência (%)</FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <Input 
                          placeholder="Ex: 85" 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9,.-]/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Percentual de produtividade (10 = 10%, não 1%). {effPercent > 0 && effPercent < 5 && <span className="text-amber-600 font-medium">⚠️ Eficiência muito baixa pode gerar custos irreais.</span>}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="setup_min"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Tempo mínimo de setup que será sempre somado ao cálculo automático.">
                        <FormLabel>Setup</FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <TimeInput 
                          placeholder="Ex: 0:30" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Tempo mínimo de preparação que será sempre cobrado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {preview && (
                <div className="text-xs text-green-600 bg-green-50 p-3 rounded">
                  <div>
                    <span className="text-green-800 font-medium">{preview.label}:</span>
                    <span className="ml-2 font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preview.valor || 0)}</span>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição da função, responsabilidades, etc..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Descrição detalhada da função e responsabilidades.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Link href="/centros-de-trabalho/funcoes">
                  <Button variant="outline" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Função'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 