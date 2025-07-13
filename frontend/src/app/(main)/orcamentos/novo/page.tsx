'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

const formSchema = z.object({
  nome_servico: z.string().min(1, 'Nome do serviço é obrigatório'),
  descricao: z.string().optional(),
  horas_producao: z.string().min(1, 'Horas de produção é obrigatório'),
  cliente_id: z.string().optional(),
  margem_lucro_customizada: z.string().optional(),
  impostos_customizados: z.string().optional(),
  itens: z.array(z.object({
    insumo_id: z.string().min(1, 'Selecione um insumo'),
    quantidade: z.string().min(1, 'Quantidade é obrigatória'),
  })).min(1, 'Adicione pelo menos um item'),
});

type FormValues = z.infer<typeof formSchema>;

interface Cliente {
  id: string;
  nome: string;
}

interface Insumo {
  id: string;
  nome: string;
  unidade_medida: string;
  custo_unitario: number;
  categoria: {
    nome: string;
  };
}

interface CalculoResultado {
  custos: {
    custo_material: number;
    custo_mao_obra: number;
    custo_indireto: number;
    custo_total_producao: number;
    margem_lucro_percentual: number;
    margem_lucro_valor: number;
    subtotal_com_lucro: number;
    impostos_percentual: number;
    impostos_valor: number;
    preco_final: number;
  };
  itens: Array<{
    insumo_id: string;
    nome_insumo: string;
    quantidade: number;
    custo_unitario: number;
    custo_total: number;
    unidade_medida: string;
  }>;
}

// Função utilitária para converter hh:mm para decimal
function hhmmToDecimal(hhmm: string): number {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h + m / 60;
}

// Função para normalizar/formatar entrada de horas
function normalizeHourInput(input: string): string {
  if (!input) return '';
  // Aceita hh:mm
  if (/^\d{1,2}:[0-5]\d$/.test(input)) return input;
  // Aceita só número (ex: 1 -> 01:00)
  if (/^\d{1,2}$/.test(input)) return input.padStart(2, '0') + ':00';
  // Aceita 0,30 ou 0.30 -> 00:30
  if (/^0[\.,:]?([0-5]\d)$/.test(input)) {
    const min = input.replace(/[^0-9]/g, '').padStart(2, '0');
    return '00:' + min;
  }
  // Aceita 130 -> 01:30
  if (/^\d{3,4}$/.test(input)) {
    const str = input.padStart(4, '0');
    return str.slice(0, 2) + ':' + str.slice(2, 4);
  }
  return input;
}

