'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Calculator, CheckCircle2, Save, LayoutTemplate } from 'lucide-react';
import { orcamentosApi, produtosApi } from '@/lib/api-client';
import { createFormSchema, FormValues, validarMateriaisItensProduto } from '../orcamento/schemas/orcamento.schema';
import { useOrcamentoData } from '../orcamento/hooks/useOrcamentoData';
import { useCalculoWebSocket } from '@/hooks/use-calculo-websocket';
import {
  montarPreviewOrcamento,
  resolverTipoMargemLucroOrcamento,
} from '../shared/utils/montar-preview-orcamento';
import { solicitarAtualizacaoBadgesSidebar } from '@/lib/sidebar-badge-refresh';
import { SimuladorPrecificacao } from '@/components/orcamentos-v2/SimuladorPrecificacao';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Função para calcular custo por unidade de uso
const calcularCustoPorUnidadeUso = (insumo: any): number => {
  if (!insumo) return 0;
  
  const custoUnitario = insumo.custo_unitario || 0;
  const fatorConversao = insumo.fator_conversao || 1;
  
  return custoUnitario / fatorConversao;
};

import { mapCamposPrateleiraFormulario } from '../orcamento/utils/map-campos-prateleira';
import {
  mapInstalacaoProdutoBackendParaFormulario,
  mapInstalacaoProdutoFormularioParaBackend,
} from '../orcamento/utils/map-instalacao-formulario';
import {
  deserializarItensModeloOrcamento,
  encontrarIndiceReferenciaModelo,
  itensProntosParaModelo,
  serializarItensModeloOrcamento,
} from '../orcamento/utils/modelo-orcamento.helpers';
import {
  ARTE_PRODUTO_DEFAULTS,
  mapArteProdutoBackendParaFormulario,
  mapArteProdutoFormularioParaBackend,
  mapArteServicosBackendParaFormulario,
  mapArteServicoFormularioParaBackend,
} from '@/components/orcamentos-v2/arte-produto.helpers';
import { ClienteSection, ProdutoSection, ConfiguracoesSection, TituloOrcamentoSection, ModeloOrcamentoSection } from '../orcamento/components';
import { PreviewCalculoV2 } from '../shared/sections';

import { ProdutoSelectionModal } from '../../../app/(main)/produtos/components/produto-selection-modal';
import { ProdutoPrateleiraSelectionModal } from '../../../app/(main)/produtos-finitos/components/produto-prateleira-selection-modal';
import {
  resolverDescricaoDetalhadaProdutoFinito,
  resolverDescricaoResumidaProdutoFinito,
} from '@/components/produtos-finitos/descricao-produto-finito.helpers';
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

