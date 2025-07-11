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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { Combobox } from '@/components/ui/combobox';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  categoriaId: z.string().min(1, 'Selecione uma categoria.'),
  fornecedorId: z.string().min(1, 'Selecione um fornecedor.'),
  unidade_medida: z.string().min(1, 'Selecione uma unidade de medida.'),
  custo_unitario: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) > 0, {
    message: 'O custo unitário deve ser maior que zero.',
  }),
  codigo_interno: z.string().optional().nullable(),
  estoque_minimo: z.any().optional().nullable(),
  descricao_tecnica: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export type InsumoFormValues = z.infer<typeof formSchema>;

interface InsumoFormProps {
  initialData?: Partial<InsumoFormValues>;
  onSave: (data: InsumoFormValues) => void;
  isSaving?: boolean;
}

const unidadesDeMedida = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'm2', label: 'Metro Quadrado (m²)' },
  { value: 'cm', label: 'Centímetro (cm)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'kit', label: 'Kit' },
  { value: 'pct', label: 'Pacote (pct)' },
  { value: 'folha', label: 'Folha' },
];

interface Option {
  value: string;
  label: string;
}

export function InsumoForm({ onSave, initialData, isSaving }: InsumoFormProps) {
  const form = useForm<InsumoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      categoriaId: '',
      fornecedorId: '',
      unidade_medida: '',
      custo_unitario: '',
      codigo_interno: '',
      estoque_minimo: '',
      descricao_tecnica: '',
      observacoes: '',
      ...initialData,
    },
  });
  
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
      estoque_minimo: data.estoque_minimo || undefined,
      codigo_interno: data.codigo_interno || undefined,
      descricao_tecnica: data.descricao_tecnica || undefined,
      observacoes: data.observacoes || undefined,
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="custo_unitario" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Custo Unitário (R$) *</FormLabel>
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
                <FormField control={form.control} name="unidade_medida" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Unidade de Medida *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                        <SelectContent>
                        {unidadesDeMedida.map(un => <SelectItem key={un.value} value={un.value}>{un.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
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

           </CardContent>
         </Card>
        
        <div className="flex justify-end gap-2">
            <Link href="/insumos"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button></Link>
            <Button type="submit" disabled={isSaving}><Save className="h-4 w-4 mr-2" />{isSaving ? 'Salvando...' : 'Salvar Insumo'}</Button>
        </div>
      </form>
    </Form>
  );
} 