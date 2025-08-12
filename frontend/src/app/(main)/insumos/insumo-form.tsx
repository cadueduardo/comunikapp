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
import { UNIDADES_COMPRA } from '@/lib/unidades-compra';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { InfoWithExamples } from '@/components/ui/info-with-examples';
import { ConversionExamplesModal } from '@/components/ui/conversion-examples-modal';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  quantidade_compra: z.any().refine(val => {
    const num = Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.'));
    return num > 0 && num <= 1000000;
  }, {
    message: 'A quantidade deve ser maior que zero e menor que 1.000.000.',
  }),
  gramatura: z.any().optional(),
  
  // Campos de uso
  unidade_uso: z.string().min(1, 'Selecione uma unidade de uso.'),
  fator_conversao: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) > 0, {
    message: 'O fator de conversão deve ser maior que zero.',
  }),
  
  // Campos de lógica de consumo
  logica_consumo: z.string().optional(),
  tipo_material_id: z.string().optional(),
  parametros_consumo: z.any().optional(),
  
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

const unidadesDeMedida = UNIDADES_COMPRA;

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
  { value: 'PERSONALIZADO', label: 'PERSONALIZADO (Tipos de Material)' },
];

interface Option {
  value: string;
  label: string;
}

export function InsumoForm({ onSave, initialData, isSaving }: InsumoFormProps) {
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [tiposMaterial, setTiposMaterial] = useState<Option[]>([]);
  
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
      logica_consumo: 'area', // Valor padrão
      tipo_material_id: '',
      parametros_consumo: {},
      codigo_interno: '',
      estoque_minimo: '',
      descricao_tecnica: '',
      observacoes: '',
      ativo: true,
      ...initialData,
    },
  });

  // Aplicar dados iniciais quando disponíveis
  useEffect(() => {
    if (initialData) {
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
  const unidadeCompra = form.watch('unidade_compra');
  
  // Cálculo do custo por unidade de uso
  const custoUnitario = form.watch('custo_unitario');
  const quantidadeCompra = form.watch('quantidade_compra');
  const fatorConversao = form.watch('fator_conversao');
  const unidadeUso = form.watch('unidade_uso');
  
  // Debug: monitorar mudanças no quantidadeCompra
  useEffect(() => {
    // console.log('🔍 quantidadeCompra mudou:', quantidadeCompra);
  }, [quantidadeCompra]);
  
  const custoPorUnidadeUso = React.useMemo(() => {
    // console.log('🔄 useMemo sendo recalculado!');
    // console.log('🔍 Valores observados:', {
    //   custoUnitario,
    //   quantidadeCompra,
    //   fatorConversao,
    //   unidadeUso
    // });
    
    if (custoUnitario && quantidadeCompra && fatorConversao) {
      const custo = Number(custoUnitario);
      const quantidade = Number(quantidadeCompra);
      const fator = Number(fatorConversao);
      
      // console.log('Dados do formulário:', {
      //   custoUnitario,
      //   quantidadeCompra,
      //   fatorConversao,
      //   largura,
      //   altura,
      //   unidadeDimensao,
      //   tipoCalculo
      // });
      
      // console.log('Valores convertidos:', {
      //   custo,
      //   quantidade,
      //   fator
      // });
      
      if (!isNaN(custo) && !isNaN(quantidade) && !isNaN(fator) && quantidade > 0 && fator > 0) {
        const quantidadeCalculada = quantidade;
        
        // Se temos dimensões e tipo de cálculo, usar a lógica específica
        if (altura && unidadeDimensao && tipoCalculo) {
          // console.log('Aplicando lógica de dimensões...');
          
          // Para COMPRIMENTO LINEAR, não precisamos de largura
          const alturaNum = parseFloat(altura);
          
          // console.log('Dimensões convertidas:', {
          //   largura: largura || 'não informada',
          //   alturaNum,
          //   unidadeDimensao,
          //   tipoCalculo
          // });
          
          if (!isNaN(alturaNum)) {
            // Converter dimensões para metros
            let alturaEmMetros = alturaNum;
            
            switch (unidadeDimensao) {
              case 'CENTÍMETROS':
              case 'CM':
                alturaEmMetros = alturaNum / 100;
                break;
              case 'MILÍMETROS':
              case 'MM':
                alturaEmMetros = alturaNum / 1000;
                break;
              case 'METROS':
              case 'M':
                // Já está em metros
                break;
            }
            
            // console.log('Dimensões em metros:', {
            //   alturaEmMetros
            // });
            
            // Calcular quantidade baseada no tipo de cálculo
            switch (tipoCalculo) {
              case 'COMPRIMENTO LINEAR':
              case 'LINEAR':
                // Para comprimento linear: calcular custo por unidade de uso
                const custoPorUnidade = custo / quantidade;
                
                if (unidadeUso === 'CENTIMETRO' || unidadeUso === 'CM') {
                  // Se a unidade de uso é centímetro, calcular custo por centímetro
                  // Para cordão: custo por metro ÷ 100 = custo por centímetro
                  const custoPorCentimetro = custoPorUnidade / 100;
                  
                  // console.log('COMPRIMENTO LINEAR - CENTIMETRO:', {
                  //   custoPorUnidade,
                  //   alturaEmMetros,
                  //   custoPorCentimetro
                  // });
                  
                  return custoPorCentimetro;
                } else {
                  // Para outras unidades de uso, usar o cálculo padrão
                  return custoPorUnidade;
                }
                
              case 'AREA':
                // Para área: calcular custo por unidade de uso baseado na área da unidade
                if (largura) {
                  const larguraNum = parseFloat(largura);
                  if (!isNaN(larguraNum)) {
                    let larguraEmMetros = larguraNum;
                    
                    switch (unidadeDimensao) {
                      case 'CENTÍMETROS':
                      case 'CM':
                        larguraEmMetros = larguraNum / 100;
                        break;
                      case 'MILÍMETROS':
                      case 'MM':
                        larguraEmMetros = larguraNum / 1000;
                        break;
                    }
                    
                    const areaPorUnidade = larguraEmMetros * alturaEmMetros;
                    
                    if (unidadeUso === 'METRO QUADRADO') {
                      // Se a unidade de uso é metro quadrado, calcular custo por m²
                      const custoPorMetroQuadrado = custo / areaPorUnidade;
                      
                      // console.log('AREA - METRO QUADRADO:', {
                      //   larguraEmMetros,
                      //   alturaEmMetros,
                      //   areaPorUnidade,
                      //   custoPorMetroQuadrado
                      // });
                      
                      return custoPorMetroQuadrado;
                    } else {
                      // Para outras unidades de uso, usar o cálculo padrão
                      return custo / quantidade;
                    }
                  }
                } else {
                  return custo / quantidade;
                }
                break;
                
              case 'QUANTIDADE':
                // Para quantidade fixa: usar quantidade diretamente
                return custo / quantidade;
                
              default:
                // Padrão: usar quantidade diretamente
                return custo / quantidade;
            }
          }
        } else {
          // console.log('Não aplicando lógica de dimensões - dados faltando:', {
          //   temLargura: !!largura,
          //   temAltura: !!altura,
          //   temUnidadeDimensao: !!unidadeDimensao,
          //   temTipoCalculo: !!tipoCalculo
          // });
        }
        
        // Cálculo final: Custo Total ÷ (Quantidade Calculada × Fator de Conversão)
        const resultado = custo / (quantidadeCalculada * fator);
        
        // console.log('Cálculo useMemo:', {
        //   custo,
        //   quantidade,
        //   fator,
        //   quantidadeCalculada,
        //   resultado,
        //   largura,
        //   altura,
        //   unidadeDimensao,
        //   tipoCalculo
        // });
        
        // Verificar se o resultado faz sentido (entre R$ 0,01 e R$ 1.000 por unidade)
        if (resultado < 0.01) {
          // console.warn('Custo por unidade muito baixo. Verifique se a quantidade está na unidade correta.');
        } else if (resultado > 1000) {
          // console.warn('Custo por unidade muito alto. Verifique se a quantidade está na unidade correta.');
        }
        
        return resultado;
      }
    }
    return null;
  }, [custoUnitario, quantidadeCompra, fatorConversao, unidadeUso, largura, altura, unidadeDimensao, tipoCalculo]);


  
  useEffect(() => {
    if (largura && altura && unidadeDimensao && tipoCalculo) {
      const larguraNum = parseFloat(largura);
      const alturaNum = parseFloat(altura);
      
      if (!isNaN(larguraNum) && !isNaN(alturaNum)) {
        let quantidadeTotal = 0;
        
        // Converter dimensões para metros se necessário
        let larguraEmMetros = larguraNum;
        let alturaEmMetros = alturaNum;
        
        switch (unidadeDimensao) {
          case 'CENTÍMETROS':
          case 'CM':
            larguraEmMetros = larguraNum / 100;
            alturaEmMetros = alturaNum / 100;
            break;
          case 'MILÍMETROS':
          case 'MM':
            larguraEmMetros = larguraNum / 1000;
            alturaEmMetros = alturaNum / 1000;
            break;
          case 'METROS':
          case 'M':
            // Já está em metros
            break;
          default:
            // Unidade não reconhecida, mantém valores originais
            break;
        }
        
        // Calcular quantidade baseada na unidade de compra
        switch (unidadeCompra) {
          case 'PACOTE':
          case 'UNID':
            // Para pacotes, usar quantidade de unidades (não calcular automaticamente)
            quantidadeTotal = 1; // Deixar o usuário definir
            break;
          case 'ROLO':
            // Para rolos, usar o comprimento em metros
            quantidadeTotal = alturaEmMetros;
            break;
          case 'BOBINA':
            // Para bobinas, usar a área em metros quadrados
            quantidadeTotal = larguraEmMetros * alturaEmMetros;
            break;
          default:
            // Caso padrão: usar área
            quantidadeTotal = larguraEmMetros * alturaEmMetros;
        }
        
        // Validar se a quantidade calculada faz sentido
        if (quantidadeTotal > 0 && quantidadeTotal < 1000000) { // Evitar valores absurdos
          // Formatar quantidade removendo zeros desnecessários
          const quantidadeFormatada = quantidadeTotal % 1 === 0 
            ? quantidadeTotal.toString() 
            : quantidadeTotal.toFixed(3).replace(/\.?0+$/, '');
          
          // Forçar o cálculo automático sempre que as dimensões forem preenchidas
          form.setValue('quantidade_compra', quantidadeFormatada);
        }
      }
    }
  }, [largura, altura, unidadeDimensao, tipoCalculo, unidadeCompra, form]);
  
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
    fetchTiposMaterial();
  }, []);

  const fetchTiposMaterial = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/tipos-material', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const options = data.map((tipo: { id: string; nome: string }) => ({
          value: tipo.id,
          label: tipo.nome,
        }));
        setTiposMaterial(options);
      }
    } catch (error) {
      console.error('Erro ao buscar tipos de material:', error);
    }
  };
  
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
    console.log('🔍 Dados do formulário antes da limpeza:', data);
    
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
      logica_consumo: data.logica_consumo || 'area', // Valor padrão se não selecionado
      tipo_material_id: data.tipo_material_id || undefined,
      ativo: data.ativo ?? true,
    }
    
    console.log('🔍 Dados limpos para envio:', cleanedData);
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
                        <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {tiposCalculo.map((tipo) => (
                                    <SelectItem key={tipo.value} value={tipo.value}>
                                        {tipo.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    // Validar se o valor não é absurdo (mais de 1 milhão)
                                    if (value > 1000000) {
                                        toast.error("Quantidade muito alta! Verifique se está na unidade correta.");
                                        return;
                                    }
                                    // Validar se o valor não é muito alto para o tipo de cálculo
                                    if (largura && altura && unidadeDimensao && tipoCalculo) {
                                        const larguraNum = parseFloat(largura);
                                        const alturaNum = parseFloat(altura);
                                        let larguraEmMetros = larguraNum;
                                        let alturaEmMetros = alturaNum;
                                        
                                        switch (unidadeDimensao) {
                                            case 'CENTÍMETROS':
                                                larguraEmMetros = larguraNum / 100;
                                                alturaEmMetros = alturaNum / 100;
                                                break;
                                            case 'MILÍMETROS':
                                                larguraEmMetros = larguraNum / 1000;
                                                alturaEmMetros = alturaNum / 1000;
                                                break;
                                        }
                                        
                                        let areaEsperada = 0;
                                        switch (tipoCalculo) {
                                            case 'AREA':
                                                areaEsperada = larguraEmMetros * alturaEmMetros;
                                                break;
                                            case 'LINEAR':
                                                areaEsperada = larguraEmMetros;
                                                break;
                                            default:
                                                areaEsperada = larguraEmMetros * alturaEmMetros;
                                        }
                                        
                                        // Se o valor é muito maior que o esperado, pode estar em cm² ou mm²
                                        if (value > areaEsperada * 100) {
                                            // Tentar corrigir automaticamente
                                            const valorCorrigido = value / 10000; // Converter de cm² para m²
                                            if (Math.abs(valorCorrigido - areaEsperada) < areaEsperada * 0.1) {
                                                toast.success("Quantidade corrigida automaticamente de cm² para m².");
                                                e.target.value = valorCorrigido.toString();
                                                field.onChange(e);
                                                return;
                                            }
                                            toast.error("Quantidade muito alta! Pode estar em cm² ou mm² em vez de m².");
                                            return;
                                        }
                                    }
                                    // Validar se o valor faz sentido para o tipo de cálculo
                                    if (largura && altura && unidadeDimensao && tipoCalculo) {
                                        const larguraNum = parseFloat(largura);
                                        const alturaNum = parseFloat(altura);
                                        let larguraEmMetros = larguraNum;
                                        let alturaEmMetros = alturaNum;
                                        
                                        switch (unidadeDimensao) {
                                            case 'CENTÍMETROS':
                                                larguraEmMetros = larguraNum / 100;
                                                alturaEmMetros = alturaNum / 100;
                                                break;
                                            case 'MILÍMETROS':
                                                larguraEmMetros = larguraNum / 1000;
                                                alturaEmMetros = alturaNum / 1000;
                                                break;
                                        }
                                        
                                        let areaEsperada = 0;
                                        switch (tipoCalculo) {
                                            case 'AREA':
                                                areaEsperada = larguraEmMetros * alturaEmMetros;
                                                break;
                                            case 'LINEAR':
                                                areaEsperada = larguraEmMetros;
                                                break;
                                            default:
                                                areaEsperada = larguraEmMetros * alturaEmMetros;
                                        }
                                        
                                                                                        // Se o valor inserido é muito diferente do calculado, mostrar aviso
                                        if (Math.abs(value - areaEsperada) > areaEsperada * 0.1) { // 10% de tolerância
                                          toast.warning("Quantidade diferente do calculado automaticamente. Verifique se está correto.");
                                        }
                                    }
                                    field.onChange(e);
                                }}
                            />
                            {largura && altura && unidadeDimensao && tipoCalculo && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                        Auto
                                    </div>
                                </div>
                            )}
                            {!largura || !altura || !unidadeDimensao || !tipoCalculo ? (
                                <div className="text-xs text-gray-500 mt-1">
                                    💡 Preencha largura, altura, unidade e tipo de cálculo para cálculo automático
                                </div>
                            ) : null}
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

            {/* Seção de Lógica de Consumo - Apenas quando Personalizado for selecionado */}
            {form.watch('tipo_calculo') === 'PERSONALIZADO' && (
              <Card>
                <CardHeader>
                  <CardTitle>🔧 Lógica de Consumo Automático</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure como este insumo será calculado automaticamente nos orçamentos.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className={`grid gap-4 ${form.watch('logica_consumo') === 'custom' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    <FormField control={form.control} name="logica_consumo" render={({ field }) => {
                      console.log('🔍 Campo logica_consumo:', field.value);
                      return (
                        <FormItem>
                          <FormLabel>Tipo de Cálculo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a lógica de consumo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="area">Área (m²)</SelectItem>
                              <SelectItem value="perimetro">Perímetro (m)</SelectItem>
                              <SelectItem value="quantidade_fixa">Quantidade Fixa</SelectItem>
                              <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            Para cálculos personalizados, use o campo &quot;Tipo de Material&quot; abaixo.
                          </p>
                          <FormMessage />
                        </FormItem>
                      );
                    }} />
                    
                    {form.watch('logica_consumo') === 'custom' && (
                      <FormField control={form.control} name="tipo_material_id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Material</FormLabel>
                          <Combobox 
                            options={tiposMaterial} 
                            {...field} 
                            placeholder="Selecione o tipo de material"
                          />
                          <p className="text-sm text-muted-foreground">
                            Configure tipos de material em Configurações → Tipos de Material.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
                  </div>
                </CardContent>
              </Card>
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