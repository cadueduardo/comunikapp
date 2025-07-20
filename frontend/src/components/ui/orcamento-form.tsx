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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, Calculator, Settings, Package, Users } from 'lucide-react';

const formSchema = z.object({
  cliente_id: z.string().min(1, 'Selecione um cliente'),
  // Configurações globais
  margem_lucro_customizada: z.string().optional(),
  impostos_customizados: z.string().optional(),
  condicoes_comerciais: z.string().optional(),
  // Itens de produto
  itens_produto: z.array(z.object({
    nome_servico: z.string().min(1, 'Nome do produto é obrigatório'),
    quantidade_produto: z.string().optional(),
    descricao: z.string().optional(),
    // Medidas do produto
    largura_produto: z.string().optional(),
    altura_produto: z.string().optional(),
    unidade_medida_produto: z.string().optional(),
    area_produto: z.string().optional(),
    // Materiais utilizados para este produto
    materiais: z.array(z.object({
      insumo_id: z.string().min(1, 'Selecione um material'),
      quantidade: z.string().min(1, 'Quantidade é obrigatória').refine(
        (val) => {
          const cleanVal = val.replace(',', '.');
          const num = Number(cleanVal);
          return !isNaN(num) && num > 0;
        },
        'Quantidade deve ser um número válido maior que zero'
      ),
    })).min(1, 'Adicione pelo menos um material'),
    // Máquinas utilizadas para este produto
    maquinas: z.array(z.object({
      maquina_id: z.string().min(1, 'Selecione uma máquina'),
      horas_utilizadas: z.string().min(1, 'Horas utilizadas é obrigatória'),
    })),
    // Funções utilizadas para este produto
    funcoes: z.array(z.object({
      funcao_id: z.string().min(1, 'Selecione uma função'),
      horas_trabalhadas: z.string().min(1, 'Horas trabalhadas é obrigatória'),
    })),
  })).min(1, 'Adicione pelo menos um produto'),
});

type FormValues = z.infer<typeof formSchema>;

interface Cliente {
  id: string;
  nome: string;
}

interface Insumo {
  id: string;
  nome: string;
  unidade_compra: string;
  custo_unitario: number;
  quantidade_compra: number;
  unidade_uso: string;
  fator_conversao: number;
  largura?: number | null;
  altura?: number | null;
  unidade_dimensao?: string | null;
  tipo_calculo?: string | null;
  gramatura?: number | null;
  categoria: {
    nome: string;
  };
}

interface Maquina {
  id: string;
  nome: string;
  tipo: string;
  custo_hora: number;
  status: string;
}

interface Funcao {
  id: string;
  nome: string;
  custo_hora: number;
  descricao?: string;
  maquina?: {
    nome: string;
  };
}

