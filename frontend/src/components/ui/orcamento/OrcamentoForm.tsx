'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { createFormSchema, FormValues } from './schemas/orcamento.schema';
import { useOrcamentoData } from './hooks/useOrcamentoData';
import { ClienteSection, ProdutoSection, ConfiguracoesSection } from './components';
import { CalculoPreview } from '../shared/sections';
import { ProdutoSelectionModal } from '../../../app/(main)/produtos/components/produto-selection-modal';

// Componente para resumo geral do orçamento
function OrcamentoResumo({ 
  form, 
  insumos, 
  maquinas, 
  funcoes, 
  margemLucroCustomizada, 
  impostosCustomizados 
}: {
  form: any;
  insumos: any[];
  maquinas: any[];
  funcoes: any[];
  margemLucroCustomizada?: string;
  impostosCustomizados?: string;
}) {
  const todosProdutos = form.watch('itens_produto') || [];
  
  if (todosProdutos.length <= 1) {
    return null; // Não mostrar se há apenas 1 produto
  }

  // Calcular totais
  let totalGeral = 0;
  const produtosDetalhados: Array<{
    index: number;
    nome: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
  }> = [];

  todosProdutos.forEach((produto: any, index: number) => {
    // Cálculo simplificado para cada produto
    const quantidade = Number(produto.quantidade_produto?.replace(',', '.')) || 1;
    const precoUnitario = 100; // Valor exemplo - seria calculado baseado nos materiais
    const precoTotal = precoUnitario * quantidade;
    
    totalGeral += precoTotal;
    produtosDetalhados.push({
      index,
      nome: produto.nome_servico || `Produto ${index + 1}`,
      quantidade,
      preco_unitario: precoUnitario,
      preco_total: precoTotal,
    });
  });

  return (
    <div className="space-y-4">
      {/* Resumo Geral */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold mb-2 text-blue-800">Resumo do Orçamento</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-blue-900">Total Geral:</span>
            <span className="text-xl font-bold text-green-600">R$ {totalGeral.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Produtos:</span>
            <span>{todosProdutos.length}</span>
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-gray-700">Produtos do Orçamento</h4>
        <div className="space-y-2">
          {produtosDetalhados.map((produto, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{produto.nome}</span>
                <span className="text-xs text-gray-600">Qtd: {produto.quantidade}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>Preço Unitário:</span>
                <span>R$ {produto.preco_unitario.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span>Total:</span>
                <span>R$ {produto.preco_total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [selectedProdutoIndex, setSelectedProdutoIndex] = useState<number>(0);
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

  // Debug: verificar se o status está sendo recebido
  useEffect(() => {
    if (mode === 'editar') {
      console.log('🔍 Debug - OrcamentoForm - Status recebido:', orcamentoStatus);
      console.log('🔍 Debug - OrcamentoForm - Mode:', mode);
      console.log('🔍 Debug - OrcamentoForm - InitialData:', initialData);
    }
  }, [mode, orcamentoStatus, initialData]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de acesso não encontrado');
        return;
      }

      // Pegar o primeiro item do produto para os dados básicos
      const primeiroItem = data.itens_produto[0];
      
      // Mapear itens do formulário
      const itensParaEnviar = primeiroItem.materiais.map(material => ({
        insumo_id: material.insumo_id,
        quantidade: Number(String(material.quantidade).replace(',', '.')),
      }));
      
      const maquinasParaEnviar = primeiroItem.maquinas.map(maquina => ({
        maquina_id: maquina.maquina_id,
        horas_utilizadas: Number(maquina.horas_utilizadas),
      }));
      
      const funcoesParaEnviar = primeiroItem.funcoes.map(funcao => ({
        funcao_id: funcao.funcao_id,
        horas_trabalhadas: Number(funcao.horas_trabalhadas),
      }));

      // Calcular horas de produção
      const horasMaquinas = primeiroItem.maquinas.reduce((total, maquina) => {
        return total + (Number(maquina.horas_utilizadas) || 0);
      }, 0);
      
      const horasFuncoes = primeiroItem.funcoes.reduce((total, funcao) => {
        return total + (Number(funcao.horas_trabalhadas) || 0);
      }, 0);
      
      const horasProducao = horasMaquinas + horasFuncoes;

      const dadosParaEnviar = {
        nome_servico: primeiroItem.nome_servico,
        descricao: primeiroItem.descricao || '',
        horas_producao: Math.max(horasProducao, 0.1), // Mínimo 0.1h
        cliente_id: data.cliente_id,
        condicoes_comerciais: data.condicoes_comerciais || '',
        margem_lucro_customizada: data.margem_lucro_customizada ? parseFloat(data.margem_lucro_customizada) : undefined,
        impostos_customizados: data.impostos_customizados ? parseFloat(data.impostos_customizados) : undefined,
        // Dimensões do produto (do primeiro item)
        largura_produto: primeiroItem.largura_produto ? parseFloat(primeiroItem.largura_produto) : undefined,
        altura_produto: primeiroItem.altura_produto ? parseFloat(primeiroItem.altura_produto) : undefined,
        area_produto: primeiroItem.area_produto ? parseFloat(primeiroItem.area_produto) : undefined,
        unidade_medida_produto: primeiroItem.unidade_medida_produto || '',
        quantidade_produto: primeiroItem.quantidade_produto ? Number(primeiroItem.quantidade_produto) : 1,
        // Itens mapeados
        itens: itensParaEnviar,
        maquinas: maquinasParaEnviar,
        funcoes: funcoesParaEnviar,
      };

      const url = mode === 'novo' 
        ? 'http://localhost:3001/orcamentos'
        : `http://localhost:3001/orcamentos/${orcamentoId}`;
      
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
    setSelectedProdutoIndex(itemIndex);
    setShowProdutoModal(true);
  };

  const handleProdutoSelected = (produto: {
    id: string;
    nome: string;
    nome_servico: string;
    descricao_produto?: string;
    largura_produto?: number;
    altura_produto?: number;
    area_produto?: number;
    unidade_medida_produto?: string;
    itens?: Array<{
      insumo: { id: string };
      quantidade: number;
    }>;
    maquinas?: Array<{
      maquina: { id: string };
      horas_utilizadas: number;
    }>;
    funcoes?: Array<{
      funcao: { id: string };
      horas_trabalhadas: number;
    }>;
  }) => {
    try {
      // Mapear dados do produto template para o formato do orçamento
      const produtoData = {
        nome_servico: produto.nome_servico || '',
        descricao: produto.descricao_produto || '',
        quantidade_produto: '1', // Quantidade padrão
        largura_produto: produto.largura_produto?.toString() || '',
        altura_produto: produto.altura_produto?.toString() || '',
        unidade_medida_produto: produto.unidade_medida_produto || '',
        area_produto: produto.area_produto?.toString() || '',
        materiais: produto.itens?.map((item) => ({
          insumo_id: item.insumo.id,
          quantidade: item.quantidade.toString()
        })) || [],
        maquinas: produto.maquinas?.map((maq) => ({
          maquina_id: maq.maquina.id,
          horas_utilizadas: maq.horas_utilizadas.toString()
        })) || [],
        funcoes: produto.funcoes?.map((func) => ({
          funcao_id: func.funcao.id,
          horas_trabalhadas: func.horas_trabalhadas.toString()
        })) || []
      };

      // Atualizar o item do produto no formulário
      const currentItems = form.getValues('itens_produto');
      const updatedItems = [...currentItems];
      updatedItems[selectedProdutoIndex] = produtoData;
      form.setValue('itens_produto', updatedItems);

      setShowProdutoModal(false);
      toast.success(`Produto "${produto.nome}" carregado com sucesso!`);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast.error('Erro ao carregar produto. Tente novamente.');
    }
  };

  const onSalvarRascunho = async (data: FormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de acesso não encontrado');
        return;
      }

      // Pegar o primeiro item do produto para os dados básicos
      const primeiroItem = data.itens_produto[0];
      
      // Validar dados mínimos para salvar rascunho
      if (!primeiroItem.nome_servico) {
        toast.error('Nome do serviço é obrigatório');
        return;
      }

      if (!primeiroItem.materiais || primeiroItem.materiais.length === 0) {
        toast.error('Adicione pelo menos um material');
        return;
      }
      
      // Mapear itens do formulário
      const itensParaEnviar = primeiroItem.materiais.map(material => ({
        insumo_id: material.insumo_id,
        quantidade: Number(String(material.quantidade).replace(',', '.')),
      }));
      
      const maquinasParaEnviar = primeiroItem.maquinas.map(maquina => ({
        maquina_id: maquina.maquina_id,
        horas_utilizadas: Number(maquina.horas_utilizadas),
      }));
      
      const funcoesParaEnviar = primeiroItem.funcoes.map(funcao => ({
        funcao_id: funcao.funcao_id,
        horas_trabalhadas: Number(funcao.horas_trabalhadas),
      }));

      // Calcular horas de produção
      const horasMaquinas = primeiroItem.maquinas.reduce((total, maquina) => {
        return total + (Number(maquina.horas_utilizadas) || 0);
      }, 0);
      
      const horasFuncoes = primeiroItem.funcoes.reduce((total, funcao) => {
        return total + (Number(funcao.horas_trabalhadas) || 0);
      }, 0);
      
      const horasProducao = horasMaquinas + horasFuncoes;

      const dadosParaEnviar = {
        nome_servico: primeiroItem.nome_servico,
        descricao: primeiroItem.descricao || '',
        horas_producao: Math.max(horasProducao, 0.1), // Mínimo 0.1h
        cliente_id: data.cliente_id || null, // Permitir null para rascunho
        condicoes_comerciais: data.condicoes_comerciais || '',
        // Configurações comerciais
        prazo_entrega: data.prazo_entrega || '',
        forma_pagamento: data.forma_pagamento || '',
        validade_proposta: data.validade_proposta || '',
        atendente: data.atendente || '',
        margem_lucro_customizada: data.margem_lucro_customizada ? parseFloat(data.margem_lucro_customizada) : undefined,
        impostos_customizados: data.impostos_customizados ? parseFloat(data.impostos_customizados) : undefined,
        // Dimensões do produto (do primeiro item)
        largura_produto: primeiroItem.largura_produto ? parseFloat(primeiroItem.largura_produto) : undefined,
        altura_produto: primeiroItem.altura_produto ? parseFloat(primeiroItem.altura_produto) : undefined,
        area_produto: primeiroItem.area_produto ? parseFloat(primeiroItem.area_produto) : undefined,
        unidade_medida_produto: primeiroItem.unidade_medida_produto || '',
        quantidade_produto: primeiroItem.quantidade_produto ? Number(primeiroItem.quantidade_produto) : 1,
        // Itens mapeados
        itens: itensParaEnviar,
        maquinas: maquinasParaEnviar,
        funcoes: funcoesParaEnviar,
      };

      const url = mode === 'editar' 
        ? `http://localhost:3001/orcamentos/${orcamentoId}`
        : 'http://localhost:3001/orcamentos/rascunho';
      
      const method = mode === 'editar' ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dadosParaEnviar),
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

      // Pegar o primeiro item do produto para os dados básicos
      const primeiroItem = data.itens_produto[0];
      
      // Mapear itens do formulário
      const itensParaEnviar = primeiroItem.materiais.map(material => ({
        insumo_id: material.insumo_id,
        quantidade: Number(String(material.quantidade).replace(',', '.')),
      }));
      
      const maquinasParaEnviar = primeiroItem.maquinas.map(maquina => ({
        maquina_id: maquina.maquina_id,
        horas_utilizadas: Number(maquina.horas_utilizadas),
      }));
      
      const funcoesParaEnviar = primeiroItem.funcoes.map(funcao => ({
        funcao_id: funcao.funcao_id,
        horas_trabalhadas: Number(funcao.horas_trabalhadas),
      }));

      // Calcular horas de produção
      const horasMaquinas = primeiroItem.maquinas.reduce((total, maquina) => {
        return total + (Number(maquina.horas_utilizadas) || 0);
      }, 0);
      
      const horasFuncoes = primeiroItem.funcoes.reduce((total, funcao) => {
        return total + (Number(funcao.horas_trabalhadas) || 0);
      }, 0);
      
      const horasProducao = horasMaquinas + horasFuncoes;

      const dadosParaEnviar = {
        nome_servico: primeiroItem.nome_servico,
        descricao: primeiroItem.descricao || '',
        horas_producao: Math.max(horasProducao, 0.1), // Mínimo 0.1h
        cliente_id: data.cliente_id,
        condicoes_comerciais: data.condicoes_comerciais || '',
        // Configurações comerciais
        prazo_entrega: data.prazo_entrega || '',
        forma_pagamento: data.forma_pagamento || '',
        validade_proposta: data.validade_proposta || '',
        atendente: data.atendente || '',
        margem_lucro_customizada: data.margem_lucro_customizada ? parseFloat(data.margem_lucro_customizada) : undefined,
        impostos_customizados: data.impostos_customizados ? parseFloat(data.impostos_customizados) : undefined,
        // Dimensões do produto (do primeiro item)
        largura_produto: primeiroItem.largura_produto ? parseFloat(primeiroItem.largura_produto) : undefined,
        altura_produto: primeiroItem.altura_produto ? parseFloat(primeiroItem.altura_produto) : undefined,
        area_produto: primeiroItem.area_produto ? parseFloat(primeiroItem.area_produto) : undefined,
        unidade_medida_produto: primeiroItem.unidade_medida_produto || '',
        quantidade_produto: primeiroItem.quantidade_produto ? Number(primeiroItem.quantidade_produto) : 1,
        // Itens mapeados
        itens: itensParaEnviar,
        maquinas: maquinasParaEnviar,
        funcoes: funcoesParaEnviar,
      };

      let orcamentoIdParaEnviar = orcamentoId;
      
      if (mode === 'novo') {
        // Salvar rascunho primeiro
        const rascunhoResponse = await fetch('http://localhost:3001/orcamentos/rascunho', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dadosParaEnviar),
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
          body: JSON.stringify(dadosParaEnviar),
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
    <div className="container mx-auto py-6">
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

      <div className="mt-6">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-6">
          {/* Formulário */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border p-6 space-y-6">
            
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
                   {(() => {
                     console.log('🔍 Debug - Status:', orcamentoStatus);
                     return orcamentoStatus === 'rascunho' ? (
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
                     );
                   })()}
                 </>
               )}
             </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-6 bg-white rounded-lg shadow-sm border p-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
              <div className="space-y-6">
                {/* Preview do Cálculo */}
                <CalculoPreview 
                itemIndex={0}
                insumos={insumos}
                maquinas={maquinas}
                funcoes={funcoes}
                margemLucroCustomizada={form.watch('margem_lucro_customizada')}
                impostosCustomizados={form.watch('impostos_customizados')}
              />
              
              {/* Resumo do Orçamento */}
              <OrcamentoResumo 
                form={form}
                insumos={insumos}
                maquinas={maquinas}
                funcoes={funcoes}
                margemLucroCustomizada={form.watch('margem_lucro_customizada')}
                impostosCustomizados={form.watch('impostos_customizados')}
              />
            </div>
          </div>
          </div>
        </form>
        </Form>
      </div>

      {showProdutoModal && (
        <ProdutoSelectionModal
          open={showProdutoModal}
          onClose={() => setShowProdutoModal(false)}
          onSelect={handleProdutoSelected}
        />
      )}
    </div>
  );
} 