export default function NovoOrcamentoPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [calculoResultado, setCalculoResultado] = useState<CalculoResultado | null>(null);
  const [parametrosLoja, setParametrosLoja] = useState<{
    custo_maodeobra_hora?: string;
    custo_maquinaria_hora?: string;
    custos_indiretos_mensais?: string;
    margem_lucro_padrao?: string;
    impostos_padrao?: string;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_servico: '',
      descricao: '',
      horas_producao: '',
      cliente_id: '',
      margem_lucro_customizada: '',
      impostos_customizados: '',
      itens: [{ insumo_id: '', quantidade: '1' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens',
  });

  // Impede adicionar novo item se já houver item vazio
  const handleAddItem = () => {
    const hasEmpty = form.getValues().itens.some(
      (item) => !item.insumo_id || !item.quantidade
    );
    if (!hasEmpty) {
      append({ insumo_id: '', quantidade: '1' });
    }
  };

  useEffect(() => {
    fetchClientes();
    fetchInsumos();
    fetchParametrosLoja();
  }, []);

  // Remover cálculo automático do useEffect

  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/clientes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const fetchInsumos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/insumos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInsumos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error);
    }
  };

  const fetchParametrosLoja = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/lojas/minha-loja', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setParametrosLoja(data);
      }
    } catch (error) {
      console.error('Erro ao buscar parâmetros da loja:', error);
    }
  };

  const calcularOrcamento = async (values: FormValues) => {
    // Proteção extra: não calcula se horas_producao inválido ou sem itens válidos
    if (!/^\d{1,2}:[0-5]\d$/.test(values.horas_producao) || !values.itens.some(item => item.insumo_id && item.quantidade)) {
      setCalculando(false);
      setCalculoResultado(null);
      return;
    }
    if (calculando) return; // Evita múltiplos cálculos concorrentes
    setCalculando(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }
      const itensValidos = values.itens.filter(item => item.insumo_id && item.quantidade);
      const payload = {
        nome_servico: values.nome_servico,
        descricao: values.descricao,
        horas_producao: hhmmToDecimal(values.horas_producao),
        itens: itensValidos.map(item => ({
          insumo_id: item.insumo_id,
          quantidade: parseFloat(item.quantidade),
        })),
        cliente_id: values.cliente_id || undefined,
        margem_lucro_customizada: values.margem_lucro_customizada ? parseFloat(values.margem_lucro_customizada) : undefined,
        impostos_customizados: values.impostos_customizados ? parseFloat(values.impostos_customizados) : undefined,
      };
      if (payload.itens.length === 0) {
        setCalculoResultado(null);
        setCalculando(false);
        return;
      }
      const response = await fetch('http://localhost:3001/orcamentos/calcular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao calcular orçamento');
      }
      const resultado = await response.json();
      setCalculoResultado(resultado);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao calcular orçamento');
      console.error('Erro no cálculo:', error);
    } finally {
      setCalculando(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      console.log('onSubmit - cliente_id:', values.cliente_id);
      console.log('onSubmit - itens:', values.itens);
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }
      // Cliente obrigatório
      if (!values.cliente_id) {
        toast.error('Selecione um cliente para o orçamento.');
        setLoading(false);
        return;
      }
      const itensValidos = values.itens.filter(item => item.insumo_id && item.quantidade);
      const payload = {
        nome_servico: values.nome_servico,
        descricao: values.descricao,
        horas_producao: hhmmToDecimal(values.horas_producao),
        itens: itensValidos.map(item => ({
          insumo_id: item.insumo_id,
          quantidade: parseFloat(item.quantidade),
        })),
        cliente_id: values.cliente_id,
        margem_lucro_customizada: values.margem_lucro_customizada ? parseFloat(values.margem_lucro_customizada) : undefined,
        impostos_customizados: values.impostos_customizados ? parseFloat(values.impostos_customizados) : undefined,
      };
      if (payload.itens.length === 0) {
        toast.error('Adicione pelo menos um item válido ao orçamento.');
        setLoading(false);
        return;
      }
      const response = await fetch('http://localhost:3001/orcamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar orçamento');
      }
      toast.success('Orçamento criado com sucesso!');
      router.push('/orcamentos');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar orçamento');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Novo Orçamento</h1>
        <p className="text-muted-foreground">
          Crie um novo orçamento usando o motor de cálculo do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Cliente primeiro */}
                  <FormField
                    control={form.control}
                    name="cliente_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientes.map((cliente) => (
                              <SelectItem key={cliente.id} value={cliente.id}>
                                {cliente.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nome_servico"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Serviço</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Banner 2x1m" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="horas_producao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horas de Produção</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              pattern="^\d{1,2}:[0-5]\d$"
                              placeholder="hh:mm (ex: 01:30)" 
                              value={field.value}
                              onChange={e => {
                                // Permite digitação livre
                                field.onChange(e.target.value);
                              }}
                              onBlur={e => {
                                // Formata ao sair do campo
                                const v = e.target.value.replace(',', ':').replace('.', ':');
                                field.onChange(normalizeHourInput(v));
                              }}
                            />
                          </FormControl>
                          <FormDescription>Formato: hh:mm (ex: 01:30 para 1 hora e meia)</FormDescription>
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
                          <Textarea 
                            placeholder="Descreva o serviço em detalhes..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Itens do Orçamento</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddItem}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Item
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg">
                          <FormField
                            control={form.control}
                            name={`itens.${index}.insumo_id`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Insumo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione um insumo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {insumos.map((insumo) => (
                                      <SelectItem key={insumo.id} value={insumo.id}>
                                        {insumo.nome} ({insumo.categoria.nome})
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
                            name={`itens.${index}.quantidade`}
                            render={({ field }) => (
                              <FormItem className="w-32">
                                <FormLabel>Quantidade</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="1" 
                                    {...field} 
                                  />
                                </FormControl>
                                {/* Mensagem de erro clara */}
                                {(!field.value || field.value === '') && (
                                  <span className="text-red-500 text-xs">Quantidade obrigatória</span>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Margem de lucro e impostos por último */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="margem_lucro_customizada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Margem de Lucro (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="100" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Deixe vazio para usar o padrão da loja</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="impostos_customizados"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impostos (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="10" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Deixe vazio para usar o padrão da loja</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading || !form.formState.isValid}>
                      {loading ? 'Criando...' : 'Criar Orçamento'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com Parâmetros e Resultado */}
        <div className="lg:col-span-1">
          <div style={{ position: 'sticky', top: 24 }}>
            {/* Parâmetros da Loja */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Parâmetros da Loja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mão de Obra/Hora:</span>
                    <span className="font-medium">
                      {parametrosLoja?.custo_maodeobra_hora 
                        ? formatCurrency(parseFloat(parametrosLoja.custo_maodeobra_hora))
                        : 'Não configurado'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Maquinária/Hora:</span>
                    <span className="font-medium">
                      {parametrosLoja?.custo_maquinaria_hora 
                        ? formatCurrency(parseFloat(parametrosLoja.custo_maquinaria_hora))
                        : 'Não configurado'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Custos Indiretos/Mês:</span>
                    <span className="font-medium">
                      {parametrosLoja?.custos_indiretos_mensais 
                        ? formatCurrency(parseFloat(parametrosLoja.custos_indiretos_mensais))
                        : 'Não configurado'
                      }
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Margem Padrão:</span>
                    <span className="font-medium">
                      {parametrosLoja?.margem_lucro_padrao 
                        ? `${parametrosLoja.margem_lucro_padrao}%`
                        : 'Não configurado'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Impostos Padrão:</span>
                    <span className="font-medium">
                      {parametrosLoja?.impostos_padrao 
                        ? `${parametrosLoja.impostos_padrao}%`
                        : 'Não configurado'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading do Cálculo */}
            {calculando && (
              <Card>
                <CardHeader>
                  <CardTitle>Calculando...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resultado do Cálculo */}
            {calculoResultado && !calculando && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultado do Cálculo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Custo Material:</span>
                      <span>{formatCurrency(calculoResultado.custos.custo_material)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mão de Obra:</span>
                      <span>{formatCurrency(calculoResultado.custos.custo_mao_obra)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Custos Indiretos:</span>
                      <span>{formatCurrency(calculoResultado.custos.custo_indireto)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Custo Total:</span>
                      <span>{formatCurrency(calculoResultado.custos.custo_total_producao)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margem de Lucro ({calculoResultado.custos.margem_lucro_percentual}%):</span>
                      <span>{formatCurrency(calculoResultado.custos.margem_lucro_valor)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impostos ({calculoResultado.custos.impostos_percentual}%):</span>
                      <span>{formatCurrency(calculoResultado.custos.impostos_valor)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-green-600">
                      <span>Preço Final:</span>
                      <span>{formatCurrency(calculoResultado.custos.preco_final)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Itens Utilizados:</h4>
                    {calculoResultado.itens.map((item, index) => (
                      <div key={index} className="text-sm">
                        <div className="flex justify-between">
                          <span>{item.nome_insumo}</span>
                          <span>{item.quantidade} {item.unidade_medida}</span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {formatCurrency(item.custo_unitario)} por {item.unidade_medida}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mensagem quando não há dados para calcular */}
            {!calculando && !calculoResultado && (
              <Card>
                <CardHeader>
                  <CardTitle>Aguardando Dados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Preencha o nome do serviço, horas de produção e pelo menos um item para ver o cálculo.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Sidebar: mostrar itens adicionados mesmo sem cálculo */}
            {!calculando && !calculoResultado && (
              <Card>
                <CardHeader>
                  <CardTitle>Itens Adicionados</CardTitle>
                </CardHeader>
                <CardContent>
                  {form.getValues().itens.filter(item => item.insumo_id && item.quantidade).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum item adicionado ainda.</p>
                  ) : (
                    <ul className="text-sm space-y-2">
                      {form.getValues().itens.filter(item => item.insumo_id && item.quantidade).map((item, idx) => {
                        const insumo = insumos.find(i => i.id === item.insumo_id);
                        return (
                          <li key={idx} className="flex justify-between">
                            <span>{insumo ? insumo.nome : 'Insumo'}</span>
                            <span>{item.quantidade} {insumo ? insumo.unidade_medida : ''}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
            {/* Sidebar: botão Calcular no final */}
            <Button
              className="w-full mt-4"
              type="button"
              variant="default"
              onClick={() => calcularOrcamento(form.getValues())}
              disabled={calculando || !form.formState.isValid}
            >
              Calcular
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 