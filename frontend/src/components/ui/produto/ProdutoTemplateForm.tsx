'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { createProdutoSchema, ProdutoFormValues } from './schemas/produto.schema';
import { useProdutoData } from './hooks/useProdutoData';
import { MaterialSection, MaquinaSection, FuncaoSection, CalculoPreview } from '../shared/sections';
import { calcularArea } from '../shared/utils/calculo.utils';

interface ProdutoTemplateFormProps {
  mode: 'novo' | 'editar';
  initialData?: Record<string, unknown>;
  produtoId?: string;
  onSuccess?: () => void;
}

export function ProdutoTemplateForm({ 
  mode, 
  initialData, 
  produtoId, 
  onSuccess 
}: ProdutoTemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { insumos, maquinas, funcoes } = useProdutoData();

  const form = useForm<ProdutoFormValues>({
    resolver: zodResolver(createProdutoSchema()),
    defaultValues: {
      itens_produto: [
        {
          nome_servico: '',
          descricao: '',
          largura_produto: '',
          altura_produto: '',
          unidade_medida_produto: '',
          area_produto: '',
          materiais: [{ insumo_id: '', quantidade: '1' }],
          maquinas: [{ maquina_id: '', horas_utilizadas: '1' }],
          funcoes: [{ funcao_id: '', horas_trabalhadas: '1' }],
        }
      ],
    },
  });

  // Carregar dados iniciais se for edição
  useEffect(() => {
    if (mode === 'editar' && initialData) {
      // Adaptar dados do orçamento para o formato do produto
      const dadosAdaptados = {
        itens_produto: Array.isArray(initialData.itens_produto) 
          ? initialData.itens_produto.slice(0, 1) // Pegar apenas o primeiro item
          : [{
              nome_servico: initialData.nome_servico || '',
              descricao: initialData.descricao || '',
              largura_produto: initialData.largura_produto || '',
              altura_produto: initialData.altura_produto || '',
              unidade_medida_produto: initialData.unidade_medida_produto || '',
              area_produto: initialData.area_produto || '',
              materiais: Array.isArray(initialData.materiais) ? initialData.materiais : [{ insumo_id: '', quantidade: '1' }],
              maquinas: Array.isArray(initialData.maquinas) ? initialData.maquinas : [{ maquina_id: '', horas_utilizadas: '1' }],
              funcoes: Array.isArray(initialData.funcoes) ? initialData.funcoes : [{ funcao_id: '', horas_trabalhadas: '1' }],
            }]
      };
      
      form.reset(dadosAdaptados);
    }
  }, [mode, initialData, form]);

  const onSubmit = async (data: ProdutoFormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de acesso não encontrado');
        return;
      }

      const url = mode === 'novo' 
        ? 'http://localhost:3001/produtos'
        : `http://localhost:3001/produtos/${produtoId}`;
      
      const method = mode === 'novo' ? 'POST' : 'PATCH';
      
      // Extrair dados do primeiro item (produto é individual)
      const primeiroItem = data.itens_produto[0];
      
      const produtoData = {
        nome_servico: primeiroItem.nome_servico,
        descricao: primeiroItem.descricao,
        largura_produto: primeiroItem.largura_produto,
        altura_produto: primeiroItem.altura_produto,
        unidade_medida_produto: primeiroItem.unidade_medida_produto,
        area_produto: primeiroItem.area_produto,
        materiais: primeiroItem.materiais,
        maquinas: primeiroItem.maquinas,
        funcoes: primeiroItem.funcoes,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(produtoData),
      });

      if (response.ok) {
        toast.success(mode === 'novo' ? 'Produto criado com sucesso!' : 'Produto atualizado com sucesso!');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/produtos');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao salvar produto');
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleCalcularArea = () => {
    const largura = Number(form.watch('itens_produto.0.largura_produto'));
    const altura = Number(form.watch('itens_produto.0.altura_produto'));
    const unidade = form.watch('itens_produto.0.unidade_medida_produto');

    if (largura && altura && unidade) {
      const area = calcularArea(largura, altura, unidade);
      form.setValue('itens_produto.0.area_produto', area.toFixed(2));
      toast.success(`Área calculada: ${area.toFixed(2)} m²`);
    } else {
      toast.error('Preencha largura, altura e unidade de medida para calcular a área');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {mode === 'novo' ? 'Novo Produto Template' : 'Editar Produto Template'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'novo' ? 'Crie um novo template de produto' : 'Edite o template de produto'}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Informações do Produto */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itens_produto.0.nome_servico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome do produto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="itens_produto.0.descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Digite a descrição do produto" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Medidas do Produto */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Medidas do Produto</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="itens_produto.0.largura_produto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largura</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9,.-]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="itens_produto.0.altura_produto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Altura</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9,.-]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="itens_produto.0.unidade_medida_produto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade de Medida</FormLabel>
                        <FormControl>
                          <Input placeholder="cm, m, mm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-end space-x-2">
                    <FormField
                      control={form.control}
                      name="itens_produto.0.area_produto"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Área (m²)</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9,.-]/g, '');
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCalcularArea}
                      className="mb-2"
                    >
                      Calcular
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Seções Compartilhadas */}
          <MaterialSection
            variant="produto"
            itemIndex={0}
            insumos={insumos}
          />

          <Separator />

          <MaquinaSection
            variant="produto"
            itemIndex={0}
            maquinas={maquinas}
          />

          <Separator />

          <FuncaoSection
            variant="produto"
            itemIndex={0}
            funcoes={funcoes}
          />

          <Separator />

          {/* Preview do Cálculo */}
          <CalculoPreview
            variant="produto"
            itemIndex={0}
            insumos={insumos}
            maquinas={maquinas}
            funcoes={funcoes}
          />

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : (mode === 'novo' ? 'Criar Produto' : 'Atualizar Produto')}</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 