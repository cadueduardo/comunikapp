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
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { Combobox } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UnitSelect } from '@/components/ui/unit-select';
import { UNIDADES_COMPRA } from '@/lib/unidades-compra';
// Fase 11 — Opção B: unidade de uso tem lista própria (inclui M²_LATERAL para caixa aberta 3D).
// Unidade de compra continua usando UNIDADES_COMPRA porque ninguém "compra" em M²_LATERAL.
import { UNIDADES_USO } from '@/lib/unidades-uso';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { InfoWithExamples } from '@/components/ui/info-with-examples';
import { ConversionExamplesModal } from '@/components/ui/conversion-examples-modal';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categoriasApi, fornecedoresApi, tiposMaterialApi, estoqueApi } from '@/lib/api-client';
import { NomeInsumoSugestoes } from './nome-insumo-sugestoes';
import {
  FornecedorForm,
  type FornecedorFormValues,
} from '@/app/(main)/fornecedores/fornecedor-form';

const formSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  categoriaId: z.string().min(1, 'Selecione uma categoria.'),
  fornecedorId: z.string().min(1, 'Selecione um fornecedor.'),
  custo_unitario: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) > 0, {
    message: 'O custo unitário deve ser maior que zero.',
  }),
  
  // Campos de compra
  unidade_compra: z.string().min(1, 'Selecione uma unidade de compra.'),
  
  // Campos de dimensões (opcional)
  largura: z.any().optional(),
  altura: z.any().optional(),
  profundidade: z.any().optional(),
  tem_profundidade: z.boolean().optional(),
  unidade_dimensao: z.string().optional(), // Unidade das dimensões (M, CM, MM)
  tipo_calculo: z.string().optional(), // Tipo de cálculo (AREA, LINEAR, QUANTIDADE)
  quantidade_compra: z.any().refine(val => {
    const num = Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.'));
    return num > 0 && num <= 1000000;
  }, {
    message: 'A quantidade deve ser maior que zero e menor que 1.000.000.',
  }),
  gramatura: z.any().optional(),
  
  // Campos de uso
  unidade_uso: z.string().min(1, 'Selecione uma unidade de uso.'),
  fator_conversao: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) > 0, {
    message: 'O fator de conversão deve ser maior que zero.',
  }),
  
  // Campos de lógica de consumo
  logica_consumo: z.string().optional(),
  tipo_material_id: z.string().optional(),
  parametros_consumo: z.any().optional(),
  
  codigo_interno: z.string().optional().nullable(),
  estoque_minimo: z.any().optional().nullable(),
  controlar_estoque: z.boolean().optional(),
  estoque_localizacao_id: z.string().optional().nullable(),
  estoque_quantidade_inicial: z.any().optional().nullable(),
  estoque_maximo: z.any().optional().nullable(),
  estoque_lote: z.string().optional().nullable(),
  estoque_data_validade: z.string().optional().nullable(),
  estoque_observacoes: z.string().optional().nullable(),
  descricao_tecnica: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  formato_material: z.string().optional(),
  largura_comercial: z.any().optional(),
  altura_comercial: z.any().optional(),
  comprimento_comercial: z.any().optional(),
  perda_padrao_percent: z.any().optional(),
  permite_simulacao_chapa: z.boolean().optional(),
  permite_registrar_sobra: z.boolean().optional(),
  metodo_cobranca_padrao: z.string().optional(),
});

export type InsumoFormValues = z.infer<typeof formSchema>;

interface InsumoFormProps {
  initialData?: Partial<InsumoFormValues>;
  onSave: (data: InsumoFormValues) => void;
  isSaving?: boolean;
  lockFornecedorCusto?: boolean;
  /** Conteúdo renderizado antes de Voltar/Salvar Insumo (ex.: matriz de fornecedores). */
  afterFields?: React.ReactNode;
  /** Em edição, exclui o próprio registro das sugestões de nome. */
  excludeInsumoId?: string;
}

const unidadesDeMedida = UNIDADES_COMPRA;
// Fase 11: lista de unidades de uso (UNIDADES_COMPRA + M2_LATERAL para caixa aberta 3D).
const unidadesDeUso = UNIDADES_USO;

const unidadesDimensao = [
  { value: 'M', label: 'METROS' },
  { value: 'CM', label: 'CENTÍMETROS' },
  { value: 'MM', label: 'MILÍMETROS' },
  { value: 'INCH', label: 'POLEGADAS' },
  { value: 'FT', label: 'PÉS' },
];

const tiposCalculo = [
  { value: 'AREA', label: 'ÁREA (Largura × Altura)' },
  { value: 'LINEAR', label: 'COMPRIMENTO LINEAR' },
  { value: 'QUANTIDADE', label: 'QUANTIDADE DE ITENS' },
  { value: 'PESO', label: 'PESO' },
  { value: 'VOLUME', label: 'VOLUME' },
  { value: 'PERSONALIZADO', label: 'PERSONALIZADO (Tipos de Material)' },
];

interface Option {
  value: string;
  label: string;
}

