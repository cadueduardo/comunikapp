'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, Calculator, Settings, Package, Users } from 'lucide-react';

const formSchema = z.object({
  cliente_id: z.string().min(1, 'Selecione um cliente'),
  // Configurações globais
  margem_lucro_customizada: z.string().optional(),
  impostos_customizados: z.string().optional(),
  condicoes_comerciais: z.string().optional(),
  // Itens de produto
  itens_produto: z.array(z.object({
    nome_servico: z.string().min(1, 'Nome do produto é obrigatório'),
    quantidade_produto: z.string().optional(),
    descricao: z.string().optional(),
    // Medidas do produto
    largura_produto: z.string().optional(),
    altura_produto: z.string().optional(),
    unidade_medida_produto: z.string().optional(),
    area_produto: z.string().optional(),
    // Materiais utilizados para este produto
    materiais: z.array(z.object({
      insumo_id: z.string().min(1, 'Selecione um material'),
      quantidade: z.string().min(1, 'Quantidade é obrigatória').refine(
        (val) => {
          const cleanVal = val.replace(',', '.');
          const num = Number(cleanVal);
          return !isNaN(num) && num > 0;
        },
        'Quantidade deve ser um número válido maior que zero'
      ),
    })).min(1, 'Adicione pelo menos um material'),
    // Máquinas utilizadas para este produto
    maquinas: z.array(z.object({
      maquina_id: z.string().min(1, 'Selecione uma máquina'),
      horas_utilizadas: z.string().min(1, 'Horas utilizadas é obrigatória'),
    })),
    // Funções utilizadas para este produto
    funcoes: z.array(z.object({
      funcao_id: z.string().min(1, 'Selecione uma função'),
      horas_trabalhadas: z.string().min(1, 'Horas trabalhadas é obrigatória'),
    })),
  })).min(1, 'Adicione pelo menos um produto'),
});

type FormValues = z.infer<typeof formSchema>;

interface Cliente {
  id: string;
  nome: string;
}

interface Insumo {
  id: string;
  nome: string;
  unidade_compra: string;
  custo_unitario: number;
  quantidade_compra: number;
  unidade_uso: string;
  fator_conversao: number;
  largura?: number | null;
  altura?: number | null;
  unidade_dimensao?: string | null;
  tipo_calculo?: string | null;
  gramatura?: number | null;
  logica_consumo?: string | null;
  tipoMaterial?: {
    id: string;
    nome: string;
    logica_consumo: string;
    parametros_padrao: Record<string, any> | null;
  } | null;
  categoria: {
    nome: string;
  };
}

interface Maquina {
  id: string;
  nome: string;
  tipo: string;
  custo_hora: number;
  status: string;
}

interface Funcao {
  id: string;
  nome: string;
  custo_hora: number;
  descricao?: string;
  maquina?: {
    nome: string;
  };
}

interface CalculoResultado {
  horas_producao_total: number;
  custos: {
    custo_material: number;
    custo_mao_obra: number;
    custo_maquinaria: number;
    custo_indireto: number;
    custos_indiretos_detalhados: Array<{
      nome: string;
      categoria: string;
      valor_rateado: number;
      percentual_rateio: number;
    }>;
    custo_total_producao: number;
    margem_lucro_percentual: number;
    margem_lucro_valor: number;
    subtotal_com_lucro: number;
    impostos_percentual: number;
    impostos_valor: number;
    preco_final: number;
  };
  itens: Array<{
    insumo_id: string;
    nome_insumo: string;
    quantidade: number;
    custo_unitario: number;
    custo_total: number;
    unidade_medida: string;
  }>;
  maquinas: Array<{
    maquina_id: string;
    nome_maquina: string;
    tipo_maquina: string;
    horas_utilizadas: number;
    custo_por_hora: number;
    custo_total: number;
  }>;
  funcoes: Array<{
    funcao_id: string;
    nome_funcao: string;
    horas_trabalhadas: number;
    custo_por_hora: number;
    custo_total: number;
    maquina_vinculada?: string;
  }>;
}

// Função para converter medidas para metros
function converterParaMetros(valor: number, unidade: string): number {
  switch (unidade.toLowerCase()) {
    case 'mm':
      return valor / 1000;
    case 'cm':
      return valor / 100;
    case 'm':
      return valor;
    case 'm2':
      return valor;
    default:
      return valor;
  }
}

// Função para calcular área em m²
function calcularArea(largura: number, altura: number, unidade: string): number {
  if (!largura || !altura) return 0;
  
  const larguraEmMetros = converterParaMetros(largura, unidade);
  const alturaEmMetros = converterParaMetros(altura, unidade);
  
  return larguraEmMetros * alturaEmMetros;
}

