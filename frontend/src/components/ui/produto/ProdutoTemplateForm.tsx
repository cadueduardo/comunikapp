'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Calculator, RefreshCw } from 'lucide-react';
import { createProdutoSchema, ProdutoFormValues } from './schemas/produto.schema';
import { useProdutoData } from './hooks/useProdutoData';
import { buildApiUrl } from '@/lib/config';
import { MaterialSection, MaquinaSection, FuncaoSection, CalculoPreview } from '../shared/sections';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface ProdutoTemplateFormProps {
  mode: 'novo' | 'editar';
  initialData?: Record<string, unknown>;
  produtoId?: string;
}

export function ProdutoTemplateForm({ 
  mode, 
  initialData, 
  produtoId
}: ProdutoTemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { 
    insumos, maquinas, funcoes,
    loading: loadingData,
    refetchAll, fetchMaquinas, fetchFuncoes
  } = useProdutoData();

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
      console.log('🔍 Debug - Dados iniciais recebidos:', initialData);
      // Adaptar dados do produto para o formato do formulário
      const dadosAdaptados = {
        itens_produto: [{
          nome_servico: String(initialData.nome_servico || ''),
          descricao: String(initialData.descricao_produto || ''),
          largura_produto: initialData.largura_produto ? String(initialData.largura_produto) : '',
          altura_produto: initialData.altura_produto ? String(initialData.altura_produto) : '',
          unidade_medida_produto: String(initialData.unidade_medida_produto || ''),
          area_produto: initialData.area_produto ? String(initialData.area_produto) : '',
          materiais: Array.isArray(initialData.itens) 
            ? initialData.itens.map(item => ({
                insumo_id: String(item.insumo?.id || item.insumo_id || ''),
                quantidade: String(item.quantidade || '1'),
              }))
            : [{ insumo_id: '', quantidade: '1' }],
          maquinas: Array.isArray(initialData.maquinas) 
            ? initialData.maquinas.map(maquina => ({
                maquina_id: String(maquina.maquina?.id || maquina.maquina_id || ''),
                horas_utilizadas: String(maquina.horas_utilizadas || '1'),
              }))
            : [{ maquina_id: '', horas_utilizadas: '1' }],
          funcoes: Array.isArray(initialData.funcoes) 
            ? initialData.funcoes.map(funcao => ({
                funcao_id: String(funcao.funcao?.id || funcao.funcao_id || ''),
                horas_trabalhadas: String(funcao.horas_trabalhadas || '1'),
              }))
            : [{ funcao_id: '', horas_trabalhadas: '1' }],
        }]
      };
      
      console.log('🔍 Debug - Dados adaptados:', dadosAdaptados);
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

      // Pegar o primeiro item do produto para os dados básicos
      const primeiroItem = data.itens_produto[0];
      
      // Mapear itens do formulário com custos calculados
      const itensParaEnviar = primeiroItem.materiais.map(material => {
        const insumo = insumos.find(i => i.id === material.insumo_id);
        const quantidade = Number(String(material.quantidade).replace(',', '.'));
        const custoUnitario = insumo ? insumo.custo_unitario : 0;
        const custoTotal = quantidade * custoUnitario;
        
        return {
          insumo_id: material.insumo_id,
          quantidade: quantidade,
          custo_unitario: custoUnitario,
          custo_total: custoTotal,
        };
      });
      
      const maquinasParaEnviar = primeiroItem.maquinas.map(maquina => {
        const maquinaEncontrada = maquinas.find(m => m.id === maquina.maquina_id);
        const horasUtilizadas = Number(maquina.horas_utilizadas);
        const custoTotal = maquinaEncontrada ? horasUtilizadas * maquinaEncontrada.custo_hora : 0;
        
        return {
          maquina_id: maquina.maquina_id,
          horas_utilizadas: horasUtilizadas,
          custo_total: custoTotal,
        };
      });
      
      const funcoesParaEnviar = primeiroItem.funcoes.map(funcao => {
        const funcaoEncontrada = funcoes.find(f => f.id === funcao.funcao_id);
        const horasTrabalhadas = Number(funcao.horas_trabalhadas);
        const custoTotal = funcaoEncontrada ? horasTrabalhadas * funcaoEncontrada.custo_hora : 0;
        
        return {
          funcao_id: funcao.funcao_id,
          horas_trabalhadas: horasTrabalhadas,
          custo_total: custoTotal,
        };
      });

      // Calcular horas de produção
      const horasMaquinas = primeiroItem.maquinas.reduce((total, maquina) => {
        return total + (Number(maquina.horas_utilizadas) || 0);
      }, 0);
      
      const horasFuncoes = primeiroItem.funcoes.reduce((total, funcao) => {
        return total + (Number(funcao.horas_trabalhadas) || 0);
      }, 0);
      
      const horasProducao = horasMaquinas + horasFuncoes;

      const dadosParaEnviar = {
        nome: primeiroItem.nome_servico, // Campo obrigatório
        categoria: 'Produto', // Campo obrigatório
        nome_servico: primeiroItem.nome_servico,
        descricao_produto: primeiroItem.descricao || '',
        horas_producao: Math.max(horasProducao || 0, 0.1), // Mínimo 0.1h, garantir que seja número
        // Dimensões do produto
        largura_produto: primeiroItem.largura_produto ? parseFloat(primeiroItem.largura_produto) : undefined,
        altura_produto: primeiroItem.altura_produto ? parseFloat(primeiroItem.altura_produto) : undefined,
        area_produto: primeiroItem.area_produto ? parseFloat(primeiroItem.area_produto) : undefined,
        unidade_medida_produto: primeiroItem.unidade_medida_produto || '',
        // Itens mapeados
        itens: itensParaEnviar,
        maquinas: maquinasParaEnviar,
        funcoes: funcoesParaEnviar,
      };

      const url = mode === 'novo' 
        ? buildApiUrl('/produtos')
        : buildApiUrl(`/produtos/${produtoId}`);
      
      const method = mode === 'novo' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      if (response.ok) {
        toast.success(mode === 'novo' ? 'Produto criado com sucesso!' : 'Produto atualizado com sucesso!');
        // Sempre redirecionar para a lista de produtos
        router.push('/produtos');
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

  const getTitle = () => {
    switch (mode) {
      case 'novo':
        return 'Novo Produto Template';
      case 'editar':
        return 'Editar Produto Template';
      default:
        return 'Produto Template';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'novo':
        return 'Crie um novo template de produto para uso rápido em orçamentos';
      case 'editar':
        return 'Edite as informações do produto template';
      default:
        return '';
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
            <h1 className="text-2xl font-bold">{getTitle()}</h1>
            <p className="text-muted-foreground">{getDescription()}</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Seção de Produto */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nome e Descrição */}
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
                          <Input 
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
                                
                                // Calcular área automaticamente
                                const largura = parseFloat(value.replace(',', '.'));
                                const altura = parseFloat((form.getValues('itens_produto.0.altura_produto') || '').replace(',', '.'));
                                const unidade = form.getValues('itens_produto.0.unidade_medida_produto') || '';
                                
                                if (!isNaN(largura) && !isNaN(altura) && largura > 0 && altura > 0) {
                                  let area = largura * altura;
                                  
                                  // Converter para m² baseado na unidade
                                  if (unidade === 'cm') {
                                    area = area / 10000; // cm² para m²
                                  } else if (unidade === 'mm') {
                                    area = area / 1000000; // mm² para m²
                                  } else if (unidade === 'pol') {
                                    area = area * 0.00064516; // polegadas² para m²
                                  }
                                  // Se for metros, já está em m²
                                  
                                  form.setValue('itens_produto.0.area_produto', area.toFixed(2));
                                }
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
                                
                                // Calcular área automaticamente
                                const altura = parseFloat(value.replace(',', '.'));
                                const largura = parseFloat((form.getValues('itens_produto.0.largura_produto') || '').replace(',', '.'));
                                const unidade = form.getValues('itens_produto.0.unidade_medida_produto') || '';
                                
                                if (!isNaN(largura) && !isNaN(altura) && largura > 0 && altura > 0) {
                                  let area = largura * altura;
                                  
                                  // Converter para m² baseado na unidade
                                  if (unidade === 'cm') {
                                    area = area / 10000; // cm² para m²
                                  } else if (unidade === 'mm') {
                                    area = area / 1000000; // mm² para m²
                                  } else if (unidade === 'pol') {
                                    area = area * 0.00064516; // polegadas² para m²
                                  }
                                  // Se for metros, já está em m²
                                  
                                  form.setValue('itens_produto.0.area_produto', area.toFixed(2));
                                }
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
                            <select 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                
                                // Recalcular área quando a unidade mudar
                                const largura = parseFloat((form.getValues('itens_produto.0.largura_produto') || '').replace(',', '.'));
                                const altura = parseFloat((form.getValues('itens_produto.0.altura_produto') || '').replace(',', '.'));
                                const unidade = e.target.value;
                                
                                if (!isNaN(largura) && !isNaN(altura) && largura > 0 && altura > 0) {
                                  let area = largura * altura;
                                  
                                  // Converter para m² baseado na unidade
                                  if (unidade === 'cm') {
                                    area = area / 10000; // cm² para m²
                                  } else if (unidade === 'mm') {
                                    area = area / 1000000; // mm² para m²
                                  } else if (unidade === 'pol') {
                                    area = area * 0.00064516; // polegadas² para m²
                                  }
                                  // Se for metros, já está em m²
                                  
                                  form.setValue('itens_produto.0.area_produto', area.toFixed(2));
                                }
                              }}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Selecione</option>
                              <option value="cm">Centímetros (cm)</option>
                              <option value="m">Metros (m)</option>
                              <option value="mm">Milímetros (mm)</option>
                              <option value="pol">Polegadas (pol)</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="itens_produto.0.area_produto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Área (m²)</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="0.00"
                              {...field}
                              readOnly
                              className="bg-gray-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Toolbar de atualização das listas */}
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fetchMaquinas()} disabled={loadingData?.maquinas}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Atualizar Máquinas
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => fetchFuncoes()} disabled={loadingData?.funcoes}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Atualizar Funções
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => refetchAll()} disabled={loadingData?.maquinas || loadingData?.funcoes || loadingData?.insumos}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Atualizar Todas
                  </Button>
                </div>

                {/* Seções Compartilhadas dentro do card */}
                <MaterialSection
                  variant="produto"
                  itemIndex={0}
                  insumos={insumos}
                />

                <MaquinaSection
                  variant="produto"
                  itemIndex={0}
                  maquinas={maquinas}
                />

                <FuncaoSection
                  variant="produto"
                  itemIndex={0}
                  funcoes={funcoes}
                />
              </CardContent>
            </Card>

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
                <span>
                  {loading ? 'Salvando...' : (mode === 'novo' ? 'Criar Produto' : 'Atualizar Produto')}
                </span>
              </Button>
            </div>
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
                  <CalculoPreview
                    variant="produto"
                    itemIndex={0}
                    insumos={insumos}
                    maquinas={maquinas}
                    funcoes={funcoes}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
} 