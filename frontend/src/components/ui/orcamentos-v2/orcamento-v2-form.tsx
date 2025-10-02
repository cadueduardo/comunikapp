'use client';

import { useState, useEffect, useRef } from 'react';
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
import { useCalculoWebSocket } from '@/hooks/use-calculo-websocket';
import { calcularProdutosPreview } from '../shared/utils/preview-calculo.helpers';

// Função para calcular custo por unidade de uso
const calcularCustoPorUnidadeUso = (insumo: any): number => {
  if (!insumo) return 0;
  
  const custoUnitario = insumo.custo_unitario || 0;
  const fatorConversao = insumo.fator_conversao || 1;
  
  return custoUnitario / fatorConversao;
};
import { ClienteSection, ProdutoSection, ConfiguracoesSection, TituloOrcamentoSection } from '../orcamento/components';
import { PreviewCalculoV2 } from '../shared/sections';

import { ProdutoSelectionModal } from '../../../app/(main)/produtos/components/produto-selection-modal';
import { ChatFlutuante } from '@/components/ui/chat-flutuante';



interface OrcamentoFormProps {
  mode: 'novo' | 'editar' | 'template';
  initialData?: Record<string, unknown>;
  orcamentoId?: string;
  showPreview?: boolean;
  onSuccess?: () => void;
  orcamentoStatus?: string;
}

