'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { Combobox } from '@/components/ui/combobox';
import { UnitSelect } from '@/components/ui/unit-select';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { InfoWithExamples } from '@/components/ui/info-with-examples';
import { ConversionExamplesModal } from '@/components/ui/conversion-examples-modal';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';

const formSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  categoriaId: z.string().min(1, 'Selecione uma categoria.'),
  fornecedorId: z.string().min(1, 'Selecione um fornecedor.'),
  custo_unitario: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) > 0, {
    message: 'O custo unitário deve ser maior que zero.',
  }),
  
  // Campos de compra
  unidade_compra: z.string().min(1, 'Selecione uma unidade de compra.'),
  
  // Campos de dimensões (opcional)
  largura: z.any().optional(),
  altura: z.any().optional(),
  unidade_dimensao: z.string().optional(), // Unidade das dimensões (M, CM, MM)
  tipo_calculo: z.string().optional(), // Tipo de cálculo (AREA, LINEAR, QUANTIDADE)
  quantidade_compra: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) > 0, {
    message: 'A quantidade deve ser maior que zero.',
  }),
  gramatura: z.any().optional(),
  
  // Campos de uso
  unidade_uso: z.string().min(1, 'Selecione uma unidade de uso.'),
  fator_conversao: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) > 0, {
    message: 'O fator de conversão deve ser maior que zero.',
  }),
  
  codigo_interno: z.string().optional().nullable(),
  estoque_minimo: z.any().optional().nullable(),
  descricao_tecnica: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
});

export type InsumoFormValues = z.infer<typeof formSchema>;

interface InsumoFormProps {
  initialData?: Partial<InsumoFormValues>;
  onSave: (data: InsumoFormValues) => void;
  isSaving?: boolean;
}

const unidadesDeMedida = [
  { value: 'UNID', label: 'UNIDADE' },
  { value: 'M', label: 'METRO' },
  { value: 'M2', label: 'METRO QUADRADO' },
  { value: 'M3', label: 'METRO CÚBICO' },
  { value: 'CM', label: 'CENTIMETRO' },
  { value: 'CM2', label: 'CENTIMETRO QUADRADO' },
  { value: 'KG', label: 'QUILOGRAMA' },
  { value: 'GRAMAS', label: 'GRAMAS' },
  { value: 'LITRO', label: 'LITRO' },
  { value: 'ML', label: 'MILILITRO' },
  { value: 'BOBINA', label: 'BOBINA' },
  { value: 'ROLO', label: 'ROLO' },
  { value: 'FOLHA', label: 'FOLHA' },
  { value: 'CX', label: 'CAIXA' },
  { value: 'CX2', label: 'CAIXA COM 2 UNIDADES' },
  { value: 'CX3', label: 'CAIXA COM 3 UNIDADES' },
  { value: 'CX5', label: 'CAIXA COM 5 UNIDADES' },
  { value: 'CX10', label: 'CAIXA COM 10 UNIDADES' },
  { value: 'CX15', label: 'CAIXA COM 15 UNIDADES' },
  { value: 'CX20', label: 'CAIXA COM 20 UNIDADES' },
  { value: 'CX25', label: 'CAIXA COM 25 UNIDADES' },
  { value: 'CX50', label: 'CAIXA COM 50 UNIDADES' },
  { value: 'CX100', label: 'CAIXA COM 100 UNIDADES' },
  { value: 'PACOTE', label: 'PACOTE' },
  { value: 'KIT', label: 'KIT' },
  { value: 'JOGO', label: 'JOGO' },
  { value: 'CONJUNTO', label: 'CONJUNTO' },
  { value: 'DUZIA', label: 'DUZIA' },
  { value: 'CENTO', label: 'CENTO' },
  { value: 'MILHEI', label: 'MILHEIRO' },
  { value: 'PARES', label: 'PARES' },
  { value: 'PC', label: 'PEÇA' },
  { value: 'BALDE', label: 'BALDE' },
  { value: 'BANDEJ', label: 'BANDEJA' },
  { value: 'BARRA', label: 'BARRA' },
  { value: 'BISNAG', label: 'BISNAGA' },
  { value: 'BLOCO', label: 'BLOCO' },
  { value: 'BOMB', label: 'BOMBONA' },
  { value: 'CAPS', label: 'CAPSULA' },
  { value: 'CART', label: 'CARTELA' },
  { value: 'CJ', label: 'CONJUNTO' },
  { value: 'DISP', label: 'DISPLAY' },
  { value: 'EMBAL', label: 'EMBALAGEM' },
  { value: 'FARDO', label: 'FARDO' },
  { value: 'FRASCO', label: 'FRASCO' },
  { value: 'GALAO', label: 'GALÃO' },
  { value: 'GF', label: 'GARRAFA' },
  { value: 'LATA', label: 'LATA' },
  { value: 'PALETE', label: 'PALETE' },
  { value: 'POTE', label: 'POTE' },
  { value: 'K', label: 'QUILATE' },
  { value: 'RESMA', label: 'RESMA' },
  { value: 'SACO', label: 'SACO' },
  { value: 'SACOLA', label: 'SACOLA' },
  { value: 'TAMBOR', label: 'TAMBOR' },
  { value: 'TANQUE', label: 'TANQUE' },
  { value: 'TON', label: 'TONELADA' },
  { value: 'TUBO', label: 'TUBO' },
  { value: 'VASIL', label: 'VASILHAME' },
  { value: 'VIDRO', label: 'VIDRO' },
  { value: 'AMPOLA', label: 'AMPOLA' },
];