// Função para obter o tipo de campo baseado na unidade de uso
function getCampoQuantidade(insumo: Insumo | undefined) {
  if (!insumo) return { label: 'Quantidade', placeholder: '0.00', step: '0.01' };
  
  switch (insumo.unidade_uso) {
    case 'M':
      return { label: 'Comprimento (metros)', placeholder: '0.00', step: '0.001' };
    case 'M2':
      return { label: 'Área (m²)', placeholder: '0.00', step: '0.01' };
    case 'M3':
      return { label: 'Volume (m³)', placeholder: '0.00', step: '0.001' };
    case 'CM':
    case 'CENTIMETRO':
      return { label: 'Comprimento (cm)', placeholder: '0.00', step: '0.01' };
    case 'CM2':
      return { label: 'Área (cm²)', placeholder: '0.00', step: '0.01' };
    case 'MM':
    case 'MILIMETRO':
      return { label: 'Comprimento (mm)', placeholder: '0.00', step: '0.1' };
    case 'KG':
      return { label: 'Peso (kg)', placeholder: '0.00', step: '0.01' };
    case 'GRAMAS':
      return { label: 'Peso (gramas)', placeholder: '0.00', step: '0.01' };
    case 'LITRO':
      return { label: 'Volume (litros)', placeholder: '0.00', step: '0.01' };
    case 'ML':
      return { label: 'Volume (ml)', placeholder: '0.00', step: '0.01' };
    case 'UNID':
    case 'PC':
      return { label: 'Quantidade (unidades)', placeholder: '0', step: '1' };
    case 'PARES':
      return { label: 'Quantidade (pares)', placeholder: '0', step: '1' };
    case 'DUZIA':
      return { label: 'Quantidade (dúzias)', placeholder: '0', step: '1' };
    case 'CENTO':
      return { label: 'Quantidade (centos)', placeholder: '0', step: '1' };
    case 'MILHEI':
      return { label: 'Quantidade (milheiros)', placeholder: '0', step: '1' };
    case 'BOBINA':
      return { label: 'Quantidade (bobinas)', placeholder: '0', step: '1' };
    case 'ROLO':
      return { label: 'Quantidade (rolos)', placeholder: '0', step: '1' };
    case 'FOLHA':
      return { label: 'Quantidade (folhas)', placeholder: '0', step: '1' };
    case 'CX':
    case 'CX2':
    case 'CX3':
    case 'CX5':
    case 'CX10':
    case 'CX15':
    case 'CX20':
    case 'CX25':
    case 'CX50':
    case 'CX100':
      return { label: 'Quantidade (caixas)', placeholder: '0', step: '1' };
    case 'PACOTE':
      return { label: 'Quantidade (pacotes)', placeholder: '0', step: '1' };
    case 'KIT':
      return { label: 'Quantidade (kits)', placeholder: '0', step: '1' };
    case 'JOGO':
      return { label: 'Quantidade (jogos)', placeholder: '0', step: '1' };
    case 'CONJUNTO':
      return { label: 'Quantidade (conjuntos)', placeholder: '0', step: '1' };
    case 'BALDE':
      return { label: 'Quantidade (baldes)', placeholder: '0', step: '1' };
    case 'BANDEJ':
      return { label: 'Quantidade (bandejas)', placeholder: '0', step: '1' };
    case 'BARRA':
      return { label: 'Quantidade (barras)', placeholder: '0', step: '1' };
    case 'BISNAG':
      return { label: 'Quantidade (bisnagas)', placeholder: '0', step: '1' };
    case 'BLOCO':
      return { label: 'Quantidade (blocos)', placeholder: '0', step: '1' };
    case 'BOMB':
      return { label: 'Quantidade (bombonas)', placeholder: '0', step: '1' };
    case 'CAPS':
      return { label: 'Quantidade (cápsulas)', placeholder: '0', step: '1' };
    case 'CART':
      return { label: 'Quantidade (cartelas)', placeholder: '0', step: '1' };
    case 'CJ':
      return { label: 'Quantidade (conjuntos)', placeholder: '0', step: '1' };
    case 'DISP':
      return { label: 'Quantidade (displays)', placeholder: '0', step: '1' };
    case 'EMBAL':
      return { label: 'Quantidade (embalagens)', placeholder: '0', step: '1' };
    case 'FARDO':
      return { label: 'Quantidade (fardos)', placeholder: '0', step: '1' };
    case 'FRASCO':
      return { label: 'Quantidade (frascos)', placeholder: '0', step: '1' };
    case 'GALAO':
      return { label: 'Quantidade (galões)', placeholder: '0', step: '1' };
    case 'GF':
      return { label: 'Quantidade (garrafas)', placeholder: '0', step: '1' };
    case 'LATA':
      return { label: 'Quantidade (latas)', placeholder: '0', step: '1' };
    case 'PALETE':
      return { label: 'Quantidade (pallets)', placeholder: '0', step: '1' };
    case 'POTE':
      return { label: 'Quantidade (potes)', placeholder: '0', step: '1' };
    case 'K':
      return { label: 'Quantidade (quilates)', placeholder: '0.00', step: '0.01' };
    case 'RESMA':
      return { label: 'Quantidade (resmas)', placeholder: '0', step: '1' };
    case 'SACO':
      return { label: 'Quantidade (sacos)', placeholder: '0', step: '1' };
    case 'SACOLA':
      return { label: 'Quantidade (sacolas)', placeholder: '0', step: '1' };
    case 'TAMBOR':
      return { label: 'Quantidade (tambores)', placeholder: '0', step: '1' };
    case 'TANQUE':
      return { label: 'Quantidade (tanques)', placeholder: '0', step: '1' };
    case 'TON':
      return { label: 'Quantidade (toneladas)', placeholder: '0.00', step: '0.01' };
    case 'TUBO':
      return { label: 'Quantidade (tubos)', placeholder: '0', step: '1' };
    case 'VASIL':
      return { label: 'Quantidade (vasilhames)', placeholder: '0', step: '1' };
    case 'VIDRO':
      return { label: 'Quantidade (vidros)', placeholder: '0', step: '1' };
    case 'AMPOLA':
      return { label: 'Quantidade (ampolas)', placeholder: '0', step: '1' };
    default:
      return { label: 'Quantidade', placeholder: '0.00', step: '0.01' };
  }
}

