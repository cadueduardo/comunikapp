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
import { useUser } from '@/contexts/UserContext';

const unidadesTotaisPreview = ['m²', 'm2', 'metro quadrado', 'metros quadrados'];
const unidadesPorUnidadePreview = [
  'cm',
  'centimetro',
  'centimetros',
  'm',
  'metro',
  'metros',
  'metro linear',
  'metros lineares',
  'un',
  'unidade',
  'unidades',
  'unid',
  'pe',
  'peca',
  'pecas',
  'kg',
  'kilograma',
  'kilogramas',
  'g',
  'grama',
  'gramas',
  'l',
  'litro',
  'litros',
  'ml',
  'mililitro',
  'mililitros',
];

const parseNumeroInicial = (valor: unknown): number => {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : 0;
  }
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

const formatNumeroFormulario = (valor: number, precision = 3): string => {
  if (!Number.isFinite(valor)) {
    return '';
  }
  if (valor === 0) {
    return '0';
  }
  const normalized = Number(valor.toFixed(precision));
  return normalized.toString();
};

const deveMultiplicarMaterialPreview = (unidade?: string | null): boolean => {
  if (!unidade || typeof unidade !== 'string') {
    return false;
  }
  const unidadeLower = unidade.toLowerCase().trim();

  if (unidadesTotaisPreview.some((item) => unidadeLower.includes(item))) {
    return false;
  }

  if (unidadesPorUnidadePreview.some((item) => unidadeLower.includes(item))) {
    return true;
  }

  return false;
};

const ajustarQuantidadeMaterialParaFormulario = (
  quantidadeTotal: unknown,
  unidade: unknown,
  quantidadeProduto: unknown,
): string => {
  const total = parseNumeroInicial(quantidadeTotal);
  const unidadeStr = typeof unidade === 'string' ? unidade : '';

  if (total === 0) {
    return '0';
  }

  if (!deveMultiplicarMaterialPreview(unidadeStr)) {
    return formatNumeroFormulario(total);
  }

  const quantidadeProdutoNumero = parseNumeroInicial(quantidadeProduto);
  if (quantidadeProdutoNumero > 0) {
    const porUnidade = total / quantidadeProdutoNumero;
    return formatNumeroFormulario(porUnidade);
  }

  return formatNumeroFormulario(total);
};

interface OrcamentoFormProps {
  mode: 'novo' | 'editar' | 'template';
  initialData?: Record<string, unknown>;
  orcamentoId?: string;
  showPreview?: boolean;
  onSuccess?: () => void;
  orcamentoStatus?: string;
  statusAprovacao?: string;
}

