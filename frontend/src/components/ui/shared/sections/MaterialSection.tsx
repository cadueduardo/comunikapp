'use client';

import { useFormContext } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, PlusCircle } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { Insumo } from '../types/common.types';
import {
  getCampoQuantidade,
  calcularCustoPorUnidadeUso,
  calcularArea,
  calcularVolume,
  calcularAreaLateral,
  converterParaMetros,
  insumoExigeProfundidade,
} from '../utils/calculo.utils';
import { NovoInsumoModal } from '@/components/orcamentos-v2/NovoInsumoModal';

interface MaterialSectionProps {
  variant?: 'orcamento' | 'produto';
  itemIndex: number;
  insumos: Insumo[];
  onAddMaterial?: (itemIndex: number) => void;
  onRemoveMaterial?: (itemIndex: number, materialIndex: number) => void;
  customFields?: React.ReactNode;
  customActions?: React.ReactNode;
  /**
   * Callback opcional disparado quando o operador cadastra um insumo novo
   * via dropdown "Material" (botão "Cadastrar novo insumo" no rodapé do
   * select). O caller deve recarregar sua lista de insumos para que o
   * novo apareça no dropdown. Quando omitido, a opção não é exibida.
   */
  onInsumoCriado?: () => void | Promise<void>;
}