// Função para calcular o custo por unidade de uso
function calcularCustoPorUnidadeUso(insumo: Insumo): number {
  if (!insumo || !insumo.custo_unitario || !insumo.quantidade_compra || !insumo.fator_conversao) {
    return 0;
  }
  
  const custo = Number(insumo.custo_unitario);
  const quantidade = Number(insumo.quantidade_compra);
  const fator = Number(insumo.fator_conversao);
  
  if (quantidade > 0 && fator > 0) {
    let quantidadeCalculada = quantidade;
    
    // Se temos dimensões e tipo de cálculo, usar a lógica específica
    if (insumo.altura && insumo.unidade_dimensao && insumo.tipo_calculo) {
      const alturaNum = Number(insumo.altura);
      
      if (!isNaN(alturaNum)) {
        // Converter altura para metros
        let alturaEmMetros = alturaNum;
        
        switch (insumo.unidade_dimensao) {
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
        
        // Calcular quantidade baseada no tipo de cálculo
        switch (insumo.tipo_calculo) {
          case 'COMPRIMENTO LINEAR':
          case 'LINEAR':
            // Para comprimento linear: calcular custo por unidade de uso
            const custoPorUnidade = custo / quantidade;
            
            if (insumo.unidade_uso === 'CENTIMETRO' || insumo.unidade_uso === 'CM') {
              // Se a unidade de uso é centímetro, calcular custo por centímetro
              // Para cordão: custo por metro ÷ 100 = custo por centímetro
              const custoPorCentimetro = custoPorUnidade / 100;
              
              return custoPorCentimetro;
            } else {
              // Para outras unidades de uso, usar o cálculo padrão
              return custoPorUnidade;
            }
            
          case 'AREA':
            // Para área: calcular custo por unidade de uso baseado na área da unidade
            if (insumo.largura) {
              const larguraNum = Number(insumo.largura);
              if (!isNaN(larguraNum)) {
                let larguraEmMetros = larguraNum;
                
                switch (insumo.unidade_dimensao) {
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
                
                if (insumo.unidade_uso === 'METRO QUADRADO') {
                  // Se a unidade de uso é metro quadrado, calcular custo por m²
                  const custoPorMetroQuadrado = custo / areaPorUnidade;
                  
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
    }
    
    return custo / (quantidadeCalculada * fator);
  }
  
  return 0;
}

interface OrcamentoFormProps {
  mode: 'novo' | 'editar';
  initialData?: FormValues;
  orcamentoId?: string;
  onSuccess?: () => void;
}

export default function OrcamentoForm({ mode, initialData, orcamentoId, onSuccess }: OrcamentoFormProps) {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [calculoResultado, setCalculoResultado] = useState<CalculoResultado | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      cliente_id: '',
      margem_lucro_customizada: '',
      impostos_customizados: '',
      condicoes_comerciais: '',
      itens_produto: [{ 
        nome_servico: '', 
        quantidade_produto: '1',
        descricao: '',
        largura_produto: '',
        altura_produto: '',
        unidade_medida_produto: '',
        area_produto: '',
        materiais: [{ insumo_id: '', quantidade: '1' }],
        maquinas: [],
        funcoes: [],
      }],
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: 'itens_produto',
  });

  const calcularAreaAutomatica = (index: number) => {
    const largura = form.watch(`itens_produto.${index}.largura_produto`);
    const altura = form.watch(`itens_produto.${index}.altura_produto`);
    const unidade = form.watch(`itens_produto.${index}.unidade_medida_produto`);
    
    if (largura && altura && unidade) {
      const area = calcularArea(Number(largura), Number(altura), unidade);
      form.setValue(`itens_produto.${index}.area_produto`, area.toFixed(2));
    }
  };

  const handleAddItem = () => {
    const hasEmpty = form.getValues().itens_produto.some(
      (item) => !item.nome_servico || item.materiais.length === 0
    );
    if (!hasEmpty) {
      appendItem({ 
        nome_servico: '', 
        quantidade_produto: '1',
        descricao: '',
        largura_produto: '',
        altura_produto: '',
        unidade_medida_produto: '',
        area_produto: '',
        materiais: [{ insumo_id: '', quantidade: '1' }],
        maquinas: [],
        funcoes: [],
      });
    }
  };

  const handleAddMaterial = (itemIndex: number) => {
    const currentMaterials = form.getValues(`itens_produto.${itemIndex}.materiais`);
    const hasEmpty = currentMaterials.some(m => !m.insumo_id || !m.quantidade);
    if (!hasEmpty) {
      const newMaterials = [...currentMaterials, { insumo_id: '', quantidade: '1' }];
      form.setValue(`itens_produto.${itemIndex}.materiais`, newMaterials);
    }
  };

  const handleRemoveMaterial = (itemIndex: number, materialIndex: number) => {
    const currentMaterials = form.getValues(`itens_produto.${itemIndex}.materiais`);
    if (currentMaterials.length > 1) {
      const newMaterials = currentMaterials.filter((_, index) => index !== materialIndex);
      form.setValue(`itens_produto.${itemIndex}.materiais`, newMaterials);
    }
  };

  const handleAddMaquina = async (itemIndex: number) => {
    await fetchMaquinas(); // Busca sempre antes de adicionar
    const currentMaquinas = form.getValues(`itens_produto.${itemIndex}.maquinas`);
    const hasEmpty = currentMaquinas.some(m => !m.maquina_id || !m.horas_utilizadas);
    if (!hasEmpty) {
      const newMaquinas = [...currentMaquinas, { maquina_id: '', horas_utilizadas: '' }];
      form.setValue(`itens_produto.${itemIndex}.maquinas`, newMaquinas);
    }
  };

  const handleRemoveMaquina = (itemIndex: number, maquinaIndex: number) => {
    const currentMaquinas = form.getValues(`itens_produto.${itemIndex}.maquinas`);
    const newMaquinas = currentMaquinas.filter((_, index) => index !== maquinaIndex);
    form.setValue(`itens_produto.${itemIndex}.maquinas`, newMaquinas);
  };

  const handleAddFuncao = async (itemIndex: number) => {
    await fetchFuncoes(); // Busca sempre antes de adicionar
    const currentFuncoes = form.getValues(`itens_produto.${itemIndex}.funcoes`);
    const hasEmpty = currentFuncoes.some(f => !f.funcao_id || !f.horas_trabalhadas);
    if (!hasEmpty) {
      const newFuncoes = [...currentFuncoes, { funcao_id: '', horas_trabalhadas: '' }];
      form.setValue(`itens_produto.${itemIndex}.funcoes`, newFuncoes);
    }
  };

  const handleRemoveFuncao = (itemIndex: number, funcaoIndex: number) => {
    const currentFuncoes = form.getValues(`itens_produto.${itemIndex}.funcoes`);
    const newFuncoes = currentFuncoes.filter((_, index) => index !== funcaoIndex);
    form.setValue(`itens_produto.${itemIndex}.funcoes`, newFuncoes);
  };

  useEffect(() => {
    fetchClientes();
    fetchInsumos();
    fetchMaquinas();
    fetchFuncoes();
  }, []);

  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/clientes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const fetchInsumos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/insumos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInsumos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error);
    }
  };

  const fetchMaquinas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/maquinas', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMaquinas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error);
    }
  };

  const fetchFuncoes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/funcoes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFuncoes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar funções:', error);
    }
  };

  const calcularOrcamento = async (values: FormValues) => {
    setCalculando(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // Transformar dados para o formato esperado pelo backend
      const primeiroItem = values.itens_produto[0];
      if (!primeiroItem) {
        toast.error('Adicione pelo menos um produto');
        return;
      }

      // Converter materiais para o formato esperado
      const itens = primeiroItem.materiais.map(material => {
        const insumo = insumos.find(i => i.id === material.insumo_id);
        const areaProduto = Number(primeiroItem.area_produto) || 0;
        const larguraProduto = Number(primeiroItem.largura_produto) || 0;
        const alturaProduto = Number(primeiroItem.altura_produto) || 0;

        return {
          insumo_id: material.insumo_id,
          quantidade: Number(String(material.quantidade).replace(',', '.')),
          // Incluir informações do produto para lógica personalizada
          area_produto: areaProduto > 0 ? areaProduto : undefined,
          largura_produto: larguraProduto > 0 ? larguraProduto : undefined,
          altura_produto: alturaProduto > 0 ? alturaProduto : undefined,
        };
      });

      // Calcular horas de produção baseado em máquinas e funções
      const horasMaquinas = primeiroItem.maquinas.reduce((total, maquina) => {
        return total + (Number(maquina.horas_utilizadas) || 0);
      }, 0);

      const horasFuncoes = primeiroItem.funcoes.reduce((total, funcao) => {
        return total + (Number(funcao.horas_trabalhadas) || 0);
      }, 0);

      const horasProducao = horasMaquinas + horasFuncoes; // Soma total das horas

      const dadosCalculo = {
        nome_servico: primeiroItem.nome_servico,
        descricao: primeiroItem.descricao,
        horas_producao: horasProducao,
        quantidade_produto: Number(primeiroItem.quantidade_produto) || 1,
        itens: itens,
        maquinas: primeiroItem.maquinas.map(maquina => ({
          maquina_id: maquina.maquina_id,
          horas_utilizadas: Number(maquina.horas_utilizadas)
        })),
        funcoes: primeiroItem.funcoes.map(funcao => ({
          funcao_id: funcao.funcao_id,
          horas_trabalhadas: Number(funcao.horas_trabalhadas)
        })),
        cliente_id: values.cliente_id,
        margem_lucro_customizada: values.margem_lucro_customizada ? Number(values.margem_lucro_customizada) : undefined,
        impostos_customizados: values.impostos_customizados ? Number(values.impostos_customizados) : undefined,
      };

      // Debug: log dos dados sendo enviados
      console.log('Dados sendo enviados para cálculo:', dadosCalculo);

      const response = await fetch('http://localhost:3001/orcamentos/calcular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dadosCalculo),
      });

      if (response.ok) {
        const resultado = await response.json();
        console.log('Resultado do cálculo:', resultado);
        setCalculoResultado(resultado);
        toast.success('Cálculo realizado com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao calcular orçamento');
      }
    } catch (error) {
      console.error('Erro ao calcular orçamento:', error);
      toast.error('Erro ao calcular orçamento');
    } finally {
      setCalculando(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const url = mode === 'novo' 
        ? 'http://localhost:3001/orcamentos'
        : `http://localhost:3001/orcamentos/${orcamentoId}`;
      
      const method = mode === 'novo' ? 'POST' : 'PATCH';

      // Transformar dados para o formato esperado pelo backend
      const primeiroItem = values.itens_produto[0];
      if (!primeiroItem) {
        toast.error('Adicione pelo menos um produto');
        return;
      }

      const dadosParaEnviar = {
        nome_servico: primeiroItem.nome_servico,
        descricao: primeiroItem.descricao,
        horas_producao: 1, // Será calculado pelo backend
        quantidade_produto: Number(primeiroItem.quantidade_produto) || 1,
        largura_produto: primeiroItem.largura_produto ? Number(String(primeiroItem.largura_produto).replace(',', '.')) : undefined,
        altura_produto: primeiroItem.altura_produto ? Number(String(primeiroItem.altura_produto).replace(',', '.')) : undefined,
        area_produto: primeiroItem.area_produto ? Number(String(primeiroItem.area_produto).replace(',', '.')) : undefined,
        unidade_medida_produto: primeiroItem.unidade_medida_produto,
        itens: primeiroItem.materiais.map(material => ({
          insumo_id: material.insumo_id,
          quantidade: Number(String(material.quantidade).replace(',', '.'))
        })),
        maquinas: primeiroItem.maquinas.map(maquina => ({
          maquina_id: maquina.maquina_id,
          horas_utilizadas: Number(maquina.horas_utilizadas)
        })),
        funcoes: primeiroItem.funcoes.map(funcao => ({
          funcao_id: funcao.funcao_id,
          horas_trabalhadas: Number(funcao.horas_trabalhadas)
        })),
        cliente_id: values.cliente_id,
        condicoes_comerciais: values.condicoes_comerciais,
        margem_lucro_customizada: values.margem_lucro_customizada ? Number(values.margem_lucro_customizada) : undefined,
        impostos_customizados: values.impostos_customizados ? Number(values.impostos_customizados) : undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      if (response.ok) {
        await response.json(); // Consumir a resposta
        toast.success(mode === 'novo' ? 'Orçamento criado com sucesso!' : 'Orçamento atualizado com sucesso!');
        
        if (mode === 'novo') {
          router.push('/orcamentos');
        } else {
          onSuccess?.();
        }
      } else {
        const error = await response.json();
        toast.error(error.message || `Erro ao ${mode === 'novo' ? 'criar' : 'atualizar'} orçamento`);
      }
    } catch (error) {
      console.error(`Erro ao ${mode === 'novo' ? 'criar' : 'atualizar'} orçamento:`, error);
      toast.error(`Erro ao ${mode === 'novo' ? 'criar' : 'atualizar'} orçamento`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'novo' ? 'Novo Orçamento' : 'Editar Orçamento'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'novo' 
              ? 'Crie um novo orçamento para seu cliente'
              : 'Edite as informações do orçamento'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 1. DADOS DO CLIENTE */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="cliente_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientes.map((cliente) => (
                              <SelectItem key={cliente.id} value={cliente.id}>
                                {cliente.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2. PRODUTOS DO ORÇAMENTO */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Produtos do Orçamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-4">
                    {itemFields.map((field, itemIndex) => (
                      <AccordionItem key={field.id} value={`item-${itemIndex}`}>
                        <AccordionTrigger className="hover:no-underline bg-gray-50 rounded-lg px-4 py-2">
                          <div className="flex items-center justify-between w-full pr-4">
                            <span className="font-medium text-gray-600">
                              {form.watch(`itens_produto.${itemIndex}.nome_servico`) || `Produto ${itemIndex + 1}`}
                            </span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (itemFields.length > 1) {
                                  removeItem(itemIndex);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            
                            {/* Informações básicas do produto */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name={`itens_produto.${itemIndex}.nome_servico`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome do Produto</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ex: Banner 60x100cm" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`itens_produto.${itemIndex}.quantidade_produto`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Quantidade</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="1"
                                        min="1"
                                        placeholder="1"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`itens_produto.${itemIndex}.unidade_medida_produto`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Unidade de Medida</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione a unidade" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="mm">Milímetros (mm)</SelectItem>
                                        <SelectItem value="cm">Centímetros (cm)</SelectItem>
                                        <SelectItem value="m">Metros (m)</SelectItem>
                                        <SelectItem value="un">Unidade (un)</SelectItem>
                                        <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Medidas do produto */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name={`itens_produto.${itemIndex}.largura_produto`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Largura</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e);
                                          calcularAreaAutomatica(itemIndex);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`itens_produto.${itemIndex}.altura_produto`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Altura</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e);
                                          calcularAreaAutomatica(itemIndex);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`itens_produto.${itemIndex}.area_produto`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Área (m²)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        readOnly
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Calculada automaticamente
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`itens_produto.${itemIndex}.descricao`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descrição</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Descreva o produto, especificações técnicas, etc."
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Separator />

                            {/* Materiais Utilizados */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-medium">Materiais Utilizados</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddMaterial(itemIndex)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar Material
                                </Button>
                              </div>
                              
                              {form.watch(`itens_produto.${itemIndex}.materiais`)?.map((material, materialIndex) => {
                                const insumoSelecionado = insumos.find(insumo => insumo.id === material.insumo_id);
                                const campoQuantidade = getCampoQuantidade(insumoSelecionado);
                                const custoPorUnidade = insumoSelecionado ? calcularCustoPorUnidadeUso(insumoSelecionado) : 0;
                                const quantidade = Number(String(material.quantidade).replace(',', '.')) || 0;
                                const custoCalculado = custoPorUnidade * quantidade;
                                
                                // Obter área do produto para materiais calculados por m²
                                const areaProduto = Number(form.watch(`itens_produto.${itemIndex}.area_produto`)) || 0;
                                const larguraProduto = Number(form.watch(`itens_produto.${itemIndex}.largura_produto`)) || 0;
                                const alturaProduto = Number(form.watch(`itens_produto.${itemIndex}.altura_produto`)) || 0;
                                const unidadeMedidaProduto = form.watch(`itens_produto.${itemIndex}.unidade_medida_produto`);
                                
                                // Calcular área se não estiver calculada
                                const areaCalculada = areaProduto > 0 ? areaProduto : 
                                  (larguraProduto && alturaProduto && unidadeMedidaProduto) ? 
                                  calcularArea(larguraProduto, alturaProduto, unidadeMedidaProduto) : 0;
                                
                                // Sugerir quantidade baseada no tipo de insumo
                                const sugerirQuantidade = () => {
                                  if (!insumoSelecionado) return '';
                                  
                                  let sugestao = '';
                                                  
                                  // Verificar se tem lógica personalizada
                                  if (insumoSelecionado.logica_consumo === 'custom' && insumoSelecionado.tipoMaterial) {
                                    const parametros = insumoSelecionado.tipoMaterial.parametros_padrao;
                                    const areaProduto = Number(form.watch(`itens_produto.${itemIndex}.area_produto`)) || 0;
                                    const larguraProduto = Number(form.watch(`itens_produto.${itemIndex}.largura_produto`)) || 0;
                                    const alturaProduto = Number(form.watch(`itens_produto.${itemIndex}.altura_produto`)) || 0;
                                    
                                    if (parametros && parametros.tipo_calculo) {
                                      switch (parametros.tipo_calculo) {
                                        case 'espacamento':
                                          if (parametros.espacamento && larguraProduto && alturaProduto) {
                                            const perimetro = 2 * (larguraProduto + alturaProduto);
                                            const espacamento = Number(parametros.espacamento);
                                            sugestao = Math.ceil(perimetro / espacamento).toString();
                                          }
                                          break;
                                        
                                        case 'quantidade_por_m2':
                                          if (parametros.quantidade_por_m2 && areaProduto > 0) {
                                            sugestao = (areaProduto * Number(parametros.quantidade_por_m2)).toString();
                                          }
                                          break;
                                        
                                        case 'multiplicador':
                                          if (parametros.multiplicador) {
                                            sugestao = (1 * Number(parametros.multiplicador)).toString();
                                          }
                                          break;
                                        
                                        case 'quantidade_fixa':
                                          if (parametros.quantidade_fixa) {
                                            sugestao = parametros.quantidade_fixa.toString();
                                          }
                                          break;
                                      }
                                    }
                                  } else {
                                    // Lógica padrão baseada na unidade de uso
                                    switch (insumoSelecionado.unidade_uso) {
                                      case 'M2':
                                        if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
                                          const area = calcularArea(Number(larguraProduto), Number(alturaProduto), unidadeMedidaProduto);
                                          sugestao = area.toFixed(2);
                                        }
                                        break;
                                      case 'M':
                                        if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
                                          const larguraEmMetros = converterParaMetros(Number(larguraProduto), unidadeMedidaProduto);
                                          const alturaEmMetros = converterParaMetros(Number(alturaProduto), unidadeMedidaProduto);
                                          const perimetro = 2 * (larguraEmMetros + alturaEmMetros);
                                          sugestao = perimetro.toFixed(2);
                                        }
                                        break;
                                    }
                                  }
                                  
                                  return sugestao;
                                };

                                // Gerar explicação detalhada do cálculo
                                const gerarExplicacaoCalculo = () => {
                                  if (!insumoSelecionado) return '';
                                  
                                  const areaProduto = Number(form.watch(`itens_produto.${itemIndex}.area_produto`)) || 0;
                                  const larguraProduto = Number(form.watch(`itens_produto.${itemIndex}.largura_produto`)) || 0;
                                  const alturaProduto = Number(form.watch(`itens_produto.${itemIndex}.altura_produto`)) || 0;
                                  
                                  // Verificar se tem lógica personalizada
                                  if (insumoSelecionado.logica_consumo === 'custom' && insumoSelecionado.tipoMaterial) {
                                    const parametros = insumoSelecionado.tipoMaterial.parametros_padrao;
                                    
                                    if (parametros && parametros.tipo_calculo) {
                                      switch (parametros.tipo_calculo) {
                                        case 'espacamento':
                                          if (parametros.espacamento && larguraProduto && alturaProduto) {
                                            const perimetro = 2 * (larguraProduto + alturaProduto);
                                            const espacamento = Number(parametros.espacamento);
                                            const quantidade = Math.ceil(perimetro / espacamento);
                                            return `A cada ${espacamento}cm 1 ${insumoSelecionado.nome.toLowerCase()} • Perímetro: ${perimetro}cm • Total: ${quantidade} unidades`;
                                          }
                                          break;
                                        
                                        case 'quantidade_por_m2':
                                          if (parametros.quantidade_por_m2 && areaProduto > 0) {
                                            const quantidade = areaProduto * Number(parametros.quantidade_por_m2);
                                            return `${parametros.quantidade_por_m2} ${insumoSelecionado.nome.toLowerCase()} por m² • Área: ${areaProduto}m² • Total: ${quantidade} unidades`;
                                          }
                                          break;
                                        
                                        case 'multiplicador':
                                          if (parametros.multiplicador) {
                                            return `Multiplicador: ${parametros.multiplicador}x • Total: ${parametros.multiplicador} unidades`;
                                          }
                                          break;
                                        
                                        case 'quantidade_fixa':
                                          if (parametros.quantidade_fixa) {
                                            return `Quantidade fixa: ${parametros.quantidade_fixa} unidades`;
                                          }
                                          break;
                                      }
                                    }
                                  } else {
                                    // Lógica padrão
                                    switch (insumoSelecionado.unidade_uso) {
                                      case 'M2':
                                        if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
                                          const area = calcularArea(Number(larguraProduto), Number(alturaProduto), unidadeMedidaProduto);
                                          return `Área calculada: ${area.toFixed(2)}m²`;
                                        }
                                        break;
                                      case 'M':
                                        if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
                                          const larguraEmMetros = converterParaMetros(Number(larguraProduto), unidadeMedidaProduto);
                                          const alturaEmMetros = converterParaMetros(Number(alturaProduto), unidadeMedidaProduto);
                                          const perimetro = 2 * (larguraEmMetros + alturaEmMetros);
                                          return `Perímetro calculado: ${perimetro.toFixed(2)}m`;
                                        }
                                        break;
                                    }
                                  }
                                  
                                  return '';
                                };
                                
                                return (
                                  <div key={materialIndex} className="space-y-4 mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                      <FormField
                                        control={form.control}
                                        name={`itens_produto.${itemIndex}.materiais.${materialIndex}.insumo_id`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Material</FormLabel>
                                            <Select onValueChange={(value) => {
                                              field.onChange(value);
                                              
                                              // Aplicar sugestão automática quando um insumo é selecionado
                                              if (value) {
                                                const insumoSelecionado = insumos.find(insumo => insumo.id === value);
                                                if (insumoSelecionado) {
                                                  const larguraProduto = form.watch(`itens_produto.${itemIndex}.largura_produto`);
                                                  const alturaProduto = form.watch(`itens_produto.${itemIndex}.altura_produto`);
                                                  const unidadeMedidaProduto = form.watch(`itens_produto.${itemIndex}.unidade_medida_produto`);
                                                  
                                                  let sugestao = '';
                                                  
                                                  // Verificar se tem lógica personalizada
                                                  if (insumoSelecionado.logica_consumo === 'custom' && insumoSelecionado.tipoMaterial) {
                                                    const parametros = insumoSelecionado.tipoMaterial.parametros_padrao;
                                                    const areaProduto = Number(form.watch(`itens_produto.${itemIndex}.area_produto`)) || 0;
                                                    const larguraProduto = Number(form.watch(`itens_produto.${itemIndex}.largura_produto`)) || 0;
                                                    const alturaProduto = Number(form.watch(`itens_produto.${itemIndex}.altura_produto`)) || 0;
                                                    
                                                    if (parametros && parametros.tipo_calculo) {
                                                      switch (parametros.tipo_calculo) {
                                                        case 'espacamento':
                                                          if (parametros.espacamento && larguraProduto && alturaProduto) {
                                                            const perimetro = 2 * (larguraProduto + alturaProduto);
                                                            const espacamento = Number(parametros.espacamento);
                                                            sugestao = Math.ceil(perimetro / espacamento).toString();
                                                          }
                                                          break;
                                                        
                                                        case 'quantidade_por_m2':
                                                          if (parametros.quantidade_por_m2 && areaProduto > 0) {
                                                            sugestao = (areaProduto * Number(parametros.quantidade_por_m2)).toString();
                                                          }
                                                          break;
                                                        
                                                        case 'multiplicador':
                                                          if (parametros.multiplicador) {
                                                            sugestao = (1 * Number(parametros.multiplicador)).toString();
                                                          }
                                                          break;
                                                        
                                                        case 'quantidade_fixa':
                                                          if (parametros.quantidade_fixa) {
                                                            sugestao = parametros.quantidade_fixa.toString();
                                                          }
                                                          break;
                                                      }
                                                    }
                                                  } else {
                                                    // Lógica padrão baseada na unidade de uso
                                                    switch (insumoSelecionado.unidade_uso) {
                                                      case 'M2':
                                                        if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
                                                          const area = calcularArea(Number(larguraProduto), Number(alturaProduto), unidadeMedidaProduto);
                                                          sugestao = area.toFixed(2);
                                                        }
                                                        break;
                                                      case 'M':
                                                        if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
                                                          const larguraEmMetros = converterParaMetros(Number(larguraProduto), unidadeMedidaProduto);
                                                          const alturaEmMetros = converterParaMetros(Number(alturaProduto), unidadeMedidaProduto);
                                                          const perimetro = 2 * (larguraEmMetros + alturaEmMetros);
                                                          sugestao = perimetro.toFixed(2);
                                                        }
                                                        break;
                                                    }
                                                  }
                                                  
                                                  if (sugestao) {
                                                    form.setValue(`itens_produto.${itemIndex}.materiais.${materialIndex}.quantidade`, sugestao);
                                                  }
                                                }
                                              }
                                            }} value={field.value}>
                                              <FormControl>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Selecione o material" />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                {insumos.map((insumo) => (
                                                  <SelectItem key={insumo.id} value={insumo.id}>
                                                    {insumo.nome} ({insumo.categoria.nome})
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <FormField
                                        control={form.control}
                                        name={`itens_produto.${itemIndex}.materiais.${materialIndex}.quantidade`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>{campoQuantidade.label}</FormLabel>
                                            <FormControl>
                                              <Input 
                                                type="text" 
                                                placeholder={campoQuantidade.placeholder}
                                                {...field}
                                                onChange={(e) => {
                                                  // Permitir vírgula e ponto como separador decimal
                                                  const value = e.target.value.replace(/[^0-9,.-]/g, '');
                                                  field.onChange(value);
                                                }}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <div className="flex items-center justify-end">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveMaterial(itemIndex, materialIndex)}
                                          className="text-red-500 hover:text-red-700"
                                          disabled={form.watch(`itens_produto.${itemIndex}.materiais`)?.length === 1}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* Sugestão automática baseada no produto */}
                                    {insumoSelecionado && !quantidade && (
                                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                        <div className="flex items-center justify-between">
                                          <span>
                                            Sugestão: {sugerirQuantidade()} {insumoSelecionado.unidade_uso.toLowerCase()}
                                          </span>
                                          {sugerirQuantidade() && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => form.setValue(
                                                `itens_produto.${itemIndex}.materiais.${materialIndex}.quantidade`,
                                                sugerirQuantidade()
                                              )}
                                              className="text-blue-600 hover:text-blue-800"
                                            >
                                              Aplicar
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Custo calculado */}
                                    {insumoSelecionado && quantidade > 0 && custoCalculado > 0 && (
                                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div>Custo: {formatCurrency(custoCalculado)} ({formatCurrency(custoPorUnidade)} por {insumoSelecionado.unidade_uso.toLowerCase()})</div>
                                            {gerarExplicacaoCalculo() && (
                                              <div className="text-green-700 mt-1 font-medium">
                                                {gerarExplicacaoCalculo()}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <Separator />

                            {/* Máquinas Utilizadas */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-medium">Máquinas Utilizadas</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => await handleAddMaquina(itemIndex)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar Máquina
                                </Button>
                              </div>
                              
                              {form.watch(`itens_produto.${itemIndex}.maquinas`)?.map((maquina, maquinaIndex) => (
                                <div key={maquinaIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <FormField
                                    control={form.control}
                                    name={`itens_produto.${itemIndex}.maquinas.${maquinaIndex}.maquina_id`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Máquina</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecione a máquina" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {maquinas.map((maquina) => (
                                              <SelectItem key={maquina.id} value={maquina.id}>
                                                {maquina.nome} ({maquina.tipo})
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={form.control}
                                    name={`itens_produto.${itemIndex}.maquinas.${maquinaIndex}.horas_utilizadas`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Horas Utilizadas</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            step="0.01"
                                            placeholder="0.00"
                                            {...field} 
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <div className="flex items-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMaquina(itemIndex, maquinaIndex)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <Separator />

                            {/* Funções Utilizadas */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-medium">Funções Utilizadas</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => await handleAddFuncao(itemIndex)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar Função
                                </Button>
                              </div>
                              
                              {form.watch(`itens_produto.${itemIndex}.funcoes`)?.map((funcao, funcaoIndex) => (
                                <div key={funcaoIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <FormField
                                    control={form.control}
                                    name={`itens_produto.${itemIndex}.funcoes.${funcaoIndex}.funcao_id`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Função</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecione a função" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {funcoes.map((funcao) => (
                                              <SelectItem key={funcao.id} value={funcao.id}>
                                                {funcao.nome}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={form.control}
                                    name={`itens_produto.${itemIndex}.funcoes.${funcaoIndex}.horas_trabalhadas`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Horas Trabalhadas</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            step="0.01"
                                            placeholder="0.00"
                                            {...field} 
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <div className="flex items-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveFuncao(itemIndex, funcaoIndex)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddItem}
                      className="w-full py-3 border-dashed border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                        Novo Produto
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 3. CONFIGURAÇÕES GLOBAIS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configurações Globais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="margem_lucro_customizada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Margem de Lucro (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Deixe em branco para usar a margem configurada na loja
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="impostos_customizados"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impostos (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Deixe em branco para usar os impostos configurados na loja
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="condicoes_comerciais"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condições Comerciais</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva as condições comerciais, prazos de entrega, formas de pagamento, etc."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
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
                {calculoResultado ? (
                  <div className="space-y-4">
                    {/* Resumo */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Resumo</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Valor Total:</span>
                          <span className="text-xl font-bold text-green-600">{formatCurrency(calculoResultado.custos.preco_final)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Horas Totais:</span>
                          <span>{calculoResultado.horas_producao_total?.toFixed(2) || '0.00'}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Preço Final (por unidade):</span>
                          <span className="font-semibold">{formatCurrency(calculoResultado.custos.preco_final / (Number(form.watch('itens_produto.0.quantidade_produto')) || 1))}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Margem de Lucro:</span>
                            <span>{calculoResultado.custos.margem_lucro_percentual?.toFixed(1) || '0.0'}%</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Impostos:</span>
                            <span>{calculoResultado.custos.impostos_percentual?.toFixed(1) || '0.0'}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Custos Detalhados */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Custos Detalhados</h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Materiais:</span>
                          <span>{formatCurrency(calculoResultado.custos.custo_material)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Máquinas:</span>
                          <span>{formatCurrency(calculoResultado.custos.custo_maquinaria)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Mão de Obra:</span>
                          <span>{formatCurrency(calculoResultado.custos.custo_mao_obra)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Custos Indiretos:</span>
                          <span>{formatCurrency(calculoResultado.custos.custo_indireto)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Custo Total:</span>
                          <span>{formatCurrency(calculoResultado.custos.custo_total_producao)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Informações de Quantidade */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Informações do Produto</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Quantidade:</span>
                          <span>{form.watch('itens_produto.0.quantidade_produto') || 1}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Valor Unitário (Custo):</span>
                          <span>{formatCurrency(calculoResultado.custos.custo_total_producao / (Number(form.watch('itens_produto.0.quantidade_produto')) || 1))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Preço Unitário (com margem/impostos):</span>
                          <span>{formatCurrency(calculoResultado.custos.preco_final / (Number(form.watch('itens_produto.0.quantidade_produto')) || 1))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Valor Total:</span>
                          <span className="font-semibold">{formatCurrency(calculoResultado.custos.preco_final)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Debug: Preço Final = {calculoResultado.custos.preco_final}, Qtd = {form.watch('itens_produto.0.quantidade_produto')}
                        </div>
                      </div>
                    </div>

                    {/* Custos Indiretos Detalhados */}
                    {calculoResultado.custos.custos_indiretos_detalhados?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Custos Indiretos</h4>
                        <div className="space-y-2">
                          {calculoResultado.custos.custos_indiretos_detalhados.map((custo, index) => (
                            <div key={index} className="text-sm p-2 bg-muted rounded">
                              <div className="flex justify-between">
                                <span>{custo.nome}</span>
                                <span>{formatCurrency(custo.valor_rateado)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {custo.categoria} • {custo.percentual_rateio.toFixed(1)}% rateado
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Máquinas Utilizadas */}
                    {calculoResultado.maquinas?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Máquinas</h4>
                        <div className="space-y-2">
                          {calculoResultado.maquinas.map((maquina, index) => (
                            <div key={index} className="text-sm p-2 bg-muted rounded">
                              <div className="flex justify-between">
                                <span>{maquina.nome_maquina}</span>
                                <span>{formatCurrency(maquina.custo_total)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {maquina.horas_utilizadas}h × {formatCurrency(maquina.custo_por_hora)}/h
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Funções Utilizadas */}
                    {calculoResultado.funcoes?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Funções</h4>
                        <div className="space-y-2">
                          {calculoResultado.funcoes.map((funcao, index) => (
                            <div key={index} className="text-sm p-2 bg-muted rounded">
                              <div className="flex justify-between">
                                <span>{funcao.nome_funcao}</span>
                                <span>{formatCurrency(funcao.custo_total)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {funcao.horas_trabalhadas}h × {formatCurrency(funcao.custo_por_hora)}/h
                                {funcao.maquina_vinculada && ` • ${funcao.maquina_vinculada}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Clique em "Calcular" para ver o resultado</p>
                  </div>
                )}
              </CardContent>
              
              {/* Footer fixo com botão calcular */}
              <div className="p-4 border-t bg-background">
                <Button
                  variant="outline"
                  onClick={() => form.handleSubmit(calcularOrcamento)()}
                  disabled={calculando}
                  className="w-full"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {calculando ? 'Calculando...' : 'Calcular'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Botão Salvar Orçamento no final */}
      <div className="flex justify-end">
        <Button
          onClick={() => form.handleSubmit(onSubmit)()}
          disabled={loading}
          size="lg"
        >
          {loading ? 'Salvando...' : mode === 'novo' ? 'Salvar Orçamento' : 'Atualizar Orçamento'}
        </Button>
      </div>
    </div>
  );
} 