export function OrcamentoV2Form({ 
  mode, 
  initialData, 
  orcamentoId, 
  showPreview = false,
  orcamentoStatus,
  statusAprovacao,
}: OrcamentoFormProps) {
  const isAprovado = mode === 'editar' && (
    orcamentoStatus === 'aprovado' || statusAprovacao === 'APROVADO'
  );
  // Forçar hot reload - versão atualizada
  const router = useRouter();
  const [loading] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);
  const [isAtualizando, setIsAtualizando] = useState(false);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [selectedProdutoIndex, setSelectedProdutoIndex] = useState<number>(0);
  const { clientes, insumos, maquinas, funcoes, servicos } = useOrcamentoData();
  const { user } = useUser();

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

      const custosIndiretosPercentual = 15;
      const margemPercentual = parseFloat(formData?.margem_lucro_customizada || '30');
      const impostosPercentual = parseFloat(formData?.impostos_customizados || '18');
      const comissaoPercentual = parseFloat(formData?.comissao_percentual || '5');
      const tipoMargemLucro =
        (formData?.tipo_margem_lucro && formData.tipo_margem_lucro !== '')
          ? (formData.tipo_margem_lucro as 'markup' | 'margem_por_dentro')
          : (user?.loja?.tipo_margem_lucro === 'markup' ? 'markup' : 'margem_por_dentro');

      const previewCalculado = calcularProdutosPreview(
        itensFormulario,
        { insumos, maquinas, funcoes, servicos, custosIndiretos: [] },
        custosIndiretosPercentual,
        margemPercentual,
        impostosPercentual,
        comissaoPercentual,
        tipoMargemLucro,
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
      tipo_margem_lucro: '',
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
          materiais: [{ insumo_id: '', quantidade: '1', material_do_cliente: false }],
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
        comissao_percentual: String(initialData.comissao_percentual ?? '5'),
        tipo_margem_lucro: String(initialData.tipo_margem_lucro ?? initialData.configuracoes?.tipo_margem_lucro ?? ''),
        condicoes_comerciais: String(initialData.condicoes_comerciais || ''),
        prazo_entrega: String(initialData.prazo_entrega || '10 a 15 dias úteis'),
        forma_pagamento: String(initialData.forma_pagamento || '50% entrada, restante na entrega'),
        validade_proposta: String(initialData.validade_proposta || '30 dias'),
        atendente: String(initialData.atendente || 'Equipe Comercial'),
        itens_produto: (() => {
          // Se tem itens_produto no initialData, usar eles
          if (initialData.itens_produto && Array.isArray(initialData.itens_produto) && initialData.itens_produto.length > 0) {
            return (initialData.itens_produto as any[]).map((produto: any) => {
              const quantidadeProdutoNumero = parseNumeroInicial(
                produto.quantidade_produto || produto.quantidade || '1',
              );
              return {
                nome_servico: String(produto.nome_servico || produto.nome || ''),
                descricao: String(produto.descricao || ''),
                quantidade_produto: String(produto.quantidade_produto || produto.quantidade || '1'),
                largura_produto: String(produto.largura_produto?.toString() || produto.largura?.toString() || ''),
                altura_produto: String(produto.altura_produto?.toString() || produto.altura?.toString() || ''),
                unidade_medida_produto: String(
                  produto.unidade_medida_produto || produto.unidade_medida || produto.unidade || '',
                ),
                area_produto: String(produto.area_produto?.toString() || produto.area?.toString() || ''),
                materiais: Array.isArray(produto.materiais)
                  ? produto.materiais.map((material: any) => ({
                      ...material,
                      quantidade: ajustarQuantidadeMaterialParaFormulario(
                        material.quantidade,
                        material.unidade,
                        quantidadeProdutoNumero,
                      ),
                    }))
                  : [],
                maquinas: produto.maquinas || [],
                funcoes: produto.funcoes || [],
                servicos: produto.servicos || [],
              };
            });
          }
          
          // Se tem produtos no initialData (formato do backend V2)
          if (initialData.produtos && Array.isArray(initialData.produtos) && initialData.produtos.length > 0) {
            console.log('🔍 Debug - Carregando produtos do backend V2:', initialData.produtos);
            console.log('🔍 Debug - Dados completos do initialData:', initialData);
            console.log('🔍 Debug - Medidas dos produtos do backend:', initialData.produtos.map((p: any) => ({
              nome: p.nome_servico || p.nome,
              largura: p.largura,
              altura: p.altura,
              area: p.area_produto || p.area,
              larguraType: typeof p.largura,
              alturaType: typeof p.altura,
              areaType: typeof (p.area_produto || p.area)
            })));
            return (initialData.produtos as any[]).map((produto: any) => {
              const quantidadeProdutoNumero = parseNumeroInicial(produto.quantidade || '1');
              return {
                nome_servico: String(produto.nome_servico || produto.nome || ''),
                descricao: String(produto.descricao || ''),
                quantidade_produto: String(produto.quantidade || '1'),
                largura_produto: String(produto.largura?.toString() || ''),
                altura_produto: String(produto.altura?.toString() || ''),
                unidade_medida_produto: String(produto.unidade_medida || ''),
                area_produto: String(produto.area_produto?.toString() || produto.area?.toString() || ''),
                materiais: (produto.insumos || []).map((ins: any) => ({
                  insumo_id: ins.insumo_id,
                  quantidade: ajustarQuantidadeMaterialParaFormulario(
                    ins.quantidade,
                    ins.unidade || ins.unidade_consumo,
                    quantidadeProdutoNumero,
                  ),
                  unidade: ins.unidade || ins.unidade_consumo,
                  material_do_cliente: Boolean(ins.material_do_cliente),
                })),
                maquinas: (produto.maquinas || []).map((maq: any) => ({
                  maquina_id: maq.maquina_id,
                  horas_utilizadas: String(maq.horas_utilizadas || maq.tempo_horas || '1'),
                })),
                funcoes: (produto.funcoes || []).map((func: any) => ({
                  funcao_id: func.funcao_id,
                  horas_trabalhadas: String(func.horas_trabalhadas || func.tempo_horas || '1'),
                })),
                servicos: (produto.servicos_manuais || []).map((serv: any) => ({
                  servico_id: serv.servico_id,
                  horas_trabalhadas: String(serv.horas_trabalhadas || serv.tempo_horas || '1'),
                })),
              };
            });
          }
          
          // Fallback: criar um produto vazio com dados do nível raiz
          return [
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
              servicos: [],
            }
          ];
        })(),
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
    console.log('🔍 Debug - transformarDadosParaBackend - dadosCalculados:', dadosCalculados);
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

    const fixDecimal = (valor: unknown, precision = 2): number => {
      const numero = typeof valor === 'number' ? valor : Number(valor);
      if (!Number.isFinite(numero)) {
        return 0;
      }
      return Number(numero.toFixed(precision));
    };

    const vazioParaUndefined = <T,>(lista: T[] | undefined): T[] | undefined =>
      Array.isArray(lista) && lista.length > 0 ? lista : undefined;

    const montarMateriaisFormulario = (produto: FormValues['itens_produto'][number]) => {
      if (!Array.isArray(produto.materiais)) {
        return undefined;
      }

      const itens = produto.materiais
        .filter((material) => material?.insumo_id)
        .map((material) => ({
          insumo_id: material.insumo_id,
          quantidade: fixDecimal(normalizarNumero(material.quantidade), 3),
          unidade: (material as any)?.unidade || undefined,
          preco_unitario: 0,
          preco_total: 0,
          material_do_cliente: Boolean((material as any)?.material_do_cliente),
        }))
        .filter((material) => material.quantidade > 0);

      return vazioParaUndefined(itens);
    };

    const montarMaquinasFormulario = (produto: FormValues['itens_produto'][number]) => {
      if (!Array.isArray(produto.maquinas)) {
        return undefined;
      }

      const itens = produto.maquinas
        .filter((maquina) => maquina?.maquina_id)
        .map((maquina) => ({
          maquina_id: maquina.maquina_id,
          tempo_horas: fixDecimal(normalizarNumero(maquina.horas_utilizadas), 3),
          custo_hora: 0,
          custo_total: 0,
        }))
        .filter((maquina) => maquina.tempo_horas > 0);

      return vazioParaUndefined(itens);
    };

    const montarFuncoesFormulario = (produto: FormValues['itens_produto'][number]) => {
      if (!Array.isArray(produto.funcoes)) {
        return undefined;
      }

      const itens = produto.funcoes
        .filter((funcao) => funcao?.funcao_id)
        .map((funcao) => ({
          funcao_id: funcao.funcao_id,
          tempo_horas: fixDecimal(normalizarNumero(funcao.horas_trabalhadas), 3),
          custo_hora: 0,
          custo_total: 0,
        }))
        .filter((funcao) => funcao.tempo_horas > 0);

      return vazioParaUndefined(itens);
    };

    const montarServicosFormulario = (produto: FormValues['itens_produto'][number]) => {
      if (!Array.isArray(produto.servicos)) {
        return undefined;
      }

      const itens = produto.servicos
        .filter((servico) => servico?.servico_id)
        .map((servico) => ({
          servico_id: servico.servico_id,
          tempo_horas: fixDecimal(normalizarNumero(servico.horas_trabalhadas), 3),
          custo_hora: 0,
          custo_total: 0,
        }))
        .filter((servico) => servico.tempo_horas > 0);

      return vazioParaUndefined(itens);
    };

    const somarCampo = <T extends Record<string, unknown>>(lista: T[] | undefined, campo: keyof T): number => {
      if (!Array.isArray(lista)) {
        return 0;
      }

      return lista.reduce((acc, item) => {
        const valor = Number(item[campo] ?? 0);
        return acc + (Number.isFinite(valor) ? valor : 0);
      }, 0);
    };

    const produtosPreview = Array.isArray(dadosCalculados?.produtos) ? dadosCalculados.produtos : undefined;
    const totaisPreview = dadosCalculados?.totais;
    const resumoPreview = dadosCalculados?.resumo;
    const custosIndiretosPreview = dadosCalculados?.custosIndiretosResumo;

    if (produtosPreview && produtosPreview.length > 0) {
      const margemPercentualEfetiva = fixDecimal(
        resumoPreview?.margem_lucro_percentual ?? margemPercentual,
      );
      const impostosPercentualEfetiva = fixDecimal(
        resumoPreview?.impostos_percentual ?? impostosPercentual,
      );
      const comissaoPercentualEfetiva = fixDecimal(
        resumoPreview?.comissao_percentual ?? comissaoPercentual,
      );

      const percentualMargemDecimal = margemPercentualEfetiva / 100;
      const percentualImpostosDecimal = impostosPercentualEfetiva / 100;
      const percentualComissaoDecimal = comissaoPercentualEfetiva / 100;

      let horasTotalPreview = 0;

      const produtosTransformadosPreview = itensProduto.map((produtoFormulario, index) => {
        const previewProduto = produtosPreview[index];

        const nomeBase =
          (typeof previewProduto?.nome_servico === 'string' && previewProduto.nome_servico.trim().length > 0
            ? previewProduto.nome_servico
            : typeof previewProduto?.nome === 'string' && previewProduto.nome.trim().length > 0
            ? previewProduto.nome
            : produtoFormulario.nome_servico) || `Produto ${index + 1}`;
        const nomeProduto = String(nomeBase).trim();

        const dimensoesPreview = previewProduto?.dimensoes || {};
        const quantidade = Math.max(
          fixDecimal(
            typeof previewProduto?.quantidade === 'number'
              ? previewProduto.quantidade
              : normalizarNumero(produtoFormulario.quantidade_produto),
            3,
          ),
          1,
        );
        const largura = fixDecimal(
          typeof dimensoesPreview?.largura === 'number'
            ? dimensoesPreview.largura
            : normalizarNumero(produtoFormulario.largura_produto),
          3,
        );
        const altura = fixDecimal(
          typeof dimensoesPreview?.altura === 'number'
            ? dimensoesPreview.altura
            : normalizarNumero(produtoFormulario.altura_produto),
          3,
        );
        const area = fixDecimal(
          typeof dimensoesPreview?.area_produto === 'number'
            ? dimensoesPreview.area_produto
            : normalizarNumero(produtoFormulario.area_produto),
          3,
        );
        const unidadeMedida =
          (typeof dimensoesPreview?.unidade_medida === 'string' && dimensoesPreview.unidade_medida.trim().length > 0
            ? dimensoesPreview.unidade_medida.trim()
            : produtoFormulario.unidade_medida_produto?.trim()) || 'un';

        const descricaoPreview =
          typeof previewProduto?.descricao === 'string' ? previewProduto.descricao.trim() : '';
        const descricao =
          descricaoPreview.length > 0 ? descricaoPreview : (produtoFormulario.descricao || '');

        const materiaisPreview = vazioParaUndefined(
          Array.isArray(previewProduto?.materiais)
            ? previewProduto.materiais
                .filter((material: any) => material?.insumo_id)
                .map((material: any) => {
                  const quantidadeMaterial = fixDecimal(material.quantidade ?? 0, 3);
                  const precoUnitario = fixDecimal(material.custo_unitario ?? 0);
                  const precoTotalMaterial = fixDecimal(
                    material.custo_total ?? quantidadeMaterial * precoUnitario,
                  );
                  const unidadeMaterial =
                    material.unidade_consumo ||
                    produtoFormulario.materiais?.find((item) => item?.insumo_id === material.insumo_id)?.unidade;
                  const materialDoCliente = produtoFormulario.materiais?.find(
                    (item) => item?.insumo_id === material.insumo_id,
                  )?.material_do_cliente;

                  return {
                    insumo_id: material.insumo_id,
                    quantidade: quantidadeMaterial,
                    unidade: unidadeMaterial,
                    preco_unitario: precoUnitario,
                    preco_total: precoTotalMaterial,
                    material_do_cliente: Boolean(materialDoCliente),
                  };
                })
            : undefined,
        );
        const materiais = materiaisPreview ?? montarMateriaisFormulario(produtoFormulario);

        const maquinasPreview = vazioParaUndefined(
          Array.isArray(previewProduto?.maquinas)
            ? previewProduto.maquinas
                .filter((maquina: any) => maquina?.maquina_id)
                .map((maquina: any) => {
                  const tempoHoras = fixDecimal(maquina.horas_utilizadas ?? maquina.tempo_horas ?? 0, 3);
                  const custoHora = fixDecimal(maquina.custo_por_hora ?? maquina.custo_hora ?? 0);
                  const custoTotalMaquina = fixDecimal(
                    maquina.custo_total ?? tempoHoras * custoHora,
                  );

                  return {
                    maquina_id: maquina.maquina_id,
                    tempo_horas: tempoHoras,
                    custo_hora: custoHora,
                    custo_total: custoTotalMaquina,
                  };
                })
            : undefined,
        );
        const maquinas = maquinasPreview ?? montarMaquinasFormulario(produtoFormulario);

        const funcoesPreview = vazioParaUndefined(
          Array.isArray(previewProduto?.funcoes)
            ? previewProduto.funcoes
                .filter((funcao: any) => funcao?.funcao_id)
                .map((funcao: any) => {
                  const tempoHoras = fixDecimal(funcao.horas_trabalhadas ?? funcao.tempo_horas ?? 0, 3);
                  const custoHora = fixDecimal(funcao.custo_por_hora ?? funcao.custo_hora ?? 0);
                  const custoTotalFuncao = fixDecimal(
                    funcao.custo_total ?? tempoHoras * custoHora,
                  );

                  return {
                    funcao_id: funcao.funcao_id,
                    tempo_horas: tempoHoras,
                    custo_hora: custoHora,
                    custo_total: custoTotalFuncao,
                  };
                })
            : undefined,
        );
        const funcoes = funcoesPreview ?? montarFuncoesFormulario(produtoFormulario);

        const servicosPreview = vazioParaUndefined(
          Array.isArray(previewProduto?.servicos)
            ? previewProduto.servicos
                .filter((servico: any) => servico?.servico_id)
                .map((servico: any) => {
                  const tempoHoras = fixDecimal(servico.horas_trabalhadas ?? servico.tempo_horas ?? 0, 3);
                  const custoHora = fixDecimal(servico.custo_por_hora ?? servico.custo_hora ?? 0);
                  const custoTotalServico = fixDecimal(
                    servico.custo_total ?? tempoHoras * custoHora,
                  );

                  return {
                    servico_id: servico.servico_id,
                    tempo_horas: tempoHoras,
                    custo_hora: custoHora,
                    custo_total: custoTotalServico,
                  };
                })
            : undefined,
        );
        const servicos = servicosPreview ?? montarServicosFormulario(produtoFormulario);

        const custoMateriaisProduto = somarCampo(materiais, 'preco_total');
        const custoMaquinasProduto = somarCampo(maquinas, 'custo_total');
        const custoFuncoesProduto = somarCampo(funcoes, 'custo_total');
        const custoServicosProduto = somarCampo(servicos, 'custo_total');

        const custoTotalProducao = fixDecimal(
          previewProduto?.custo_total_producao ??
            custoMateriaisProduto + custoMaquinasProduto + custoFuncoesProduto + custoServicosProduto,
        );

        const precoTotalProduto = fixDecimal(
          previewProduto?.preco_venda_total ?? previewProduto?.preco_total ?? custoTotalProducao,
        );
        const precoUnitarioProduto = fixDecimal(
          previewProduto?.preco_venda_unitario ??
            previewProduto?.preco_unitario ??
            precoTotalProduto / Math.max(quantidade, 1),
        );
        const margemLucroProduto = fixDecimal(
          previewProduto?.margem_lucro_produto ??
            previewProduto?.margem_lucro ??
            precoTotalProduto * percentualMargemDecimal,
        );
        const impostosProduto = fixDecimal(
          previewProduto?.impostos_produto ??
            previewProduto?.impostos ??
            precoTotalProduto * percentualImpostosDecimal,
        );

        let horasProduto = Number(previewProduto?.horas_producao);
        if (!Number.isFinite(horasProduto) || horasProduto <= 0) {
          horasProduto =
            somarCampo(maquinas, 'tempo_horas') +
            somarCampo(funcoes, 'tempo_horas') +
            somarCampo(servicos, 'tempo_horas');
        }
        horasTotalPreview += horasProduto;

        const produtoTransformado: any = {
          nome_servico: nomeProduto,
          nome: nomeProduto,
          descricao,
          quantidade,
          unidade: unidadeMedida,
          unidade_medida: unidadeMedida,
          observacoes: (produtoFormulario as any)?.observacoes,
          largura,
          altura,
          area,
          custo_total_producao: custoTotalProducao,
          preco_unitario: precoUnitarioProduto,
          preco_total: precoTotalProduto,
          margem_lucro: margemLucroProduto,
          impostos: impostosProduto,
        };

        if (materiais) {
          produtoTransformado.insumos = materiais;
        }
        if (maquinas) {
          produtoTransformado.maquinas = maquinas;
        }
        if (funcoes) {
          produtoTransformado.funcoes = funcoes;
        }
        if (servicos) {
          produtoTransformado.servicos_manuais = servicos;
        }

        return produtoTransformado;
      });

      const custoMaterial = fixDecimal(
        totaisPreview?.materiais ??
          produtosTransformadosPreview.reduce(
            (total, produto) => total + somarCampo(produto.insumos, 'preco_total'),
            0,
          ),
      );
      const custoMaquinas = fixDecimal(
        totaisPreview?.maquinas ??
          produtosTransformadosPreview.reduce(
            (total, produto) => total + somarCampo(produto.maquinas, 'custo_total'),
            0,
          ),
      );
      const custoFuncoes = fixDecimal(
        totaisPreview?.funcoes ??
          produtosTransformadosPreview.reduce(
            (total, produto) => total + somarCampo(produto.funcoes, 'custo_total'),
            0,
          ),
      );
      const custoServicos = fixDecimal(
        totaisPreview?.servicos ??
          produtosTransformadosPreview.reduce(
            (total, produto) => total + somarCampo(produto.servicos_manuais, 'custo_total'),
            0,
          ),
      );
      const custoIndiretos = fixDecimal(
        totaisPreview?.indiretos ??
          custosIndiretosPreview?.totalRateado ??
          resumoPreview?.total_custo_indireto ??
          0,
      );
      const custoMaoObra = fixDecimal(custoMaquinas + custoFuncoes + custoServicos);
      let custoTotal = fixDecimal(
        resumoPreview?.total_custo_producao ?? custoMaterial + custoMaoObra + custoIndiretos,
      );

      const tipoMargemLucroEfetivo =
        (data.tipo_margem_lucro && data.tipo_margem_lucro !== '')
          ? data.tipo_margem_lucro
          : (user?.loja?.tipo_margem_lucro === 'markup' ? 'markup' : 'margem_por_dentro');

      let precoFinal: number;
      if (resumoPreview?.preco_final != null && Number.isFinite(resumoPreview.preco_final)) {
        precoFinal = fixDecimal(resumoPreview.preco_final);
      } else if (tipoMargemLucroEfetivo === 'markup') {
        const divisorMarkup = 1 - percentualImpostosDecimal - percentualComissaoDecimal;
        precoFinal = fixDecimal(
          divisorMarkup > 0
            ? (custoTotal * (1 + percentualMargemDecimal)) / divisorMarkup
            : custoTotal * (1 + percentualMargemDecimal),
        );
      } else {
        const divisor = 1 - percentualImpostosDecimal - percentualComissaoDecimal - percentualMargemDecimal;
        precoFinal = fixDecimal(divisor > 0 ? custoTotal / divisor : custoTotal);
      }
      if (!Number.isFinite(precoFinal) || precoFinal <= 0) {
        precoFinal = fixDecimal(custoTotal);
      }

      const margemLucro = fixDecimal(
        resumoPreview?.total_margem_lucro ?? precoFinal * percentualMargemDecimal,
      );
      const impostos = fixDecimal(resumoPreview?.total_impostos ?? precoFinal * percentualImpostosDecimal);
      const horasProducao = fixDecimal(horasTotalPreview, 3);

      const primeiroProdutoFormulario = data.itens_produto?.[0];
      const primeiroProdutoTransformado = produtosTransformadosPreview[0];

      const nomeServicoPrincipal =
        primeiroProdutoFormulario?.nome_servico?.trim() ||
        primeiroProdutoTransformado?.nome_servico ||
        data.titulo?.trim() ||
        'Orçamento sem nome';
      const tituloPrincipal = data.titulo?.trim() || nomeServicoPrincipal;
      const descricaoPrincipal =
        primeiroProdutoFormulario?.descricao?.trim() ||
        primeiroProdutoTransformado?.descricao ||
        '';

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
        comissao_percentual: comissaoPercentualEfetiva,
        tipo: 'produto_servico',
        tipo_orcamento: 'produto_servico',
        horas_producao: horasProducao,
        custo_material: custoMaterial,
        custo_mao_obra: custoMaoObra,
        custo_indireto: custoIndiretos,
        custo_total: custoTotal,
        margem_lucro: margemLucro,
        impostos,
        preco_final: precoFinal,
        produtos: produtosTransformadosPreview,
        largura_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.largura : undefined,
        altura_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.altura : undefined,
        area_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.area : undefined,
        unidade_medida_produto: primeiroProdutoTransformado
          ? primeiroProdutoTransformado.unidade
          : undefined,
        quantidade_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.quantidade : undefined,
        margem_lucro_customizada: margemPercentual,
        impostos_customizados: impostosPercentual,
        comissao_percentual: comissaoPercentual,
        configuracoes: { tipo_margem_lucro: tipoMargemLucroEfetivo },
      };

      return dadosTransformados;
    }

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
    
    // Resolver tipo de margem: do orçamento ou padrão da loja
    const tipoMargemLucroEfetivo =
      (data.tipo_margem_lucro && data.tipo_margem_lucro !== '')
        ? data.tipo_margem_lucro
        : (user?.loja?.tipo_margem_lucro === 'markup' ? 'markup' : 'margem_por_dentro');

    const percentualMargemDecimal = margemPercentual / 100;
    const percentualImpostosDecimal = impostosPercentual / 100;
    const percentualComissaoDecimal = comissaoPercentual / 100;

    let precoFinal: number;
    if (tipoMargemLucroEfetivo === 'markup') {
      // Markup: margem por fora sobre o custo. Preço = Custo*(1+margem) / (1 - impostos - comissão)
      const divisorMarkup = 1 - percentualImpostosDecimal - percentualComissaoDecimal;
      precoFinal = divisorMarkup > 0
        ? (custoTotal * (1 + percentualMargemDecimal)) / divisorMarkup
        : custoTotal * (1 + percentualMargemDecimal);
    } else {
      // Margem por dentro: Preço = Custo / (1 - %Imposto - %Comissão - %Lucro)
      const divisor = 1 - percentualImpostosDecimal - percentualComissaoDecimal - percentualMargemDecimal;
      precoFinal = divisor > 0 ? custoTotal / divisor : custoTotal;
    }

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
      const area = produto.area_produto || 0;
      const quantidade = produto.quantidade || 1;
      
      // Calcular área total do produto (já está em m²)
      const areaTotal = area * quantidade;
      
      // Se não há área, usar apenas quantidade como peso
      const peso = areaTotal > 0 ? areaTotal : quantidade;
      
      console.log(`🔍 Debug - Produto ${index + 1} peso calculado:`, {
        nome: produto.nome_servico,
        area,
        quantidade,
        areaTotal,
        peso
      });
      
      return { ...produto, peso };
    });
    
    // Calcular peso total de todos os produtos
    const pesoTotal = produtosComPeso.reduce((total, produto) => total + produto.peso, 0);
    
    console.log(`🔍 Debug - Peso total calculado:`, pesoTotal);
    
    // Primeiro, calcular custos individuais de todos os produtos
    const custosProdutos = produtosComPeso.map((produto, index) => {
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

      return {
        produto,
        custoTotalProduto,
        custoMaterialProduto,
        custoMaquinaProduto,
        custoFuncaoProduto
      };
    });

    // Calcular custo total real de todos os produtos
    const custoTotalReal = custosProdutos.reduce((total, item) => total + item.custoTotalProduto, 0);
    
    console.log('🔍 Debug - Custo total real calculado:', custoTotalReal);
    console.log('🔍 Debug - Custo total do preview:', custoTotal);

        // Calcular preços individuais usando a fórmula correta
        console.log('🔍 Debug - Calculando preços individuais para cada produto');
        custosProdutos.forEach((item, index) => {
          const { produto, custoTotalProduto } = item;
          
          // Aplicar mesma fórmula do total: Preço = Custo / (1 - %Imposto - %Comissão - %Lucro)
          const precoVendaProduto = divisor > 0 ? custoTotalProduto / divisor : custoTotalProduto;
          const precoUnitarioVenda = precoVendaProduto / produto.quantidade;
          
          // Calcular componentes individuais
          const margemLucroProduto = precoVendaProduto * percentualMargemDecimal;
          const impostosProduto = precoVendaProduto * percentualImpostosDecimal;
          const comissaoProduto = precoVendaProduto * percentualComissaoDecimal;

          produto.custo_total_producao = custoTotalProduto;
          produto.preco_unitario = precoUnitarioVenda;
          produto.preco_total = precoVendaProduto;
          produto.margem_lucro = margemLucroProduto;
          produto.impostos = impostosProduto;
        
          console.log(`🔍 Debug - Produto ${index + 1} calculado:`, {
            nome: produto.nome_servico,
            quantidade: produto.quantidade,
            custo_total_produto: custoTotalProduto,
            preco_venda_produto: precoVendaProduto,
            preco_unitario_venda: precoUnitarioVenda,
            margem_lucro_produto: margemLucroProduto,
            impostos_produto: impostosProduto
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

    // Debug: verificar medidas dos produtos antes de enviar
    console.log('🔍 Debug - Medidas dos produtos ANTES de enviar ao backend:', produtosTransformados.map(p => ({
      nome: p.nome_servico || p.nome,
      largura: p.largura,
      altura: p.altura,
      area: p.area_produto || p.area
    })));

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
      margem_lucro_customizada: margemPercentual,
      impostos_customizados: impostosPercentual,
      comissao_percentual: comissaoPercentual,
      configuracoes: { tipo_margem_lucro: tipoMargemLucroEfetivo },
    };

    // Log detalhado removido para limpar terminal
    // console.log('🔍 Debug - Dados originais do form:', data.itens_produto);
    // console.log('🔍 Debug - Dados transformados:', dadosTransformados);
    // console.log('🔍 Debug - Produtos transformados:', dadosTransformados.produtos);

    return dadosTransformados;
  };

  const handleSubmit = async (data: FormValues) => {
    if (isAtualizando) return;
    setIsAtualizando(true);
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
    } finally {
      setIsAtualizando(false);
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
      
      // Usar dados calculados localmente se disponíveis, senão usar dados do WebSocket
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
    if (isEnviando) return;
    setIsEnviando(true);
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
      
      // Usar dados calculados localmente se disponíveis, senão usar dados do WebSocket
      const dadosTransformados = transformarDadosParaBackend(formData, dadosCalculados);
      
      console.log('🔍 Dados transformados para backend (enviar):', dadosTransformados);
      
      // Se for edição, usar enviar; se for criação, usar create
      let resEnviar: { email_enviado?: boolean; email_destinatario?: string; email_motivo?: string } | undefined;
      if (mode === 'editar' && orcamentoId) {
        resEnviar = await orcamentosApi.enviar(orcamentoId, token) as typeof resEnviar;
        const msg = resEnviar?.email_enviado
          ? `Orçamento enviado! E-mail enviado para ${resEnviar.email_destinatario || 'cliente'}.`
          : resEnviar?.email_motivo
            ? `Orçamento enviado. E-mail não enviado: ${resEnviar.email_motivo}`
            : 'Orçamento enviado com sucesso!';
        toast.success(msg);
      } else {
        // Para novo orçamento, criar e enviar
        const orcamentoCriado = await orcamentosApi.create(dadosTransformados, token);
        if (orcamentoCriado && (orcamentoCriado as { id?: string }).id) {
          resEnviar = await orcamentosApi.enviar((orcamentoCriado as { id: string }).id, token) as typeof resEnviar;
          const msg = resEnviar?.email_enviado
            ? `Orçamento criado e enviado! E-mail enviado para ${resEnviar.email_destinatario || 'cliente'}.`
            : resEnviar?.email_motivo
              ? `Orçamento criado e enviado. E-mail não enviado: ${resEnviar.email_motivo}`
              : 'Orçamento criado e enviado com sucesso!';
          toast.success(msg);
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
    } finally {
      setIsEnviando(false);
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
                  {isAprovado && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-medium">
                      Orçamento aprovado — somente visualização. Nenhuma alteração é permitida.
                    </div>
                  )}
                  <div className={isAprovado ? 'pointer-events-none select-none opacity-95' : ''}>
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
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      {isAprovado ? 'Voltar' : 'Cancelar'}
                    </Button>
                    
                    {!isAprovado && mode === 'template' && (
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
                    
                    {!isAprovado && mode === 'novo' && (
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
                          disabled={loading || isEnviando}
                          className="flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>{loading || isEnviando ? 'Enviando...' : 'Enviar Orçamento'}</span>
                        </Button>
                      </>
                    )}
                    
                    {!isAprovado && mode === 'editar' && (
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
                                disabled={loading || isEnviando}
                                className="flex items-center space-x-2"
                              >
                                <Save className="w-4 h-4" />
                                <span>{loading || isEnviando ? 'Enviando...' : 'Enviar para Cliente'}</span>
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => handleSubmit(form.getValues())}
                              disabled={loading || isAtualizando}
                              className="flex items-center space-x-2"
                            >
                              <Save className="w-4 h-4" />
                              <span>{loading || isAtualizando ? 'Atualizando...' : 'Atualizar Orçamento'}</span>
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
              {isAprovado && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-medium">
                  Orçamento aprovado — somente visualização. Nenhuma alteração é permitida.
                </div>
              )}
              <div className={isAprovado ? 'pointer-events-none select-none opacity-95' : ''}>
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
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {isAprovado ? 'Voltar' : 'Cancelar'}
              </Button>
              
              {!isAprovado && mode === 'template' && (
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
              
              {!isAprovado && mode === 'novo' && (
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
                    disabled={loading || isEnviando}
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading || isEnviando ? 'Enviando...' : 'Enviar Orçamento'}</span>
                  </Button>
                </>
              )}
              
              {!isAprovado && mode === 'editar' && (
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
                          disabled={loading || isEnviando}
                          className="flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>{loading || isEnviando ? 'Enviando...' : 'Enviar para Cliente'}</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="submit"
                        disabled={loading || isAtualizando}
                        className="flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{loading || isAtualizando ? 'Atualizando...' : 'Atualizar Orçamento'}</span>
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

      {/* Chat Flutuante - mostrar para todos os status exceto rascunho e aprovado (aprovado = somente visualização) */}
      {orcamentoId && orcamentoStatus && orcamentoStatus !== 'rascunho' && !isAprovado && (
        <ChatFlutuante 
          orcamentoId={orcamentoId}
          isPublic={false}
          shouldOpen={orcamentoStatus === 'negociando' || orcamentoStatus === 'NEGOCIANDO'}
        />
      )}
    </div>
  );
}