export function OrcamentoV2Form({ 
  mode, 
  initialData, 
  orcamentoId, 
  showPreview = false,
  orcamentoStatus 
}: OrcamentoFormProps) {
  // Forçar hot reload - versão atualizada
  const router = useRouter();
  const [loading] = useState(false);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [selectedProdutoIndex, setSelectedProdutoIndex] = useState<number>(0);
  const { clientes, insumos, maquinas, funcoes, servicos } = useOrcamentoData();
  
  // Hook para WebSocket - capturar dados calculados do preview
  const { resultadoOrcamento, isConnected } = useCalculoWebSocket();
  
  // Estado para armazenar dados calculados localmente
  const [dadosCalculadosLocais, setDadosCalculadosLocais] = useState<any>(null);
  
  // Função para calcular dados localmente quando WebSocket não estiver disponível
  const calcularDadosLocalmente = (formData: FormValues) => {
    try {
      const itensFormulario = Array.isArray(formData?.itens_produto) ? formData.itens_produto : [];
      if (itensFormulario.length === 0) {
        return null;
      }

      const custosIndiretosPercentual = 15; // Valor padrão
      const margemPercentual = parseFloat(formData?.margem_lucro_customizada || '30');
      const impostosPercentual = parseFloat(formData?.impostos_customizados || '18');
      const comissaoPercentual = parseFloat(formData?.comissao_percentual || '5');

      const previewCalculado = calcularProdutosPreview(
        itensFormulario,
        { insumos, maquinas, funcoes, servicos, custosIndiretos: [] },
        custosIndiretosPercentual,
        margemPercentual,
        impostosPercentual,
      );

      return previewCalculado;
    } catch (error) {
      console.error('Erro ao calcular dados localmente:', error);
      return null;
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(mode)),
    defaultValues: {
      cliente_id: '',
      titulo: '',
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
  
  // Função para calcular dados quando necessário (sem useEffect)
  const calcularDadosQuandoNecessario = () => {
    const formData = form.getValues();
    console.log('🔍 Debug - FormData para cálculo:', formData);
    console.log('🔍 Debug - Insumos disponíveis:', insumos.length);
    console.log('🔍 Debug - Máquinas disponíveis:', maquinas.length);
    console.log('🔍 Debug - Funções disponíveis:', funcoes.length);
    console.log('🔍 Debug - Serviços disponíveis:', servicos.length);
    
    if (formData.itens_produto && formData.itens_produto.length > 0) {
      const calculoLocal = calcularDadosLocalmente(formData);
      console.log('🔍 Debug - Resultado do cálculo local:', calculoLocal);
      if (calculoLocal) {
        setDadosCalculadosLocais(calculoLocal);
        return calculoLocal;
      }
    }
    return null;
  };

  // Debug: verificar props recebidas
  useEffect(() => {
    console.log('🔍 Debug - OrcamentoForm - Props recebidas:', {
      mode,
      hasInitialData: !!initialData,
      orcamentoId,
      orcamentoStatus
    });
  }, [mode, initialData, orcamentoId, orcamentoStatus]);

  // Carregar dados iniciais se for edição
  useEffect(() => {
    if (mode === 'editar' && initialData) {
      // Debug logs removidos para limpar terminal
      // console.log('🔍 Debug - OrcamentoForm - Dados recebidos para reset:', initialData);
      // console.log('🔍 Debug - OrcamentoForm - Cliente ID recebido:', initialData.cliente_id);
      // console.log('🔍 Debug - OrcamentoForm - Estrutura completa dos dados:', JSON.stringify(initialData, null, 2));
      
      // Verificar se os dados estão no formato esperado pelo formulário
      const dadosFormatados = {
        cliente_id: String(initialData.cliente_id || ''),
        titulo: String(initialData.titulo || ''),
        margem_lucro_customizada: String(initialData.margem_lucro_customizada || '30'),
        impostos_customizados: String(initialData.impostos_customizados || '25'),
        condicoes_comerciais: String(initialData.condicoes_comerciais || ''),
        prazo_entrega: String(initialData.prazo_entrega || '10 a 15 dias úteis'),
        forma_pagamento: String(initialData.forma_pagamento || '50% entrada, restante na entrega'),
        validade_proposta: String(initialData.validade_proposta || '30 dias'),
        atendente: String(initialData.atendente || 'Equipe Comercial'),
        itens_produto: (initialData.itens_produto as FormValues['itens_produto']) || [
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
      
      // Debug logs removidos para limpar terminal
      // console.log('🔍 Debug - OrcamentoForm - Dados formatados para o form:', dadosFormatados);
      
      // Tentar reset com delay para garantir que o formulário esteja pronto
      setTimeout(() => {
        // console.log('🔍 Debug - OrcamentoForm - Executando reset com delay...');
        form.reset(dadosFormatados);
        
        // Verificar se os valores foram aplicados
        setTimeout(() => {
          // const currentValues = form.getValues();
          // console.log('🔍 Debug - OrcamentoForm - Valores atuais do form após reset:', currentValues);
        }, 50);
      }, 100);
    }
  }, [mode, initialData]);

  // Debug: verificar se o status está sendo recebido
  useEffect(() => {
    if (mode === 'editar') {
      console.log('🔍 Debug - OrcamentoForm - Status recebido:', orcamentoStatus);
      console.log('🔍 Debug - OrcamentoForm - Mode:', mode);
      console.log('🔍 Debug - OrcamentoForm - InitialData:', initialData);
    }
  }, [mode, orcamentoStatus, initialData]);

  // Função auxiliar para transformar dados do frontend para o formato do backend
  const transformarDadosParaBackend = (data: FormValues, dadosCalculados?: any) => {
    const itensProduto = (Array.isArray(data.itens_produto) ? data.itens_produto : []).filter(
      (produto): produto is FormValues['itens_produto'][number] => Boolean(produto)
    );

    // Definir variáveis de percentuais que estavam faltando
    const custosIndiretosPercentual = 15; // Valor padrão
    const margemPercentual = parseFloat(data?.margem_lucro_customizada || '30');
    const impostosPercentual = parseFloat(data?.impostos_customizados || '25');
    const comissaoPercentual = parseFloat(data?.comissao_percentual || '5');

    const normalizarNumero = (valor: unknown): number => {
      if (typeof valor === 'number') return valor;
      if (typeof valor === 'string') {
        const cleaned = valor.replace(/[^0-9,.-]/g, '').replace(',', '.');
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      if (valor && typeof (valor as any).toString === 'function') {
        const parsed = Number((valor as any).toString().replace(',', '.'));
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    const produtosTransformados = itensProduto.map((produto, index) => {
      const quantidade = Math.max(normalizarNumero(produto.quantidade_produto) || 1, 1);
      const largura = normalizarNumero(produto.largura_produto);
      const altura = normalizarNumero(produto.altura_produto);
      const area = normalizarNumero(produto.area_produto);

      const nomeProduto = produto.nome_servico?.trim() || `Produto ${index + 1}`;

      const produtoTransformado = {
        nome_servico: nomeProduto,
        nome: nomeProduto,
        descricao: produto.descricao || '',
        quantidade,
        unidade: produto.unidade_medida_produto?.trim() || 'un',
        unidade_medida: produto.unidade_medida_produto?.trim() || 'un',
        observacoes: (produto as any)?.observacoes,
        largura,
        altura,
        area,
        insumos: Array.isArray(produto.materiais)
          ? (produto.materiais || [])
            .filter((material) => material?.insumo_id)
            .map((material) => ({
              insumo_id: material.insumo_id,
              quantidade: normalizarNumero(material.quantidade),
              unidade: (material as any)?.unidade || undefined,
              preco_unitario: 0,
              preco_total: 0,
            }))
          : undefined,
        maquinas: Array.isArray(produto.maquinas)
          ? (produto.maquinas || [])
            .filter((maquina) => maquina?.maquina_id)
            .map((maquina) => ({
              maquina_id: maquina.maquina_id,
              tempo_horas: normalizarNumero(maquina.horas_utilizadas),
              custo_hora: 0,
              custo_total: 0,
            }))
          : undefined,
        funcoes: Array.isArray(produto.funcoes)
          ? (produto.funcoes || [])
            .filter((funcao) => funcao?.funcao_id)
            .map((funcao) => ({
              funcao_id: funcao.funcao_id,
              tempo_horas: normalizarNumero(funcao.horas_trabalhadas),
              custo_hora: 0,
              custo_total: 0,
            }))
          : undefined,
        servicos_manuais: Array.isArray(produto.servicos)
          ? (produto.servicos || [])
            .filter((servico) => servico?.servico_id)
            .map((servico) => ({
              servico_id: servico.servico_id,
              tempo_horas: normalizarNumero(servico.horas_trabalhadas),
              custo_hora: 0,
              custo_total: 0,
            }))
          : undefined,
        custos_indiretos: undefined,
        custo_total_producao: 0,
        // Calcular valores individuais do produto baseado nos dados calculados
        preco_unitario: 0, // Será calculado abaixo
        preco_total: 0, // Será calculado abaixo
        margem_lucro: 0, // Será calculado abaixo
        impostos: 0, // Será calculado abaixo
      };

      if (produtoTransformado.insumos && produtoTransformado.insumos.length === 0) {
        delete produtoTransformado.insumos;
      }
      if (produtoTransformado.maquinas && produtoTransformado.maquinas.length === 0) {
        delete produtoTransformado.maquinas;
      }
      if (produtoTransformado.funcoes && produtoTransformado.funcoes.length === 0) {
        delete produtoTransformado.funcoes;
      }
      if (produtoTransformado.servicos_manuais && produtoTransformado.servicos_manuais.length === 0) {
        delete produtoTransformado.servicos_manuais;
      }

      return produtoTransformado;
    });

    const primeiroProdutoTransformado = produtosTransformados[0];

    // Determinar valores principais baseados nos dados do formulário
    const primeiroProduto = data.itens_produto?.[0];
    const nomeServicoPrincipal = primeiroProduto?.nome_servico?.trim() || data.titulo?.trim() || 'Orçamento sem nome';
    const descricaoPrincipal = primeiroProduto?.descricao?.trim() || '';
    const tituloPrincipal = data.titulo?.trim() || nomeServicoPrincipal;

    const tipoOrcamento = 'produto_servico';

    // Debug: verificar estrutura dos dados calculados
    console.log('🔍 Debug - Estrutura dos dados calculados:', dadosCalculados);
    console.log('🔍 Debug - Totais dos dados calculados:', dadosCalculados?.totais);
    console.log('🔍 Debug - Dados calculados existe?', !!dadosCalculados);
    
    const custoMaterial = dadosCalculados?.totais?.materiais || 0;
    const custoMaquinas = dadosCalculados?.totais?.maquinas || 0;
    const custoFuncoes = dadosCalculados?.totais?.funcoes || 0;
    const custoServicos = dadosCalculados?.totais?.servicos || 0;
    const custoIndiretos = dadosCalculados?.totais?.indiretos || 0;
    const custoMaoObra = custoMaquinas + custoFuncoes + custoServicos;
    const custoTotal = custoMaterial + custoMaoObra + custoIndiretos;
    
    // Calcular preço final com margem, impostos e comissão
    // (variáveis já definidas acima na função transformarDadosParaBackend)
    
    console.log('🔍 Debug - Percentuais do formulário:', {
      margem_lucro_customizada: data?.margem_lucro_customizada,
      impostos_customizados: data?.impostos_customizados,
      comissao_percentual: data?.comissao_percentual,
      margemPercentual,
      impostosPercentual,
      comissaoPercentual
    });
    
    // Fórmula: Preço = Custo / (1 - %Imposto - %Comissão - %Lucro)
    const percentualMargemDecimal = margemPercentual / 100;
    const percentualImpostosDecimal = impostosPercentual / 100;
    const percentualComissaoDecimal = comissaoPercentual / 100;
    const divisor = 1 - percentualImpostosDecimal - percentualComissaoDecimal - percentualMargemDecimal;
    
    console.log('🔍 Debug - Cálculo de percentuais:', {
      percentualMargemDecimal,
      percentualImpostosDecimal,
      percentualComissaoDecimal,
      divisor
    });
    
    const precoFinal = divisor > 0 ? custoTotal / divisor : custoTotal;
    const margemLucro = precoFinal * percentualMargemDecimal;
    const impostos = precoFinal * percentualImpostosDecimal;
    const comissao = precoFinal * percentualComissaoDecimal;
    
    console.log('🔍 Debug - Cálculo de preço final:', {
      custoTotal,
      margemPercentual,
      impostosPercentual,
      comissaoPercentual,
      precoFinal,
      margemLucro,
      impostos,
      comissao
    });
    
    // Calcular valores individuais para cada produto baseado em características específicas
    const totalProdutos = produtosTransformados.length;
    
    // Calcular peso de cada produto baseado em área e quantidade
    const produtosComPeso = produtosTransformados.map((produto, index) => {
      const largura = produto.largura || 0;
      const altura = produto.altura || 0;
      const quantidade = produto.quantidade || 1;
      
      // Calcular área total do produto
      const areaTotal = largura * altura * quantidade;
      
      // Se não há dimensões, usar apenas quantidade como peso
      // Se há dimensões, usar área total como peso
      const peso = areaTotal > 0 ? areaTotal : quantidade;
      
      console.log(`🔍 Debug - Produto ${index + 1} peso calculado:`, {
        nome: produto.nome_servico,
        largura,
        altura,
        quantidade,
        areaTotal,
        peso
      });
      
      return { ...produto, peso };
    });
    
    // Calcular peso total de todos os produtos
    const pesoTotal = produtosComPeso.reduce((total, produto) => total + produto.peso, 0);
    
    console.log(`🔍 Debug - Peso total calculado:`, pesoTotal);
    
    // Calcular preço individual para cada produto baseado em seus próprios custos
    produtosComPeso.forEach((produto, index) => {
      // Calcular custos individuais do produto
      const custoMaterialProduto = produto.insumos?.reduce((total: number, insumo: any) => {
        const insumoEncontrado = insumos.find(i => i.id === insumo.insumo_id);
        const custoUnitario = insumoEncontrado ? calcularCustoPorUnidadeUso(insumoEncontrado) : 0;
        return total + (insumo.quantidade * custoUnitario);
      }, 0) || 0;

      const custoMaquinaProduto = produto.maquinas?.reduce((total: number, maquina: any) => {
        const maquinaEncontrada = maquinas.find(m => m.id === maquina.maquina_id);
        const custoHora = maquinaEncontrada ? maquinaEncontrada.custo_hora : 0;
        return total + (maquina.horas_utilizadas * custoHora);
      }, 0) || 0;

      const custoFuncaoProduto = produto.funcoes?.reduce((total: number, funcao: any) => {
        const funcaoEncontrada = funcoes.find(f => f.id === funcao.funcao_id);
        const custoHora = funcaoEncontrada ? funcaoEncontrada.custo_hora : 0;
        return total + (funcao.horas_trabalhadas * custoHora);
      }, 0) || 0;

      const custoBaseProduto = custoMaterialProduto + custoMaquinaProduto + custoFuncaoProduto;
      const custoIndiretoProduto = custoBaseProduto * (custosIndiretosPercentual / 100);
      const custoTotalProduto = custoBaseProduto + custoIndiretoProduto;

      // Aplicar a mesma fórmula do total para cada produto individualmente
      const divisorProduto = divisor; // Usar o mesmo divisor do cálculo total
      const precoFinalProduto = divisorProduto > 0 ? custoTotalProduto / divisorProduto : custoTotalProduto;
      const margemLucroProduto = precoFinalProduto * percentualMargemDecimal;
      const impostosProduto = precoFinalProduto * percentualImpostosDecimal;

      produto.custo_total_producao = custoTotalProduto;
      produto.preco_unitario = precoFinalProduto / produto.quantidade;
      produto.preco_total = precoFinalProduto;
      produto.margem_lucro = margemLucroProduto;
      produto.impostos = impostosProduto;
      
      console.log(`🔍 Debug - Produto ${index + 1} calculado individualmente:`, {
        nome: produto.nome_servico,
        quantidade: produto.quantidade,
        custo_material: custoMaterialProduto,
        custo_maquina: custoMaquinaProduto,
        custo_funcao: custoFuncaoProduto,
        custo_total: custoTotalProduto,
        preco_unitario: produto.preco_unitario,
        preco_total: produto.preco_total,
        margem_lucro: produto.margem_lucro,
        impostos: produto.impostos
      });
    });
    
    // Atualizar a lista original com os valores calculados
    produtosTransformados.forEach((produto, index) => {
      const produtoComPeso = produtosComPeso[index];
      produto.custo_total_producao = produtoComPeso.custo_total_producao;
      produto.preco_unitario = produtoComPeso.preco_unitario;
      produto.preco_total = produtoComPeso.preco_total;
      produto.margem_lucro = produtoComPeso.margem_lucro;
      produto.impostos = produtoComPeso.impostos;
      
      // Debug: verificar se os valores estão corretos
      console.log(`🔍 Debug - Produto ${index + 1} (${produto.nome_servico}):`, {
        preco_unitario: produto.preco_unitario,
        preco_total: produto.preco_total,
        quantidade: produto.quantidade,
        custo_total_producao: produto.custo_total_producao
      });
    });
    
    console.log('🔍 Debug - Custos calculados:', {
      custoMaterial,
      custoMaquinas,
      custoFuncoes,
      custoServicos,
      custoIndiretos,
      custoMaoObra,
      custoTotal,
      margemLucro,
      impostos,
      comissao,
      precoFinal
    });

    const dadosTransformados = {
      titulo: tituloPrincipal,
      nome_servico: nomeServicoPrincipal,
      descricao: descricaoPrincipal,
      cliente_id: data.cliente_id,
      condicoes_comerciais: data.condicoes_comerciais,
      prazo_entrega: data.prazo_entrega,
      forma_pagamento: data.forma_pagamento,
      validade_proposta: data.validade_proposta,
      atendente: data.atendente,
      tipo: tipoOrcamento,
      tipo_orcamento: tipoOrcamento,
      horas_producao: produtosTransformados.reduce((total, produto) => {
        const horasMaquinas = (produto.maquinas || []).reduce((acc, maquina) => acc + (maquina.tempo_horas || 0), 0);
        const horasFuncoes = (produto.funcoes || []).reduce((acc, funcao) => acc + (funcao.tempo_horas || 0), 0);
        const horasServicos = (produto.servicos_manuais || []).reduce((acc, servico) => acc + (servico.tempo_horas || 0), 0);
        return total + horasMaquinas + horasFuncoes + horasServicos;
      }, 0),
      // Usar dados calculados do preview se disponíveis, senão usar zeros
      custo_material: custoMaterial,
      custo_mao_obra: custoMaoObra,
      custo_indireto: custoIndiretos,
      custo_total: custoTotal,
      margem_lucro: margemLucro,
      impostos: impostos,
      preco_final: precoFinal,
      produtos: produtosTransformados,
      largura_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.largura : undefined,
      altura_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.altura : undefined,
      area_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.area : undefined,
      unidade_medida_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.unidade : undefined,
      quantidade_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.quantidade : undefined,
    };

    // Log detalhado removido para limpar terminal
    // console.log('🔍 Debug - Dados originais do form:', data.itens_produto);
    // console.log('🔍 Debug - Dados transformados:', dadosTransformados);
    // console.log('🔍 Debug - Produtos transformados:', dadosTransformados.produtos);

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

      // Capturar dados calculados do preview se disponíveis
      let dadosCalculados = dadosCalculadosLocais || resultadoOrcamento?.resultado;
      
      // Se não há dados do preview, calcular localmente
      if (!dadosCalculados) {
        console.log('🔍 Debug - Sem dados do preview, calculando localmente...');
        const calculoLocal = calcularDadosLocalmente(data);
        if (calculoLocal) {
          dadosCalculados = calculoLocal;
          console.log('🔍 Debug - Dados calculados localmente:', dadosCalculados);
        }
      }
      
      const dadosTransformados = transformarDadosParaBackend(data, dadosCalculados);
      console.log('🔍 Dados transformados para backend:', dadosTransformados);

      if (mode === 'editar' && orcamentoId) {
        await orcamentosApi.v2.update(orcamentoId, dadosTransformados, token);
        toast.success('Orçamento atualizado com sucesso!');
      } else {
        await orcamentosApi.v2.create(dadosTransformados, token);
        toast.success('Orçamento criado com sucesso!');
      }

      router.push('/orcamentos-v2');
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

      // Calcular dados no momento do salvamento
      console.log('🔍 Debug - Calculando dados para salvamento...');
      const dadosCalculados = calcularDadosQuandoNecessario() || resultadoOrcamento?.resultado;
      
      if (dadosCalculados) {
        console.log('🔍 Debug - Dados calculados para salvamento:', dadosCalculados);
      } else {
        console.log('🔍 Debug - Nenhum dado calculado disponível');
      }
      
      const dadosTransformados = transformarDadosParaBackend(formData, dadosCalculados);
      
      console.log('🔍 Dados transformados para backend (rascunho):', dadosTransformados);
      console.log('🔍 Debug - Valores específicos enviados:', {
        preco_final: dadosTransformados.preco_final,
        margem_lucro: dadosTransformados.margem_lucro,
        impostos: dadosTransformados.impostos,
        custo_total: dadosTransformados.custo_total
      });
      
      // Se for edição, usar update; se for criação, usar salvarRascunho
      if (mode === 'editar' && orcamentoId) {
        console.log('🔍 Debug - Editando rascunho existente com ID:', orcamentoId);
        console.log('🔍 Debug - Fazendo requisição para API...');
        try {
          const resultado = await orcamentosApi.v2.update(orcamentoId, dadosTransformados, token);
          console.log('🔍 Debug - Resposta da API:', resultado);
          toast.success('Rascunho atualizado com sucesso!');
        } catch (error) {
          console.error('🔍 Debug - Erro na API:', error);
          throw error;
        }
      } else {
        console.log('🔍 Debug - Criando novo rascunho');
        console.log('🔍 Debug - Fazendo requisição para API...');
        try {
          const resultado = await orcamentosApi.v2.create(dadosTransformados, token);
          console.log('🔍 Debug - Resposta da API:', resultado);
          toast.success('Rascunho salvo com sucesso!');
        } catch (error) {
          console.error('🔍 Debug - Erro na API:', error);
          throw error;
        }
      }
      
      // Redirecionar para o grid de orçamentos após salvar rascunho
      router.push('/orcamentos-v2');
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

      // Capturar dados calculados do preview se disponíveis
      let dadosCalculados = dadosCalculadosLocais || resultadoOrcamento?.resultado;
      
      // Se não há dados do preview, calcular localmente
      if (!dadosCalculados) {
        console.log('🔍 Debug - Sem dados do preview, calculando localmente...');
        const calculoLocal = calcularDadosLocalmente(formData);
        if (calculoLocal) {
          dadosCalculados = calculoLocal;
          console.log('🔍 Debug - Dados calculados localmente:', dadosCalculados);
        }
      }
      
      const dadosTransformados = transformarDadosParaBackend(formData, dadosCalculados);
      
      console.log('🔍 Dados transformados para backend (enviar):', dadosTransformados);
      
      // Se for edição, usar enviar; se for criação, usar create
      if (mode === 'editar' && orcamentoId) {
        await orcamentosApi.enviar(orcamentoId, token);
        toast.success('Orçamento enviado com sucesso!');
      } else {
        // Para novo orçamento, criar e enviar
        const orcamentoCriado = await orcamentosApi.create(dadosTransformados, token);
        if (orcamentoCriado && (orcamentoCriado as { id?: string }).id) {
          await orcamentosApi.enviar((orcamentoCriado as { id: string }).id, token);
          toast.success('Orçamento criado e enviado com sucesso!');
        } else {
          toast.success('Orçamento criado com sucesso!');
        }
      }
      
      router.push('/orcamentos-v2');
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


  return (
    <div>
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="w-full">
          {showPreview ? (
            /* Layout com Preview - Flex horizontal */
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Formulário principal */}
              <div className="flex-1">
                <div className="w-full bg-white rounded-lg shadow-sm border p-6 space-y-6">
                  {/* Seção de Cliente */}
                  <ClienteSection 
                    clientes={clientes} 
                    mode={mode} 
                  />

                  <Separator />

                  {/* Título do Orçamento */}
                  <TituloOrcamentoSection modo={mode} />

                  <Separator />

                  {/* Seção de Produtos */}
                  <ProdutoSection 
                    mode={mode}
                    onCarregarProduto={handleCarregarProduto}
                    insumos={insumos}
                    maquinas={maquinas}
                    funcoes={funcoes}
                    servicos={servicos}
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
                        type="button"
                        onClick={() => handleSubmit(form.getValues())}
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
                              type="button"
                              onClick={() => handleSubmit(form.getValues())}
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
              </div>

              {/* Sidebar com preview de cálculo */}
              <div className="w-full lg:w-3/10 lg:flex-shrink-0">
                <div className="sticky top-6">
                  <PreviewCalculoV2 />
                </div>
              </div>
            </div>
          ) : (
            /* Layout sem Preview - Formulário completo */
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
                servicos={servicos}
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
          )}
        </form>
      </Form>

      {showProdutoModal && (
        <ProdutoSelectionModal
          open={showProdutoModal}
          onClose={() => setShowProdutoModal(false)}
          onSelect={handleProdutoSelected}
        />
      )}

      {/* Chat Flutuante - mostrar para todos os status exceto rascunho */}
      {orcamentoId && orcamentoStatus && orcamentoStatus !== 'rascunho' && (
        <ChatFlutuante 
          orcamentoId={orcamentoId}
          isPublic={false}
          shouldOpen={orcamentoStatus === 'negociando' || orcamentoStatus === 'NEGOCIANDO'}
        />
      )}
    </div>
  );
}