const unidadesDimensao = [
  { value: 'M', label: 'METROS' },
  { value: 'CM', label: 'CENTÍMETROS' },
  { value: 'MM', label: 'MILÍMETROS' },
  { value: 'INCH', label: 'POLEGADAS' },
  { value: 'FT', label: 'PÉS' },
];

const tiposCalculo = [
  { value: 'AREA', label: 'ÁREA (Largura × Altura)' },
  { value: 'LINEAR', label: 'COMPRIMENTO LINEAR' },
  { value: 'QUANTIDADE', label: 'QUANTIDADE DE ITENS' },
  { value: 'PESO', label: 'PESO' },
  { value: 'VOLUME', label: 'VOLUME' },
];

interface Option {
  value: string;
  label: string;
}

export function InsumoForm({ onSave, initialData, isSaving }: InsumoFormProps) {
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  
  const form = useForm<InsumoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      categoriaId: '',
      fornecedorId: '',
      custo_unitario: '',
      unidade_compra: '',
      quantidade_compra: '',
      largura: '',
      altura: '',
      unidade_dimensao: '',
      tipo_calculo: '',
      gramatura: '',
      unidade_uso: '',
      fator_conversao: '',
      codigo_interno: '',
      estoque_minimo: '',
      descricao_tecnica: '',
      observacoes: '',
      ativo: true,
      ...initialData,
    },
  });

  // Debug: log dos dados iniciais
  console.log('InsumoForm initialData:', initialData);
  console.log('Form values:', form.getValues());

  // Aplicar dados iniciais quando disponíveis
  useEffect(() => {
    if (initialData) {
      console.log('Aplicando dados iniciais:', initialData);
      Object.entries(initialData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.setValue(key as keyof InsumoFormValues, value);
        }
      });
    }
  }, [initialData, form]);

  // Cálculo automático da quantidade total
  const largura = form.watch('largura');
  const altura = form.watch('altura');
  const unidadeDimensao = form.watch('unidade_dimensao');
  const tipoCalculo = form.watch('tipo_calculo');
  
  // Cálculo do custo por unidade de uso
  const custoUnitario = form.watch('custo_unitario');
  const quantidadeCompra = form.watch('quantidade_compra');
  const fatorConversao = form.watch('fator_conversao');
  const unidadeUso = form.watch('unidade_uso');
  
  const custoPorUnidadeUso = React.useMemo(() => {
    if (custoUnitario && quantidadeCompra && fatorConversao) {
      // O CustomCurrencyInput retorna o valor em reais (já dividido por 100)
      // Quando vem do banco (edição), já vem em reais
      // Quando vem do formulário (criação), também vem em reais
      const custo = Number(custoUnitario);
      const quantidade = Number(quantidadeCompra);
      const fator = Number(fatorConversao);
      
      if (!isNaN(custo) && !isNaN(quantidade) && !isNaN(fator) && quantidade > 0 && fator > 0) {
        return custo / (quantidade * fator);
      }
    }
    return null;
  }, [custoUnitario, quantidadeCompra, fatorConversao]);
  
  useEffect(() => {
    if (largura && altura && unidadeDimensao && tipoCalculo) {
      const larguraNum = parseFloat(largura);
      const alturaNum = parseFloat(altura);
      
      if (!isNaN(larguraNum) && !isNaN(alturaNum)) {
        let quantidadeTotal = 0;
        
        switch (tipoCalculo) {
          case 'AREA':
            quantidadeTotal = larguraNum * alturaNum;
            break;
          case 'LINEAR':
            quantidadeTotal = larguraNum; // Usa apenas a largura como comprimento
            break;
          case 'QUANTIDADE':
            quantidadeTotal = larguraNum * alturaNum; // Para itens em grade
            break;
          default:
            quantidadeTotal = larguraNum * alturaNum;
        }
        
        form.setValue('quantidade_compra', quantidadeTotal.toFixed(3));
      }
    }
  }, [largura, altura, unidadeDimensao, tipoCalculo, form]);
  
  const [categorias, setCategorias] = useState<Option[]>([]);
  const [fornecedores, setFornecedores] = useState<Option[]>([]);
  
  useEffect(() => {
    const fetchData = async (url: string, setter: React.Dispatch<React.SetStateAction<Option[]>>) => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`http://localhost:3001${url}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setter(data.map((item: {id: string, nome: string}) => ({ value: item.id, label: item.nome })));
      } catch (error) {
        toast.error(`Falha ao carregar ${url.replace('/', '')}.`);
        console.error(`Fetch error for ${url}:`, error);
      }
    };
    fetchData('/categorias', setCategorias);
    fetchData('/fornecedores', setFornecedores);
  }, []);
  
  const handleCreate = async (
    name: string,
    type: 'categoria' | 'fornecedor'
  ) => {
    const url = type === 'categoria' ? '/categorias' : '/fornecedores';
    const setter = type === 'categoria' ? setCategorias : setFornecedores;
    const fieldName = type === 'categoria' ? 'categoriaId' : 'fornecedorId';
    const token = localStorage.getItem('access_token');
    
    try {
      const response = await fetch(`http://localhost:3001${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nome: name }),
      });
      
      const newData = await response.json();
      
      if (response.ok) {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} "${name}" criada com sucesso!`);
        const newOption = { value: newData.id, label: newData.nome };
        setter(prev => [...prev, newOption]);
        form.setValue(fieldName, newData.id);
      } else {
        toast.error(newData.message || `Falha ao criar ${type}.`);
      }
    } catch (error) {
      toast.error(`Ocorreu um erro de conexão ao criar ${type}.`);
      console.error(error);
    }
  };

  function onSubmit(data: InsumoFormValues) {
    const cleanedData = {
      ...data,
      custo_unitario: data.custo_unitario || 0,
      quantidade_compra: data.quantidade_compra || 1,
      fator_conversao: data.fator_conversao || 1,
      largura: data.largura || undefined,
      altura: data.altura || undefined,
      unidade_dimensao: data.unidade_dimensao || undefined,
      tipo_calculo: data.tipo_calculo || undefined,
      gramatura: data.gramatura || undefined,
      estoque_minimo: data.estoque_minimo || undefined,
      codigo_interno: data.codigo_interno || undefined,
      descricao_tecnica: data.descricao_tecnica || undefined,
      observacoes: data.observacoes || undefined,
      ativo: data.ativo ?? true,
    }
    onSave(cleanedData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
         <Card>
           <CardHeader>
             <CardTitle>Dados do Insumo</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="nome" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nome do Insumo *</FormLabel>
                    <FormControl><Input placeholder="Ex: Lona XPTO 440g" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="categoriaId" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                     <Combobox 
                        options={categorias} 
                        {...field} 
                        placeholder="Selecione a categoria"
                        onCreate={(name) => handleCreate(name, 'categoria')}
                     />
                    <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="custo_unitario" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Custo Total da Unidade (R$) *</FormLabel>
                    <FormControl>
                        <CustomCurrencyInput 
                            onValueChange={field.onChange} 
                            value={field.value} 
                            placeholder="R$ 10,50"
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="fornecedorId" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Fornecedor *</FormLabel>
                    <Combobox 
                        options={fornecedores} 
                        {...field} 
                        placeholder="Selecione o fornecedor"
                        onCreate={(name) => handleCreate(name, 'fornecedor')}
                    />
                    <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="largura" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Largura (opcional)</FormLabel>
                    <FormControl>
                        <Input 
                            type="number" 
                            step="0.01"
                            placeholder="Ex: 6.0" 
                            {...field} 
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="altura" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Altura/Comprimento (opcional)</FormLabel>
                    <FormControl>
                        <Input 
                            type="number" 
                            step="0.01"
                            placeholder="Ex: 2.2" 
                            {...field} 
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="unidade_dimensao" render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        <InfoTooltip content="Selecione a unidade de medida das dimensões (largura e altura). Ex: se você mediu em metros, selecione METROS.">
                            Unidade das Dimensões
                        </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                        <UnitSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione a unidade"
                            units={unidadesDimensao}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="tipo_calculo" render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        <InfoTooltip content="Como calcular a quantidade total: ÁREA (largura × altura), LINEAR (apenas largura), QUANTIDADE (itens em grade), PESO ou VOLUME.">
                            Tipo de Cálculo
                        </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                        <UnitSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione o tipo"
                            units={tiposCalculo}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="quantidade_compra" render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        <InfoTooltip content="Quantidade total da unidade de compra. Ex: 13.2 m² em uma bobina, 100 metros em um rolo, 50 unidades em uma caixa. Será calculado automaticamente se você preencher largura, altura, unidade e tipo de cálculo.">
                            Quantidade Total *
                        </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input 
                                type="number" 
                                step="0.001"
                                placeholder="Ex: 13.2" 
                                {...field} 
                                className={largura && altura && unidadeDimensao && tipoCalculo ? "pr-10" : ""}
                            />
                            {largura && altura && unidadeDimensao && tipoCalculo && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                        Auto
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="unidade_compra" render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        <InfoTooltip content="Como você compra o insumo. Ex: BOBINA (lona), ROLO (cordão), CAIXA (parafusos), KG (tinta), LITRO (cola).">
                            Unidade de Compra *
                        </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                        <UnitSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione a unidade de compra"
                            units={unidadesDeMedida}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="unidade_uso" render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        <InfoTooltip content="Como você consome o insumo no produto final. Ex: M² (lona), M (cordão), UNIDADE (parafusos), M² (tinta), M² (cola).">
                            Unidade de Uso *
                        </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                        <UnitSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione a unidade de uso"
                            units={unidadesDeMedida}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="fator_conversao" render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        <InfoWithExamples 
                            tooltipContent="Fator que converte unidade de compra para unidade de uso. Na maioria dos casos use 1.0."
                            onShowExamples={() => setShowExamplesModal(true)}
                        >
                            Fator de Conversão *
                        </InfoWithExamples>
                    </FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input 
                                type="number" 
                                step="0.0001"
                                placeholder="Ex: 1.0" 
                                {...field} 
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border">
                                    Dica: Use 1.0
                                </div>
                            </div>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
            </div>

            {/* Campo calculado - Custo por Unidade de Uso */}
            {custoPorUnidadeUso && unidadeUso && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-green-800">💰 Custo por {unidadeUso}</div>
                            <div className="text-sm text-green-600">
                                Calculado automaticamente baseado nos dados acima
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-700">
                                {new Intl.NumberFormat('pt-BR', { 
                                  style: 'currency', 
                                  currency: 'BRL',
                                  minimumFractionDigits: 4,
                                  maximumFractionDigits: 4
                                }).format(custoPorUnidadeUso)}
                            </div>
                            <div className="text-xs text-green-600">
                                por {unidadeUso.toLowerCase()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <FormField control={form.control} name="gramatura" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Gramatura (opcional)</FormLabel>
                    <FormControl>
                        <Input 
                            type="number" 
                            step="0.1"
                            placeholder="Ex: 440" 
                            {...field} 
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="codigo_interno" render={({ field }) => (
                    <FormItem><FormLabel>Código Interno</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="estoque_minimo" render={({ field }) => (
                    <FormItem><FormLabel>Estoque Mínimo</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            
            <FormField control={form.control} name="descricao_tecnica" render={({ field }) => (
                <FormItem><FormLabel>Descrição Técnica</FormLabel><FormControl><Textarea placeholder="Cor, gramatura, etc." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="observacoes" render={({ field }) => (
                <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex items-center space-x-2">
                <FormField control={form.control} name="ativo" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                            <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Insumo Ativo</FormLabel>
                    </FormItem>
                )} />
            </div>

           </CardContent>
         </Card>
        
        <div className="flex justify-end gap-2">
            <Link href="/insumos"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button></Link>
            <Button type="submit" disabled={isSaving}><Save className="h-4 w-4 mr-2" />{isSaving ? 'Salvando...' : 'Salvar Insumo'}</Button>
        </div>
      </form>
      
      <ConversionExamplesModal 
        isOpen={showExamplesModal}
        onClose={() => setShowExamplesModal(false)}
      />
    </Form>
  );
} 