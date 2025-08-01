'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Calculator } from 'lucide-react';
import { createFormSchema, FormValues } from './schemas/orcamento.schema';
import { useOrcamentoData } from './hooks/useOrcamentoData';
import { ClienteSection, ProdutoSection, ConfiguracoesSection } from './components';
import { CalculoPreview } from '../shared/sections';

interface OrcamentoFormProps {
  mode: 'novo' | 'editar' | 'template';
  initialData?: Record<string, unknown>;
  orcamentoId?: string;
  onSuccess?: () => void;
  orcamentoStatus?: string;
}

export function OrcamentoForm({ 
  mode, 
  initialData, 
  orcamentoId, 
  onSuccess,
  orcamentoStatus 
}: OrcamentoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { clientes, insumos, maquinas, funcoes } = useOrcamentoData();

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(mode)),
    defaultValues: {
      cliente_id: '',
      margem_lucro_customizada: '',
      impostos_customizados: '',
      condicoes_comerciais: '',
      itens_produto: [
        {
          nome_servico: '',
          descricao: '',
          quantidade_produto: '1',
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
      form.reset(initialData);
    }
  }, [mode, initialData, form]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de acesso não encontrado');
        return;
      }

      const url = mode === 'novo' 
        ? 'http://localhost:3001/orcamentos'
        : `http://localhost:3001/orcamentos/${orcamentoId}`;
      
      const method = mode === 'novo' ? 'POST' : 'PATCH';
      
      const orcamentoData = {
        ...data,
        status: orcamentoStatus || 'rascunho',
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orcamentoData),
      });

      if (response.ok) {
        toast.success(mode === 'novo' ? 'Orçamento criado com sucesso!' : 'Orçamento atualizado com sucesso!');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/orcamentos');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao salvar orçamento');
      }
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast.error('Erro ao salvar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCarregarProduto = (itemIndex: number) => {
    // Implementar lógica para carregar produto template
    toast.info(`Funcionalidade de carregar produto será implementada para o item ${itemIndex + 1}`);
  };

  const onSalvarRascunho = async (data: FormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de acesso não encontrado');
        return;
      }

      const url = mode === 'editar' 
        ? `http://localhost:3001/orcamentos/${orcamentoId}`
        : 'http://localhost:3001/orcamentos/rascunho';
      
      const method = mode === 'editar' ? 'PATCH' : 'POST';
      
      const orcamentoData = {
        ...data,
        status: 'rascunho',
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orcamentoData),
      });

      if (response.ok) {
        toast.success('Rascunho salvo com sucesso!');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/orcamentos');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao salvar rascunho');
      }
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      toast.error('Erro ao salvar rascunho');
    } finally {
      setLoading(false);
    }
  };

  const onEnviarOrcamento = async (data: FormValues) => {
    if (mode !== 'template' && !data.cliente_id) {
      toast.error('Selecione um cliente antes de enviar o orçamento');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de acesso não encontrado');
        return;
      }

      let orcamentoIdParaEnviar = orcamentoId;
      
      if (mode === 'novo') {
        // Salvar rascunho primeiro
        const rascunhoResponse = await fetch('http://localhost:3001/orcamentos/rascunho', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...data,
            status: 'rascunho',
          }),
        });

        if (!rascunhoResponse.ok) {
          throw new Error('Erro ao salvar rascunho');
        }

        const rascunhoResult = await rascunhoResponse.json();
        orcamentoIdParaEnviar = rascunhoResult.id;
      } else {
        // Se for edição, atualizar o orçamento existente
        const updateResponse = await fetch(`http://localhost:3001/orcamentos/${orcamentoId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...data,
            status: 'rascunho',
          }),
        });

        if (!updateResponse.ok) {
          throw new Error('Erro ao atualizar orçamento');
        }
      }

      // Agora enviar o orçamento
      const enviarResponse = await fetch(`http://localhost:3001/orcamentos/${orcamentoIdParaEnviar}/enviar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!enviarResponse.ok) {
        throw new Error('Erro ao enviar orçamento');
      }

      toast.success('Orçamento enviado com sucesso! O cliente receberá um email com o link de aprovação.');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/orcamentos');
      }
    } catch (error) {
      console.error('Erro ao enviar orçamento:', error);
      toast.error('Erro ao enviar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'novo':
        return 'Novo Orçamento';
      case 'editar':
        return 'Editar Orçamento';
      case 'template':
        return 'Novo Produto Template';
      default:
        return 'Orçamento';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'novo':
        return 'Crie um novo orçamento para o cliente';
      case 'editar':
        return 'Edite as informações do orçamento';
      case 'template':
        return 'Crie um novo template de produto';
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
            
            {/* Seção de Cliente */}
            <ClienteSection 
              clientes={clientes} 
              mode={mode} 
            />

            <Separator />

                          {/* Seção de Produtos */}
              <ProdutoSection 
                mode={mode}
                onCarregarProduto={handleCarregarProduto}
                insumos={insumos}
                maquinas={maquinas}
                funcoes={funcoes}
              />

              <Separator />

            {/* Configurações Comerciais */}
            <ConfiguracoesSection mode={mode} />

                         {/* Botões de Ação */}
             <div className="flex justify-end space-x-4">
               <Button
                 type="button"
                 variant="outline"
                 onClick={() => router.back()}
               >
                 Cancelar
               </Button>
               
               {mode === 'template' && (
                 <Button
                   type="submit"
                   disabled={loading}
                   className="flex items-center space-x-2"
                 >
                   <Save className="w-4 h-4" />
                   <span>
                     {loading ? 'Salvando...' : 'Criar Produto Template'}
                   </span>
                 </Button>
               )}
               
               {mode === 'novo' && (
                 <>
                   <Button
                     type="button"
                     variant="outline"
                     onClick={() => form.handleSubmit(onSalvarRascunho)()}
                     disabled={loading}
                     className="flex items-center space-x-2"
                   >
                     <Save className="w-4 h-4" />
                     <span>{loading ? 'Salvando...' : 'Salvar Rascunho'}</span>
                   </Button>
                   <Button
                     type="button"
                     onClick={() => form.handleSubmit(onEnviarOrcamento)()}
                     disabled={loading}
                     className="flex items-center space-x-2"
                   >
                     <Save className="w-4 h-4" />
                     <span>{loading ? 'Enviando...' : 'Enviar Orçamento'}</span>
                   </Button>
                 </>
               )}
               
               {mode === 'editar' && (
                 <>
                   {orcamentoStatus === 'rascunho' ? (
                     <>
                       <Button
                         type="button"
                         variant="outline"
                         onClick={() => form.handleSubmit(onSalvarRascunho)()}
                         disabled={loading}
                         className="flex items-center space-x-2"
                       >
                         <Save className="w-4 h-4" />
                         <span>{loading ? 'Salvando...' : 'Salvar como Rascunho'}</span>
                       </Button>
                       <Button
                         type="button"
                         onClick={() => form.handleSubmit(onEnviarOrcamento)()}
                         disabled={loading}
                         className="flex items-center space-x-2"
                       >
                         <Save className="w-4 h-4" />
                         <span>{loading ? 'Enviando...' : 'Enviar para Cliente'}</span>
                       </Button>
                     </>
                   ) : (
                     <Button
                       type="submit"
                       disabled={loading}
                       className="flex items-center space-x-2"
                     >
                       <Save className="w-4 h-4" />
                       <span>{loading ? 'Atualizando...' : 'Atualizar Orçamento'}</span>
                     </Button>
                   )}
                 </>
               )}
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
                    variant="orcamento"
                    itemIndex={0}
                    insumos={insumos}
                    maquinas={maquinas}
                    funcoes={funcoes}
                    margemLucroCustomizada={form.watch('margem_lucro_customizada')}
                    impostosCustomizados={form.watch('impostos_customizados')}
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