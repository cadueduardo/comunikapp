'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Package, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  QuickGeometryInput,
  type GeometriaCalculada,
  type GeometriaValor,
} from '@/components/orcamentos-v2/QuickGeometryInput';
import { AnexoGeometriaInput } from '@/components/orcamentos-v2/AnexoGeometriaInput';
import {
  DxfRevisaoCard,
  type DxfExtraido,
  type AplicarMedidasDxf,
  type SugestaoInsumoCamada,
  type SugestoesPorCamada,
} from '@/components/orcamentos-v2/DxfRevisaoCard';
import { NovoInsumoModal } from '@/components/orcamentos-v2/NovoInsumoModal';
import { MaterialSection, MaquinaSection, FuncaoSection, ServicoSection } from '../../shared/sections';

interface ProdutoSectionProps {
  mode: 'novo' | 'editar' | 'template';
  onCarregarProduto?: (itemIndex: number) => void;
  insumos?: Array<{
    id: string;
    nome: string;
    unidade_compra: string;
    custo_unitario: number;
    quantidade_compra: number;
    unidade_uso: string;
    fator_conversao: number;
    logica_consumo?: string | null;
    tipo_material_id?: string | null;
    parametros_consumo?: Record<string, unknown> | null;
    tipoMaterial?: {
      id: string;
      nome: string;
      logica_consumo: string;
      parametros_padrao: Record<string, unknown> | null;
    } | null;
    categoria: { nome: string };
  }>;
  maquinas?: Array<{
    id: string;
    nome: string;
    tipo: string;
    custo_hora: number;
  }>;
  funcoes?: Array<{
    id: string;
    nome: string;
    custo_hora: number;
    maquina?: { nome: string };
  }>;
  servicos?: Array<{
    id: string;
    nome: string;
    custo_hora: number | string;
    tipo_calculo?: 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'POR_PECA_COM_CATEGORIA' | 'MANUAL';
    horas_por_m2?: number | string;
    horas_por_unidade?: number | string;
    eficiencia_percent?: number | string;
    setup_min?: number | string;
    categorias?: Array<{
      nome: string;
      ate_m2: number;
      tempo_min: number | string;
    }>;
  }>;
  /**
   * Sub-fase 7.B++: callback opcional disparado quando um insumo é
   * cadastrado dentro do orçamento (seja pelo `NovoInsumoModal` do DXF ou
   * pelo botão no dropdown de Material). Esperado: o parent recarrega a
   * lista global de insumos (ex.: `fetchInsumos` do `useOrcamentoData`).
   * Quando omitido, a opção "Cadastrar novo insumo" continua disponível
   * mas a lista não é atualizada automaticamente (só após reload manual).
   */
  onInsumoCriado?: () => void | Promise<void>;
}

