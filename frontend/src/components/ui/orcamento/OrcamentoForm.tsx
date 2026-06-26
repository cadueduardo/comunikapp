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
import { orcamentosApi } from '@/lib/api-client';
import { createFormSchema, FormValues } from './schemas/orcamento.schema';
import { useOrcamentoData } from './hooks/useOrcamentoData';
import { ClienteSection, ProdutoSection, ConfiguracoesSection, ModeloOrcamentoSection } from './components';
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
  const [dadosCarregados, setDadosCarregados] = useState(false);
  const { clientes, insumos, maquinas, funcoes, servicos, fetchInsumos } = useOrcamentoData();

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(mode)),
    // IMPORTANTE: Sem defaultValues vazios para evitar sobrescrever dados reais
    defaultValues: {
      cliente_id: '',
      margem_lucro_customizada: '30',
      impostos_customizados: '25',
      condicoes_comerciais: '',
      prazo_entrega: '10 a 15 dias úteis',
      forma_pagamento: '50% entrada, restante na entrega',
      validade_proposta: '30 dias',
      atendente: 'Equipe Comercial',
      itens_produto: [
        {
          nome_servico: '',
          descricao: '',
          quantidade_produto: '1',
          largura_produto: '',
          altura_produto: '',
          profundidade_produto: '',
          tem_profundidade: false,
          unidade_medida_produto: '',
          area_produto: '',
          materiais: [],
          maquinas: [],
          funcoes: [],
          servicos: [],
        }
      ],
    },
  });

  // Carregar dados iniciais se for edição
  useEffect(() => {
    if (mode === 'editar' && initialData) {
      console.log('🔍 Debug - OrcamentoForm - Dados recebidos para reset:', initialData);
      console.log('🔍 Debug - OrcamentoForm - Cliente ID recebido:', initialData.cliente_id);
      console.log('🔍 Debug - OrcamentoForm - Estrutura completa dos dados:', JSON.stringify(initialData, null, 2));
      
      // Verificar se os dados estão no formato esperado pelo formulário
      const dadosFormatados = {
        cliente_id: String(initialData.cliente_id || ''),
        margem_lucro_customizada: String(initialData.margem_lucro_customizada || '30'),
        impostos_customizados: String(initialData.impostos_customizados || '25'),
        condicoes_comerciais: String(initialData.condicoes_comerciais || ''),
        prazo_entrega: String(initialData.prazo_entrega || '10 a 15 dias úteis'),
        forma_pagamento: String(initialData.forma_pagamento || '50% entrada, restante na entrega'),
        validade_proposta: String(initialData.validade_proposta || '30 dias'),
        atendente: String(initialData.atendente || 'Equipe Comercial'),
        itens_produto: [
          (() => {
            // Fase 11: profundidade vem do initialData (se a OS/orcamento ja tem 3D).
            // Source-of-truth unica: tem_profundidade e derivado do valor (> 0 = true).
            const profundidadeRaw = (initialData as any).profundidade_produto?.toString() || '';
            const profundidadeNum = Number(String(profundidadeRaw).replace(',', '.'));
            const temProfundidade = !!profundidadeRaw && !isNaN(profundidadeNum) && profundidadeNum > 0;
            return {
              nome_servico: String(initialData.nome_servico || ''),
              descricao: String(initialData.descricao || ''),
              quantidade_produto: String(initialData.quantidade_produto || '1'),
              largura_produto: String(initialData.largura_produto || ''),
              altura_produto: String(initialData.altura_produto || ''),
              profundidade_produto: profundidadeRaw,
              tem_profundidade: temProfundidade,
              unidade_medida_produto: String(initialData.unidade_medida_produto || ''),
              area_produto: String(initialData.area_produto || ''),
              materiais: [],
              maquinas: [],
              funcoes: [],
            };
          })(),
        ],
      };
      
      console.log('🔍 Debug - OrcamentoForm - Dados formatados para o form:', dadosFormatados);
      form.reset(dadosFormatados);
      
      // Aguardar um momento para garantir que os dados foram aplicados
      setTimeout(() => {
        setDadosCarregados(true);
        console.log('🔍 Debug - OrcamentoForm - Dados marcados como carregados');
      }, 500); // Aumentado para 500ms para garantir sincronização
    } else if (mode === 'novo') {
      setDadosCarregados(true);
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

  // Função auxiliar para transformar dados do frontend para o formato do backend
  const transformarDadosParaBackend = (data: FormValues) => {
    // Validar se há dados válidos
    if (!data.itens_produto || data.itens_produto.length === 0) {
      throw new Error('Nenhum produto foi adicionado ao orçamento');
    }

    // Verificar se o primeiro produto tem materiais
    const primeiroProduto = data.itens_produto[0];
    if (!primeiroProduto.materiais || primeiroProduto.materiais.length === 0) {
      throw new Error('O primeiro produto deve ter pelo menos um material');
    }

    // Calcular horas de produção por unidade (soma das horas de máquinas e funções do primeiro produto)
    const horasMaquinasPorUnidade = (primeiroProduto.maquinas || []).reduce((total, m) => {
      const h = Number(String(m.horas_utilizadas || '0').replace(',', '.')) || 0;
      return total + h;
    }, 0);
    const horasFuncoesPorUnidade = (primeiroProduto.funcoes || []).reduce((total, f) => {
      const h = Number(String(f.horas_trabalhadas || '0').replace(',', '.')) || 0;
      return total + h;
    }, 0);
    const horasProducaoPorUnidade = horasMaquinasPorUnidade + horasFuncoesPorUnidade;

    const dadosTransformados = {
      nome_servico: primeiroProduto.nome_servico || 'Orçamento',
      descricao: primeiroProduto.descricao || '',
      // IMPORTANTE: horas_producao por unidade (backend multiplica pela quantidade depois)
      horas_producao: horasProducaoPorUnidade || 0,
      itens: data.itens_produto.flatMap(produto => 
        produto.materiais?.map(material => ({
          insumo_id: material.insumo_id,
          quantidade: Number(material.quantidade.replace(',', '.'))
        })) || []
      ),
      maquinas: data.itens_produto.flatMap(produto => 
        produto.maquinas?.map(maquina => ({
          maquina_id: maquina.maquina_id,
          horas_utilizadas: Number(maquina.horas_utilizadas.replace(',', '.'))
        })) || []
      ),
      funcoes: data.itens_produto.flatMap(produto => 
        produto.funcoes?.map(funcao => ({
          funcao_id: funcao.funcao_id,
          horas_trabalhadas: Number(funcao.horas_trabalhadas.replace(',', '.'))
        })) || []
      ),
      cliente_id: data.cliente_id,
      condicoes_comerciais: data.condicoes_comerciais,
      prazo_entrega: data.prazo_entrega,
      forma_pagamento: data.forma_pagamento,
      validade_proposta: data.validade_proposta,
      atendente: data.atendente,
      margem_lucro_customizada: data.margem_lucro_customizada ? Number(data.margem_lucro_customizada.replace(',', '.')) : undefined,
      impostos_customizados: data.impostos_customizados ? Number(data.impostos_customizados.replace(',', '.')) : undefined,
      // Enviar dados de múltiplos produtos
      itens_produto: data.itens_produto.map((produto, index) => {
        // Fase 11: profundidade so vai no payload quando ha valor numerico > 0.
        // Source-of-truth unica (guardrail 3): o VALOR DIGITADO e a fonte da verdade,
        // nao a flag tem_profundidade. Isso evita perder dados em race conditions
        // do react-hook-form. Quando profundidade_produto e vazio/0, envia null (2D).
        const profundidadeRaw = (produto as any)?.profundidade_produto;
        const profundidadeNum =
          profundidadeRaw ? Number(String(profundidadeRaw).replace(',', '.')) : NaN;
        const profundidade =
          !isNaN(profundidadeNum) && profundidadeNum > 0 ? profundidadeNum : null;
        return {
          nome_servico: produto.nome_servico || `Produto ${index + 1}`,
          descricao: produto.descricao || '',
          quantidade: produto.quantidade_produto ? Number(produto.quantidade_produto.replace(',', '.')) : 1,
          largura: produto.largura_produto ? Number(produto.largura_produto.replace(',', '.')) : undefined,
          altura: produto.altura_produto ? Number(produto.altura_produto.replace(',', '.')) : undefined,
          profundidade,
          area_produto: produto.area_produto ? Number(produto.area_produto.replace(',', '.')) : undefined,
          unidade_medida: produto.unidade_medida_produto || '',
          ordem: index,
          materiais: produto.materiais || [],
          maquinas: produto.maquinas || [],
          funcoes: produto.funcoes || []
        };
      }),
      // Manter compatibilidade com campos do primeiro produto para o nível raiz
      largura_produto: primeiroProduto.largura_produto ? Number(primeiroProduto.largura_produto.replace(',', '.')) : undefined,
      altura_produto: primeiroProduto.altura_produto ? Number(primeiroProduto.altura_produto.replace(',', '.')) : undefined,
      area_produto: primeiroProduto.area_produto ? Number(primeiroProduto.area_produto.replace(',', '.')) : undefined,
      unidade_medida_produto: primeiroProduto.unidade_medida_produto,
      quantidade_produto: primeiroProduto.quantidade_produto ? Number(primeiroProduto.quantidade_produto.replace(',', '.')) : 1
    };

    // Log detalhado para debug
    console.log('🔍 Debug - Dados originais do form:', data.itens_produto);
    console.log('🔍 Debug - Dados transformados:', dadosTransformados);
    console.log('🔍 Debug - Itens_produto enviados:', dadosTransformados.itens_produto);
    console.log('🔍 Debug - Medidas dos produtos:', dadosTransformados.itens_produto.map(p => ({
      nome: p.nome_servico,
      largura: p.largura,
      altura: p.altura,
      area: p.area_produto
    })));

    return dadosTransformados;
  };

  const handleSubmit = async (data: FormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      // Validar dados antes de transformar
      if (!data.itens_produto || data.itens_produto.length === 0) {
        toast.error('Adicione pelo menos um produto ao orçamento');
        return;
      }

      const primeiroProduto = data.itens_produto[0];
      if (!primeiroProduto.materiais || primeiroProduto.materiais.length === 0) {
        toast.error('O primeiro produto deve ter pelo menos um material');
        return;
      }

      const dadosTransformados = transformarDadosParaBackend(data);
      console.log('🔍 Dados transformados para backend:', dadosTransformados);

      if (mode === 'editar' && orcamentoId) {
        await orcamentosApi.update(orcamentoId, dadosTransformados, token);
        toast.success('Orçamento atualizado com sucesso!');
      } else {
        await orcamentosApi.create(dadosTransformados, token);
        toast.success('Orçamento criado com sucesso!');
      }

      router.push('/orcamentos');
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      
      // Mostrar mensagem de erro mais específica
      if (error instanceof Error) {
        toast.error(`Erro ao salvar orçamento: ${error.message}`);
      } else {
        toast.error('Erro ao salvar orçamento');
      }
    }
  };

  const handleSalvarRascunho = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const formData = form.getValues();
      
      // Validar dados antes de transformar
      if (!formData.itens_produto || formData.itens_produto.length === 0) {
        toast.error('Adicione pelo menos um produto ao orçamento');
        return;
      }

      const primeiroProduto = formData.itens_produto[0];
      if (!primeiroProduto.materiais || primeiroProduto.materiais.length === 0) {
        toast.error('O primeiro produto deve ter pelo menos um material');
        return;
      }

      const dadosTransformados = transformarDadosParaBackend(formData);
      
      console.log('🔍 Dados transformados para backend (rascunho):', dadosTransformados);
      
      // Se for edição, usar update; se for criação, usar salvarRascunho
      if (mode === 'editar' && orcamentoId) {
        console.log('🔍 Debug - Editando rascunho existente com ID:', orcamentoId);
        await orcamentosApi.update(orcamentoId, dadosTransformados, token);
        toast.success('Rascunho atualizado com sucesso!');
      } else {
        console.log('🔍 Debug - Criando novo rascunho');
        await orcamentosApi.salvarRascunho(dadosTransformados, token);
        toast.success('Rascunho salvo com sucesso!');
      }
      
      // Redirecionar para o grid de orçamentos após salvar rascunho
      router.push('/orcamentos');
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      
      // Mostrar mensagem de erro mais específica
      if (error instanceof Error) {
        toast.error(`Erro ao salvar rascunho: ${error.message}`);
      } else {
        toast.error('Erro ao salvar rascunho');
      }
    }
  };

  const handleEnviar = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      if (!orcamentoId) {
        toast.error('ID do orçamento não encontrado');
        return;
      }

      await orcamentosApi.enviar(orcamentoId, token);
      toast.success('Orçamento enviado com sucesso!');
      router.push('/orcamentos');
    } catch (error) {
      console.error('Erro ao enviar orçamento:', error);
      toast.error('Erro ao enviar orçamento');
    }
  };

  const handleCarregarModelo = () => {
    setSelectedProdutoIndex(0);
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
      // Mapear dados do produto template para o formato do orçamento.
      // Fase 11: profundidade do template e propagada quando preenchida (template 3D).
      const profundidadeTemplateRaw = (produto as any)?.profundidade_produto?.toString() || '';
      const profundidadeTemplateNum = Number(String(profundidadeTemplateRaw).replace(',', '.'));
      const temProfundidadeTemplate =
        !!profundidadeTemplateRaw && !isNaN(profundidadeTemplateNum) && profundidadeTemplateNum > 0;
      const produtoData = {
        nome_servico: produto.nome_servico || '',
        descricao: produto.descricao_produto || '',
        quantidade_produto: '1', // Quantidade padrão
        largura_produto: produto.largura_produto?.toString() || '',
        altura_produto: produto.altura_produto?.toString() || '',
        profundidade_produto: profundidadeTemplateRaw,
        tem_profundidade: temProfundidadeTemplate,
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
        })) || [],
        servicos: [] // Produtos template não têm serviços por enquanto
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col lg:flex-row gap-6">
          {/* Formulário */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border p-6 space-y-6">
            
            {/* Seção de Cliente */}
            <ClienteSection 
              clientes={clientes} 
              mode={mode} 
            />

            <Separator />

            <ModeloOrcamentoSection modo={mode} onCarregarModelo={handleCarregarModelo} />

            <Separator />

                          {/* Seção de Produtos */}
              <ProdutoSection 
                mode={mode}
                insumos={insumos}
                maquinas={maquinas}
                funcoes={funcoes}
                servicos={servicos as any}
                onInsumoCriado={fetchInsumos}
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
                     onClick={() => handleSalvarRascunho()}
                     disabled={loading}
                     className="flex items-center space-x-2"
                   >
                     <Save className="w-4 h-4" />
                     <span>{loading ? 'Salvando...' : 'Salvar Rascunho'}</span>
                   </Button>
                   <Button
                     type="button"
                     onClick={() => handleEnviar()}
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
                           onClick={() => handleSalvarRascunho()}
                           disabled={loading}
                           className="flex items-center space-x-2"
                         >
                           <Save className="w-4 h-4" />
                           <span>{loading ? 'Salvando...' : 'Salvar como Rascunho'}</span>
                         </Button>
                         <Button
                           type="button"
                           onClick={() => handleEnviar()}
                           disabled={loading}
                           className="flex items-center space-x-2"
                         >
                           <Save className="w-4 h-4" />
                           <span>{loading ? 'Enviar para Cliente' : 'Enviar para Cliente'}</span>
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
                  variant="orcamento"
                  itemIndex={0}
                  insumos={insumos}
                  maquinas={maquinas}
                  funcoes={funcoes}
                  margemLucroCustomizada={form.watch('margem_lucro_customizada')}
                  impostosCustomizados={form.watch('impostos_customizados')}
                  dadosCarregados={dadosCarregados}
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