const percentualOuPadrao = (valor: unknown, fallback: number): number => {
  if (valor === null || valor === undefined || valor === '') return fallback;
  const parsed = parseNumeroInicial(valor);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Comissão padrão da loja; se não configurada, mantém 5% (legado). */
const comissaoPadraoDaLoja = (loja?: { comissao_padrao?: unknown } | null): number => {
  const raw = loja?.comissao_padrao;
  if (raw === null || raw === undefined || raw === '') return 5;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 5;
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

interface SimuladorSeed {
  custoInicial: number;
  margemInicial: number;
  impostosInicial: number;
  comissaoInicial: number;
  tipoInicial: 'markup' | 'margem_por_dentro';
}

export function OrcamentoV2Form({ 
  mode, 
  initialData, 
  orcamentoId, 
  showPreview = false,
  onSuccess,
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
  const [isFechandoPedido, setIsFechandoPedido] = useState(false);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [showProdutoPrateleiraModal, setShowProdutoPrateleiraModal] = useState(false);
  const [showSimuladorModal, setShowSimuladorModal] = useState(false);
  const [simuladorSeed, setSimuladorSeed] = useState<SimuladorSeed | null>(null);
  const [selectedProdutoIndex, setSelectedProdutoIndex] = useState<number>(0);
  const [showSalvarModeloDialog, setShowSalvarModeloDialog] = useState(false);
  const [nomeModeloOrcamento, setNomeModeloOrcamento] = useState('');
  const [salvandoModelo, setSalvandoModelo] = useState(false);
  const [produtosSectionKey, setProdutosSectionKey] = useState(0);
  const [dadosCarregados, setDadosCarregados] = useState(mode !== 'editar');
  const { clientes, insumos, maquinas, funcoes, servicos, custosIndiretos, fetchInsumos } = useOrcamentoData();
  const { user } = useUser();
  const comissaoPadraoLoja = comissaoPadraoDaLoja(user?.loja);
  const funcaoUsuario = String(user?.funcao || '').toLowerCase();
  const podeFecharPedido = ['admin', 'administrador', 'gerente', 'vendedor'].includes(funcaoUsuario);

  // Hook para WebSocket - capturar dados calculados do preview
  const { resultadoOrcamento, isConnected } = useCalculoWebSocket();
  
  // Estado para armazenar dados calculados localmente
  const [dadosCalculadosLocais, setDadosCalculadosLocais] = useState<any>(null);
  
  // Função para calcular dados localmente quando WebSocket não estiver disponível
  const calcularDadosLocalmente = (formData: FormValues) => {
    try {
      return montarPreviewOrcamento(formData as Record<string, unknown>, {
        datasets: {
          insumos,
          maquinas,
          funcoes,
          servicos,
          custosIndiretos: Array.isArray(custosIndiretos) ? custosIndiretos : [],
        },
        loja: user?.loja,
        comissaoPadrao: comissaoPadraoLoja,
      });
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
      valor_final_manual: '',
      tipo_margem_lucro: '',
      condicoes_comerciais: '',
      prazo_entrega: '10 a 15 dias úteis',
      forma_pagamento: '', // DEPRECATED Fase 6: nao gravado pelo formulario novo; permanece para compatibilidade.
      validade_proposta: '30 dias',
      // Fase 6 - Condicao de pagamento estruturada (defaults vem da loja via CondicaoPagamentoFieldset)
      condicao_pagamento_tipo: undefined,
      condicao_pagamento_entrada_pct: '',
      condicao_pagamento_parcelas: '',
      condicao_pagamento_descricao: '',
      entrega_modalidade_id: '',
      entrega_modalidade_nome: '',
      entrega_usar_endereco_cliente: true,
      entrega_endereco_snapshot: '',
      entrega_cep: '',
      entrega_logradouro: '',
      entrega_numero: '',
      entrega_complemento: '',
      entrega_bairro: '',
      entrega_cidade: '',
      entrega_estado: '',
      entrega_prazo_dias: '',
      entrega_valor_cobrado: '',
      entrega_custo_estimado: '',
      entrega_observacoes: '',
      atendente: 'Equipe Comercial',
      comissao_percentual: '5',
      itens_produto: [
        {
          nome_servico: '',
          descricao: '',
          quantidade_produto: '1',
          largura_produto: '',
          altura_produto: '',
          profundidade_produto: '',
          tem_profundidade: false,
          unidade_medida_produto: 'un',
          area_produto: '',
          perimetro_produto: '',
          geometria_origem: 'MANUAL',
          arquivo_geometria_url: '',
          unidade_geometria: 'mm',
          materiais: [{
            insumo_id: '',
            quantidade: '1',
            material_do_cliente: false,
            usa_medida_propria: false,
            largura_material: '',
            altura_material: '',
            profundidade_material: '',
            unidade_medida_material: 'mm',
          }],
          maquinas: [{ maquina_id: '', horas_utilizadas: '1' }],
          funcoes: [{ funcao_id: '', horas_trabalhadas: '1' }],
          servicos: [{ servico_id: '', horas_trabalhadas: '1' }],
          ...ARTE_PRODUTO_DEFAULTS,
          instalacao_necessaria: false,
          instalacao_tipo_id: '',
          instalacao_regra_cobranca: 'FIXO',
          instalacao_valor_unitario: '',
          instalacao_usar_endereco_entrega: true,
          instalacao_endereco_snapshot: '',
          instalacao_cep: '',
          instalacao_logradouro: '',
          instalacao_numero: '',
          instalacao_complemento: '',
          instalacao_bairro: '',
          instalacao_cidade: '',
          instalacao_estado: '',
          instalacao_preco_cobrado: '',
          instalacao_custo_mao_obra: '',
          instalacao_custo_deslocamento: '',
          instalacao_tempo_estimado_min: '',
          instalacao_quantidade_pessoas: '',
          instalacao_observacoes: '',
          tipo_item: 'SOB_DEMANDA',
          produto_finito_id: '',
          sku_snapshot: '',
          preco_unitario_snapshot: '',
          preco_custo_snapshot: '',
          estoque_catalogo: 0,
          imagem_snapshot_url: '',
        }
      ],
    },
  });
  
  // Função para calcular dados quando necessário (sem useEffect)
  const lojaDefaultsAplicadosRef = useRef(false);

  useEffect(() => {
    if (mode !== 'novo' || lojaDefaultsAplicadosRef.current || !user?.loja) {
      return;
    }

    const loja = user.loja as any;
    form.reset({
      ...form.getValues(),
      margem_lucro_customizada: formatNumeroFormulario(
        percentualOuPadrao(loja.margem_lucro_padrao, 30),
        2,
      ),
      impostos_customizados: formatNumeroFormulario(
        percentualOuPadrao(loja.impostos_padrao, 25),
        2,
      ),
      comissao_percentual: formatNumeroFormulario(comissaoPadraoDaLoja(loja), 2),
      tipo_margem_lucro:
        loja.tipo_margem_lucro === 'markup' ? 'markup' : 'margem_por_dentro',
    });
    lojaDefaultsAplicadosRef.current = true;
  }, [form, mode, user?.loja, comissaoPadraoLoja]);

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

  const abrirSimuladorPrecificacao = () => {
    const formData = form.getValues();
    const calculoLocal = calcularDadosLocalmente(formData);
    const custoInicial = Number(
      calculoLocal
        ? calculoLocal.totais.materiais +
            calculoLocal.totais.maquinas +
            calculoLocal.totais.funcoes +
            calculoLocal.totais.servicos +
            calculoLocal.totais.indiretos
        : 0,
    );
    const margemInicial = percentualOuPadrao(formData.margem_lucro_customizada, 30);
    const impostosInicial = percentualOuPadrao(formData.impostos_customizados, 18);
    const comissaoInicial = percentualOuPadrao(formData.comissao_percentual, comissaoPadraoLoja);
    const tipoInicial =
      formData.tipo_margem_lucro ||
      (user?.loja?.tipo_margem_lucro === 'markup' ? 'markup' : 'margem_por_dentro');

    setSimuladorSeed({
      custoInicial,
      margemInicial,
      impostosInicial,
      comissaoInicial,
      tipoInicial,
    });
    setShowSimuladorModal(true);
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

  // Carregar dados iniciais se for edição/template
  useEffect(() => {
    if ((mode === 'editar' || mode === 'template') && initialData) {
      // Debug logs removidos para limpar terminal
      // console.log('🔍 Debug - OrcamentoForm - Dados recebidos para reset:', initialData);
      // console.log('🔍 Debug - OrcamentoForm - Cliente ID recebido:', initialData.cliente_id);
      // console.log('🔍 Debug - OrcamentoForm - Estrutura completa dos dados:', JSON.stringify(initialData, null, 2));
      
      // Verificar se os dados estão no formato esperado pelo formulário
      const configuracoesIniciais = initialData.configuracoes as
        | { tipo_margem_lucro?: unknown }
        | undefined;
      const dadosFormatados = {
        cliente_id: String(initialData.cliente_id || ''),
        titulo: String(initialData.titulo || ''),
        margem_lucro_customizada: String(initialData.margem_lucro_customizada ?? '30'),
        impostos_customizados: String(initialData.impostos_customizados ?? '25'),
        valor_final_manual:
          initialData.valor_final_manual != null
            ? String(initialData.valor_final_manual)
            : '',
        comissao_percentual: String(
          initialData.comissao_percentual ?? comissaoPadraoLoja,
        ),
        tipo_margem_lucro: String(
          initialData.tipo_margem_lucro ?? configuracoesIniciais?.tipo_margem_lucro ?? '',
        ),
        preco_final_persistido: String(initialData.preco_final_persistido ?? ''),
        condicoes_comerciais: String(initialData.condicoes_comerciais || ''),
        prazo_entrega: String(initialData.prazo_entrega || '10 a 15 dias úteis'),
        forma_pagamento: String(initialData.forma_pagamento || ''),
        validade_proposta: String(initialData.validade_proposta || '30 dias'),
        // Fase 6 - Condicao de pagamento estruturada
        condicao_pagamento_tipo: (initialData.condicao_pagamento_tipo as
          | 'A_VISTA'
          | 'ENTRADA_SALDO'
          | 'FATURADO_30'
          | 'FATURADO_60'
          | 'FATURADO_90'
          | 'PARCELADO'
          | 'PERSONALIZADO'
          | undefined) ?? undefined,
        condicao_pagamento_entrada_pct:
          initialData.condicao_pagamento_entrada_pct != null
            ? String(initialData.condicao_pagamento_entrada_pct)
            : '',
        condicao_pagamento_parcelas:
          initialData.condicao_pagamento_parcelas != null
            ? String(initialData.condicao_pagamento_parcelas)
            : '',
        condicao_pagamento_descricao: String(initialData.condicao_pagamento_descricao ?? ''),
        entrega_modalidade_id: String(initialData.entrega_modalidade_id ?? ''),
        entrega_modalidade_nome: String(initialData.entrega_modalidade_nome ?? ''),
        entrega_usar_endereco_cliente:
          initialData.entrega_usar_endereco_cliente !== false,
        entrega_endereco_snapshot: String(initialData.entrega_endereco_snapshot ?? ''),
        entrega_cep: String(initialData.entrega_cep ?? ''),
        entrega_logradouro: String(initialData.entrega_logradouro ?? ''),
        entrega_numero: String(initialData.entrega_numero ?? ''),
        entrega_complemento: String(initialData.entrega_complemento ?? ''),
        entrega_bairro: String(initialData.entrega_bairro ?? ''),
        entrega_cidade: String(initialData.entrega_cidade ?? ''),
        entrega_estado: String(initialData.entrega_estado ?? ''),
        entrega_prazo_dias:
          initialData.entrega_prazo_dias != null
            ? String(initialData.entrega_prazo_dias)
            : '',
        entrega_valor_cobrado:
          initialData.entrega_valor_cobrado != null
            ? String(initialData.entrega_valor_cobrado)
            : '',
        entrega_custo_estimado:
          initialData.entrega_custo_estimado != null
            ? String(initialData.entrega_custo_estimado)
            : '',
        entrega_observacoes: String(initialData.entrega_observacoes ?? ''),
        atendente: String(initialData.atendente || 'Equipe Comercial'),
        itens_produto: (() => {
          const mapProdutoBackendParaFormulario = (produto: any) => {
            const quantidadeProdutoNumero = parseNumeroInicial(produto.quantidade || '1');
            const profundidadeRaw = produto.profundidade?.toString() || '';
            const profundidadeNum = Number(String(profundidadeRaw).replace(',', '.'));
            const temProfundidade = !!profundidadeRaw && !isNaN(profundidadeNum) && profundidadeNum > 0;
            const isPrateleira =
              String(produto.tipo_item || 'SOB_DEMANDA').toUpperCase() === 'PRODUTO_FINITO';

            return {
              nome_servico: String(produto.nome_servico || produto.nome || ''),
              descricao: String(produto.descricao || ''),
              quantidade_produto: String(produto.quantidade || '1'),
              largura_produto: String(produto.largura?.toString() || ''),
              altura_produto: String(produto.altura?.toString() || ''),
              profundidade_produto: profundidadeRaw,
              tem_profundidade: temProfundidade,
              unidade_medida_produto: String(produto.unidade_medida || 'un'),
              area_produto: String(produto.area_produto?.toString() || produto.area?.toString() || ''),
              perimetro_produto: String(produto.perimetro_produto?.toString() || ''),
              geometria_origem: produto.geometria_origem || 'MANUAL',
              arquivo_geometria_url: String(produto.arquivo_geometria_url || ''),
              unidade_geometria: produto.unidade_geometria || undefined,
              materiais: isPrateleira
                ? []
                : (produto.insumos || []).map((ins: any) => {
                    let calculoChapa: Record<string, unknown> | null = null;
                    if (ins.calculo_chapa) {
                      try {
                        calculoChapa =
                          typeof ins.calculo_chapa === 'string'
                            ? JSON.parse(ins.calculo_chapa)
                            : ins.calculo_chapa;
                      } catch {
                        calculoChapa = null;
                      }
                    }
                    return {
                      item_insumo_id: ins.id,
                      insumo_id: ins.insumo_id,
                      quantidade: ajustarQuantidadeMaterialParaFormulario(
                        ins.quantidade,
                        ins.unidade || ins.unidade_consumo,
                        quantidadeProdutoNumero,
                      ),
                      unidade: ins.unidade || ins.unidade_consumo,
                      material_do_cliente: Boolean(ins.material_do_cliente),
                      usa_medida_propria: Boolean(ins.usa_medida_propria),
                      largura_material: ins.largura_material?.toString() || '',
                      altura_material: ins.altura_material?.toString() || '',
                      profundidade_material: ins.profundidade_material?.toString() || '',
                      unidade_medida_material:
                        ins.unidade_medida_material || produto.unidade_geometria || 'mm',
                      calculo_chapa: calculoChapa,
                    };
                  }),
              maquinas: isPrateleira
                ? []
                : (produto.maquinas || []).map((maq: any) => ({
                    maquina_id: maq.maquina_id,
                    horas_utilizadas: String(maq.horas_utilizadas || maq.tempo_horas || '1'),
                  })),
              funcoes: isPrateleira
                ? []
                : (produto.funcoes || []).map((func: any) => ({
                    funcao_id: func.funcao_id,
                    horas_trabalhadas: String(func.horas_trabalhadas || func.tempo_horas || '1'),
                  })),
              servicos: isPrateleira
                ? []
                : mapArteServicosBackendParaFormulario(produto.servicos_manuais),
              ...mapArteProdutoBackendParaFormulario(produto),
              ...mapInstalacaoProdutoBackendParaFormulario(produto),
              ...mapCamposPrateleiraFormulario(produto),
            };
          };

          // Preferir produtos do backend (fonte completa, com tipo_item e produto_finito)
          if (initialData.produtos && Array.isArray(initialData.produtos) && initialData.produtos.length > 0) {
            return (initialData.produtos as any[]).map(mapProdutoBackendParaFormulario);
          }

          // Se tem itens_produto no initialData, usar eles
          if (initialData.itens_produto && Array.isArray(initialData.itens_produto) && initialData.itens_produto.length > 0) {
            return (initialData.itens_produto as any[]).map((produto: any) => {
              const quantidadeProdutoNumero = parseNumeroInicial(
                produto.quantidade_produto || produto.quantidade || '1',
              );
              // Fase 11: derivacao 'source of truth unica' - tem_profundidade vem do valor real.
              // Se profundidade > 0, marca a flag; se ausente/0, oculta o campo.
              const profundidadeRaw = produto.profundidade_produto?.toString() || produto.profundidade?.toString() || '';
              const profundidadeNum = Number(String(profundidadeRaw).replace(',', '.'));
              const temProfundidade = !!profundidadeRaw && !isNaN(profundidadeNum) && profundidadeNum > 0;
              const isPrateleira =
                String(produto.tipo_item || 'SOB_DEMANDA').toUpperCase() === 'PRODUTO_FINITO';
              return {
                nome_servico: String(produto.nome_servico || produto.nome || ''),
                descricao: String(produto.descricao || ''),
                quantidade_produto: String(produto.quantidade_produto || produto.quantidade || '1'),
                largura_produto: String(produto.largura_produto?.toString() || produto.largura?.toString() || ''),
                altura_produto: String(produto.altura_produto?.toString() || produto.altura?.toString() || ''),
                profundidade_produto: profundidadeRaw,
                tem_profundidade: temProfundidade,
                unidade_medida_produto: String(
                  produto.unidade_medida_produto || produto.unidade_medida || produto.unidade || 'un',
                ),
                area_produto: String(produto.area_produto?.toString() || produto.area?.toString() || ''),
                perimetro_produto: String(produto.perimetro_produto?.toString() || ''),
                geometria_origem: produto.geometria_origem || 'MANUAL',
                arquivo_geometria_url: String(produto.arquivo_geometria_url || ''),
                unidade_geometria: produto.unidade_geometria || undefined,
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
                servicos: isPrateleira
                ? []
                : mapArteServicosBackendParaFormulario(
                    produto.servicos_manuais || produto.servicos,
                  ),
                ...mapArteProdutoBackendParaFormulario(produto),
                ...mapInstalacaoProdutoBackendParaFormulario(produto),
                ...mapCamposPrateleiraFormulario(produto),
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
              profundidade_produto: '',
              tem_profundidade: false,
              unidade_medida_produto: 'un',
              area_produto: '',
              perimetro_produto: '',
              geometria_origem: 'MANUAL',
              arquivo_geometria_url: '',
              unidade_geometria: 'mm',
              materiais: [],
              maquinas: [],
              funcoes: [],
              servicos: [],
              instalacao_necessaria: false,
              instalacao_tipo_id: '',
              instalacao_regra_cobranca: 'FIXO',
              instalacao_valor_unitario: '',
              instalacao_usar_endereco_entrega: true,
              instalacao_endereco_snapshot: '',
              instalacao_cep: '',
              instalacao_logradouro: '',
              instalacao_numero: '',
              instalacao_complemento: '',
              instalacao_bairro: '',
              instalacao_cidade: '',
              instalacao_estado: '',
              instalacao_preco_cobrado: '',
              instalacao_custo_mao_obra: '',
              instalacao_custo_deslocamento: '',
              instalacao_tempo_estimado_min: '',
              instalacao_quantidade_pessoas: '',
              instalacao_observacoes: '',
            }
          ];
        })(),
      };
      
      // Debug logs removidos para limpar terminal
      // console.log('🔍 Debug - OrcamentoForm - Dados formatados para o form:', dadosFormatados);
      
      // Tentar reset com delay para garantir que o formulário esteja pronto
      setTimeout(() => {
        form.reset(dadosFormatados as FormValues);
        setProdutosSectionKey((k) => k + 1);
        setDadosCarregados(false);
        setTimeout(() => setDadosCarregados(true), 450);
      }, 100);
    }
  }, [mode, initialData]);

  useEffect(() => {
    if (mode === 'editar' && initialData && insumos.length > 0) {
      setDadosCarregados(true);
    }
  }, [mode, initialData, insumos.length]);

  // Debug: verificar se o status está sendo recebido
  useEffect(() => {
    if (mode === 'editar') {
      console.log('🔍 Debug - OrcamentoForm - Status recebido:', orcamentoStatus);
      console.log('🔍 Debug - OrcamentoForm - Mode:', mode);
      console.log('🔍 Debug - OrcamentoForm - InitialData:', initialData);
    }
  }, [mode, orcamentoStatus, initialData]);

  // Função auxiliar para transformar dados do frontend para o formato do backend
  const montarProdutoPrateleiraBackend = (
    produto: FormValues['itens_produto'][number],
    index: number,
    fixDecimalFn: (valor: unknown, precision?: number) => number,
    normalizarNumeroFn: (valor: unknown) => number,
  ) => {
    const quantidade = Math.max(
      Math.floor(normalizarNumeroFn(produto.quantidade_produto) || 1),
      1,
    );
    const precoUnitario = fixDecimalFn(
      normalizarNumeroFn(
        (produto as any)?.preco_unitario_snapshot || (produto as any)?.preco_unitario,
      ),
    );
    const precoCustoUnitario = fixDecimalFn(
      normalizarNumeroFn((produto as any)?.preco_custo_snapshot),
    );
    const precoTotal = fixDecimalFn(precoUnitario * quantidade);
    const custoTotalProducao = fixDecimalFn(precoCustoUnitario * quantidade);
    const nomeProduto = produto.nome_servico?.trim() || `Produto ${index + 1}`;

    return {
      nome_servico: nomeProduto,
      nome: nomeProduto,
      descricao: produto.descricao || '',
      quantidade,
      unidade: 'un',
      unidade_medida: 'un',
      tipo_item: 'PRODUTO_FINITO' as const,
      produto_finito_id: (produto as any)?.produto_finito_id || undefined,
      sku_snapshot: (produto as any)?.sku_snapshot || undefined,
      custo_total_producao: custoTotalProducao,
      preco_unitario: precoUnitario,
      preco_total: precoTotal,
      margem_lucro: 0,
      impostos: 0,
      ...mapInstalacaoProdutoFormularioParaBackend(
        produto as Record<string, unknown>,
        normalizarNumeroFn,
        fixDecimalFn,
      ),
    };
  };

  const transformarDadosParaBackend = (data: FormValues, dadosCalculados?: any) => {
    console.log('🔍 Debug - transformarDadosParaBackend - dadosCalculados:', dadosCalculados);
    const itensProduto = (Array.isArray(data.itens_produto) ? data.itens_produto : []).filter(
      (produto): produto is FormValues['itens_produto'][number] => Boolean(produto)
    );

    // Definir variáveis de percentuais que estavam faltando
    const custosIndiretosPercentual = 15; // Valor padrão
    const margemPercentual = percentualOuPadrao(data?.margem_lucro_customizada, 30);
    const impostosPercentual = percentualOuPadrao(data?.impostos_customizados, 25);
    const comissaoPercentual = percentualOuPadrao(data?.comissao_percentual, comissaoPadraoLoja);

    const normalizarNumero = (valor: unknown): number => {
      if (typeof valor === 'number') return valor;
      if (typeof valor === 'string') {
        const cleaned = valor.replace(/[^0-9,.-]/g, '');
        const normalized =
          cleaned.includes(',') && cleaned.includes('.')
            ? cleaned.replace(/\./g, '').replace(',', '.')
            : cleaned.replace(',', '.');
        const parsed = Number(normalized);
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
      const fator = 10 ** precision;
      return Math.round((numero + Number.EPSILON) * fator) / fator;
    };

    const valorFinalManualTexto =
      typeof data.valor_final_manual === 'string'
        ? data.valor_final_manual.trim()
        : data.valor_final_manual != null
          ? String(data.valor_final_manual).trim()
          : '';
    const temValorFinalManual = valorFinalManualTexto.length > 0;
    const valorFinalManual = fixDecimal(normalizarNumero(valorFinalManualTexto));
    const resolverPrecoFinal = (precoCalculado: number): number =>
      temValorFinalManual ? valorFinalManual : fixDecimal(precoCalculado);

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
          horas_trabalhadas: fixDecimal(
            normalizarNumero(servico.horas_trabalhadas),
            3,
          ),
          custo_hora: fixDecimal(normalizarNumero((servico as any).custo_hora)),
          custo_total: fixDecimal(normalizarNumero((servico as any).custo_total)),
          origem: (servico as any).origem,
          descricao: (servico as any).descricao,
        }))
        .filter((servico) => servico.tempo_horas > 0);

      return vazioParaUndefined(itens);
    };

    const montarInstalacaoProduto = (produto: FormValues['itens_produto'][number]) =>
      mapInstalacaoProdutoFormularioParaBackend(
        produto as Record<string, unknown>,
        normalizarNumero,
        fixDecimal,
      );

    const montarEntregaOrcamento = () => ({
      entrega_modalidade_id: data.entrega_modalidade_id || undefined,
      entrega_usar_endereco_cliente: data.entrega_usar_endereco_cliente !== false,
      entrega_endereco_snapshot: data.entrega_endereco_snapshot || undefined,
      entrega_cep: data.entrega_cep || undefined,
      entrega_logradouro: data.entrega_logradouro || undefined,
      entrega_numero: data.entrega_numero || undefined,
      entrega_complemento: data.entrega_complemento || undefined,
      entrega_bairro: data.entrega_bairro || undefined,
      entrega_cidade: data.entrega_cidade || undefined,
      entrega_estado: data.entrega_estado || undefined,
      entrega_prazo_dias: data.entrega_prazo_dias
        ? normalizarNumero(data.entrega_prazo_dias)
        : undefined,
      entrega_valor_cobrado: fixDecimal(
        normalizarNumero(data.entrega_valor_cobrado),
      ),
      entrega_custo_estimado: fixDecimal(
        normalizarNumero(data.entrega_custo_estimado),
      ),
      entrega_observacoes: data.entrega_observacoes || undefined,
    });

    const somarCampo = (lista: unknown[] | undefined, campo: string): number => {
      if (!Array.isArray(lista)) {
        return 0;
      }

      return lista.reduce<number>((acc, item) => {
        const valor = Number((item as Record<string, unknown>)?.[campo] ?? 0);
        return acc + (Number.isFinite(valor) ? valor : 0);
      }, 0);
    };

    const previewUnificado =
      dadosCalculados?.resumo && Array.isArray(dadosCalculados?.produtos)
        ? dadosCalculados
        : montarPreviewOrcamento(data as Record<string, unknown>, {
            datasets: {
              insumos,
              maquinas,
              funcoes,
              servicos,
              custosIndiretos: Array.isArray(custosIndiretos) ? custosIndiretos : [],
            },
            loja: user?.loja,
            comissaoPadrao: comissaoPadraoLoja,
          });

    const produtosPreview = previewUnificado?.produtos;
    const totaisPreview = previewUnificado?.totais;
    const resumoPreview = previewUnificado?.resumo;
    const custosIndiretosPreview = previewUnificado?.custosIndiretosResumo;

    if (previewUnificado && produtosPreview && produtosPreview.length > 0) {
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
        if (
          String((produtoFormulario as any)?.tipo_item || 'SOB_DEMANDA').toUpperCase() ===
          'PRODUTO_FINITO'
        ) {
          return montarProdutoPrateleiraBackend(
            produtoFormulario,
            index,
            fixDecimal,
            normalizarNumero,
          );
        }

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
        const perimetroProduto = fixDecimal(
          normalizarNumero(produtoFormulario.perimetro_produto),
          2,
        );
        const profundidadePreview = normalizarNumero(
          (dimensoesPreview as any)?.profundidade ??
            previewProduto?.profundidade ??
            (produtoFormulario as any)?.profundidade_produto,
        );
        const profundidade = profundidadePreview > 0 ? fixDecimal(profundidadePreview, 3) : null;
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
                    (
                      produtoFormulario.materiais?.find(
                        (item) => item?.insumo_id === material.insumo_id,
                      ) as { unidade?: string } | undefined
                    )?.unidade;
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

        const instalacao = montarInstalacaoProduto(produtoFormulario);
        const custoInstalacaoProduto = fixDecimal(
          Number(instalacao.instalacao_custo_mao_obra || 0) +
            Number(instalacao.instalacao_custo_deslocamento || 0),
        );
        const precoInstalacaoProduto = fixDecimal(
          Number(instalacao.instalacao_preco_cobrado || 0),
        );

        const custoTotalProducaoBase = fixDecimal(
          previewProduto?.custo_total_producao ??
            custoMateriaisProduto + custoMaquinasProduto + custoFuncoesProduto + custoServicosProduto,
        );
        const custoTotalProducao = fixDecimal(
          custoTotalProducaoBase + custoInstalacaoProduto,
        );

        const precoTotalProduto = fixDecimal(
          (previewProduto?.preco_venda_total ??
            previewProduto?.preco_total ??
            custoTotalProducaoBase) + precoInstalacaoProduto,
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
          profundidade,
          area,
          perimetro_produto: perimetroProduto || undefined,
          unidade_geometria: produtoFormulario.unidade_geometria,
          geometria_origem: produtoFormulario.geometria_origem || 'MANUAL',
          arquivo_geometria_url:
            produtoFormulario.arquivo_geometria_url || undefined,
          ...mapArteProdutoFormularioParaBackend(
            produtoFormulario as Record<string, unknown>,
          ),
          custo_total_producao: custoTotalProducao,
          preco_unitario: precoUnitarioProduto,
          preco_total: precoTotalProduto,
          margem_lucro: margemLucroProduto,
          impostos: impostosProduto,
          ...instalacao,
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
      const custoInstalacoes = fixDecimal(
        produtosTransformadosPreview.reduce(
          (total, produto) =>
            total +
            Number(produto.instalacao_custo_mao_obra || 0) +
            Number(produto.instalacao_custo_deslocamento || 0),
          0,
        ),
      );
      const precoInstalacoes = fixDecimal(
        produtosTransformadosPreview.reduce(
          (total, produto) =>
            total + Number(produto.instalacao_preco_cobrado || 0),
          0,
        ),
      );
      const entrega = montarEntregaOrcamento();
      const entregaValor = Number(entrega.entrega_valor_cobrado || 0);
      const entregaCusto = Number(entrega.entrega_custo_estimado || 0);
      const custoMaoObraProducao = fixDecimal(custoMaquinas + custoFuncoes + custoServicos);
      const custoMaoObra = fixDecimal(custoMaoObraProducao + custoInstalacoes);
      const custoProducaoBase = fixDecimal(
        resumoPreview?.total_custo_producao ??
          custoMaterial + custoMaoObraProducao + custoIndiretos,
      );
      const custoTotal = fixDecimal(custoProducaoBase + custoInstalacoes + entregaCusto);

      const tipoMargemLucroEfetivo = resolverTipoMargemLucroOrcamento(
        data as Record<string, unknown>,
        user?.loja,
      );

      // Fonte única: totais do mesmo motor do PreviewCalculoV2
      const precoFinal = fixDecimal(resumoPreview?.preco_final ?? 0);
      const margemLucro = fixDecimal(resumoPreview?.total_margem_lucro ?? 0);
      const impostos = fixDecimal(resumoPreview?.total_impostos ?? 0);
      const horasProducao = fixDecimal(
        resumoPreview?.tempo_total_producao ?? horasTotalPreview,
        3,
      );

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
        // forma_pagamento: DEPRECATED Fase 6 - nao gravamos mais; backend deriva da condicao estruturada
        validade_proposta: data.validade_proposta,
        // Fase 6 - Condicao de pagamento estruturada
        condicao_pagamento_tipo: data.condicao_pagamento_tipo,
        condicao_pagamento_entrada_pct: data.condicao_pagamento_entrada_pct
          ? Number(String(data.condicao_pagamento_entrada_pct).replace(',', '.'))
          : undefined,
        condicao_pagamento_parcelas: data.condicao_pagamento_parcelas
          ? Number(data.condicao_pagamento_parcelas)
          : undefined,
        condicao_pagamento_descricao: data.condicao_pagamento_descricao || undefined,
        atendente: data.atendente,
        comissao_percentual: comissaoPercentualEfetiva,
        tipo: 'produto_servico',
        tipo_orcamento: 'produto_servico',
        horas_producao: Math.max(horasProducao, 0.01),
        custo_material: custoMaterial,
        custo_mao_obra: custoMaoObra,
        custo_indireto: custoIndiretos,
        custo_total: custoTotal,
        margem_lucro: margemLucro,
        impostos,
        preco_final: precoFinal,
        produtos: produtosTransformadosPreview,
        ...entrega,
        largura_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.largura : undefined,
        altura_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.altura : undefined,
        area_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.area : undefined,
        unidade_medida_produto: primeiroProdutoTransformado
          ? primeiroProdutoTransformado.unidade
          : undefined,
        quantidade_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.quantidade : undefined,
        margem_lucro_customizada: margemPercentual,
        impostos_customizados: impostosPercentual,
        tipo_margem_lucro: tipoMargemLucroEfetivo,
        configuracoes: {
          tipo_margem_lucro: tipoMargemLucroEfetivo,
          valor_final_manual: temValorFinalManual ? valorFinalManual : null,
          entrega_modalidade_nome: data.entrega_modalidade_nome?.trim() || undefined,
        },
      };

      return dadosTransformados;
    }

    const produtosTransformados = itensProduto.map((produto, index) => {
      if (
        String((produto as any)?.tipo_item || 'SOB_DEMANDA').toUpperCase() === 'PRODUTO_FINITO'
      ) {
        return montarProdutoPrateleiraBackend(produto, index, fixDecimal, normalizarNumero);
      }

      const quantidade = Math.max(normalizarNumero(produto.quantidade_produto) || 1, 1);
      const largura = normalizarNumero(produto.largura_produto);
      const altura = normalizarNumero(produto.altura_produto);
      const area = normalizarNumero(produto.area_produto);
      const perimetroProduto = normalizarNumero(produto.perimetro_produto);
      // Fase 11: profundidade so vai no payload quando ha valor numerico > 0.
      // Source-of-truth unica (guardrail 3): o VALOR DIGITADO e a fonte da verdade,
      // nao a flag. Isso evita perder profundidade caso a flag 'tem_profundidade'
      // do react-hook-form fique dessincronizada do checkbox visual em alguma race
      // condition. Quando profundidade_produto e vazio/0, envia null (produto 2D).
      const profundidadeRaw = (produto as any)?.profundidade_produto;
      const profundidadeNum = normalizarNumero(profundidadeRaw);
      const profundidade = profundidadeNum > 0 ? profundidadeNum : null;

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
        profundidade,
        area,
        area_produto: area,
        perimetro_produto: perimetroProduto || undefined,
        unidade_geometria: produto.unidade_geometria,
        geometria_origem: produto.geometria_origem || 'MANUAL',
        arquivo_geometria_url: produto.arquivo_geometria_url || undefined,
        ...mapArteProdutoFormularioParaBackend(
          produto as Record<string, unknown>,
        ),
        insumos: Array.isArray(produto.materiais)
          ? (produto.materiais || [])
            .filter((material) => material?.insumo_id)
            .map((material) => ({
              insumo_id: material.insumo_id,
              quantidade: normalizarNumero(material.quantidade),
              unidade: (material as any)?.unidade || undefined,
              preco_unitario: 0,
              preco_total: 0,
              material_do_cliente: Boolean(material.material_do_cliente),
              usa_medida_propria: Boolean((material as any)?.usa_medida_propria),
              largura_material: (material as any)?.usa_medida_propria
                ? normalizarNumero((material as any)?.largura_material)
                : undefined,
              altura_material: (material as any)?.usa_medida_propria
                ? normalizarNumero((material as any)?.altura_material)
                : undefined,
              profundidade_material: (material as any)?.usa_medida_propria
                ? normalizarNumero((material as any)?.profundidade_material)
                : undefined,
              unidade_medida_material: (material as any)?.usa_medida_propria
                ? (material as any)?.unidade_medida_material || produto.unidade_geometria || 'mm'
                : undefined,
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
            .map((servico) =>
              mapArteServicoFormularioParaBackend(
                servico as Record<string, unknown>,
                normalizarNumero,
              ),
            )
          : undefined,
        custos_indiretos: undefined,
        custo_total_producao: 0,
        // Calcular valores individuais do produto baseado nos dados calculados
        preco_unitario: 0, // Será calculado abaixo
        preco_total: 0, // Será calculado abaixo
        margem_lucro: 0, // Será calculado abaixo
        impostos: 0, // Será calculado abaixo
        ...montarInstalacaoProduto(produto),
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
    const custoInstalacoes = produtosTransformados.reduce(
      (total, produto) =>
        total +
        Number(produto.instalacao_custo_mao_obra || 0) +
        Number(produto.instalacao_custo_deslocamento || 0),
      0,
    );
    const precoInstalacoes = produtosTransformados.reduce(
      (total, produto) => total + Number(produto.instalacao_preco_cobrado || 0),
      0,
    );
    const entrega = montarEntregaOrcamento();
    const entregaValor = Number(entrega.entrega_valor_cobrado || 0);
    const entregaCusto = Number(entrega.entrega_custo_estimado || 0);
    const custoMaoObraProducao = custoMaquinas + custoFuncoes + custoServicos;
    const custoMaoObra = custoMaoObraProducao + custoInstalacoes;
    const custoProducaoBase = custoMaterial + custoMaoObraProducao + custoIndiretos;
    const custoTotal = custoProducaoBase + custoInstalacoes + entregaCusto;
    
    // Calcular preço final com margem, impostos e comissão (fonte única: montarPreviewOrcamento)
    const previewFallback =
      previewUnificado ??
      montarPreviewOrcamento(data as Record<string, unknown>, {
        datasets: {
          insumos,
          maquinas,
          funcoes,
          servicos,
          custosIndiretos: Array.isArray(custosIndiretos) ? custosIndiretos : [],
        },
        loja: user?.loja,
        comissaoPadrao: comissaoPadraoLoja,
      });

    const resumoFallback = previewFallback?.resumo;
    const percentualMargemDecimal = margemPercentual / 100;
    const percentualImpostosDecimal = impostosPercentual / 100;
    const percentualComissaoDecimal = comissaoPercentual / 100;

    let precoFinal: number;
    let margemLucro: number;
    let impostos: number;

    if (resumoFallback) {
      precoFinal = fixDecimal(resumoFallback.preco_final);
      margemLucro = fixDecimal(resumoFallback.total_margem_lucro);
      impostos = fixDecimal(resumoFallback.total_impostos);
    } else {
      const tipoMargemLucroEfetivo = resolverTipoMargemLucroOrcamento(
        data as Record<string, unknown>,
        user?.loja,
      );
      const divisorMargemPorDentro =
        1 - percentualImpostosDecimal - percentualComissaoDecimal - percentualMargemDecimal;
      if (tipoMargemLucroEfetivo === 'markup') {
        const divisorMarkup = 1 - percentualImpostosDecimal - percentualComissaoDecimal;
        precoFinal =
          divisorMarkup > 0
            ? (custoProducaoBase * (1 + percentualMargemDecimal)) / divisorMarkup
            : custoProducaoBase * (1 + percentualMargemDecimal);
      } else {
        precoFinal =
          divisorMargemPorDentro > 0
            ? custoProducaoBase / divisorMargemPorDentro
            : custoProducaoBase;
      }
      precoFinal = fixDecimal(precoFinal + precoInstalacoes + entregaValor);
      precoFinal = resolverPrecoFinal(precoFinal);
      margemLucro = fixDecimal(precoFinal * percentualMargemDecimal);
      impostos = fixDecimal(precoFinal * percentualImpostosDecimal);
    }

    const comissao = fixDecimal(
      resumoFallback?.comissao_total ?? precoFinal * percentualComissaoDecimal,
    );
    
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
        return total + (normalizarNumero(maquina.tempo_horas ?? maquina.horas_utilizadas) * custoHora);
      }, 0) || 0;

      const custoFuncaoProduto = produto.funcoes?.reduce((total: number, funcao: any) => {
        const funcaoEncontrada = funcoes.find(f => f.id === funcao.funcao_id);
        const custoHora = funcaoEncontrada ? funcaoEncontrada.custo_hora : 0;
        return total + (normalizarNumero(funcao.tempo_horas ?? funcao.horas_trabalhadas) * custoHora);
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

          if (produto.tipo_item === 'PRODUTO_FINITO') {
            return;
          }
          
          // Aplicar mesma fórmula do total: Preço = Custo / (1 - %Imposto - %Comissão - %Lucro)
          const precoVendaProduto =
            tipoMargemLucroEfetivo === 'markup'
              ? (() => {
                  const divisorMarkup = 1 - percentualImpostosDecimal - percentualComissaoDecimal;
                  return divisorMarkup > 0
                    ? (custoTotalProduto * (1 + percentualMargemDecimal)) / divisorMarkup
                    : custoTotalProduto * (1 + percentualMargemDecimal);
                })()
              : divisorMargemPorDentro > 0
                ? custoTotalProduto / divisorMargemPorDentro
                : custoTotalProduto;
          const custoInstalacaoProduto =
            Number(produto.instalacao_custo_mao_obra || 0) +
            Number(produto.instalacao_custo_deslocamento || 0);
          const precoInstalacaoProduto = Number(produto.instalacao_preco_cobrado || 0);
          const precoVendaProdutoComInstalacao =
            precoVendaProduto + precoInstalacaoProduto;
          const custoTotalProdutoComInstalacao =
            custoTotalProduto + custoInstalacaoProduto;
          const precoUnitarioVenda =
            precoVendaProdutoComInstalacao / produto.quantidade;
          
          // Calcular componentes individuais
          const margemLucroProduto = precoVendaProdutoComInstalacao * percentualMargemDecimal;
          const impostosProduto = precoVendaProdutoComInstalacao * percentualImpostosDecimal;
          const comissaoProduto = precoVendaProdutoComInstalacao * percentualComissaoDecimal;

          produto.custo_total_producao = custoTotalProdutoComInstalacao;
          produto.preco_unitario = precoUnitarioVenda;
          produto.preco_total = precoVendaProdutoComInstalacao;
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
      if (produto.tipo_item === 'PRODUTO_FINITO') {
        return;
      }
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
      // forma_pagamento: DEPRECATED Fase 6 - nao gravamos mais; backend deriva da condicao estruturada
      validade_proposta: data.validade_proposta,
      // Fase 6 - Condicao de pagamento estruturada
      condicao_pagamento_tipo: data.condicao_pagamento_tipo,
      condicao_pagamento_entrada_pct: data.condicao_pagamento_entrada_pct
        ? Number(String(data.condicao_pagamento_entrada_pct).replace(',', '.'))
        : undefined,
      condicao_pagamento_parcelas: data.condicao_pagamento_parcelas
        ? Number(data.condicao_pagamento_parcelas)
        : undefined,
      condicao_pagamento_descricao: data.condicao_pagamento_descricao || undefined,
      atendente: data.atendente,
      tipo: tipoOrcamento,
      tipo_orcamento: tipoOrcamento,
      horas_producao: Math.max(
        produtosTransformados.reduce((total, produto) => {
          const horasMaquinas = (produto.maquinas || []).reduce((acc, maquina) => acc + (maquina.tempo_horas || 0), 0);
          const horasFuncoes = (produto.funcoes || []).reduce((acc, funcao) => acc + (funcao.tempo_horas || 0), 0);
          const horasServicos = (produto.servicos_manuais || []).reduce((acc, servico) => acc + (servico.tempo_horas || 0), 0);
          return total + horasMaquinas + horasFuncoes + horasServicos;
        }, 0),
        0.01,
      ),
      // Usar dados calculados do preview se disponíveis, senão usar zeros
      custo_material: custoMaterial,
      custo_mao_obra: custoMaoObra,
      custo_indireto: custoIndiretos,
      custo_total: custoTotal,
      margem_lucro: margemLucro,
      impostos: impostos,
      preco_final: precoFinal,
      produtos: produtosTransformados,
      ...entrega,
      largura_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.largura : undefined,
      altura_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.altura : undefined,
      area_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.area : undefined,
      unidade_medida_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.unidade : undefined,
      quantidade_produto: primeiroProdutoTransformado ? primeiroProdutoTransformado.quantidade : undefined,
      margem_lucro_customizada: margemPercentual,
      impostos_customizados: impostosPercentual,
      comissao_percentual: comissaoPercentual,
      tipo_margem_lucro: tipoMargemLucroEfetivo,
      configuracoes: {
        tipo_margem_lucro: tipoMargemLucroEfetivo,
        valor_final_manual: temValorFinalManual ? valorFinalManual : null,
        entrega_modalidade_nome: data.entrega_modalidade_nome?.trim() || undefined,
      },
    };

    // Log detalhado removido para limpar terminal
    // console.log('🔍 Debug - Dados originais do form:', data.itens_produto);
    // console.log('🔍 Debug - Dados transformados:', dadosTransformados);
    // console.log('🔍 Debug - Produtos transformados:', dadosTransformados.produtos);

    return dadosTransformados;
  };

  const transformarDadosParaProdutoTemplate = (
    dados: any,
    opcoes?: { produtoIndex?: number; nome?: string },
  ) => {
    const truncarTexto = (valor: unknown, max: number): string => {
      const texto = String(valor ?? '').trim();
      if (!texto) return '';
      return texto.length > max ? texto.slice(0, max) : texto;
    };

    const indice =
      typeof opcoes?.produtoIndex === 'number' && opcoes.produtoIndex >= 0
        ? opcoes.produtoIndex
        : 0;
    const primeiroProduto = Array.isArray(dados?.produtos)
      ? dados.produtos[indice]
      : null;
    const toNumber = (value: unknown): number => {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    };
    const nomeModelo = truncarTexto(
      opcoes?.nome?.trim() || dados.titulo || 'Modelo de orçamento',
      255,
    );
    const nomeProdutoLegado = truncarTexto(
      primeiroProduto?.nome_servico ||
        primeiroProduto?.nome ||
        dados.nome_servico ||
        nomeModelo,
      255,
    );
    const descricaoProduto = String(primeiroProduto?.descricao ?? '').trim();
    const descricaoOrcamento = String(dados.descricao ?? '').trim();
    const descricaoResumo = descricaoProduto || descricaoOrcamento;

    return {
      nome: nomeModelo,
      categoria: truncarTexto(primeiroProduto?.categoria || 'Produto', 100),
      nome_servico: nomeProdutoLegado,
      descricao: truncarTexto(descricaoResumo, 500),
      descricao_produto: truncarTexto(descricaoProduto || descricaoResumo, 1000),
      horas_producao: Math.max(toNumber(dados.horas_producao), 0.1),
      largura_produto: primeiroProduto?.largura || undefined,
      altura_produto: primeiroProduto?.altura || undefined,
      profundidade_produto: primeiroProduto?.profundidade ?? undefined,
      area_produto: primeiroProduto?.area_produto || primeiroProduto?.area || undefined,
      perimetro_produto: primeiroProduto?.perimetro_produto || undefined,
      unidade_geometria: primeiroProduto?.unidade_geometria || 'mm',
      geometria_origem: primeiroProduto?.geometria_origem || 'MANUAL',
      arquivo_geometria_url: primeiroProduto?.arquivo_geometria_url || undefined,
      unidade_medida_produto: primeiroProduto?.unidade_medida || primeiroProduto?.unidade || 'un',
      quantidade_padrao: Math.max(toNumber(primeiroProduto?.quantidade), 1),
      ativo: true,
      itens: (primeiroProduto?.insumos || [])
        .filter((item: any) => item?.insumo_id)
        .map((item: any) => ({
          insumo_id: item.insumo_id,
          quantidade: Math.max(toNumber(item.quantidade), 0.001),
          custo_unitario: Math.max(toNumber(item.preco_unitario ?? item.custo_unitario), 0),
          custo_total: Math.max(toNumber(item.preco_total ?? item.custo_total), 0),
          usa_medida_propria: Boolean(item.usa_medida_propria),
          largura_material: item.usa_medida_propria ? toNumber(item.largura_material) : undefined,
          altura_material: item.usa_medida_propria ? toNumber(item.altura_material) : undefined,
          profundidade_material: item.usa_medida_propria ? toNumber(item.profundidade_material) : undefined,
          unidade_medida_material: item.usa_medida_propria
            ? item.unidade_medida_material || primeiroProduto?.unidade_geometria || 'mm'
            : undefined,
        })),
      maquinas: (primeiroProduto?.maquinas || [])
        .filter((item: any) => item?.maquina_id)
        .map((item: any) => ({
          maquina_id: item.maquina_id,
          horas_utilizadas: Math.max(toNumber(item.tempo_horas ?? item.horas_utilizadas), 0),
          custo_total: Math.max(toNumber(item.custo_total), 0),
        })),
      funcoes: (primeiroProduto?.funcoes || [])
        .filter((item: any) => item?.funcao_id)
        .map((item: any) => ({
          funcao_id: item.funcao_id,
          horas_trabalhadas: Math.max(toNumber(item.tempo_horas ?? item.horas_trabalhadas), 0),
          custo_total: Math.max(toNumber(item.custo_total), 0),
        })),
      servicos: (primeiroProduto?.servicos_manuais || [])
        .filter((item: any) => item?.servico_id)
        .map((item: any) => ({
          servico_id: item.servico_id,
          horas_trabalhadas: Math.max(toNumber(item.tempo_horas ?? item.horas_trabalhadas), 0),
          custo_total: Math.max(toNumber(item.custo_total), 0),
        })),
    };
  };

  const montarPayloadSalvarTemplate = (
    formData: FormValues,
    dadosTransformados: ReturnType<typeof transformarDadosParaBackend>,
  ) => {
    const itensSnapshot = serializarItensModeloOrcamento(
      formData.itens_produto as Array<Record<string, unknown>>,
    );
    const indiceModelo = encontrarIndiceReferenciaModelo(formData.itens_produto);
    const nomeModelo =
      formData.titulo?.trim() ||
      formData.nome_servico?.trim() ||
      'Modelo de orçamento';

    return {
      ...transformarDadosParaProdutoTemplate(dadosTransformados, {
        produtoIndex: indiceModelo,
        nome: nomeModelo,
      }),
      itens_orcamento_json: JSON.stringify(itensSnapshot),
    };
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

      const erroItens = validarMateriaisItensProduto(data.itens_produto);
      if (erroItens) {
        toast.error(erroItens);
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

      if (mode === 'template') {
        const produtoTemplate = montarPayloadSalvarTemplate(data, dadosTransformados);
        if (orcamentoId) {
          await produtosApi.update(orcamentoId, produtoTemplate, token);
          toast.success('Produto atualizado com sucesso!');
        } else {
          await produtosApi.create(produtoTemplate, token);
          toast.success('Produto criado com sucesso!');
        }
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/produtos');
        }
      } else if (mode === 'editar' && orcamentoId) {
        await orcamentosApi.v2.update(orcamentoId, dadosTransformados, token);
        toast.success('Orcamento atualizado com sucesso!');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/orcamentos-v2');
        }
      } else {
        await orcamentosApi.v2.create(dadosTransformados, token);
        toast.success('Orcamento criado com sucesso!');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/orcamentos-v2');
        }
      }
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

  const abrirDialogSalvarModelo = () => {
    const formData = form.getValues();

    if (!itensProntosParaModelo(formData.itens_produto as Array<Record<string, unknown>>)) {
      toast.error(
        'Configure pelo menos um produto (customizado ou de prateleira) antes de salvar o modelo.',
      );
      return;
    }

    const indiceReferencia = encontrarIndiceReferenciaModelo(formData.itens_produto);
    const itemReferencia = formData.itens_produto[indiceReferencia];

    const nomePadrao =
      formData.titulo?.trim() ||
      itemReferencia?.nome_servico?.trim() ||
      'Modelo de orçamento';
    setNomeModeloOrcamento(nomePadrao);
    setShowSalvarModeloDialog(true);
  };

  const handleSalvarComoModelo = async () => {
    const nomeModelo = nomeModeloOrcamento.trim();
    if (!nomeModelo) {
      toast.error('Informe um nome para o modelo.');
      return;
    }

    try {
      setSalvandoModelo(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const formData = form.getValues();
      const indiceModelo = encontrarIndiceReferenciaModelo(formData.itens_produto);
      const itensSnapshot = serializarItensModeloOrcamento(
        formData.itens_produto as Array<Record<string, unknown>>,
      );
      if (itensSnapshot.length === 0) {
        toast.error('Adicione pelo menos um produto configurado antes de salvar o modelo.');
        return;
      }

      const dadosCalculados =
        calcularDadosQuandoNecessario() || resultadoOrcamento?.resultado;
      const dadosTransformados = transformarDadosParaBackend(formData, dadosCalculados);
      const produtoTemplate = {
        ...transformarDadosParaProdutoTemplate(dadosTransformados, {
          produtoIndex: indiceModelo,
          nome: nomeModelo,
        }),
        itens_orcamento_json: JSON.stringify(itensSnapshot),
      };

      await produtosApi.create(produtoTemplate, token);
      setShowSalvarModeloDialog(false);
      toast.success('Modelo de orçamento salvo com sucesso!', {
        description: 'Disponível em Modelos de orçamento.',
        action: {
          label: 'Ver modelos',
          onClick: () => router.push('/produtos'),
        },
      });
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao salvar modelo de orçamento',
      );
    } finally {
      setSalvandoModelo(false);
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
      
      const erroItens = validarMateriaisItensProduto(formData.itens_produto);
      if (erroItens) {
        toast.error(erroItens);
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

      if (mode === 'template') {
        const produtoTemplate = montarPayloadSalvarTemplate(formData, dadosTransformados);
        if (orcamentoId) {
          await produtosApi.update(orcamentoId, produtoTemplate, token);
          toast.success('Produto atualizado com sucesso!');
        } else {
          await produtosApi.create(produtoTemplate, token);
          toast.success('Produto criado com sucesso!');
        }
        router.push('/produtos');
        return;
      }
      
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
      
      const erroItens = validarMateriaisItensProduto(formData.itens_produto);
      if (erroItens) {
        toast.error(erroItens);
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

  const handleFecharPedido = async () => {
    if (isFechandoPedido) return;
    setIsFechandoPedido(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const formData = form.getValues();

      const erroItens = validarMateriaisItensProduto(formData.itens_produto);
      if (erroItens) {
        toast.error(erroItens);
        return;
      }

      let dadosCalculados = dadosCalculadosLocais || resultadoOrcamento?.resultado;

      if (!dadosCalculados) {
        const calculoLocal = calcularDadosLocalmente(formData);
        if (calculoLocal) {
          dadosCalculados = calculoLocal;
        }
      }

      const dadosTransformados = transformarDadosParaBackend(formData, dadosCalculados);
      let idParaFechar = orcamentoId;

      if (mode === 'editar' && orcamentoId) {
        await orcamentosApi.v2.update(orcamentoId, dadosTransformados, token);
      } else {
        const orcamentoCriado = await orcamentosApi.v2.create(dadosTransformados, token);
        idParaFechar = (orcamentoCriado as { id?: string })?.id;
      }

      if (!idParaFechar) {
        throw new Error('Não foi possível identificar o orçamento para fechar o pedido.');
      }

      const resultado = await orcamentosApi.v2.fecharPedido(
        idParaFechar,
        token,
      ) as { os_numero?: string };

      toast.success(
        resultado?.os_numero
          ? `Pedido fechado. OS ${resultado.os_numero} gerada.`
          : 'Pedido fechado e OS gerada com sucesso.',
      );
      solicitarAtualizacaoBadgesSidebar();
      router.push('/orcamentos-v2');
    } catch (error) {
      console.error('Erro ao aprovar e gerar OS:', error);
      if (error instanceof Error) {
        toast.error(`Erro ao aprovar e gerar OS: ${error.message}`);
      } else {
        toast.error('Erro ao aprovar e gerar OS');
      }
    } finally {
      setIsFechandoPedido(false);
    }
  };

  const handleCarregarModelo = () => {
    setSelectedProdutoIndex(0);
    setShowProdutoModal(true);
  };

  const handleAdicionarProdutoPrateleira = (itemIndex: number) => {
    setSelectedProdutoIndex(itemIndex);
    setShowProdutoPrateleiraModal(true);
  };

  const handleProdutoPrateleiraSelected = (produto: {
    id: string;
    nome: string;
    sku: string;
    descricao?: string | null;
    descricao_resumida?: string | null;
    preco_unitario?: number;
    preco_custo?: number | null;
    estoque_atual: number;
    imagens?: Array<{ id: string; url_imagem: string; ordem: number }>;
  }) => {
    try {
      const index = selectedProdutoIndex;
      if (index == null || index < 0) return;

      const quantidade = 1;
      const precoUnitario = Number(produto.preco_unitario || 0);
      const precoCustoUnitario = Number(produto.preco_custo || 0);
      const imagemUrl = produto.imagens?.[0]?.url_imagem || '';
      const descricaoResumida = resolverDescricaoResumidaProdutoFinito(produto);
      const descricaoDetalhada = resolverDescricaoDetalhadaProdutoFinito(produto);

      const produtoData = {
        tipo_item: 'PRODUTO_FINITO',
        produto_finito_id: produto.id,
        sku_snapshot: produto.sku,
        nome_servico: produto.nome,
        descricao: descricaoResumida,
        descricao_detalhada: descricaoDetalhada,
        quantidade_produto: String(quantidade),
        unidade_medida_produto: 'un',
        preco_unitario_snapshot: String(precoUnitario),
        preco_custo_snapshot: precoCustoUnitario > 0 ? String(precoCustoUnitario) : '',
        estoque_catalogo: produto.estoque_atual,
        imagem_snapshot_url: imagemUrl,
        materiais: [],
        maquinas: [],
        funcoes: [],
        servicos: [],
        largura_produto: '',
        altura_produto: '',
        profundidade_produto: '',
        tem_profundidade: false,
        area_produto: '',
        perimetro_produto: '',
        arquivo_geometria_url: '',
        instalacao_necessaria: false,
      };

      form.setValue(
        `itens_produto.${index}`,
        {
          ...form.getValues(`itens_produto.${index}`),
          ...produtoData,
        } as any,
        { shouldDirty: true, shouldValidate: true },
      );

      setShowProdutoPrateleiraModal(false);
      toast.success('Produto de prateleira adicionado ao orçamento.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao adicionar produto de prateleira.');
    }
  };

  const handleProdutoSelected = async (produto: {
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
    servicos?: Array<{
      servico: { id: string };
      horas_trabalhadas: number;
    }>;
    itens_orcamento?: Array<Record<string, unknown>>;
  }) => {
    try {
      const token = localStorage.getItem('access_token');
      let produtoCompleto = produto;

      if (token && produto.id) {
        try {
          const detalhe = (await produtosApi.getById(produto.id, token)) as typeof produto;
          produtoCompleto = { ...produto, ...detalhe };
        } catch (error) {
          console.warn('Não foi possível carregar detalhes do modelo; usando dados da lista.', error);
        }
      }

      const snapshot = produtoCompleto.itens_orcamento;
      if (Array.isArray(snapshot) && snapshot.length > 0) {
        const itensRestaurados = deserializarItensModeloOrcamento(snapshot);
        form.setValue('itens_produto', itensRestaurados as any, {
          shouldDirty: true,
          shouldValidate: false,
        });
        setProdutosSectionKey((k) => k + 1);
        setShowProdutoModal(false);
        toast.success(
          `Modelo "${produtoCompleto.nome}" carregado com ${itensRestaurados.length} produto(s).`,
        );
        return;
      }

      // Mapear dados do produto template para o formato do orçamento (legado: 1 produto)
      const tituloModelo = produtoCompleto.nome?.trim() || '';
      const nomeServicoTemplate = produtoCompleto.nome_servico?.trim() || '';
      const nomeProdutoLegado =
        nomeServicoTemplate && nomeServicoTemplate !== tituloModelo
          ? nomeServicoTemplate
          : nomeServicoTemplate;
      // Fase 11: profundidade do template e propagada quando preenchida (template 3D).
      const profundidadeTemplateRaw = (produtoCompleto as any)?.profundidade_produto?.toString() || '';
      const profundidadeTemplateNum = Number(String(profundidadeTemplateRaw).replace(',', '.'));
      const temProfundidadeTemplate =
        !!profundidadeTemplateRaw && !isNaN(profundidadeTemplateNum) && profundidadeTemplateNum > 0;
      const produtoData = {
        tipo_item: 'SOB_DEMANDA',
        produto_finito_id: '',
        sku_snapshot: '',
        preco_unitario_snapshot: '',
        estoque_catalogo: 0,
        imagem_snapshot_url: '',
        nome_servico: nomeProdutoLegado,
        descricao: produtoCompleto.descricao_produto || '',
        descricao_detalhada: '',
        quantidade_produto: '1', // Quantidade padrão
        largura_produto: produtoCompleto.largura_produto?.toString() || '',
        altura_produto: produtoCompleto.altura_produto?.toString() || '',
        profundidade_produto: profundidadeTemplateRaw,
        tem_profundidade: temProfundidadeTemplate,
        unidade_medida_produto: produtoCompleto.unidade_medida_produto || 'un',
        area_produto: produtoCompleto.area_produto?.toString() || '',
        perimetro_produto: (produtoCompleto as any).perimetro_produto?.toString() || '',
        geometria_origem: ((produtoCompleto as any).geometria_origem || 'MANUAL') as const,
        arquivo_geometria_url: (produtoCompleto as any).arquivo_geometria_url?.toString() || '',
        unidade_geometria: ((produtoCompleto as any).unidade_geometria || 'mm') as const,
        materiais: produtoCompleto.itens?.map((item) => ({
          insumo_id: item.insumo.id,
          quantidade: item.quantidade.toString(),
          usa_medida_propria: Boolean((item as any).usa_medida_propria),
          largura_material: (item as any).largura_material?.toString() || '',
          altura_material: (item as any).altura_material?.toString() || '',
          profundidade_material: (item as any).profundidade_material?.toString() || '',
          unidade_medida_material: (item as any).unidade_medida_material || (produtoCompleto as any).unidade_geometria || 'mm',
        })) || [],
        maquinas: produtoCompleto.maquinas?.map((maq) => ({
          maquina_id: maq.maquina.id,
          horas_utilizadas: maq.horas_utilizadas.toString()
        })) || [],
        funcoes: produtoCompleto.funcoes?.map((func) => ({
          funcao_id: func.funcao.id,
          horas_trabalhadas: func.horas_trabalhadas.toString()
        })) || [],
        servicos: produtoCompleto.servicos?.map((serv) => ({
          servico_id: serv.servico.id,
          horas_trabalhadas: serv.horas_trabalhadas.toString(),
        })) || [{ servico_id: '', horas_trabalhadas: '1' }],
      };

      // Atualizar o item do produto no formulário (legado: substitui apenas o slot selecionado)
      const currentItems = form.getValues('itens_produto');
      const updatedItems = [...currentItems];
      updatedItems[selectedProdutoIndex] = produtoData;
      form.setValue('itens_produto', updatedItems);

      setShowProdutoModal(false);
      if (!Array.isArray(snapshot) || snapshot.length === 0) {
        toast.warning(
          `Modelo "${produtoCompleto.nome}" carregado em modo legado (1 produto). Salve o modelo novamente para preservar todos os itens, inclusive de prateleira.`,
        );
      } else {
        toast.success(`Produto "${produtoCompleto.nome}" carregado com sucesso!`);
      }
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
                  <div className={isAprovado ? 'pointer-events-none select-none opacity-95 space-y-6' : 'space-y-6'}>
                  {/* Seção de Cliente */}
                  <ClienteSection 
                    clientes={clientes} 
                    mode={mode} 
                  />

                  <Separator />

                  {/* Título do Orçamento */}
                  <TituloOrcamentoSection modo={mode} />

                  <ModeloOrcamentoSection
                    modo={mode}
                    desabilitado={isAprovado}
                    onCarregarModelo={handleCarregarModelo}
                  />
                  </div>

                  <Separator />

                  {/* Seção de Produtos — accordion liberado em modo leitura */}
                  <ProdutoSection 
                    key={produtosSectionKey}
                    mode={mode}
                    orcamentoId={orcamentoId}
                    somenteLeitura={isAprovado}
                    onAdicionarProdutoPrateleira={handleAdicionarProdutoPrateleira}
                    insumos={insumos}
                    maquinas={maquinas}
                    funcoes={funcoes}
                    servicos={servicos}
                    onInsumoCriado={fetchInsumos}
                  />

                  <Separator />

                  <div className={isAprovado ? 'pointer-events-none select-none opacity-95 space-y-6' : 'space-y-6'}>
                  {/* Configurações Comerciais */}
                  <ConfiguracoesSection mode={mode} />
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={abrirSimuladorPrecificacao}
                      className="flex items-center space-x-2"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>Simular preço</span>
                    </Button>
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
                        disabled={loading || isAtualizando}
                        className="flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {loading || isAtualizando
                            ? 'Salvando...'
                            : orcamentoId
                              ? 'Salvar Produto Template'
                              : 'Criar Produto Template'}
                        </span>
                      </Button>
                    )}
                    
                    {!isAprovado && mode === 'novo' && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={abrirDialogSalvarModelo}
                          disabled={loading || salvandoModelo}
                          className="flex items-center space-x-2"
                        >
                          <LayoutTemplate className="w-4 h-4" />
                          <span>Salvar como modelo de orçamento</span>
                        </Button>
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
                        {podeFecharPedido && (
                          <Button
                            type="button"
                            onClick={() => handleFecharPedido()}
                            disabled={loading || isEnviando || isAtualizando || isFechandoPedido}
                            className="flex items-center space-x-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isFechandoPedido ? 'Aprovando...' : 'Aprovar e gerar OS'}</span>
                          </Button>
                        )}
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
                                onClick={abrirDialogSalvarModelo}
                                disabled={loading || salvandoModelo}
                                className="flex items-center space-x-2"
                              >
                                <LayoutTemplate className="w-4 h-4" />
                                <span>Salvar como modelo de orçamento</span>
                              </Button>
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
                              {podeFecharPedido && (
                                <Button
                                  type="button"
                                  onClick={() => handleFecharPedido()}
                                  disabled={loading || isEnviando || isAtualizando || isFechandoPedido}
                                  className="flex items-center space-x-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>{isFechandoPedido ? 'Aprovando...' : 'Aprovar e gerar OS'}</span>
                                </Button>
                              )}
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
                            <>
                              {podeFecharPedido && (
                                <Button
                                  type="button"
                                  onClick={() => handleFecharPedido()}
                                  disabled={loading || isEnviando || isAtualizando || isFechandoPedido}
                                  className="flex items-center space-x-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>{isFechandoPedido ? 'Aprovando...' : 'Aprovar e gerar OS'}</span>
                                </Button>
                              )}
                            <Button
                              type="button"
                              onClick={() => handleSubmit(form.getValues())}
                              disabled={loading || isAtualizando}
                              className="flex items-center space-x-2"
                            >
                              <Save className="w-4 h-4" />
                              <span>{loading || isAtualizando ? 'Atualizando...' : 'Atualizar Orçamento'}</span>
                            </Button>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar com preview de cálculo */}
              <div className="w-full lg:w-3/10 lg:flex-shrink-0">
                <div className="sticky top-6 space-y-3">
                  <PreviewCalculoV2
                    dadosCarregados={dadosCarregados}
                    datasets={{
                      insumos,
                      maquinas,
                      funcoes,
                      servicos,
                      custosIndiretos,
                    }}
                  />
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
              <div className={isAprovado ? 'pointer-events-none select-none opacity-95 space-y-6' : 'space-y-6'}>
              {/* Seção de Cliente */}
              <ClienteSection 
                clientes={clientes} 
                mode={mode} 
              />

              <Separator />

              <TituloOrcamentoSection modo={mode} />

              <ModeloOrcamentoSection
                modo={mode}
                desabilitado={isAprovado}
                onCarregarModelo={handleCarregarModelo}
              />
              </div>

              <Separator />

              <ProdutoSection 
                key={produtosSectionKey}
                mode={mode}
                orcamentoId={orcamentoId}
                somenteLeitura={isAprovado}
                onAdicionarProdutoPrateleira={handleAdicionarProdutoPrateleira}
                insumos={insumos}
                maquinas={maquinas}
                funcoes={funcoes}
                servicos={servicos}
                onInsumoCriado={fetchInsumos}
              />

              <Separator />

              <div className={isAprovado ? 'pointer-events-none select-none opacity-95 space-y-6' : 'space-y-6'}>
              <ConfiguracoesSection mode={mode} />
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={abrirSimuladorPrecificacao}
                className="flex items-center space-x-2"
              >
                <Calculator className="w-4 h-4" />
                <span>Simular preço</span>
              </Button>
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
                  disabled={loading || isAtualizando}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {loading || isAtualizando
                      ? 'Salvando...'
                      : orcamentoId
                        ? 'Salvar Produto Template'
                        : 'Criar Produto Template'}
                  </span>
                </Button>
              )}
              
              {!isAprovado && mode === 'novo' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={abrirDialogSalvarModelo}
                    disabled={loading || salvandoModelo}
                    className="flex items-center space-x-2"
                  >
                    <LayoutTemplate className="w-4 h-4" />
                    <span>Salvar como modelo de orçamento</span>
                  </Button>
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
                  {podeFecharPedido && (
                    <Button
                      type="button"
                      onClick={() => handleFecharPedido()}
                      disabled={loading || isEnviando || isAtualizando || isFechandoPedido}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFechandoPedido ? 'Aprovando...' : 'Aprovar e gerar OS'}</span>
                    </Button>
                  )}
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
                          onClick={abrirDialogSalvarModelo}
                          disabled={loading || salvandoModelo}
                          className="flex items-center space-x-2"
                        >
                          <LayoutTemplate className="w-4 h-4" />
                          <span>Salvar como modelo de orçamento</span>
                        </Button>
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
                        {podeFecharPedido && (
                          <Button
                            type="button"
                            onClick={() => handleFecharPedido()}
                            disabled={loading || isEnviando || isAtualizando || isFechandoPedido}
                            className="flex items-center space-x-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isFechandoPedido ? 'Aprovando...' : 'Aprovar e gerar OS'}</span>
                          </Button>
                        )}
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
                      <>
                        {podeFecharPedido && (
                          <Button
                            type="button"
                            onClick={() => handleFecharPedido()}
                            disabled={loading || isEnviando || isAtualizando || isFechandoPedido}
                            className="flex items-center space-x-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isFechandoPedido ? 'Aprovando...' : 'Aprovar e gerar OS'}</span>
                          </Button>
                        )}
                      <Button
                        type="submit"
                        disabled={loading || isAtualizando}
                        className="flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{loading || isAtualizando ? 'Atualizando...' : 'Atualizar Orçamento'}</span>
                      </Button>
                      </>
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

      {showProdutoPrateleiraModal && (
        <ProdutoPrateleiraSelectionModal
          open={showProdutoPrateleiraModal}
          onClose={() => setShowProdutoPrateleiraModal(false)}
          onSelect={handleProdutoPrateleiraSelected}
        />
      )}

      <Dialog open={showSalvarModeloDialog} onOpenChange={setShowSalvarModeloDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar como modelo de orçamento</DialogTitle>
            <DialogDescription>
              Todos os produtos configurados no orçamento (customizados e de prateleira)
              serão salvos no modelo para reutilizar depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="nome-modelo-orcamento">Nome do modelo</Label>
            <Input
              id="nome-modelo-orcamento"
              value={nomeModeloOrcamento}
              onChange={(e) => setNomeModeloOrcamento(e.target.value)}
              placeholder="Ex.: Banner 3x1 com lona front"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSalvarComoModelo();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSalvarModeloDialog(false)}
              disabled={salvandoModelo}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleSalvarComoModelo()}
              disabled={salvandoModelo}
            >
              {salvandoModelo ? 'Salvando...' : 'Salvar modelo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Flutuante - mostrar para todos os status exceto rascunho e aprovado (aprovado = somente visualização) */}
      <Dialog open={showSimuladorModal} onOpenChange={setShowSimuladorModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Simular preço</DialogTitle>
            <DialogDescription>
              Simulação rápida com os dados atuais do orçamento. Fechar esta janela
              não altera o formulário.
            </DialogDescription>
          </DialogHeader>
          {simuladorSeed && (
            <SimuladorPrecificacao
              key={JSON.stringify(simuladorSeed)}
              custoInicial={simuladorSeed.custoInicial}
              margemInicial={simuladorSeed.margemInicial}
              impostosInicial={simuladorSeed.impostosInicial}
              comissaoInicial={simuladorSeed.comissaoInicial}
              tipoInicial={simuladorSeed.tipoInicial}
              className="border-0 shadow-none"
            />
          )}
        </DialogContent>
      </Dialog>

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
