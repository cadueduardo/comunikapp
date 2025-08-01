'use client';

import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { Insumo } from '../types/common.types';
import { getCampoQuantidade, calcularCustoPorUnidadeUso, calcularArea, converterParaMetros } from '../utils/calculo.utils';

interface MaterialSectionProps {
  variant?: 'orcamento' | 'produto';
  itemIndex: number;
  insumos: Insumo[];
  onAddMaterial?: (itemIndex: number) => void;
  onRemoveMaterial?: (itemIndex: number, materialIndex: number) => void;
  customFields?: React.ReactNode;
  customActions?: React.ReactNode;
}

export function MaterialSection({ 
  itemIndex,
  insumos,
  onAddMaterial,
  onRemoveMaterial,
  customFields,
  customActions
}: MaterialSectionProps) {
  const form = useFormContext();

  const handleAddMaterial = () => {
    if (onAddMaterial) {
      onAddMaterial(itemIndex);
    } else {
      const currentMaterials = form.getValues(`itens_produto.${itemIndex}.materiais`);
      const hasEmpty = currentMaterials.some((m: { insumo_id: string; quantidade: string }) => !m.insumo_id || !m.quantidade);
      if (!hasEmpty) {
        const newMaterials = [...currentMaterials, { insumo_id: '', quantidade: '1' }];
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
      
      {form.watch(`itens_produto.${itemIndex}.materiais`)?.map((material: { insumo_id: string; quantidade: string }, materialIndex: number) => {
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
        // const areaCalculada = areaProduto > 0 ? areaProduto : 
        //   (larguraProduto && alturaProduto && unidadeMedidaProduto) ? 
        //   calcularArea(larguraProduto, alturaProduto, unidadeMedidaProduto) : 0;
        
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
                  onClick={() => handleRemoveMaterial(materialIndex)}
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

            {/* Campos customizados específicos do módulo */}
            {customFields}

            {/* Ações customizadas específicas do módulo */}
            {customActions}
          </div>
        );
      })}
    </div>
  );
} 