export function ProdutoSection({ mode, onCarregarProduto, insumos = [], maquinas = [], funcoes = [], servicos = [], onInsumoCriado }: ProdutoSectionProps) {
  const form = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens_produto',
  });

  // Sub-fase 7.B: metadados extraídos de DXFs anexados, por índice de produto.
  // Quando há entrada aqui o card "Valores detectados no DXF" é exibido
  // logo abaixo do AnexoGeometriaInput. O operador escolhe "Aplicar ao
  // produto" (preenche largura/altura/área/perímetro) ou "Ignorar" (limpa
  // apenas o card — não toca no anexo).
  const [dxfPorIndice, setDxfPorIndice] = useState<
    Record<number, DxfExtraido | null>
  >({});

  // Sub-fase 7.B (extensão): sugestões de insumo derivadas das camadas do
  // DXF, calculadas pelo backend (heurística por nome de camada). Mantidas
  // separadas do dxf_extraido porque o backend recalcula on-demand a cada
  // upload/releitura.
  const [sugestoesPorIndice, setSugestoesPorIndice] = useState<
    Record<number, SugestoesPorCamada[]>
  >({});

  // Sub-fase 7.B++: estado do modal de cadastro inline de insumo.
  // Quando aberto, guarda o índice do produto + nome sugerido para o novo
  // insumo. Ao criar com sucesso, o insumo é atrelado a esse mesmo índice.
  const [novoInsumoModal, setNovoInsumoModal] = useState<{
    aberto: boolean;
    itemIndex: number | null;
    nomeSugerido: string;
    nomeCamada: string;
  }>({ aberto: false, itemIndex: null, nomeSugerido: '', nomeCamada: '' });

  const setDxfDoProduto = (
    indice: number,
    dxf: DxfExtraido | null,
    sugestoes: SugestoesPorCamada[] = [],
  ) => {
    setDxfPorIndice((prev) => ({ ...prev, [indice]: dxf }));
    setSugestoesPorIndice((prev) => ({ ...prev, [indice]: sugestoes }));
  };

  // Adiciona o insumo sugerido à lista de materiais do produto. A quantidade
  // ainda é calculada pelo motor a partir da área/perímetro do produto;
  // gravamos '1' como placeholder editável. Se o insumo já estava na lista
  // (mesmo `insumo_id`), evita duplicar.
  const atrelarInsumoAoProduto = (
    itemIndex: number,
    sugestao: SugestaoInsumoCamada,
  ) => {
    const materiaisAtuais =
      (form.getValues(`itens_produto.${itemIndex}.materiais`) as
        | Array<{
            insumo_id?: string;
            quantidade?: string;
            material_do_cliente?: boolean;
          }>
        | undefined) || [];
    const jaExiste = materiaisAtuais.some(
      (m) => m.insumo_id === sugestao.insumo_id,
    );
    if (jaExiste) {
      toast.info(`O insumo "${sugestao.insumo_nome}" já está na lista.`);
      return;
    }
    // Se a primeira posição estiver "vazia" (placeholder de novo produto),
    // substitui ela em vez de criar nova entrada — UX mais limpa.
    const proximaLista = [...materiaisAtuais];
    const primeiraVazia = proximaLista.findIndex((m) => !m.insumo_id);
    if (primeiraVazia >= 0) {
      proximaLista[primeiraVazia] = {
        insumo_id: sugestao.insumo_id,
        quantidade: '1',
        material_do_cliente: false,
      };
    } else {
      proximaLista.push({
        insumo_id: sugestao.insumo_id,
        quantidade: '1',
        material_do_cliente: false,
      });
    }
    form.setValue(`itens_produto.${itemIndex}.materiais`, proximaLista, {
      shouldDirty: true,
    });
    toast.success(`Insumo "${sugestao.insumo_nome}" atrelado ao produto.`);
  };

  // Aplica os valores extraídos do DXF (sempre em mm) ao produto. O formulário
  // armazena a unidade em `unidade_geometria`; aqui forçamos 'mm' para evitar
  // converter ida-e-volta — o operador pode trocar manualmente depois.
  const aplicarMedidasDxf = (
    itemIndex: number,
    medidas: AplicarMedidasDxf,
  ) => {
    form.setValue(
      `itens_produto.${itemIndex}.largura_produto`,
      String(medidas.largura_mm),
      { shouldDirty: true },
    );
    form.setValue(
      `itens_produto.${itemIndex}.altura_produto`,
      String(medidas.altura_mm),
      { shouldDirty: true },
    );
    form.setValue(
      `itens_produto.${itemIndex}.unidade_geometria`,
      'mm',
      { shouldDirty: true },
    );
    // Área em m² (campo do formulário), arredondada para 4 casas.
    const areaM2 = Number((medidas.area_mm2 / 1_000_000).toFixed(4));
    form.setValue(
      `itens_produto.${itemIndex}.area_produto`,
      String(areaM2),
      { shouldDirty: true },
    );
    form.setValue(
      `itens_produto.${itemIndex}.perimetro_produto`,
      String(medidas.perimetro_mm),
      { shouldDirty: true },
    );
    form.setValue(
      `itens_produto.${itemIndex}.geometria_origem`,
      'DXF',
      { shouldDirty: true },
    );
    setDxfDoProduto(itemIndex, null);
    toast.success(
      medidas.origem_area === 'POLIGONO_FECHADO'
        ? `Medidas do DXF aplicadas (camada ${medidas.camada_perimetro || '—'}, área pelo polígono fechado).`
        : `Medidas do DXF aplicadas (camada ${medidas.camada_perimetro || '—'}, área aproximada pela envolvente).`,
    );
  };

  const handleAddProduto = () => {
    append({
      nome_servico: '',
      descricao: '',
      quantidade_produto: '1',
      largura_produto: '',
      altura_produto: '',
      unidade_medida_produto: '',
      area_produto: '',
      perimetro_produto: '',
      geometria_origem: 'MANUAL',
      arquivo_geometria_url: '',
      unidade_geometria: 'mm',
      materiais: [{ insumo_id: '', quantidade: '1', material_do_cliente: false }],
      maquinas: [{ maquina_id: '', horas_utilizadas: '1' }],
      funcoes: [{ funcao_id: '', horas_trabalhadas: '1' }],
      servicos: [{ servico_id: '', horas_trabalhadas: '1' }],
    });
  };

  const handleRemoveProduto = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      toast.success('Produto removido');
    } else {
      toast.error('Deve haver pelo menos um produto');
    }
  };

  // Atualiza a geometria sem misturar unidade produtiva com unidade comercial.
  // Importante: a `geometria_origem` só vira `MANUAL` aqui quando o operador
  // edita largura/altura. Se o produto já tem um anexo (IMAGEM/DXF), o campo
  // foi ajustado pelo `atualizarAnexoGeometria` e não deve regredir só porque
  // o operador conferiu a medida manualmente.
  const atualizarGeometria = (
    itemIndex: number,
    valor: GeometriaValor,
    calculada: GeometriaCalculada,
  ) => {
    form.setValue(`itens_produto.${itemIndex}.largura_produto`, valor.largura, {
      shouldDirty: true,
    });
    form.setValue(`itens_produto.${itemIndex}.altura_produto`, valor.altura, {
      shouldDirty: true,
    });
    form.setValue(`itens_produto.${itemIndex}.unidade_geometria`, valor.unidade, {
      shouldDirty: true,
    });
    form.setValue(`itens_produto.${itemIndex}.area_produto`, String(calculada.area_m2), {
      shouldDirty: true,
    });
    form.setValue(
      `itens_produto.${itemIndex}.perimetro_produto`,
      String(calculada.perimetro_mm),
      { shouldDirty: true },
    );
    const origemAtual = form.getValues(
      `itens_produto.${itemIndex}.geometria_origem`,
    );
    if (origemAtual !== 'IMAGEM' && origemAtual !== 'DXF') {
      form.setValue(`itens_produto.${itemIndex}.geometria_origem`, 'MANUAL', {
        shouldDirty: true,
      });
    }
  };

  // Atualiza o anexo de geometria do produto. A categoria (IMAGEM/DXF) é
  // devolvida pelo backend no momento do upload e usada para refletir em
  // `geometria_origem`. Quando o anexo é removido (url=null), volta para
  // MANUAL.
  const atualizarAnexoGeometria = (
    itemIndex: number,
    url: string | null,
    categoria: 'IMAGEM' | 'DXF' | null,
  ) => {
    form.setValue(`itens_produto.${itemIndex}.arquivo_geometria_url`, url || '', {
      shouldDirty: true,
    });
    const novaOrigem = url && categoria ? categoria : 'MANUAL';
    form.setValue(`itens_produto.${itemIndex}.geometria_origem`, novaOrigem, {
      shouldDirty: true,
    });
  };

  // Sugere preenchimento do "Nome do Produto" a partir do nome do arquivo DXF
  // — apenas quando o campo estiver vazio. Decisão registrada na Fase 7.A:
  // nunca sobrescrever digitação do operador.
  const sugerirNomeProduto = (itemIndex: number, sugestao: string) => {
    const atual = form.getValues(`itens_produto.${itemIndex}.nome_servico`);
    if (atual && String(atual).trim().length > 0) return;
    if (!sugestao || sugestao.trim().length === 0) return;
    form.setValue(`itens_produto.${itemIndex}.nome_servico`, sugestao.trim(), {
      shouldDirty: true,
    });
  };

  // Sub-fase 7.B++: sugere a descrição a partir do header do DXF
  // (`$TITLE/$SUBJECT/$KEYWORDS/$COMMENTS/$AUTHOR` concatenados). Mesma
  // política do nome: só preenche quando o campo "Descrição" estiver vazio.
  const sugerirDescricaoProduto = (itemIndex: number, sugestao: string) => {
    const atual = form.getValues(`itens_produto.${itemIndex}.descricao`);
    if (atual && String(atual).trim().length > 0) return;
    if (!sugestao || sugestao.trim().length === 0) return;
    form.setValue(`itens_produto.${itemIndex}.descricao`, sugestao.trim(), {
      shouldDirty: true,
    });
  };

  // Sub-fase 7.B++: abre o modal de cadastro inline a partir de uma camada
  // do DXF que não tem sugestão (ou que o operador queira customizar).
  const abrirNovoInsumoModal = (
    itemIndex: number,
    args: { nome_camada: string; nome_sugerido: string },
  ) => {
    setNovoInsumoModal({
      aberto: true,
      itemIndex,
      nomeSugerido: args.nome_sugerido,
      nomeCamada: args.nome_camada,
    });
  };

  // Recarrega as sugestões de insumo para um produto, refazendo o GET no
  // endpoint de releitura do anexo. Usado após cadastrar um insumo novo
  // para que ele apareça nas listas de sugestão de outras camadas.
  const recarregarSugestoesDoProduto = async (itemIndex: number) => {
    const urlAnexo = form.getValues(
      `itens_produto.${itemIndex}.arquivo_geometria_url`,
    ) as string | undefined;
    if (!urlAnexo) return;
    const match = urlAnexo.match(
      /\/orcamentos-v2\/anexos-geometria\/([0-9a-f-]{36})$/i,
    );
    if (!match) return;
    const tokenAnexo = match[1];
    try {
      const apiBase = (
        process.env.NEXT_PUBLIC_API_URL || '/api'
      ).replace(/\/$/, '');
      const tokenAuth =
        typeof window !== 'undefined'
          ? localStorage.getItem('access_token')
          : null;
      const headers: Record<string, string> = {};
      if (tokenAuth) headers['Authorization'] = `Bearer ${tokenAuth}`;
      const resp = await fetch(
        `${apiBase}/orcamentos-v2/anexos-geometria/${tokenAnexo}/dxf-extraido`,
        { headers },
      );
      if (!resp.ok) return;
      const data = (await resp.json()) as {
        sugestoes_insumo?: SugestoesPorCamada[];
      };
      setSugestoesPorIndice((prev) => ({
        ...prev,
        [itemIndex]: data.sugestoes_insumo || [],
      }));
    } catch {
      // Releitura é best-effort; se falhar, o insumo recém-criado já está
      // atrelado, só não aparece como "sugestão" para outras camadas.
    }
  };

  const calcularAreaTotal = (itemIndex: number) => {
    const areaUnitaria = Number(form.watch(`itens_produto.${itemIndex}.area_produto`));
    const quantidade = Number(form.watch(`itens_produto.${itemIndex}.quantidade_produto`));
    
    if (areaUnitaria && quantidade) {
      return (areaUnitaria * quantidade).toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Produtos</h2>
        </div>
        <Button
          type="button"
          onClick={handleAddProduto}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {fields.map((field, index) => (
          <AccordionItem key={field.id} value={`item-${index}`}>
            <Card>
              <AccordionTrigger className="px-6 !py-0">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">
                      Produto {index + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {form.watch(`itens_produto.${index}.nome_servico`) || 'Sem nome'}
                    </span>
                  </div>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveProduto(index);
                    }}
                    className="text-red-500 hover:text-red-700 cursor-pointer p-1 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-6">
                  {/* Anexo de geometria (imagem ou DXF) — sempre no TOPO do
                      card. Aceita Ctrl+V, drag-and-drop e clique. A imagem
                      anexada aqui vira a arte da OS gerada (decisão da
                      Fase 7.A). */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Imagem do produto / DXF
                    </h4>
                    <AnexoGeometriaInput
                      value={
                        (form.watch(
                          `itens_produto.${index}.arquivo_geometria_url`,
                        ) as string | undefined) || null
                      }
                      onChange={(url, categoria) => {
                        atualizarAnexoGeometria(index, url, categoria);
                        if (!url || categoria !== 'DXF') {
                          setDxfDoProduto(index, null, []);
                        }
                      }}
                      onNomeSugerido={(sug) => sugerirNomeProduto(index, sug)}
                      onDescricaoSugerida={(sug) =>
                        sugerirDescricaoProduto(index, sug)
                      }
                      onDxfExtraido={(dxf, sugestoes) =>
                        setDxfDoProduto(index, dxf, sugestoes)
                      }
                    />
                    {dxfPorIndice[index] ? (
                      <div className="mt-2">
                        <DxfRevisaoCard
                          dados={dxfPorIndice[index] as DxfExtraido}
                          sugestoesInsumo={sugestoesPorIndice[index] || []}
                          onAplicar={(medidas) =>
                            aplicarMedidasDxf(index, medidas)
                          }
                          onAtrelarInsumo={(sug) =>
                            atrelarInsumoAoProduto(index, sug)
                          }
                          onCadastrarNovoInsumo={(args) =>
                            abrirNovoInsumoModal(index, args)
                          }
                          onIgnorar={() => setDxfDoProduto(index, null, [])}
                        />
                      </div>
                    ) : null}
                  </div>

                  {/* Informações do Produto */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField
                       control={form.control}
                       name={`itens_produto.${index}.nome_servico`}
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
                       name={`itens_produto.${index}.quantidade_produto`}
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Quantidade</FormLabel>
                           <FormControl>
                             <Input 
                               type="text" 
                               placeholder="1"
                               {...field}
                               onChange={(e) => {
                                 const value = e.target.value.replace(/[^0-9,.-]/g, '');
                                 field.onChange(value);
                                 // Força re-render do disclaimer para atualizar área total
                                 setTimeout(() => form.trigger(`itens_produto.${index}.quantidade_produto`), 0);
                               }}
                             />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />

                     {/* Botão Carregar Produto */}
                     {onCarregarProduto && (
                       <FormItem>
                         <FormLabel>&nbsp;</FormLabel>
                         <FormControl>
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => onCarregarProduto(index)}
                             className="w-full flex items-center space-x-2"
                           >
                             <Loader2 className="w-4 h-4" />
                             <span>Carregar Produto</span>
                           </Button>
                         </FormControl>
                       </FormItem>
                     )}
                   </div>

                  <FormField
                    control={form.control}
                    name={`itens_produto.${index}.descricao`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Digite a descrição do produto" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Medidas do Produto */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Medidas do Produto</h4>
                    <QuickGeometryInput
                      valor={{
                        largura: form.watch(`itens_produto.${index}.largura_produto`) || '',
                        altura: form.watch(`itens_produto.${index}.altura_produto`) || '',
                        unidade:
                          (form.watch(`itens_produto.${index}.unidade_geometria`) as GeometriaValor['unidade']) ||
                          'mm',
                      }}
                      onChange={(valor, calculada) =>
                        atualizarGeometria(index, valor, calculada)
                      }
                      titulo="Geometria de produção"
                    />
                    {mode === 'editar' &&
                      !form.watch(`itens_produto.${index}.unidade_geometria`) && (
                        <p className="text-xs text-amber-700">
                          Unidade não confirmada para este orçamento. Assumindo mm.
                          Confirme abaixo.
                        </p>
                      )}
                    {/* Disclaimer da Área Total */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`itens_produto.${index}.unidade_medida_produto`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidade comercial</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a unidade comercial" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="m2">Metro quadrado (m²)</SelectItem>
                                <SelectItem value="un">Unidade (un)</SelectItem>
                                <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                                <SelectItem value="m">Metro linear (m)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`itens_produto.${index}.area_produto`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Área (m²)</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="bg-muted" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`itens_produto.${index}.perimetro_produto`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Perímetro (mm)</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="bg-muted" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch(`itens_produto.${index}.area_produto`) && 
                     form.watch(`itens_produto.${index}.quantidade_produto`) && 
                     Number(form.watch(`itens_produto.${index}.quantidade_produto`)) > 1 && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-md">
                        <div className="text-sm text-blue-800">
                          📐 <span className="font-medium">Área Total:</span> {form.watch(`itens_produto.${index}.quantidade_produto`)} × {form.watch(`itens_produto.${index}.area_produto`)}m² = <span className="font-semibold text-blue-900">{calcularAreaTotal(index)}m²</span>
                        </div>
                      </div>
                    )}
                  </div>

                  

                  {/* Seções de Materiais, Máquinas e Funções */}
                  <div className="space-y-6">
                    {/* Materiais Utilizados */}
                    <MaterialSection
                      variant="orcamento"
                      itemIndex={index}
                      insumos={insumos}
                      onInsumoCriado={onInsumoCriado}
                    />

                    {/* Máquinas Utilizadas */}
                    <MaquinaSection
                      variant="orcamento"
                      itemIndex={index}
                      maquinas={maquinas}
                    />

                    {/* Funções Utilizadas */}
                    <FuncaoSection
                      variant="orcamento"
                      itemIndex={index}
                      funcoes={funcoes}
                    />

                    {/* Serviços Manuais */}
                    <ServicoSection
                      variant="orcamento"
                      itemIndex={index}
                      servicos={servicos}
                    />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>

      <NovoInsumoModal
        open={novoInsumoModal.aberto}
        onOpenChange={(aberto) =>
          setNovoInsumoModal((prev) => ({ ...prev, aberto }))
        }
        nomeInicial={novoInsumoModal.nomeSugerido}
        onInsumoCriado={onInsumoCriado}
        onCriado={(insumoCriado) => {
          const itemIndex = novoInsumoModal.itemIndex;
          if (itemIndex === null) return;
          // Atrela o insumo recém-criado ao produto imediatamente, sem
          // esperar nova consulta. Usa o mesmo helper das sugestões para
          // manter o comportamento consistente (substitui posição vazia /
          // evita duplicata).
          atrelarInsumoAoProduto(itemIndex, {
            insumo_id: insumoCriado.id,
            insumo_nome: insumoCriado.nome,
            tipo_material_nome: null,
            categoria_nome: null,
            score: 0,
            tokens_match: [],
            motivo: 'NOME_INSUMO',
          });
          // Recarrega sugestões para que o insumo novo apareça também em
          // outras camadas com palavras-chave compatíveis.
          void recarregarSugestoesDoProduto(itemIndex);
        }}
      />
    </div>
  );
}