export function InsumoForm({
  onSave,
  initialData,
  isSaving,
  lockFornecedorCusto = false,
  afterFields,
  excludeInsumoId,
}: InsumoFormProps) {
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [tiposMaterial, setTiposMaterial] = useState<Option[]>([]);
  
  const form = useForm<InsumoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      categoriaId: '',
      fornecedorId: '',
      custo_unitario: '',
      unidade_compra: '',
      quantidade_compra: '',
      largura: '',
      altura: '',
      profundidade: '',
      tem_profundidade: false,
      unidade_dimensao: '',
      tipo_calculo: '',
      gramatura: '',
      unidade_uso: '',
      fator_conversao: '',
      logica_consumo: 'area', // Valor padrão
      tipo_material_id: '',
      parametros_consumo: null,
      codigo_interno: '',
      estoque_minimo: '',
      controlar_estoque: false,
      estoque_localizacao_id: '',
      estoque_quantidade_inicial: '',
      estoque_maximo: '',
      estoque_lote: '',
      estoque_data_validade: '',
      estoque_observacoes: '',
      descricao_tecnica: '',
      observacoes: '',
      ativo: true,
      formato_material: '',
      largura_comercial: '',
      altura_comercial: '',
      comprimento_comercial: '',
      perda_padrao_percent: '',
      permite_simulacao_chapa: false,
      permite_registrar_sobra: false,
      metodo_cobranca_padrao: 'AREA_LIQUIDA',
      ...initialData,
    },
  });

  // Aplicar dados iniciais quando disponíveis
  useEffect(() => {
    if (initialData) {
      console.log('🔍 InsumoForm - Aplicando dados iniciais:', initialData);
      Object.entries(initialData).forEach(([key, value]) => {
        // Permitir valores vazios ('') para campos de string, mas não null/undefined
        if (value !== undefined && value !== null) {
          console.log(`🔍 InsumoForm - Setando ${key}:`, value);
          form.setValue(key as keyof InsumoFormValues, value);
        } else if (value === '') {
          // Permitir strings vazias para campos como tipo_material_id
          console.log(`🔍 InsumoForm - Setando ${key} como string vazia:`, value);
          form.setValue(key as keyof InsumoFormValues, value);
        }
      });

      const parametros = initialData.parametros_consumo;
      let parametrosObj: any = null;
      if (typeof parametros === 'string') {
        try {
          parametrosObj = JSON.parse(parametros);
        } catch {
          parametrosObj = null;
        }
      } else if (parametros && typeof parametros === 'object') {
        parametrosObj = parametros;
      }

      const geometria3d = parametrosObj?.geometria_3d;
      if (geometria3d && typeof geometria3d === 'object') {
        const profundidadeInicial = Number(geometria3d.profundidade);
        const temProfundidadeInicial =
          Boolean(geometria3d.tem_profundidade) && profundidadeInicial > 0;
        form.setValue('tem_profundidade', temProfundidadeInicial);
        form.setValue(
          'profundidade',
          temProfundidadeInicial ? String(profundidadeInicial) : '',
        );
      }
    }
  }, [initialData, form]);



  // Cálculo automático da quantidade total
  const largura = form.watch('largura');
  const altura = form.watch('altura');
  const profundidade = form.watch('profundidade');
  const temProfundidade = form.watch('tem_profundidade');
  const unidadeDimensao = form.watch('unidade_dimensao');
  const tipoCalculo = form.watch('tipo_calculo');
  const unidadeCompra = form.watch('unidade_compra');
  
  // Cálculo do custo por unidade de uso
  const custoUnitario = form.watch('custo_unitario');
  const quantidadeCompra = form.watch('quantidade_compra');
  const fatorConversao = form.watch('fator_conversao');
  const unidadeUso = form.watch('unidade_uso');
  const controlarEstoque = form.watch('controlar_estoque');
  const formatoMaterial = form.watch('formato_material');
  const larguraCadastro = form.watch('largura');
  const alturaCadastro = form.watch('altura');
  const unidadeDimensaoCadastro = form.watch('unidade_dimensao');
  const converterParaMetros = (valor: number, unidade: string) => {
    switch (unidade) {
      case 'CENTÍMETROS':
      case 'CM':
        return valor / 100;
      case 'MILÍMETROS':
      case 'MM':
        return valor / 1000;
      case 'METROS':
      case 'M':
      default:
        return valor;
    }
  };
  
  // Debug: monitorar mudanças no quantidadeCompra
  useEffect(() => {
    // console.log('🔍 quantidadeCompra mudou:', quantidadeCompra);
  }, [quantidadeCompra]);
  
  const custoPorUnidadeUso = React.useMemo(() => {
    const unidadeUsoNormalizada = (unidadeUso || '').toUpperCase();
    const unidadeUsoEhMetroQuadrado =
      unidadeUsoNormalizada === 'M2' || unidadeUsoNormalizada === 'METRO QUADRADO';
    // console.log('🔄 useMemo sendo recalculado!');
    // console.log('🔍 Valores observados:', {
    //   custoUnitario,
    //   quantidadeCompra,
    //   fatorConversao,
    //   unidadeUso
    // });
    
    if (custoUnitario && quantidadeCompra && fatorConversao) {
      const custo = Number(custoUnitario);
      const quantidade = Number(quantidadeCompra);
      const fator = Number(fatorConversao);
      
      // console.log('Dados do formulário:', {
      //   custoUnitario,
      //   quantidadeCompra,
      //   fatorConversao,
      //   largura,
      //   altura,
      //   unidadeDimensao,
      //   tipoCalculo
      // });
      
      // console.log('Valores convertidos:', {
      //   custo,
      //   quantidade,
      //   fator
      // });
      
      if (!isNaN(custo) && !isNaN(quantidade) && !isNaN(fator) && quantidade > 0 && fator > 0) {
        const quantidadeCalculada = quantidade;
        
        // Se temos dimensões e tipo de cálculo, usar a lógica específica
        if (altura && unidadeDimensao && tipoCalculo) {
          // console.log('Aplicando lógica de dimensões...');
          
          // Para COMPRIMENTO LINEAR, não precisamos de largura
          const alturaNum = parseFloat(altura);
          
          // console.log('Dimensões convertidas:', {
          //   largura: largura || 'não informada',
          //   alturaNum,
          //   unidadeDimensao,
          //   tipoCalculo
          // });
          
          if (!isNaN(alturaNum)) {
            // Converter dimensões para metros
            let alturaEmMetros = alturaNum;
            
            switch (unidadeDimensao) {
              case 'CENTÍMETROS':
              case 'CM':
                alturaEmMetros = alturaNum / 100;
                break;
              case 'MILÍMETROS':
              case 'MM':
                alturaEmMetros = alturaNum / 1000;
                break;
              case 'METROS':
              case 'M':
                // Já está em metros
                break;
            }
            
            // console.log('Dimensões em metros:', {
            //   alturaEmMetros
            // });
            
            // Calcular quantidade baseada no tipo de cálculo
            switch (tipoCalculo) {
              case 'COMPRIMENTO LINEAR':
              case 'LINEAR':
                // Para comprimento linear: calcular custo por unidade de uso
                const custoPorUnidade = custo / quantidade;
                
                if (unidadeUso === 'CENTIMETRO' || unidadeUso === 'CM') {
                  // Se a unidade de uso é centímetro, calcular custo por centímetro
                  // Para cordão: custo por metro ÷ 100 = custo por centímetro
                  const custoPorCentimetro = custoPorUnidade / 100;
                  
                  // console.log('COMPRIMENTO LINEAR - CENTIMETRO:', {
                  //   custoPorUnidade,
                  //   alturaEmMetros,
                  //   custoPorCentimetro
                  // });
                  
                  return custoPorCentimetro;
                } else {
                  // Para outras unidades de uso, usar o cálculo padrão
                  return custoPorUnidade;
                }
                
              case 'AREA':
                // Para área: calcular custo por unidade de uso baseado na área da unidade
                if (largura) {
                  const larguraNum = parseFloat(largura);
                  if (!isNaN(larguraNum)) {
                    let larguraEmMetros = larguraNum;
                    
                    switch (unidadeDimensao) {
                      case 'CENTÍMETROS':
                      case 'CM':
                        larguraEmMetros = larguraNum / 100;
                        break;
                      case 'MILÍMETROS':
                      case 'MM':
                        larguraEmMetros = larguraNum / 1000;
                        break;
                    }
                    
                    const areaPorUnidade = larguraEmMetros * alturaEmMetros;
                    
                    if (unidadeUsoEhMetroQuadrado) {
                      // Se a unidade de uso é metro quadrado, calcular custo por m²
                      const custoPorMetroQuadrado = custo / areaPorUnidade;
                      
                      // console.log('AREA - METRO QUADRADO:', {
                      //   larguraEmMetros,
                      //   alturaEmMetros,
                      //   areaPorUnidade,
                      //   custoPorMetroQuadrado
                      // });
                      
                      return custoPorMetroQuadrado;
                    } else {
                      // Para outras unidades de uso, usar o cálculo padrão
                      return custo / quantidade;
                    }
                  }
                } else {
                  return custo / quantidade;
                }
                break;
                
              case 'QUANTIDADE':
                // Para quantidade fixa: usar quantidade diretamente
                return custo / quantidade;
                
              default:
                // Padrão: usar quantidade diretamente
                return custo / quantidade;
            }
          }
        } else {
          // console.log('Não aplicando lógica de dimensões - dados faltando:', {
          //   temLargura: !!largura,
          //   temAltura: !!altura,
          //   temUnidadeDimensao: !!unidadeDimensao,
          //   temTipoCalculo: !!tipoCalculo
          // });
        }
        
        // Cálculo final: Custo Total ÷ (Quantidade Calculada × Fator de Conversão)
        const resultado = custo / (quantidadeCalculada * fator);
        
        // console.log('Cálculo useMemo:', {
        //   custo,
        //   quantidade,
        //   fator,
        //   quantidadeCalculada,
        //   resultado,
        //   largura,
        //   altura,
        //   unidadeDimensao,
        //   tipoCalculo
        // });
        
        // Verificar se o resultado faz sentido (entre R$ 0,01 e R$ 1.000 por unidade)
        if (resultado < 0.01) {
          // console.warn('Custo por unidade muito baixo. Verifique se a quantidade está na unidade correta.');
        } else if (resultado > 1000) {
          // console.warn('Custo por unidade muito alto. Verifique se a quantidade está na unidade correta.');
        }
        
        return resultado;
      }
    }
    return null;
  }, [custoUnitario, quantidadeCompra, fatorConversao, unidadeUso, largura, altura, unidadeDimensao, tipoCalculo]);


  
  useEffect(() => {
    if (largura && altura && unidadeDimensao && tipoCalculo) {
      const larguraNum = parseFloat(largura);
      const alturaNum = parseFloat(altura);
      
      if (!isNaN(larguraNum) && !isNaN(alturaNum)) {
        let quantidadeTotal = 0;
        
        // Converter dimensões para metros se necessário
        const larguraEmMetros = converterParaMetros(larguraNum, unidadeDimensao);
        const alturaEmMetros = converterParaMetros(alturaNum, unidadeDimensao);
        
        // Calcular quantidade com base no tipo de cálculo selecionado.
        // A unidade de compra influencia apenas casos específicos de quantidade.
        switch (tipoCalculo) {
          case 'LINEAR':
            quantidadeTotal = alturaEmMetros;
            break;
          case 'AREA':
            quantidadeTotal = larguraEmMetros * alturaEmMetros;
            break;
          case 'VOLUME': {
            const profundidadeNum = parseFloat(profundidade || '');
            if (!temProfundidade || isNaN(profundidadeNum) || profundidadeNum <= 0) {
              return;
            }
            const profundidadeEmMetros = converterParaMetros(
              profundidadeNum,
              unidadeDimensao,
            );
            quantidadeTotal = larguraEmMetros * alturaEmMetros * profundidadeEmMetros;
            break;
          }
          case 'QUANTIDADE':
            if (unidadeCompra === 'PACOTE' || unidadeCompra === 'UNID') {
              quantidadeTotal = 1;
            } else {
              quantidadeTotal = larguraEmMetros * alturaEmMetros;
            }
            break;
          default:
            if (unidadeCompra === 'ROLO') {
              quantidadeTotal = alturaEmMetros;
            } else {
              quantidadeTotal = larguraEmMetros * alturaEmMetros;
            }
            break;
        }
        
        // Validar se a quantidade calculada faz sentido
        if (quantidadeTotal > 0 && quantidadeTotal < 1000000) { // Evitar valores absurdos
          // Formatar quantidade removendo zeros desnecessários
          const quantidadeFormatada = quantidadeTotal % 1 === 0 
            ? quantidadeTotal.toString() 
            : quantidadeTotal.toFixed(3).replace(/\.?0+$/, '');
          
          // Forçar o cálculo automático sempre que as dimensões forem preenchidas
          form.setValue('quantidade_compra', quantidadeFormatada);
        }
      }
    }
  }, [largura, altura, profundidade, temProfundidade, unidadeDimensao, tipoCalculo, unidadeCompra, form]);
  
  const [categorias, setCategorias] = useState<Option[]>([]);
  const [fornecedores, setFornecedores] = useState<Option[]>([]);
  const [localizacoesEstoque, setLocalizacoesEstoque] = useState<Option[]>([]);
  const [fornecedorCompletoOpen, setFornecedorCompletoOpen] = useState(false);
  const [nomeNovoFornecedor, setNomeNovoFornecedor] = useState('');
  const [salvandoFornecedor, setSalvandoFornecedor] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        // Usar APIs centralizadas em vez de URLs hardcoded
        const [categoriasData, fornecedoresData, tiposMaterialData] = await Promise.all([
          categoriasApi.getAll(token),
          fornecedoresApi.getAll(token, 'INSUMO'),
          tiposMaterialApi.getAll(token)
        ]) as [{id: string, nome: string}[], {id: string, nome: string}[], {id: string, nome: string}[]];

        setCategorias(categoriasData.map((item: {id: string, nome: string}) => ({ 
          value: item.id, 
          label: item.nome 
        })));

        try {
          const localizacoesData = await estoqueApi.getLocalizacoes(token) as
            | Array<{ id: string; codigo?: string; deposito?: string; descricao?: string }>
            | { data?: Array<{ id: string; codigo?: string; deposito?: string; descricao?: string }> };
          const localizacoes = Array.isArray(localizacoesData)
            ? localizacoesData
            : localizacoesData.data ?? [];

          setLocalizacoesEstoque(localizacoes.map((localizacao) => ({
            value: localizacao.id,
            label: [
              localizacao.codigo,
              localizacao.deposito || localizacao.descricao || 'Estoque',
            ].filter(Boolean).join(' - '),
          })));
        } catch (error) {
          console.warn('Não foi possível carregar localizações de estoque:', error);
          setLocalizacoesEstoque([]);
        }
        
        setFornecedores(fornecedoresData.map((item: {id: string, nome: string}) => ({ 
          value: item.id, 
          label: item.nome 
        })));
        
        setTiposMaterial(tiposMaterialData.map((tipo: { id: string; nome: string }) => ({
          value: tipo.id,
          label: tipo.nome,
        })));
        
        console.log('🔍 InsumoForm - Tipos de material carregados:', tiposMaterialData);
      } catch (error) {
        toast.error('Falha ao carregar dados de referência.');
        console.error('Erro ao carregar dados:', error);
      }
    };
    
    fetchData();
  }, []);

  const handleCreate = async (
    name: string,
    type: 'categoria' | 'fornecedor'
  ) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      let newData;
      
      if (type === 'categoria') {
        newData = await categoriasApi.create({ nome: name }, token) as { id: string; nome: string };
        const newOption = { value: newData.id, label: newData.nome };
        setCategorias(prev => [...prev, newOption]);
        form.setValue('categoriaId', newData.id);
      } else {
        newData = await fornecedoresApi.create({ nome: name }, token) as { id: string; nome: string };
        const newOption = { value: newData.id, label: newData.nome };
        setFornecedores(prev => [...prev, newOption]);
        form.setValue('fornecedorId', newData.id);
      }
      
      const entidadeCriada = type === 'categoria' ? 'Categoria' : 'Fornecedor';
      const participio = type === 'categoria' ? 'criada' : 'criado';
      toast.success(`${entidadeCriada} "${name}" ${participio} com sucesso!`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Falha ao criar ${type}.`,
      );
      console.error(error);
    }
  };

  const abrirCadastroCompletoFornecedor = (nome: string) => {
    setNomeNovoFornecedor(nome.trim());
    setFornecedorCompletoOpen(true);
  };

  const salvarFornecedorCompleto = async (values: FornecedorFormValues) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Sua sessão expirou. Entre novamente para continuar.');
      return;
    }

    if (values.tipo === 'TERCEIRIZADO') {
      toast.error(
        'Para vincular este cadastro ao insumo, selecione Venda de insumos ou Ambos.',
      );
      return;
    }

    setSalvandoFornecedor(true);
    try {
      const fornecedor = await fornecedoresApi.create(values, token) as {
        id: string;
        nome: string;
      };
      const novaOpcao = { value: fornecedor.id, label: fornecedor.nome };

      setFornecedores((atuais) => [...atuais, novaOpcao]);
      form.setValue('fornecedorId', fornecedor.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setFornecedorCompletoOpen(false);
      setNomeNovoFornecedor('');
      toast.success(`Fornecedor "${fornecedor.nome}" cadastrado e selecionado.`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Falha ao cadastrar o fornecedor.',
      );
      console.error('Erro ao cadastrar fornecedor completo:', error);
    } finally {
      setSalvandoFornecedor(false);
    }
  };

  function parseDimensao(valor: unknown): number | undefined {
    const num = Number(String(valor ?? '').replace(',', '.'));
    return Number.isFinite(num) && num > 0 ? num : undefined;
  }

  function sincronizarCamposComerciaisMaterial(data: InsumoFormValues) {
    const formato = data.formato_material?.trim();
    if (!formato) {
      return {
        formato_material: undefined,
        largura_comercial: undefined,
        altura_comercial: undefined,
        comprimento_comercial: undefined,
      };
    }

    const largura = parseDimensao(data.largura);
    const altura = parseDimensao(data.altura);
    const usaComprimento =
      formato === 'ROLO' || formato === 'METRO_LINEAR' || formato === 'BARRA';

    return {
      formato_material: formato,
      largura_comercial: largura,
      altura_comercial: usaComprimento ? undefined : altura,
      comprimento_comercial: usaComprimento ? altura : undefined,
      perda_padrao_percent: data.perda_padrao_percent
        ? Number(String(data.perda_padrao_percent).replace(',', '.'))
        : undefined,
      permite_simulacao_chapa: Boolean(data.permite_simulacao_chapa),
      permite_registrar_sobra: Boolean(data.permite_registrar_sobra),
      metodo_cobranca_padrao: data.metodo_cobranca_padrao || undefined,
    };
  }

  function onSubmit(data: InsumoFormValues) {
    console.log('🔍 Dados do formulário antes da limpeza:', data);
    const profundidadeNumerica = Number(data.profundidade || 0);
    let parametrosConsumo: any = data.parametros_consumo ?? null;

    if (typeof parametrosConsumo === 'string') {
      try {
        parametrosConsumo = JSON.parse(parametrosConsumo);
      } catch {
        parametrosConsumo = null;
      }
    }
    if (!parametrosConsumo || typeof parametrosConsumo !== 'object') {
      parametrosConsumo = {};
    }

    if (data.tem_profundidade && profundidadeNumerica > 0) {
      parametrosConsumo.geometria_3d = {
        tem_profundidade: true,
        profundidade: profundidadeNumerica,
      };
    } else if (parametrosConsumo.geometria_3d) {
      delete parametrosConsumo.geometria_3d;
    }
    
    const cleanedData: any = {
      ...data,
      custo_unitario: data.custo_unitario || 0,
      quantidade_compra: data.quantidade_compra || 1,
      fator_conversao: data.fator_conversao || 1,
      largura: data.largura || undefined,
      altura: data.altura || undefined,
      unidade_dimensao: data.unidade_dimensao || undefined,
      tipo_calculo: data.tipo_calculo || undefined,
      gramatura: data.gramatura || undefined,
      estoque_minimo: data.estoque_minimo || undefined,
      controlar_estoque: Boolean(data.controlar_estoque),
      estoque_localizacao_id: data.estoque_localizacao_id || undefined,
      estoque_quantidade_inicial: data.estoque_quantidade_inicial || undefined,
      estoque_maximo: data.estoque_maximo || undefined,
      estoque_lote: data.estoque_lote || undefined,
      estoque_data_validade: data.estoque_data_validade || undefined,
      estoque_observacoes: data.estoque_observacoes || undefined,
      codigo_interno: data.codigo_interno || undefined,
      descricao_tecnica: data.descricao_tecnica || undefined,
      observacoes: data.observacoes || undefined,
      logica_consumo: data.logica_consumo || 'area', // Valor padrão se não selecionado
      tipo_material_id: data.tipo_material_id || '',
      parametros_consumo: Object.keys(parametrosConsumo).length > 0 ? parametrosConsumo : null,
      ativo: data.ativo ?? true,
      ...sincronizarCamposComerciaisMaterial(data),
      perda_padrao_percent: data.perda_padrao_percent
        ? Number(String(data.perda_padrao_percent).replace(',', '.'))
        : undefined,
    }
    delete cleanedData.tem_profundidade;
    delete cleanedData.profundidade;
    
    console.log('🔍 Dados limpos para envio:', cleanedData);
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
                    <NomeInsumoSugestoes
                      nome={field.value ?? ''}
                      excludeId={excludeInsumoId}
                    />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="custo_unitario" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Custo Total da Unidade (R$) *</FormLabel>
                    <FormControl>
                        <CustomCurrencyInput 
                            onValueChange={field.onChange} 
                            value={field.value} 
                            placeholder="R$ 10,50"
                            disabled={lockFornecedorCusto}
                        />
                    </FormControl>
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
                        onCreateDetailed={abrirCadastroCompletoFornecedor}
                        createPlaceholder="Criar fornecedor rápido"
                        detailedCreatePlaceholder="Cadastrar fornecedor completo"
                        disabled={lockFornecedorCusto}
                    />
                    {lockFornecedorCusto && (
                      <p className="text-xs text-muted-foreground">
                        Altere o fornecedor e o custo padrão na matriz abaixo.
                      </p>
                    )}
                    <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="flex items-center gap-2 py-1">
              <FormField control={form.control} name="tem_profundidade" render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={Boolean(field.value)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        field.onChange(checked);
                        if (!checked) form.setValue('profundidade', '');
                      }}
                      className="h-3.5 w-3.5 rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel className="text-xs font-normal text-muted-foreground">
                    Usar profundidade (3D)
                  </FormLabel>
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <FormField control={form.control} name="largura" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Largura (opcional)</FormLabel>
                    <FormControl>
                        <Input 
                            type="number" 
                            step="0.01"
                            placeholder="Ex: 6.0" 
                            {...field} 
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="altura" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Altura/Comprimento (opcional)</FormLabel>
                    <FormControl>
                        <Input 
                            type="number" 
                            step="0.01"
                            placeholder="Ex: 2.2" 
                            {...field} 
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                {temProfundidade && (
                  <FormField control={form.control} name="profundidade" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profundidade</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 0.05" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                <FormField control={form.control} name="unidade_dimensao" render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        <InfoTooltip content="Selecione a unidade de medida das dimensões (largura e altura). Ex: se você mediu em metros, selecione METROS.">
                            Unidade das Dimensões
                        </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                        <UnitSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione a unidade"
                            units={unidadesDimensao}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="tipo_calculo" render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        <InfoTooltip content="Como calcular a quantidade total: ÁREA (largura × altura), LINEAR (apenas largura), QUANTIDADE (itens em grade), PESO ou VOLUME.">
                            Tipo de Cálculo
                        </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {tiposCalculo.map((tipo) => (
                                    <SelectItem key={tipo.value} value={tipo.value}>
                                        {tipo.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="quantidade_compra" render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        <InfoTooltip content="Quantidade total da unidade de compra. Ex: 13.2 m² em uma bobina, 100 metros em um rolo, 50 unidades em uma caixa. Será calculado automaticamente se você preencher largura, altura, unidade e tipo de cálculo.">
                            Quantidade Total *
                        </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input 
                                type="number" 
                                step="0.001"
                                placeholder="Ex: 13.2" 
                                {...field} 
                                className={
                                  largura &&
                                  altura &&
                                  unidadeDimensao &&
                                  tipoCalculo &&
                                  (tipoCalculo !== 'VOLUME' || (temProfundidade && profundidade))
                                    ? "pr-10"
                                    : ""
                                }
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    // Validar se o valor não é absurdo (mais de 1 milhão)
                                    if (value > 1000000) {
                                        toast.error("Quantidade muito alta! Verifique se está na unidade correta.");
                                        return;
                                    }
                                    // Validar se o valor não é muito alto para o tipo de cálculo
                                    if (largura && altura && unidadeDimensao && tipoCalculo) {
                                        const larguraNum = parseFloat(largura);
                                        const alturaNum = parseFloat(altura);
                                        const larguraEmMetros = converterParaMetros(larguraNum, unidadeDimensao);
                                        const alturaEmMetros = converterParaMetros(alturaNum, unidadeDimensao);
                                        
                                        let areaEsperada = 0;
                                        switch (tipoCalculo) {
                                            case 'AREA':
                                                areaEsperada = larguraEmMetros * alturaEmMetros;
                                                break;
                                            case 'LINEAR':
                                                areaEsperada = larguraEmMetros;
                                                break;
                                            case 'VOLUME': {
                                                const profundidadeNum = parseFloat(profundidade || '');
                                                const profundidadeEmMetros = converterParaMetros(
                                                  isNaN(profundidadeNum) ? 0 : profundidadeNum,
                                                  unidadeDimensao,
                                                );
                                                areaEsperada = larguraEmMetros * alturaEmMetros * profundidadeEmMetros;
                                                break;
                                            }
                                            default:
                                                areaEsperada = larguraEmMetros * alturaEmMetros;
                                        }
                                        
                                        // Se o valor é muito maior que o esperado, pode estar em cm² ou mm²
                                        if (value > areaEsperada * 100) {
                                            // Tentar corrigir automaticamente
                                            const valorCorrigido = value / 10000; // Converter de cm² para m²
                                            if (Math.abs(valorCorrigido - areaEsperada) < areaEsperada * 0.1) {
                                                toast.success("Quantidade corrigida automaticamente de cm² para m².");
                                                e.target.value = valorCorrigido.toString();
                                                field.onChange(e);
                                                return;
                                            }
                                            toast.error("Quantidade muito alta! Pode estar em cm² ou mm² em vez de m².");
                                            return;
                                        }
                                    }
                                    // Validar se o valor faz sentido para o tipo de cálculo
                                    if (largura && altura && unidadeDimensao && tipoCalculo) {
                                        const larguraNum = parseFloat(largura);
                                        const alturaNum = parseFloat(altura);
                                        const larguraEmMetros = converterParaMetros(larguraNum, unidadeDimensao);
                                        const alturaEmMetros = converterParaMetros(alturaNum, unidadeDimensao);
                                        
                                        let areaEsperada = 0;
                                        switch (tipoCalculo) {
                                            case 'AREA':
                                                areaEsperada = larguraEmMetros * alturaEmMetros;
                                                break;
                                            case 'LINEAR':
                                                areaEsperada = larguraEmMetros;
                                                break;
                                            case 'VOLUME': {
                                                const profundidadeNum = parseFloat(profundidade || '');
                                                const profundidadeEmMetros = converterParaMetros(
                                                  isNaN(profundidadeNum) ? 0 : profundidadeNum,
                                                  unidadeDimensao,
                                                );
                                                areaEsperada = larguraEmMetros * alturaEmMetros * profundidadeEmMetros;
                                                break;
                                            }
                                            default:
                                                areaEsperada = larguraEmMetros * alturaEmMetros;
                                        }
                                        
                                                                                        // Se o valor inserido é muito diferente do calculado, mostrar aviso
                                        if (Math.abs(value - areaEsperada) > areaEsperada * 0.1) { // 10% de tolerância
                                          toast.warning("Quantidade diferente do calculado automaticamente. Verifique se está correto.");
                                        }
                                    }
                                    field.onChange(e);
                                }}
                            />
                            {largura &&
                              altura &&
                              unidadeDimensao &&
                              tipoCalculo &&
                              (tipoCalculo !== 'VOLUME' || (temProfundidade && profundidade)) && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                        Auto
                                    </div>
                                </div>
                            )}
                            {!largura || !altura || !unidadeDimensao || !tipoCalculo || (tipoCalculo === 'VOLUME' && (!temProfundidade || !profundidade)) ? (
                                <div className="text-xs text-gray-500 mt-1">
                                    💡 Preencha largura, altura, unidade e tipo de cálculo{tipoCalculo === 'VOLUME' ? ' + profundidade 3D' : ''} para cálculo automático
                                </div>
                            ) : null}
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="unidade_compra" render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        <InfoTooltip content="Como você compra o insumo. Ex: BOBINA (lona), ROLO (cordão), CAIXA (parafusos), KG (tinta), LITRO (cola).">
                            Unidade de Compra *
                        </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                        <UnitSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione a unidade de compra"
                            units={unidadesDeMedida}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="unidade_uso" render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        <InfoTooltip content="Como você consome o insumo no produto final. Ex: M² (lona), M (cordão), UNIDADE (parafusos), M³ (bloco EPS para totem 3D), M² LATERAL (lona que reveste só as 4 laterais de caixa aberta).">
                            Unidade de Uso *
                        </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                        <UnitSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione a unidade de uso"
                            units={unidadesDeUso}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="fator_conversao" render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        <InfoWithExamples 
                            tooltipContent="Fator que converte unidade de compra para unidade de uso. Na maioria dos casos use 1.0."
                            onShowExamples={() => setShowExamplesModal(true)}
                        >
                            Fator de Conversão *
                        </InfoWithExamples>
                    </FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input 
                                type="number" 
                                step="0.0001"
                                placeholder="Ex: 1" 
                                {...field} 
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border">
                                    Dica: 1 ou 1,0
                                </div>
                            </div>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
            </div>

            {/* Campo calculado - Custo por Unidade de Uso */}
            {custoPorUnidadeUso && unidadeUso && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-green-800">💰 Custo por {unidadeUso}</div>
                            <div className="text-sm text-green-600">
                                Calculado automaticamente baseado nos dados acima
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-700">
                                {new Intl.NumberFormat('pt-BR', { 
                                  style: 'currency', 
                                  currency: 'BRL',
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                }).format(custoPorUnidadeUso)}
                            </div>
                            <div className="text-xs text-green-600">
                                por {unidadeUso.toLowerCase()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Seção de Lógica de Consumo - Apenas quando Personalizado for selecionado */}
            {form.watch('tipo_calculo') === 'PERSONALIZADO' && (
              <Card>
                <CardHeader>
                  <CardTitle>🔧 Lógica de Consumo Automático</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure como este insumo será calculado automaticamente nos orçamentos.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className={`grid gap-4 ${form.watch('logica_consumo') === 'custom' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    <FormField control={form.control} name="logica_consumo" render={({ field }) => {
                      console.log('🔍 Campo logica_consumo:', field.value);
                      return (
                        <FormItem>
                          <FormLabel>Tipo de Cálculo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a lógica de consumo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="area">Área (m²)</SelectItem>
                              <SelectItem value="perimetro">Perímetro (m)</SelectItem>
                              <SelectItem value="quantidade_fixa">Quantidade Fixa</SelectItem>
                              <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            Para cálculos personalizados, use o campo &quot;Tipo de Material&quot; abaixo.
                          </p>
                          <FormMessage />
                        </FormItem>
                      );
                    }} />
                    
                    {form.watch('logica_consumo') === 'custom' && (
                      <FormField control={form.control} name="tipo_material_id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Material</FormLabel>
                          <Combobox 
                            options={tiposMaterial} 
                            {...field} 
                            placeholder="Selecione o tipo de material"
                          />
                          <p className="text-sm text-muted-foreground">
                            Configure tipos de material em Configurações → Tipos de Material.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <FormField control={form.control} name="gramatura" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Gramatura (opcional)</FormLabel>
                    <FormControl>
                        <Input 
                            type="number" 
                            step="0.1"
                            placeholder="Ex: 440" 
                            {...field} 
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="codigo_interno" render={({ field }) => (
                    <FormItem><FormLabel>Código Interno</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="estoque_minimo" render={({ field }) => (
                    <FormItem><FormLabel>Estoque Mínimo</FormLabel><FormControl><Input type="number" min="0" step="1" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            
            <div className="rounded-md border p-4 space-y-4">
                <FormField control={form.control} name="controlar_estoque" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <input
                                type="checkbox"
                                checked={Boolean(field.value)}
                                onChange={(event) => field.onChange(event.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-gray-300"
                            />
                        </FormControl>
                        <div className="space-y-1">
                            <FormLabel className="text-sm font-medium">Controlar este insumo no estoque</FormLabel>
                            <p className="text-sm text-muted-foreground">
                                Ao marcar, o sistema cria ou atualiza um item de estoque vinculado a este insumo.
                            </p>
                        </div>
                    </FormItem>
                )} />

                {controlarEstoque && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="estoque_localizacao_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Localização do Estoque</FormLabel>
                                <Combobox
                                    options={localizacoesEstoque}
                                    {...field}
                                    value={field.value ?? ''}
                                    placeholder="Usar localização padrão"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Se não selecionar, será usada ou criada a localização padrão da loja.
                                </p>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="estoque_quantidade_inicial" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantidade Inicial</FormLabel>
                                <FormControl><Input type="number" min="0" step="0.001" {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="estoque_maximo" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estoque Máximo</FormLabel>
                                <FormControl><Input type="number" min="0" step="0.001" {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="estoque_lote" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lote</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="estoque_data_validade" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Validade do Lote</FormLabel>
                                <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="estoque_observacoes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Observações do Estoque</FormLabel>
                                <FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                )}
            </div>

            <FormField control={form.control} name="descricao_tecnica" render={({ field }) => (
                <FormItem><FormLabel>Descrição Técnica</FormLabel><FormControl><Textarea placeholder="Cor, gramatura, etc." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="observacoes" render={({ field }) => (
                <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />

           </CardContent>
         </Card>

         <Card>
           <CardHeader>
             <CardTitle>Aproveitamento e cobrança no orçamento</CardTitle>
             <p className="text-sm text-muted-foreground font-normal">
               Complementa o cadastro acima. As medidas comerciais vêm de{' '}
               <strong>Largura</strong> e <strong>Altura/Comprimento</strong> — não precisa repetir.
               Chapa: peça em uma folha. Rolo/bobina: largura da mídia × metragem do rolo (ex.: banner em rolo de 50 m).
             </p>
           </CardHeader>
           <CardContent className="space-y-4">
             <FormField
               control={form.control}
               name="formato_material"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Como você compra este material</FormLabel>
                   <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                     <FormControl>
                       <SelectTrigger>
                         <SelectValue placeholder="Opcional — só se usar simulação no orçamento" />
                       </SelectTrigger>
                     </FormControl>
                     <SelectContent>
                       <SelectItem value="none">Não usar simulação de aproveitamento</SelectItem>
                       <SelectItem value="CHAPA">Chapa / placa (área fixa)</SelectItem>
                       <SelectItem value="ROLO">Rolo / bobina</SelectItem>
                       <SelectItem value="BARRA">Barra</SelectItem>
                       <SelectItem value="UNIDADE">Unidade</SelectItem>
                       <SelectItem value="METRO_LINEAR">Metro linear</SelectItem>
                       <SelectItem value="LIQUIDO">Líquido</SelectItem>
                       <SelectItem value="PESO">Peso</SelectItem>
                       <SelectItem value="SERVICO">Serviço</SelectItem>
                     </SelectContent>
                   </Select>
                   <FormMessage />
                 </FormItem>
               )}
             />

             {formatoMaterial && formatoMaterial !== 'none' && (
               <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
                 <p className="font-medium text-foreground">Medidas que o orçamento vai usar</p>
                 {parseDimensao(larguraCadastro) ? (
                   <p>
                     Largura: {larguraCadastro} {unidadeDimensaoCadastro || ''}
                     {(formatoMaterial === 'ROLO' ||
                       formatoMaterial === 'METRO_LINEAR' ||
                       formatoMaterial === 'BARRA') &&
                     parseDimensao(alturaCadastro)
                       ? ` · Comprimento do rolo/barra: ${alturaCadastro} ${unidadeDimensaoCadastro || ''}`
                       : parseDimensao(alturaCadastro)
                         ? ` · Altura/comprimento: ${alturaCadastro} ${unidadeDimensaoCadastro || ''}`
                         : ' · Informe Altura/Comprimento no cadastro acima'}
                   </p>
                 ) : (
                   <p className="text-amber-700">
                     Preencha Largura (e Altura/Comprimento) na seção &quot;Dados do Insumo&quot; para habilitar a simulação.
                   </p>
                 )}
                 {formatoMaterial === 'ROLO' && (
                   <p>
                     No mercado, rolo costuma ser orçado por m² consumido ou por metro linear impresso; aqui a simulação estima área e sobra com base na bobina.
                   </p>
                 )}
               </div>
             )}

             {formatoMaterial && formatoMaterial !== 'none' && (
               <>
                 <FormField control={form.control} name="perda_padrao_percent" render={({ field }) => (
                   <FormItem>
                     <FormLabel>Perda padrão na produção (%)</FormLabel>
                     <FormControl>
                       <Input placeholder="Ex: 5 (sangria, refilo, setup)" {...field} value={field.value ?? ''} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )} />

                 <FormField
                   control={form.control}
                   name="metodo_cobranca_padrao"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Como cobrar este material no orçamento (padrão)</FormLabel>
                       <Select value={field.value || 'AREA_LIQUIDA'} onValueChange={field.onChange}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           <SelectItem value="AREA_LIQUIDA">Área líquida usada (m² da peça)</SelectItem>
                           <SelectItem value="AREA_COM_PERDA">Área usada + perda padrão</SelectItem>
                           {(formatoMaterial === 'CHAPA' || !formatoMaterial) && (
                             <SelectItem value="CHAPA_INTEIRA">Chapa / unidade comercial inteira</SelectItem>
                           )}
                           <SelectItem value="MANUAL">Valor manual</SelectItem>
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <div className="flex flex-col gap-3">
                   <FormField control={form.control} name="permite_simulacao_chapa" render={({ field }) => (
                     <FormItem className="flex flex-row items-center gap-2 space-y-0">
                       <FormControl>
                         <input type="checkbox" checked={Boolean(field.value)} onChange={field.onChange} className="h-4 w-4 rounded border-gray-300" />
                       </FormControl>
                       <FormLabel className="text-sm font-normal">
                         Mostrar simulação de aproveitamento e sobra no orçamento
                       </FormLabel>
                     </FormItem>
                   )} />
                   <FormField control={form.control} name="permite_registrar_sobra" render={({ field }) => (
                     <FormItem className="flex flex-row items-center gap-2 space-y-0">
                       <FormControl>
                         <input type="checkbox" checked={Boolean(field.value)} onChange={field.onChange} className="h-4 w-4 rounded border-gray-300" />
                       </FormControl>
                       <FormLabel className="text-sm font-normal">
                         Permitir registrar sobra/retalho na OS (após produção)
                       </FormLabel>
                     </FormItem>
                   )} />
                 </div>
               </>
             )}
           </CardContent>
         </Card>

        {afterFields}

        <div className="flex justify-end gap-2">
            <Link href="/insumos"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button></Link>
            <Button type="submit" disabled={isSaving}><Save className="h-4 w-4 mr-2" />{isSaving ? 'Salvando...' : 'Salvar Insumo'}</Button>
        </div>
      </form>

      <Dialog
        open={fornecedorCompletoOpen}
        onOpenChange={(open) => {
          if (!salvandoFornecedor) setFornecedorCompletoOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Cadastrar fornecedor completo</DialogTitle>
            <DialogDescription>
              Complete os dados do fornecedor. Ao salvar, ele será selecionado
              automaticamente neste insumo.
            </DialogDescription>
          </DialogHeader>
          <FornecedorForm
            key={nomeNovoFornecedor}
            initialData={{ nome: nomeNovoFornecedor, tipo: 'INSUMO' }}
            onSave={salvarFornecedorCompleto}
            onCancel={() => setFornecedorCompletoOpen(false)}
            loading={salvandoFornecedor}
          />
        </DialogContent>
      </Dialog>
      
      <ConversionExamplesModal 
        isOpen={showExamplesModal}
        onClose={() => setShowExamplesModal(false)}
      />
    </Form>
  );
} 