interface CalculoResultado {
  horas_producao_total: number;
  custos: {
    custo_material: number;
    custo_mao_obra: number;
    custo_maquinaria: number;
    custo_indireto: number;
    custos_indiretos_detalhados: Array<{
      nome: string;
      categoria: string;
      valor_rateado: number;
      percentual_rateio: number;
    }>;
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
  maquinas: Array<{
    maquina_id: string;
    nome_maquina: string;
    tipo_maquina: string;
    horas_utilizadas: number;
    custo_por_hora: number;
    custo_total: number;
  }>;
  funcoes: Array<{
    funcao_id: string;
    nome_funcao: string;
    horas_trabalhadas: number;
    custo_por_hora: number;
    custo_total: number;
    maquina_vinculada?: string;
  }>;
}

// Função para converter medidas para metros
function converterParaMetros(valor: number, unidade: string): number {
  switch (unidade.toLowerCase()) {
    case 'mm':
      return valor / 1000;
    case 'cm':
      return valor / 100;
    case 'm':
      return valor;
    case 'm2':
      return valor;
    default:
      return valor;
  }
}

// Função para calcular área em m²
function calcularArea(largura: number, altura: number, unidade: string): number {
  if (!largura || !altura) return 0;
  
  const larguraEmMetros = converterParaMetros(largura, unidade);
  const alturaEmMetros = converterParaMetros(altura, unidade);
  
  return larguraEmMetros * alturaEmMetros;
}

// Função para obter o tipo de campo baseado na unidade de uso
function getCampoQuantidade(insumo: Insumo | undefined) {
  if (!insumo) return { label: 'Quantidade', placeholder: '0.00', step: '0.01' };
  
  switch (insumo.unidade_uso) {
    case 'M':
      return { label: 'Comprimento (metros)', placeholder: '0.00', step: '0.001' };
    case 'M2':
      return { label: 'Área (m²)', placeholder: '0.00', step: '0.01' };
    case 'M3':
      return { label: 'Volume (m³)', placeholder: '0.00', step: '0.001' };
    case 'KG':
      return { label: 'Peso (kg)', placeholder: '0.00', step: '0.01' };
    case 'LITRO':
      return { label: 'Volume (litros)', placeholder: '0.00', step: '0.01' };
    case 'UNID':
    case 'PC':
    case 'PARES':
    case 'DUZIA':
    case 'CENTO':
    case 'MILHEI':
      return { label: 'Quantidade', placeholder: '0', step: '1' };
    default:
      return { label: 'Quantidade', placeholder: '0.00', step: '0.01' };
  }
}

// Função para calcular o custo por unidade de uso
function calcularCustoPorUnidadeUso(insumo: Insumo): number {
  if (!insumo || !insumo.custo_unitario || !insumo.quantidade_compra || !insumo.fator_conversao) {
    return 0;
  }
  
  const custo = Number(insumo.custo_unitario);
  const quantidade = Number(insumo.quantidade_compra);
  const fator = Number(insumo.fator_conversao);
  
  if (quantidade > 0 && fator > 0) {
    return custo / (quantidade * fator);
  }
  
  return 0;
}

interface OrcamentoFormProps {
  mode: 'novo' | 'editar';
  initialData?: FormValues;
  orcamentoId?: string;
  onSuccess?: () => void;
}

export default function OrcamentoForm({ mode, initialData, orcamentoId, onSuccess }: OrcamentoFormProps) {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [calculoResultado, setCalculoResultado] = useState<CalculoResultado | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      cliente_id: '',
      margem_lucro_customizada: '',
      impostos_customizados: '',
      condicoes_comerciais: '',
      itens_produto: [{ 
        nome_servico: '', 
        quantidade_produto: '1',
        descricao: '',
        largura_produto: '',
        altura_produto: '',
        unidade_medida_produto: '',
        area_produto: '',
        materiais: [{ insumo_id: '', quantidade: '1' }],
        maquinas: [],
        funcoes: [],
      }],
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: 'itens_produto',
  });

  const calcularAreaAutomatica = (index: number) => {
    const largura = form.watch(`itens_produto.${index}.largura_produto`);
    const altura = form.watch(`itens_produto.${index}.altura_produto`);
    const unidade = form.watch(`itens_produto.${index}.unidade_medida_produto`);
    
    if (largura && altura && unidade) {
      const area = calcularArea(Number(largura), Number(altura), unidade);
      form.setValue(`itens_produto.${index}.area_produto`, area.toFixed(2));
    }
  };

  const handleAddItem = () => {
    const hasEmpty = form.getValues().itens_produto.some(
      (item) => !item.nome_servico || item.materiais.length === 0
    );
    if (!hasEmpty) {
      appendItem({ 
        nome_servico: '', 
        quantidade_produto: '1',
        descricao: '',
        largura_produto: '',
        altura_produto: '',
        unidade_medida_produto: '',
        area_produto: '',
        materiais: [{ insumo_id: '', quantidade: '1' }],
        maquinas: [],
        funcoes: [],
      });
    }
  };

  const handleAddMaterial = (itemIndex: number) => {
    const currentMaterials = form.getValues(`itens_produto.${itemIndex}.materiais`);
    const hasEmpty = currentMaterials.some(m => !m.insumo_id || !m.quantidade);
    if (!hasEmpty) {
      const newMaterials = [...currentMaterials, { insumo_id: '', quantidade: '1' }];
      form.setValue(`itens_produto.${itemIndex}.materiais`, newMaterials);
    }
  };

  const handleRemoveMaterial = (itemIndex: number, materialIndex: number) => {
    const currentMaterials = form.getValues(`itens_produto.${itemIndex}.materiais`);
    if (currentMaterials.length > 1) {
      const newMaterials = currentMaterials.filter((_, index) => index !== materialIndex);
      form.setValue(`itens_produto.${itemIndex}.materiais`, newMaterials);
    }
  };

  const handleAddMaquina = async (itemIndex: number) => {
    await fetchMaquinas(); // Busca sempre antes de adicionar
    const currentMaquinas = form.getValues(`itens_produto.${itemIndex}.maquinas`);
    const hasEmpty = currentMaquinas.some(m => !m.maquina_id || !m.horas_utilizadas);
    if (!hasEmpty) {
      const newMaquinas = [...currentMaquinas, { maquina_id: '', horas_utilizadas: '' }];
      form.setValue(`itens_produto.${itemIndex}.maquinas`, newMaquinas);
    }
  };

  const handleRemoveMaquina = (itemIndex: number, maquinaIndex: number) => {
    const currentMaquinas = form.getValues(`itens_produto.${itemIndex}.maquinas`);
    const newMaquinas = currentMaquinas.filter((_, index) => index !== maquinaIndex);
    form.setValue(`itens_produto.${itemIndex}.maquinas`, newMaquinas);
  };

  const handleAddFuncao = async (itemIndex: number) => {
    await fetchFuncoes(); // Busca sempre antes de adicionar
    const currentFuncoes = form.getValues(`itens_produto.${itemIndex}.funcoes`);
    const hasEmpty = currentFuncoes.some(f => !f.funcao_id || !f.horas_trabalhadas);
    if (!hasEmpty) {
      const newFuncoes = [...currentFuncoes, { funcao_id: '', horas_trabalhadas: '' }];
      form.setValue(`itens_produto.${itemIndex}.funcoes`, newFuncoes);
    }
  };

  const handleRemoveFuncao = (itemIndex: number, funcaoIndex: number) => {
    const currentFuncoes = form.getValues(`itens_produto.${itemIndex}.funcoes`);
    const newFuncoes = currentFuncoes.filter((_, index) => index !== funcaoIndex);
    form.setValue(`itens_produto.${itemIndex}.funcoes`, newFuncoes);
  };

  useEffect(() => {
    fetchClientes();
    fetchInsumos();
    fetchMaquinas();
    fetchFuncoes();
  }, []);

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

  const fetchMaquinas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/maquinas', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMaquinas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error);
    }
  };

  const fetchFuncoes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/funcoes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFuncoes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar funções:', error);
    }
  };

  const calcularOrcamento = async (values: FormValues) => {
    setCalculando(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // Transformar dados para o formato esperado pelo backend
      const primeiroItem = values.itens_produto[0];
      if (!primeiroItem) {
        toast.error('Adicione pelo menos um produto');
        return;
      }

      // Converter materiais para o formato esperado
      const itens = primeiroItem.materiais.map(material => ({
        insumo_id: material.insumo_id,
        quantidade: Number(String(material.quantidade).replace(',', '.'))
      }));

      // Calcular horas de produção baseado em máquinas e funções
      const horasMaquinas = primeiroItem.maquinas.reduce((total, maquina) => {
        return total + (Number(maquina.horas_utilizadas) || 0);
      }, 0);

      const horasFuncoes = primeiroItem.funcoes.reduce((total, funcao) => {
        return total + (Number(funcao.horas_trabalhadas) || 0);
      }, 0);

      const horasProducao = Math.max(horasMaquinas, horasFuncoes, 1); // Mínimo 1 hora

      const dadosCalculo = {
        nome_servico: primeiroItem.nome_servico,
        descricao: primeiroItem.descricao,
        horas_producao: horasProducao,
        quantidade_produto: Number(primeiroItem.quantidade_produto) || 1,
        itens: itens,
        maquinas: primeiroItem.maquinas.map(maquina => ({
          maquina_id: maquina.maquina_id,
          horas_utilizadas: Number(maquina.horas_utilizadas)
        })),
        funcoes: primeiroItem.funcoes.map(funcao => ({
          funcao_id: funcao.funcao_id,
          horas_trabalhadas: Number(funcao.horas_trabalhadas)
        })),
        cliente_id: values.cliente_id,
        margem_lucro_customizada: values.margem_lucro_customizada ? Number(values.margem_lucro_customizada) : undefined,
        impostos_customizados: values.impostos_customizados ? Number(values.impostos_customizados) : undefined,
      };

      // Debug: log dos dados sendo enviados
      console.log('Dados sendo enviados para cálculo:', dadosCalculo);

      const response = await fetch('http://localhost:3001/orcamentos/calcular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dadosCalculo),
      });

      if (response.ok) {
        const resultado = await response.json();
        console.log('Resultado do cálculo:', resultado);
        setCalculoResultado(resultado);
        toast.success('Cálculo realizado com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao calcular orçamento');
      }
    } catch (error) {
      console.error('Erro ao calcular orçamento:', error);
      toast.error('Erro ao calcular orçamento');
    } finally {
      setCalculando(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const url = mode === 'novo' 
        ? 'http://localhost:3001/orcamentos'
        : `http://localhost:3001/orcamentos/${orcamentoId}`;
      
      const method = mode === 'novo' ? 'POST' : 'PATCH';

      // Transformar dados para o formato esperado pelo backend
      const primeiroItem = values.itens_produto[0];
      if (!primeiroItem) {
        toast.error('Adicione pelo menos um produto');
        return;
      }

      const dadosParaEnviar = {
        nome_servico: primeiroItem.nome_servico,
        descricao: primeiroItem.descricao,
        horas_producao: 1, // Será calculado pelo backend
        quantidade_produto: Number(primeiroItem.quantidade_produto) || 1,
        largura_produto: primeiroItem.largura_produto ? Number(String(primeiroItem.largura_produto).replace(',', '.')) : undefined,
        altura_produto: primeiroItem.altura_produto ? Number(String(primeiroItem.altura_produto).replace(',', '.')) : undefined,
        area_produto: primeiroItem.area_produto ? Number(String(primeiroItem.area_produto).replace(',', '.')) : undefined,
        unidade_medida_produto: primeiroItem.unidade_medida_produto,
        itens: primeiroItem.materiais.map(material => ({
          insumo_id: material.insumo_id,
          quantidade: Number(String(material.quantidade).replace(',', '.'))
        })),
        maquinas: primeiroItem.maquinas.map(maquina => ({
          maquina_id: maquina.maquina_id,
          horas_utilizadas: Number(maquina.horas_utilizadas)
        })),
        funcoes: primeiroItem.funcoes.map(funcao => ({
          funcao_id: funcao.funcao_id,
          horas_trabalhadas: Number(funcao.horas_trabalhadas)
        })),
        cliente_id: values.cliente_id,
        condicoes_comerciais: values.condicoes_comerciais,
        margem_lucro_customizada: values.margem_lucro_customizada ? Number(values.margem_lucro_customizada) : undefined,
        impostos_customizados: values.impostos_customizados ? Number(values.impostos_customizados) : undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      if (response.ok) {
        await response.json(); // Consumir a resposta
        toast.success(mode === 'novo' ? 'Orçamento criado com sucesso!' : 'Orçamento atualizado com sucesso!');
        
        if (mode === 'novo') {
          router.push('/orcamentos');
        } else {
          onSuccess?.();
        }
      } else {
        const error = await response.json();
        toast.error(error.message || `Erro ao ${mode === 'novo' ? 'criar' : 'atualizar'} orçamento`);
      }
    } catch (error) {
      console.error(`Erro ao ${mode === 'novo' ? 'criar' : 'atualizar'} orçamento:`, error);
      toast.error(`Erro ao ${mode === 'novo' ? 'criar' : 'atualizar'} orçamento`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'novo' ? 'Novo Orçamento' : 'Editar Orçamento'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'novo' 
              ? 'Crie um novo orçamento para seu cliente'
              : 'Edite as informações do orçamento'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 1. DADOS DO CLIENTE */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* 2. PRODUTOS DO ORÇAMENTO */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Produtos do Orçamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-4">
                    {itemFields.map((field, itemIndex) => (
                      <AccordionItem key={field.id} value={`item-${itemIndex}`}>
                        <AccordionTrigger className="hover:no-underline bg-gray-50 rounded-lg px-4 py-2">
                          <div className="flex items-center justify-between w-full pr-4">
                            <span className="font-medium text-gray-600">
                              {form.watch(`itens_produto.${itemIndex}.nome_servico`) || `Produto ${itemIndex + 1}`}
                            </span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (itemFields.length > 1) {
                                  removeItem(itemIndex);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            
                            {/* Informações básicas do produto */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name={`itens_produto.${itemIndex}.nome_servico`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome do Produto</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ex: Banner 60x100cm" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`itens_produto.${itemIndex}.quantidade_produto`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Quantidade</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="1"
                                        min="1"
                                        placeholder="1"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`itens_produto.${itemIndex}.unidade_medida_produto`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Unidade de Medida</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione a unidade" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="mm">Milímetros (mm)</SelectItem>
                                        <SelectItem value="cm">Centímetros (cm)</SelectItem>
                                        <SelectItem value="m">Metros (m)</SelectItem>
                                        <SelectItem value="un">Unidade (un)</SelectItem>
                                        <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Medidas do produto */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name={`itens_produto.${itemIndex}.largura_produto`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Largura</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e);
                                          calcularAreaAutomatica(itemIndex);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`itens_produto.${itemIndex}.altura_produto`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Altura</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e);
                                          calcularAreaAutomatica(itemIndex);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`itens_produto.${itemIndex}.area_produto`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Área (m²)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        readOnly
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Calculada automaticamente
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`itens_produto.${itemIndex}.descricao`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descrição</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Descreva o produto, especificações técnicas, etc."
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Separator />

                            {/* Materiais Utilizados */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-medium">Materiais Utilizados</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddMaterial(itemIndex)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar Material
                                </Button>
                              </div>
                              
                              {form.watch(`itens_produto.${itemIndex}.materiais`)?.map((material, materialIndex) => {
                                const insumoSelecionado = insumos.find(insumo => insumo.id === material.insumo_id);
                                const campoQuantidade = getCampoQuantidade(insumoSelecionado);
                                const custoPorUnidade = insumoSelecionado ? calcularCustoPorUnidadeUso(insumoSelecionado) : 0;
                                const quantidade = Number(String(material.quantidade).replace(',', '.')) || 0;
                                const custoCalculado = custoPorUnidade * quantidade;
                                
                                // Obter área do produto para materiais calculados por m²
                                const areaProduto = Number(form.watch(`itens_produto.${itemIndex}.area_produto`)) || 0;
                                const larguraProduto = Number(form.watch(`itens_produto.${itemIndex}.largura_produto`)) || 0;
                                const alturaProduto = Number(form.watch(`itens_produto.${itemIndex}.altura_produto`)) || 0;
                                const unidadeMedidaProduto = form.watch(`itens_produto.${itemIndex}.unidade_medida_produto`);
                                
                                // Calcular área se não estiver calculada
                                const areaCalculada = areaProduto > 0 ? areaProduto : 
                                  (larguraProduto && alturaProduto && unidadeMedidaProduto) ? 
                                  calcularArea(larguraProduto, alturaProduto, unidadeMedidaProduto) : 0;
                                
                                // Sugerir quantidade baseada no tipo de insumo
                                const sugerirQuantidade = () => {
                                  if (!insumoSelecionado) return '';
                                  
                                  switch (insumoSelecionado.unidade_uso) {
                                    case 'M2':
                                      return areaCalculada > 0 ? areaCalculada.toFixed(2) : '';
                                    case 'M':
                                      // Para cordão, usar o perímetro (2 × largura + 2 × altura)
                                      if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
                                        const larguraEmMetros = converterParaMetros(larguraProduto, unidadeMedidaProduto);
                                        const alturaEmMetros = converterParaMetros(alturaProduto, unidadeMedidaProduto);
                                        const perimetro = 2 * (larguraEmMetros + alturaEmMetros);
                                        return perimetro.toFixed(2);
                                      }
                                      return '';
                                    default:
                                      return '';
                                  }
                                };
                                
                                return (
                                  <div key={materialIndex} className="space-y-4 mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                      <FormField
                                        control={form.control}
                                        name={`itens_produto.${itemIndex}.materiais.${materialIndex}.insumo_id`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Material</FormLabel>
                                            <Select onValueChange={(value) => {
                                              field.onChange(value);
                                              
                                              // Aplicar sugestão automática quando um insumo é selecionado
                                              if (value) {
                                                const insumoSelecionado = insumos.find(insumo => insumo.id === value);
                                                if (insumoSelecionado) {
                                                  const larguraProduto = form.watch(`itens_produto.${itemIndex}.largura_produto`);
                                                  const alturaProduto = form.watch(`itens_produto.${itemIndex}.altura_produto`);
                                                  const unidadeMedidaProduto = form.watch(`itens_produto.${itemIndex}.unidade_medida_produto`);
                                                  
                                                  let sugestao = '';
                                                  switch (insumoSelecionado.unidade_uso) {
                                                    case 'M2':
                                                      if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
                                                        const area = calcularArea(larguraProduto, alturaProduto, unidadeMedidaProduto);
                                                        sugestao = area.toFixed(2);
                                                      }
                                                      break;
                                                    case 'M':
                                                      if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
                                                        const larguraEmMetros = converterParaMetros(larguraProduto, unidadeMedidaProduto);
                                                        const alturaEmMetros = converterParaMetros(alturaProduto, unidadeMedidaProduto);
                                                        const perimetro = 2 * (larguraEmMetros + alturaEmMetros);
                                                        sugestao = perimetro.toFixed(2);
                                                      }
                                                      break;
                                                  }
                                                  
                                                  if (sugestao) {
                                                    form.setValue(`itens_produto.${itemIndex}.materiais.${materialIndex}.quantidade`, sugestao);
                                                  }
                                                }
                                              }
                                            }} value={field.value}>
                                              <FormControl>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Selecione o material" />
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
                                        name={`itens_produto.${itemIndex}.materiais.${materialIndex}.quantidade`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>{campoQuantidade.label}</FormLabel>
                                            <FormControl>
                                              <Input 
                                                type="text" 
                                                placeholder={campoQuantidade.placeholder}
                                                {...field}
                                                onChange={(e) => {
                                                  // Permitir vírgula e ponto como separador decimal
                                                  const value = e.target.value.replace(/[^0-9,.-]/g, '');
                                                  field.onChange(value);
                                                }}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <div className="flex items-center justify-end">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveMaterial(itemIndex, materialIndex)}
                                          className="text-red-500 hover:text-red-700"
                                          disabled={form.watch(`itens_produto.${itemIndex}.materiais`)?.length === 1}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* Sugestão automática baseada no produto */}
                                    {insumoSelecionado && !quantidade && (
                                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                        <div className="flex items-center justify-between">
                                          <span>
                                            Sugestão: {sugerirQuantidade()} {insumoSelecionado.unidade_uso.toLowerCase()}
                                          </span>
                                          {sugerirQuantidade() && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => form.setValue(
                                                `itens_produto.${itemIndex}.materiais.${materialIndex}.quantidade`,
                                                sugerirQuantidade()
                                              )}
                                              className="text-blue-600 hover:text-blue-800"
                                            >
                                              Aplicar
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Custo calculado */}
                                    {insumoSelecionado && quantidade > 0 && custoCalculado > 0 && (
                                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                                        Custo: {formatCurrency(custoCalculado)} 
                                        ({formatCurrency(custoPorUnidade)} por {insumoSelecionado.unidade_uso.toLowerCase()})
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <Separator />

                            {/* Máquinas Utilizadas */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-medium">Máquinas Utilizadas</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => await handleAddMaquina(itemIndex)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar Máquina
                                </Button>
                              </div>
                              
                              {form.watch(`itens_produto.${itemIndex}.maquinas`)?.map((maquina, maquinaIndex) => (
                                <div key={maquinaIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <FormField
                                    control={form.control}
                                    name={`itens_produto.${itemIndex}.maquinas.${maquinaIndex}.maquina_id`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Máquina</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecione a máquina" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {maquinas.map((maquina) => (
                                              <SelectItem key={maquina.id} value={maquina.id}>
                                                {maquina.nome} ({maquina.tipo})
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
                                    name={`itens_produto.${itemIndex}.maquinas.${maquinaIndex}.horas_utilizadas`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Horas Utilizadas</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            step="0.01"
                                            placeholder="0.00"
                                            {...field} 
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <div className="flex items-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMaquina(itemIndex, maquinaIndex)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <Separator />

                            {/* Funções Utilizadas */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-medium">Funções Utilizadas</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => await handleAddFuncao(itemIndex)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar Função
                                </Button>
                              </div>
                              
                              {form.watch(`itens_produto.${itemIndex}.funcoes`)?.map((funcao, funcaoIndex) => (
                                <div key={funcaoIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <FormField
                                    control={form.control}
                                    name={`itens_produto.${itemIndex}.funcoes.${funcaoIndex}.funcao_id`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Função</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecione a função" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {funcoes.map((funcao) => (
                                              <SelectItem key={funcao.id} value={funcao.id}>
                                                {funcao.nome}
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
                                    name={`itens_produto.${itemIndex}.funcoes.${funcaoIndex}.horas_trabalhadas`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Horas Trabalhadas</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            step="0.01"
                                            placeholder="0.00"
                                            {...field} 
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <div className="flex items-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveFuncao(itemIndex, funcaoIndex)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddItem}
                      className="w-full py-3 border-dashed border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                        Novo Produto
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 3. CONFIGURAÇÕES GLOBAIS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configurações Globais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                              placeholder="0.00"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Deixe em branco para usar a margem configurada na loja
                          </FormDescription>
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
                              placeholder="0.00"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Deixe em branco para usar os impostos configurados na loja
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="condicoes_comerciais"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condições Comerciais</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva as condições comerciais, prazos de entrega, formas de pagamento, etc."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Sidebar com Preview do Cálculo */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 h-[calc(100vh-3rem)] flex flex-col">
            <Card className="flex-1 flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Preview do Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {calculoResultado ? (
                  <div className="space-y-4">
                    {/* Resumo */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Resumo</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Valor Total:</span>
                          <span className="text-xl font-bold text-green-600">{formatCurrency(calculoResultado.custos.preco_final)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Horas Totais:</span>
                          <span>{calculoResultado.horas_producao?.toFixed(2) || '0.00'}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Preço Final (por unidade):</span>
                          <span className="font-semibold">{formatCurrency(calculoResultado.custos.preco_final / (Number(form.watch('itens_produto.0.quantidade_produto')) || 1))}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Margem de Lucro:</span>
                            <span>{calculoResultado.custos.margem_lucro_percentual?.toFixed(1) || '0.0'}%</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Impostos:</span>
                            <span>{calculoResultado.custos.impostos_percentual?.toFixed(1) || '0.0'}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Custos Detalhados */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Custos Detalhados</h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Materiais:</span>
                          <span>{formatCurrency(calculoResultado.custos.custo_material)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Máquinas:</span>
                          <span>{formatCurrency(calculoResultado.custos.custo_maquinaria)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Mão de Obra:</span>
                          <span>{formatCurrency(calculoResultado.custos.custo_mao_obra)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Custos Indiretos:</span>
                          <span>{formatCurrency(calculoResultado.custos.custo_indireto)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Custo Total:</span>
                          <span>{formatCurrency(calculoResultado.custos.custo_total_producao)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Informações de Quantidade */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Informações do Produto</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Quantidade:</span>
                          <span>{form.watch('itens_produto.0.quantidade_produto') || 1}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Valor Unitário (Custo):</span>
                          <span>{formatCurrency(calculoResultado.custos.custo_total_producao / (Number(form.watch('itens_produto.0.quantidade_produto')) || 1))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Preço Unitário (com margem/impostos):</span>
                          <span>{formatCurrency(calculoResultado.custos.preco_final / (Number(form.watch('itens_produto.0.quantidade_produto')) || 1))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Valor Total:</span>
                          <span className="font-semibold">{formatCurrency(calculoResultado.custos.preco_final)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Debug: Preço Final = {calculoResultado.custos.preco_final}, Qtd = {form.watch('itens_produto.0.quantidade_produto')}
                        </div>
                      </div>
                    </div>

                    {/* Custos Indiretos Detalhados */}
                    {calculoResultado.custos.custos_indiretos_detalhados?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Custos Indiretos</h4>
                        <div className="space-y-2">
                          {calculoResultado.custos.custos_indiretos_detalhados.map((custo, index) => (
                            <div key={index} className="text-sm p-2 bg-muted rounded">
                              <div className="flex justify-between">
                                <span>{custo.nome}</span>
                                <span>{formatCurrency(custo.valor_rateado)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {custo.categoria} • {custo.percentual_rateio.toFixed(1)}% rateado
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Máquinas Utilizadas */}
                    {calculoResultado.maquinas?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Máquinas</h4>
                        <div className="space-y-2">
                          {calculoResultado.maquinas.map((maquina, index) => (
                            <div key={index} className="text-sm p-2 bg-muted rounded">
                              <div className="flex justify-between">
                                <span>{maquina.nome_maquina}</span>
                                <span>{formatCurrency(maquina.custo_total)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {maquina.horas_utilizadas}h × {formatCurrency(maquina.custo_por_hora)}/h
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Funções Utilizadas */}
                    {calculoResultado.funcoes?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Funções</h4>
                        <div className="space-y-2">
                          {calculoResultado.funcoes.map((funcao, index) => (
                            <div key={index} className="text-sm p-2 bg-muted rounded">
                              <div className="flex justify-between">
                                <span>{funcao.nome_funcao}</span>
                                <span>{formatCurrency(funcao.custo_total)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {funcao.horas_trabalhadas}h × {formatCurrency(funcao.custo_por_hora)}/h
                                {funcao.maquina_vinculada && ` • ${funcao.maquina_vinculada}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Clique em "Calcular" para ver o resultado</p>
                  </div>
                )}
              </CardContent>
              
              {/* Footer fixo com botão calcular */}
              <div className="p-4 border-t bg-background">
                <Button
                  variant="outline"
                  onClick={() => form.handleSubmit(calcularOrcamento)()}
                  disabled={calculando}
                  className="w-full"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {calculando ? 'Calculando...' : 'Calcular'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Botão Salvar Orçamento no final */}
      <div className="flex justify-end">
        <Button
          onClick={() => form.handleSubmit(onSubmit)()}
          disabled={loading}
          size="lg"
        >
          {loading ? 'Salvando...' : mode === 'novo' ? 'Salvar Orçamento' : 'Atualizar Orçamento'}
        </Button>
      </div>
    </div>
  );
} 