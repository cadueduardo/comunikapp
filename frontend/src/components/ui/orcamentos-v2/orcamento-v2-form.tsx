'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { orcamentosApi } from '@/lib/api-client';
import { createFormSchema, FormValues } from '../orcamento/schemas/orcamento.schema';
import { useOrcamentoData } from '../orcamento/hooks/useOrcamentoData';
import { ClienteSection, ProdutoSection, ConfiguracoesSection } from '../orcamento/components';

import { ProdutoSelectionModal } from '../../../app/(main)/produtos/components/produto-selection-modal';



interface OrcamentoFormProps {
  mode: 'novo' | 'editar' | 'template';
  initialData?: Record<string, unknown>;
  orcamentoId?: string;
  onSuccess?: () => void;
  orcamentoStatus?: string;
}

export function OrcamentoV2Form({ 
  mode, 
  initialData, 
  orcamentoId, 
  orcamentoStatus 
}: OrcamentoFormProps) {
  const router = useRouter();
  const [loading] = useState(false);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [selectedProdutoIndex, setSelectedProdutoIndex] = useState<number>(0);
  const { clientes, insumos, maquinas, funcoes, servicos } = useOrcamentoData();

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(mode)),
    defaultValues: {
      cliente_id: '',
      margem_lucro_customizada: '30',
      impostos_customizados: '25',
      condicoes_comerciais: '',
      prazo_entrega: '10 a 15 dias úteis',
      forma_pagamento: '50% entrada, restante na entrega',
      validade_proposta: '30 dias',
      atendente: 'Equipe Comercial',
      comissao_percentual: '5',
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
          servicos: [{ servico_id: '', horas_trabalhadas: '1' }],
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
        itens_produto: (initialData.itens_produto as any[]) || [
          {
            nome_servico: String(initialData.nome_servico || ''),
            descricao: String(initialData.descricao || ''),
            quantidade_produto: '1',
            largura_produto: '',
            altura_produto: '',
            unidade_medida_produto: '',
            area_produto: '',
            materiais: [],
            maquinas: [],
            funcoes: [],
          }
        ],
      };
      
      console.log('🔍 Debug - OrcamentoForm - Dados formatados para o form:', dadosFormatados);
      form.reset(dadosFormatados);
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

    const dadosTransformados = {
      nome_servico: primeiroProduto.nome_servico || 'Orçamento',
      descricao: primeiroProduto.descricao || '',
      horas_producao: 1, // Valor padrão
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
      comissao_percentual: data.comissao_percentual ? Number(data.comissao_percentual.replace(',', '.')) : undefined,
      largura_produto: primeiroProduto.largura_produto ? Number(primeiroProduto.largura_produto.replace(',', '.')) : undefined,
      altura_produto: primeiroProduto.altura_produto ? Number(primeiroProduto.altura_produto.replace(',', '.')) : undefined,
      area_produto: primeiroProduto.area_produto ? Number(primeiroProduto.area_produto.replace(',', '.')) : undefined,
      unidade_medida_produto: primeiroProduto.unidade_medida_produto,
      quantidade_produto: primeiroProduto.quantidade_produto ? Number(primeiroProduto.quantidade_produto.replace(',', '.')) : 1
    };

    // Log detalhado para debug
    console.log('🔍 Debug - Dados originais do form:', data.itens_produto);
    console.log('🔍 Debug - Dados transformados:', dadosTransformados);
    console.log('🔍 Debug - Itens transformados:', dadosTransformados.itens);
    console.log('🔍 Debug - Quantidades:', dadosTransformados.itens.map(item => item.quantidade));

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
      
      console.log('🔍 Dados transformados para backend (enviar):', dadosTransformados);
      
      // Se for edição, usar enviar; se for criação, usar create
      if (mode === 'editar' && orcamentoId) {
        await orcamentosApi.enviar(orcamentoId, token);
        toast.success('Orçamento enviado com sucesso!');
      } else {
        // Para novo orçamento, criar e enviar
        const orcamentoCriado = await orcamentosApi.create(dadosTransformados, token);
        if (orcamentoCriado && orcamentoCriado.id) {
          await orcamentosApi.enviar(orcamentoCriado.id, token);
          toast.success('Orçamento criado e enviado com sucesso!');
        } else {
          toast.success('Orçamento criado com sucesso!');
        }
      }
      
      router.push('/orcamentos');
    } catch (error) {
      console.error('Erro ao enviar orçamento:', error);
      
      // Mostrar mensagem de erro mais específica
      if (error instanceof Error) {
        toast.error(`Erro ao enviar orçamento: ${error.message}`);
      } else {
        toast.error('Erro ao enviar orçamento');
      }
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
        return 'Novo Orçamento V2';
      case 'editar':
        return 'Editar Orçamento V2';
      case 'template':
        return 'Novo Produto Template V2';
      default:
        return 'Orçamento V2';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'novo':
        return 'Crie um novo orçamento para o cliente usando o sistema V2';
      case 'editar':
        return 'Edite as informações do orçamento V2';
      case 'template':
        return 'Crie um novo template de produto V2';
      default:
        return '';
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
          {/* Formulário */}
          <div className="w-full bg-white rounded-lg shadow-sm border p-6 space-y-6">
            
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
              servicos={servicos as any}
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

          
        </form>
      </Form>

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