export function MaterialSection({ 
  itemIndex,
  insumos,
  onAddMaterial,
  onRemoveMaterial,
  customFields,
  customActions,
  onInsumoCriado,
}: MaterialSectionProps) {
  const form = useFormContext();

  // Sub-fase 7.B++: estado do modal de cadastro inline acionado pelo
  // dropdown de Material. Guarda o índice do material que disparou para
  // poder atrelar o insumo recém-criado naquela linha específica.
  const [novoInsumoModal, setNovoInsumoModal] = useState<{
    aberto: boolean;
    materialIndex: number | null;
  }>({ aberto: false, materialIndex: null });

  // Monitorar mudanças nas dimensões e quantidade do produto para recalcular materiais automaticamente
  const quantidadeProduto = form.watch(`itens_produto.${itemIndex}.quantidade_produto`);
  const areaProduto = form.watch(`itens_produto.${itemIndex}.area_produto`);
  const larguraProduto = form.watch(`itens_produto.${itemIndex}.largura_produto`);
  const alturaProduto = form.watch(`itens_produto.${itemIndex}.altura_produto`);
  const unidadeGeometria = form.watch(`itens_produto.${itemIndex}.unidade_geometria`) || 'mm';
  const perimetroProduto = form.watch(`itens_produto.${itemIndex}.perimetro_produto`);
  // Fase 11: profundidade opcional (produtos 3D). Source-of-truth e o VALOR DIGITADO
  // (profundidadeProduto). A flag 'tem_profundidade' do form controla apenas a UI do
  // QuickGeometryInput (mostrar/esconder o campo) e nao influencia o motor de calculo,
  // evitando race conditions em que a flag fica dessincronizada do checkbox visual.
  const profundidadeProduto = form.watch(`itens_produto.${itemIndex}.profundidade_produto`);

  const normalizarNumero = (valor: unknown): number => {
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
    if (typeof valor === 'string') {
      const parsed = Number(valor.replace(/[^0-9,.-]/g, '').replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const obterAreaM2 = (): number => {
    const areaInformada = normalizarNumero(areaProduto);
    if (areaInformada > 0) return areaInformada;

    const largura = normalizarNumero(larguraProduto);
    const altura = normalizarNumero(alturaProduto);
    return largura && altura ? calcularArea(largura, altura, unidadeGeometria) : 0;
  };

  const obterPerimetroM = (): number => {
    const perimetroMm = normalizarNumero(perimetroProduto);
    if (perimetroMm > 0) return perimetroMm / 1000;

    const largura = normalizarNumero(larguraProduto);
    const altura = normalizarNumero(alturaProduto);
    if (!largura || !altura) return 0;

    const larguraEmMetros = converterParaMetros(largura, unidadeGeometria);
    const alturaEmMetros = converterParaMetros(altura, unidadeGeometria);
    return 2 * (larguraEmMetros + alturaEmMetros);
  };

  // Fase 11: volume em m3 (LxAxP). Source-of-truth unica (guardrail 3): a presenca
  // de profundidade > 0 e suficiente para caracterizar 3D. NAO depende de
  // 'temProfundidade' (flag do react-hook-form que pode estar dessincronizada do
  // checkbox visual em race conditions). Compartilha unidade_geometria com L/A.
  const obterVolumeM3 = (): number => {
    const largura = normalizarNumero(larguraProduto);
    const altura = normalizarNumero(alturaProduto);
    const profundidade = normalizarNumero(profundidadeProduto);
    if (profundidade <= 0) return 0;
    return calcularVolume(largura, altura, profundidade, unidadeGeometria);
  };

  // Fase 11: area lateral em m2 (caixa aberta, 4 laterais). Mesma logica do volume:
  // valor digitado e source-of-truth, nao a flag.
  const obterAreaLateralM2 = (): number => {
    const largura = normalizarNumero(larguraProduto);
    const altura = normalizarNumero(alturaProduto);
    const profundidade = normalizarNumero(profundidadeProduto);
    if (profundidade <= 0) return 0;
    return calcularAreaLateral(largura, altura, profundidade, unidadeGeometria);
  };

  // Helper para o aviso visual e mensagens: indica se o produto ja tem profundidade
  // util preenchida (mesma logica defensiva acima, independente da flag tem_profundidade).
  const temProfundidadeValida = (): boolean =>
    normalizarNumero(profundidadeProduto) > 0;

  const formatarNumeroMedida = (
    valor: unknown,
    casas: number,
    usarVirgula = true,
  ): string => {
    const numero =
      typeof valor === 'number'
        ? valor
        : Number(String(valor || '').replace(',', '.'));
    if (!Number.isFinite(numero)) return '';
    const formatado = numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: casas,
    });
    return usarVirgula ? formatado : formatado.replace(/\./g, '').replace(',', '.');
  };

  const formatarQuantidadeAutomatica = (
    valor: number,
    unidadeUso?: string,
    usarVirgula = true,
  ): string => {
    const casas =
      unidadeUso === 'M3' ? 3 : unidadeUso === 'M2_LATERAL' ? 2 : 2;
    return formatarNumeroMedida(valor, casas, usarVirgula);
  };

  useEffect(() => {
    // Recalcular automaticamente as quantidades de materiais quando as dimensões ou quantidade do produto mudarem
    const materiais = form.getValues(`itens_produto.${itemIndex}.materiais`) || [];
    
    materiais.forEach((material: { insumo_id: string; quantidade: string; material_do_cliente?: boolean }, materialIndex: number) => {
      if (material.insumo_id) {
        const insumoSelecionado = insumos.find(insumo => insumo.id === material.insumo_id);
        if (insumoSelecionado) {
          let novaQuantidade = '';
          const quantidadeProdutoNum = Number(quantidadeProduto) || 1;
          const areaProdutoNum = obterAreaM2();
          const perimetroProdutoM = obterPerimetroM();
          
          // Verificar se tem lógica personalizada
          if (insumoSelecionado.logica_consumo === 'custom' && insumoSelecionado.tipoMaterial) {
            const parametros = insumoSelecionado.tipoMaterial.parametros_padrao;
            
            if (parametros && parametros.tipo_calculo) {
              switch (parametros.tipo_calculo) {
                case 'espacamento':
                  if (parametros.espacamento && perimetroProdutoM > 0) {
                    const perimetro = perimetroProdutoM * 100;
                    const espacamento = Number(parametros.espacamento);
                    novaQuantidade = (Math.ceil(perimetro / espacamento) * quantidadeProdutoNum).toString();
                  }
                  break;
                
                case 'quantidade_por_m2':
                  if (parametros.quantidade_por_m2 && areaProdutoNum > 0) {
                    novaQuantidade = (areaProdutoNum * Number(parametros.quantidade_por_m2) * quantidadeProdutoNum).toString();
                  }
                  break;
                
                case 'multiplicador':
                  if (parametros.multiplicador) {
                    novaQuantidade = (1 * Number(parametros.multiplicador) * quantidadeProdutoNum).toString();
                  }
                  break;
                
                case 'quantidade_fixa':
                  if (parametros.quantidade_fixa) {
                    novaQuantidade = (Number(parametros.quantidade_fixa) * quantidadeProdutoNum).toString();
                  }
                  break;
              }
            }
          } else {
            // Lógica padrão baseada na unidade de uso
            switch (insumoSelecionado.unidade_uso) {
              case 'M2':
                if (areaProdutoNum > 0) {
                  novaQuantidade = formatarQuantidadeAutomatica(
                    areaProdutoNum * quantidadeProdutoNum,
                    insumoSelecionado.unidade_uso,
                  );
                }
                break;
              case 'M':
                if (perimetroProdutoM > 0) {
                  novaQuantidade = formatarQuantidadeAutomatica(
                    perimetroProdutoM * quantidadeProdutoNum,
                    insumoSelecionado.unidade_uso,
                  );
                }
                break;
              // Fase 11: volume (LxAxP em m3) para produtos 3D. obterVolumeM3 ja retorna 0
              // quando profundidade <= 0; nesse caso o operador ve o aviso amarelo abaixo.
              // Precisao 6 casas porque produtos pequenos em mm (ex.: letra caixa 50x50x50 mm)
              // dao volume = 0.000125 m3, que arredondado a 3 casas vira 0.000 (silencioso).
              case 'M3': {
                const volumeM3 = obterVolumeM3();
                if (volumeM3 > 0) {
                  novaQuantidade = formatarQuantidadeAutomatica(
                    volumeM3 * quantidadeProdutoNum,
                    insumoSelecionado.unidade_uso,
                  );
                }
                break;
              }
              // Fase 11: area lateral (caixa aberta, 4 laterais sem tampa/fundo) em m2.
              // Precisao 4 casas para acomodar produtos pequenos (laterais finas).
              case 'M2_LATERAL': {
                const areaLateralM2 = obterAreaLateralM2();
                if (areaLateralM2 > 0) {
                  novaQuantidade = formatarQuantidadeAutomatica(
                    areaLateralM2 * quantidadeProdutoNum,
                    insumoSelecionado.unidade_uso,
                  );
                }
                break;
              }
            }
          }
          
          // Atualizar apenas se a nova quantidade for diferente e válida
          if (novaQuantidade && novaQuantidade !== material.quantidade) {
            form.setValue(`itens_produto.${itemIndex}.materiais.${materialIndex}.quantidade`, novaQuantidade);
          }
        }
      }
    });
  }, [quantidadeProduto, areaProduto, larguraProduto, alturaProduto, unidadeGeometria, perimetroProduto, profundidadeProduto, form, itemIndex, insumos]);

  const handleAddMaterial = () => {
    if (onAddMaterial) {
      onAddMaterial(itemIndex);
    } else {
      const currentMaterials = form.getValues(`itens_produto.${itemIndex}.materiais`);
      const hasEmpty = currentMaterials.some((m: { insumo_id: string; quantidade: string }) => !m.insumo_id || !m.quantidade);
      if (!hasEmpty) {
        const newMaterials = [...currentMaterials, { insumo_id: '', quantidade: '1', material_do_cliente: false }];
        form.setValue(`itens_produto.${itemIndex}.materiais`, newMaterials);
      }
    }
  };

  const handleRemoveMaterial = (materialIndex: number) => {
    if (onRemoveMaterial) {
      onRemoveMaterial(itemIndex, materialIndex);
    } else {
      const currentMaterials = form.getValues(`itens_produto.${itemIndex}.materiais`);
      if (currentMaterials.length > 1) {
        const newMaterials = currentMaterials.filter((_: unknown, index: number) => index !== materialIndex);
        form.setValue(`itens_produto.${itemIndex}.materiais`, newMaterials);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium">Materiais Utilizados</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddMaterial}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Material
        </Button>
      </div>
      
      {form.watch(`itens_produto.${itemIndex}.materiais`)?.map((material: { insumo_id: string; quantidade: string; material_do_cliente?: boolean }, materialIndex: number) => {
        const insumoSelecionado = insumos.find(insumo => insumo.id === material.insumo_id);
        const campoQuantidade = getCampoQuantidade(insumoSelecionado);
        const custoPorUnidade = insumoSelecionado ? calcularCustoPorUnidadeUso(insumoSelecionado) : 0;
        const quantidade = Number(String(material.quantidade).replace(',', '.')) || 0;
        const materialDoCliente = Boolean(material.material_do_cliente);
        // Calcular custo considerando se a quantidade já inclui a multiplicação pelo produto
        // Se o material foi calculado automaticamente, a quantidade já considera a quantidade do produto
        // Se foi digitado manualmente, precisamos verificar se deve multiplicar
        const custoCalculado = materialDoCliente ? 0 : custoPorUnidade * quantidade;
        
        // Obter dimensões do produto para materiais calculados por m²
        
        // Calcular área se não estiver calculada
        // const areaCalculada = areaProduto > 0 ? areaProduto : 
        //   (larguraProduto && alturaProduto && unidadeMedidaProduto) ? 
        //   calcularArea(larguraProduto, alturaProduto, unidadeMedidaProduto) : 0;
        
        // Sugerir quantidade baseada no tipo de insumo
        const sugerirQuantidade = () => {
          if (!insumoSelecionado) return '';
          
          let sugestao = '';
          
          // Obter quantidade do produto para cálculo total
          const quantidadeProduto = Number(form.watch(`itens_produto.${itemIndex}.quantidade_produto`)) || 1;
          const areaProduto = obterAreaM2();
          const perimetroProdutoM = obterPerimetroM();
          const perimetroProdutoCm = perimetroProdutoM * 100;
                          
          // Verificar se tem lógica personalizada
          if (insumoSelecionado.logica_consumo === 'custom' && insumoSelecionado.tipoMaterial) {
            const parametros = insumoSelecionado.tipoMaterial.parametros_padrao;
            
            console.log('🔍 MaterialSection - Cálculo personalizado:', {
              insumo: insumoSelecionado.nome,
              logica_consumo: insumoSelecionado.logica_consumo,
              tipoMaterial: insumoSelecionado.tipoMaterial,
              parametros,
              areaProduto,
              perimetroProdutoM,
              quantidadeProduto
            });
            
            if (parametros && parametros.tipo_calculo) {
              switch (parametros.tipo_calculo) {
                case 'espacamento':
                  if (parametros.espacamento && perimetroProdutoCm > 0) {
                    const perimetro = perimetroProdutoCm;
                    const espacamento = Number(parametros.espacamento);
                    sugestao = (Math.ceil(perimetro / espacamento) * quantidadeProduto).toString();
                    console.log('🔍 MaterialSection - Cálculo espaçamento:', {
                      perimetro,
                      espacamento,
                      quantidadeUnitaria: Math.ceil(perimetro / espacamento),
                      quantidadeProduto,
                      sugestao
                    });
                  } else {
                    console.warn('⚠️ MaterialSection - Parâmetros de espaçamento incompletos:', {
                      espacamento: parametros.espacamento,
                      perimetroProdutoM
                    });
                  }
                  break;
                
                case 'quantidade_por_m2':
                  if (parametros.quantidade_por_m2 && areaProduto > 0) {
                    sugestao = (areaProduto * Number(parametros.quantidade_por_m2) * quantidadeProduto).toString();
                  }
                  break;
                
                case 'multiplicador':
                  if (parametros.multiplicador) {
                    sugestao = (1 * Number(parametros.multiplicador) * quantidadeProduto).toString();
                  }
                  break;
                
                case 'quantidade_fixa':
                  if (parametros.quantidade_fixa) {
                    sugestao = (Number(parametros.quantidade_fixa) * quantidadeProduto).toString();
                  }
                  break;
              }
            } else {
              console.log('⚠️ MaterialSection - Parâmetros não encontrados ou tipo_calculo vazio');
              
              // Fallback: se é um material de ilhós mas não tem parâmetros corretos,
              // usar cálculo padrão de espaçamento de 15cm
              if (insumoSelecionado.nome.toLowerCase().includes('ilh') && perimetroProdutoCm > 0) {
                console.log('🔧 MaterialSection - Aplicando fallback para ilhós (15cm)');
                const perimetro = perimetroProdutoCm;
                const espacamento = 15; // Fallback padrão
                sugestao = (Math.ceil(perimetro / espacamento) * quantidadeProduto).toString();
                console.log('🔍 MaterialSection - Cálculo fallback:', {
                  perimetro,
                  espacamento,
                  quantidadeUnitaria: Math.ceil(perimetro / espacamento),
                  quantidadeProduto,
                  sugestao
                });
              }
            }
          } else {
            // Lógica padrão baseada na unidade de uso
            switch (insumoSelecionado.unidade_uso) {
              case 'M2':
                if (areaProduto > 0) {
                  sugestao = formatarQuantidadeAutomatica(
                    areaProduto * quantidadeProduto,
                    insumoSelecionado.unidade_uso,
                  );
                }
                break;
              case 'M':
                if (perimetroProdutoM > 0) {
                  sugestao = formatarQuantidadeAutomatica(
                    perimetroProdutoM * quantidadeProduto,
                    insumoSelecionado.unidade_uso,
                  );
                }
                break;
              // Fase 11: volume e area lateral para produtos 3D.
              // Mesma precisao dos campos auto-preenchidos (6 casas para M3, 4 para M2_LATERAL)
              // para evitar exibir "Sugestao: 0.000 m3" em produtos pequenos.
              case 'M3': {
                const volumeM3 = obterVolumeM3();
                if (volumeM3 > 0) {
                  sugestao = formatarQuantidadeAutomatica(
                    volumeM3 * quantidadeProduto,
                    insumoSelecionado.unidade_uso,
                  );
                }
                break;
              }
              case 'M2_LATERAL': {
                const areaLateralM2 = obterAreaLateralM2();
                if (areaLateralM2 > 0) {
                  sugestao = formatarQuantidadeAutomatica(
                    areaLateralM2 * quantidadeProduto,
                    insumoSelecionado.unidade_uso,
                  );
                }
                break;
              }
            }
          }
          
          return sugestao;
        };

        // Gerar explicação detalhada do cálculo
        const gerarExplicacaoCalculo = () => {
          if (!insumoSelecionado) return '';
          
          const areaProduto = obterAreaM2();
          const perimetroProdutoM = obterPerimetroM();
          const perimetroProdutoCm = perimetroProdutoM * 100;
          const quantidadeProduto = Number(form.watch(`itens_produto.${itemIndex}.quantidade_produto`)) || 1;
          
          // Verificar se tem lógica personalizada
          if (insumoSelecionado.logica_consumo === 'custom' && insumoSelecionado.tipoMaterial) {
            const parametros = insumoSelecionado.tipoMaterial.parametros_padrao;
            
            if (parametros && parametros.tipo_calculo) {
              switch (parametros.tipo_calculo) {
                case 'espacamento':
                  if (parametros.espacamento && perimetroProdutoCm > 0) {
                    const perimetro = perimetroProdutoCm;
                    const espacamento = Number(parametros.espacamento);
                    const quantidadeUnitaria = Math.ceil(perimetro / espacamento);
                    const quantidadeTotal = quantidadeUnitaria * quantidadeProduto;
                    return `A cada ${espacamento}cm 1 ${insumoSelecionado.nome.toLowerCase()} • Perímetro: ${perimetro}cm × ${quantidadeProduto} unidades • Total: ${quantidadeTotal} unidades`;
                  }
                  break;
                
                case 'quantidade_por_m2':
                  if (parametros.quantidade_por_m2 && areaProduto > 0) {
                    const quantidadeUnitaria = areaProduto * Number(parametros.quantidade_por_m2);
                    const quantidadeTotal = quantidadeUnitaria * quantidadeProduto;
                    return `${parametros.quantidade_por_m2} ${insumoSelecionado.nome.toLowerCase()} por m² • Área: ${areaProduto}m² × ${quantidadeProduto} unidades • Total: ${quantidadeTotal} unidades`;
                  }
                  break;
                
                case 'multiplicador':
                  if (parametros.multiplicador) {
                    const quantidadeTotal = Number(parametros.multiplicador) * quantidadeProduto;
                    return `Multiplicador: ${parametros.multiplicador}x × ${quantidadeProduto} unidades • Total: ${quantidadeTotal} unidades`;
                  }
                  break;
                
                case 'quantidade_fixa':
                  if (parametros.quantidade_fixa) {
                    const quantidadeTotal = Number(parametros.quantidade_fixa) * quantidadeProduto;
                    return `Quantidade fixa: ${parametros.quantidade_fixa} × ${quantidadeProduto} unidades • Total: ${quantidadeTotal} unidades`;
                  }
                  break;
              }
            }
          } else {
            // Lógica padrão
            // Fase 11: M3 e M2_LATERAL precedem M2/M porque o switch precisa caso a caso.
            if (insumoSelecionado.unidade_uso === 'M3') {
              const volumeM3 = obterVolumeM3();
              if (volumeM3 > 0) {
                const volumeTotal = volumeM3 * quantidadeProduto;
                return `Volume: L x A x P = ${formatarNumeroMedida(volumeM3, 3)}m³ × ${quantidadeProduto} unidades = ${formatarNumeroMedida(volumeTotal, 3)}m³`;
              }
              if (!temProfundidadeValida()) {
                return 'Este insumo requer profundidade. Preencha o campo Profundidade em Geometria de produção.';
              }
            }
            if (insumoSelecionado.unidade_uso === 'M2_LATERAL') {
              const areaLateralM2 = obterAreaLateralM2();
              if (areaLateralM2 > 0) {
                const areaTotal = areaLateralM2 * quantidadeProduto;
                return `Área lateral (caixa aberta): (2L+2A) x P = ${formatarNumeroMedida(areaLateralM2, 2)}m² × ${quantidadeProduto} unidades = ${formatarNumeroMedida(areaTotal, 2)}m²`;
              }
              if (!temProfundidadeValida()) {
                return 'Este insumo requer profundidade. Preencha o campo Profundidade em Geometria de produção.';
              }
            }
            switch (insumoSelecionado.unidade_uso) {
              case 'M2':
                if (areaProduto > 0) {
                  const areaTotal = areaProduto * quantidadeProduto;
                  return `Área calculada: ${formatarNumeroMedida(areaProduto, 2)}m² × ${quantidadeProduto} unidades = ${formatarNumeroMedida(areaTotal, 2)}m²`;
                }
                break;
              case 'M':
                if (perimetroProdutoM > 0) {
                  const perimetroTotal = perimetroProdutoM * quantidadeProduto;
                  return `Perímetro calculado: ${formatarNumeroMedida(perimetroProdutoM, 2)}m × ${quantidadeProduto} unidades = ${formatarNumeroMedida(perimetroTotal, 2)}m`;
                }
                break;
            }
          }
          
          return '';
        };
        
        return (
          <div key={materialIndex} className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_80px_auto_auto] gap-4 items-end">
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
                          const areaProduto = obterAreaM2();
                          const perimetroProdutoM = obterPerimetroM();
                          const perimetroProdutoCm = perimetroProdutoM * 100;
                          
                          let sugestao = '';
                          
                          // Obter quantidade do produto para cálculo total
                          const quantidadeProduto = Number(form.watch(`itens_produto.${itemIndex}.quantidade_produto`)) || 1;
                          
                          // Verificar se tem lógica personalizada
                          if (insumoSelecionado.logica_consumo === 'custom' && insumoSelecionado.tipoMaterial) {
                            const parametros = insumoSelecionado.tipoMaterial.parametros_padrao;
                            if (parametros && parametros.tipo_calculo) {
                              switch (parametros.tipo_calculo) {
                                case 'espacamento':
                                  if (parametros.espacamento && perimetroProdutoCm > 0) {
                                    const perimetro = perimetroProdutoCm;
                                    const espacamento = Number(parametros.espacamento);
                                    sugestao = (Math.ceil(perimetro / espacamento) * quantidadeProduto).toString();
                                  }
                                  break;
                                
                                case 'quantidade_por_m2':
                                  if (parametros.quantidade_por_m2 && areaProduto > 0) {
                                    sugestao = (areaProduto * Number(parametros.quantidade_por_m2) * quantidadeProduto).toString();
                                  }
                                  break;
                                
                                case 'multiplicador':
                                  if (parametros.multiplicador) {
                                    sugestao = (1 * Number(parametros.multiplicador) * quantidadeProduto).toString();
                                  }
                                  break;
                                
                                case 'quantidade_fixa':
                                  if (parametros.quantidade_fixa) {
                                    sugestao = (Number(parametros.quantidade_fixa) * quantidadeProduto).toString();
                                  }
                                  break;
                              }
                            }
                          } else {
                            // Lógica padrão baseada na unidade de uso
                            switch (insumoSelecionado.unidade_uso) {
                              case 'M2':
                                if (areaProduto > 0) {
                                  sugestao = formatarQuantidadeAutomatica(
                                    areaProduto * quantidadeProduto,
                                    insumoSelecionado.unidade_uso,
                                  );
                                }
                                break;
                              case 'M':
                                if (perimetroProdutoM > 0) {
                                  sugestao = formatarQuantidadeAutomatica(
                                    perimetroProdutoM * quantidadeProduto,
                                    insumoSelecionado.unidade_uso,
                                  );
                                }
                                break;
                              case 'M3': {
                                const volumeM3 = obterVolumeM3();
                                if (volumeM3 > 0) {
                                  sugestao = formatarQuantidadeAutomatica(
                                    volumeM3 * quantidadeProduto,
                                    insumoSelecionado.unidade_uso,
                                  );
                                }
                                break;
                              }
                              case 'M2_LATERAL': {
                                const areaLateralM2 = obterAreaLateralM2();
                                if (areaLateralM2 > 0) {
                                  sugestao = formatarQuantidadeAutomatica(
                                    areaLateralM2 * quantidadeProduto,
                                    insumoSelecionado.unidade_uso,
                                  );
                                }
                                break;
                              }
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
                        {/*
                          Sub-fase 7.B++: opção "Cadastrar novo insumo" no
                          rodapé do dropdown. Usa <button> (não <SelectItem>)
                          para que o clique NÃO selecione o valor — apenas
                          dispara a abertura do modal. onMouseDown previne a
                          propagação para o Select fechar com selectedValue
                          inalterado. Só é exibida quando o caller passa
                          onInsumoCriado (sinalizando que ele sabe atualizar
                          a lista de insumos).
                        */}
                        {onInsumoCriado ? (
                          <div className="border-t mt-1 pt-1 px-1">
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setNovoInsumoModal({
                                  aberto: true,
                                  materialIndex,
                                });
                                // Fecha o Select fora do React state cycle
                                // via blur do elemento ativo (o trigger).
                                if (
                                  document.activeElement instanceof HTMLElement
                                ) {
                                  document.activeElement.blur();
                                }
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-primary font-medium"
                            >
                              <PlusCircle className="h-4 w-4" />
                              Cadastrar novo insumo
                            </button>
                          </div>
                        ) : null}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`itens_produto.${itemIndex}.materiais.${materialIndex}.quantidade`}
                render={({ field }) => {
                  // Verificar se o material é calculado por área (M2) ou tem lógica personalizada baseada em área
                  const isQuantidadeCalculada = insumoSelecionado && (
                    insumoSelecionado.unidade_uso === 'M2' ||
                    insumoSelecionado.unidade_uso === 'M' ||
                    insumoSelecionado.unidade_uso === 'M3' ||
                    insumoSelecionado.unidade_uso === 'M2_LATERAL' ||
                    (insumoSelecionado.logica_consumo === 'custom' &&
                     insumoSelecionado.tipoMaterial?.parametros_padrao?.tipo_calculo === 'quantidade_por_m2')
                  );
                  const quantidadeCasas =
                    insumoSelecionado?.unidade_uso === 'M3'
                      ? 3
                      : insumoSelecionado?.unidade_uso === 'M2_LATERAL'
                        ? 2
                        : 2;
                  
                  return (
                    <FormItem>
                      <FormLabel>{campoQuantidade.label}</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder={campoQuantidade.placeholder}
                          {...field}
                          value={
                            isQuantidadeCalculada
                              ? formatarNumeroMedida(field.value, quantidadeCasas)
                              : field.value
                          }
                          readOnly={Boolean(isQuantidadeCalculada)}
                          className={`max-w-[80px] ${isQuantidadeCalculada ? "bg-muted" : ""}`}
                          onChange={(e) => {
                            if (!isQuantidadeCalculada) {
                              // Permitir vírgula e ponto como separador decimal
                              const value = e.target.value.replace(/[^0-9,.-]/g, '');
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name={`itens_produto.${itemIndex}.materiais.${materialIndex}.material_do_cliente`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-end space-x-2 space-y-0 pb-2">
                    <FormControl>
                      <Checkbox
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer whitespace-nowrap">
                      Material do cliente
                    </FormLabel>
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-end pb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMaterial(materialIndex)}
                  className="text-red-500 hover:text-red-700"
                  disabled={form.watch(`itens_produto.${itemIndex}.materiais`)?.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Fase 11: salvaguarda anti-erro - se o insumo exige profundidade mas o produto
                nao tem profundidade preenchida, avisar o operador em vez de calcular com 0
                silenciosamente. Usa o VALOR (temProfundidadeValida) como source-of-truth,
                nao a flag tem_profundidade (que pode estar dessincronizada). */}
            {insumoSelecionado &&
              insumoExigeProfundidade(insumoSelecionado.unidade_uso) &&
              !temProfundidadeValida() && (
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded">
                  Este insumo usa <strong>{insumoSelecionado.unidade_uso === 'M3' ? 'volume (m³)' : 'área lateral (m²)'}</strong> e requer profundidade do produto.
                  Preencha o campo <em>Profundidade</em> em <strong>Geometria de produção</strong> para calcular automaticamente.
                </div>
              )}

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
            {insumoSelecionado && quantidade > 0 && (
              <div className={`text-xs p-2 rounded ${materialDoCliente ? 'text-amber-700 bg-amber-50' : 'text-green-600 bg-green-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    {materialDoCliente ? (
                      <div>Material do cliente — custo zerado no orçamento</div>
                    ) : (
                      <>
                        <div>Custo: {formatCurrency(custoCalculado)} ({formatCurrency(custoPorUnidade)} por {insumoSelecionado.unidade_uso.toLowerCase()})</div>
                        {gerarExplicacaoCalculo() && (
                          <div className="text-green-700 mt-1 font-medium">
                            {gerarExplicacaoCalculo()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Campos customizados específicos do módulo */}
            {customFields}

            {/* Ações customizadas específicas do módulo */}
            {customActions}
          </div>
        );
      })}

      {/*
        Sub-fase 7.B++: modal compartilhado para cadastro inline de insumo
        a partir do dropdown de Material. Renderizado uma única vez por
        produto; a linha alvo é guardada em novoInsumoModal.materialIndex.
        Só é montado quando onInsumoCriado foi passado (do contrário o
        botão que abre o modal nem aparece).
      */}
      {onInsumoCriado ? (
        <NovoInsumoModal
          open={novoInsumoModal.aberto}
          onOpenChange={(aberto) =>
            setNovoInsumoModal((prev) => ({ ...prev, aberto }))
          }
          nomeInicial=""
          onInsumoCriado={onInsumoCriado}
          onCriado={(insumoCriado) => {
            const materialIndex = novoInsumoModal.materialIndex;
            if (materialIndex === null) return;
            // Atrela o insumo recém-criado naquela linha específica do
            // array de materiais. A sugestão automática de quantidade
            // (que normalmente roda no onValueChange do Select) é
            // reproduzida aqui de forma simplificada: M2 usa area, M usa
            // perimetro, e o resto fica em '1' como placeholder.
            form.setValue(
              `itens_produto.${itemIndex}.materiais.${materialIndex}.insumo_id`,
              insumoCriado.id,
            );
            // Quantidade padrão pós-cadastro: deixa em branco para a
            // sugestão automática rodar quando o useEffect reagir à
            // mudança em insumos. Se já houver valor, não sobrescreve.
            const qtdAtual = form.getValues(
              `itens_produto.${itemIndex}.materiais.${materialIndex}.quantidade`,
            );
            if (!qtdAtual || String(qtdAtual).trim().length === 0) {
              form.setValue(
                `itens_produto.${itemIndex}.materiais.${materialIndex}.quantidade`,
                '1',
              );
            }
          }}
        />
      ) : null}
    </div>
  );
}
