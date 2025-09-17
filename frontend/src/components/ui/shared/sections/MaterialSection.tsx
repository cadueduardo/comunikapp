'use client';

import { useFormContext } from 'react-hook-form';
import { useEffect } from 'react';
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

  // Monitorar mudanças nas dimensões e quantidade do produto para recalcular materiais automaticamente
  const quantidadeProduto = form.watch(`itens_produto.${itemIndex}.quantidade_produto`);
  const areaProduto = form.watch(`itens_produto.${itemIndex}.area_produto`);
  const larguraProduto = form.watch(`itens_produto.${itemIndex}.largura_produto`);
  const alturaProduto = form.watch(`itens_produto.${itemIndex}.altura_produto`);
  const unidadeMedidaProduto = form.watch(`itens_produto.${itemIndex}.unidade_medida_produto`);

  useEffect(() => {
    // Recalcular automaticamente as quantidades de materiais quando as dimensões ou quantidade do produto mudarem
    const materiais = form.getValues(`itens_produto.${itemIndex}.materiais`) || [];
    
    materiais.forEach((material: { insumo_id: string; quantidade: string }, materialIndex: number) => {
      if (material.insumo_id) {
        const insumoSelecionado = insumos.find(insumo => insumo.id === material.insumo_id);
        if (insumoSelecionado) {
          let novaQuantidade = '';
          const quantidadeProdutoNum = Number(quantidadeProduto) || 1;
          const areaProdutoNum = Number(areaProduto) || 0;
          const larguraProdutoNum = Number(larguraProduto) || 0;
          const alturaProdutoNum = Number(alturaProduto) || 0;
          
          // Verificar se tem lógica personalizada
          if (insumoSelecionado.logica_consumo === 'custom' && insumoSelecionado.tipoMaterial) {
            const parametros = insumoSelecionado.tipoMaterial.parametros_padrao;
            
            if (parametros && parametros.tipo_calculo) {
              switch (parametros.tipo_calculo) {
                case 'espacamento':
                  if (parametros.espacamento && larguraProdutoNum && alturaProdutoNum) {
                    const perimetro = 2 * (larguraProdutoNum + alturaProdutoNum);
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
                    novaQuantidade = (parametros.quantidade_fixa * quantidadeProdutoNum).toString();
                  }
                  break;
              }
            }
          } else {
            // Lógica padrão baseada na unidade de uso
            switch (insumoSelecionado.unidade_uso) {
              case 'M2':
                if (larguraProdutoNum && alturaProdutoNum && unidadeMedidaProduto) {
                  const area = calcularArea(larguraProdutoNum, alturaProdutoNum, unidadeMedidaProduto);
                  novaQuantidade = (area * quantidadeProdutoNum).toFixed(2);
                }
                break;
              case 'M':
                if (larguraProdutoNum && alturaProdutoNum && unidadeMedidaProduto) {
                  const larguraEmMetros = converterParaMetros(larguraProdutoNum, unidadeMedidaProduto);
                  const alturaEmMetros = converterParaMetros(alturaProdutoNum, unidadeMedidaProduto);
                  const perimetro = 2 * (larguraEmMetros + alturaEmMetros);
                  novaQuantidade = (perimetro * quantidadeProdutoNum).toFixed(2);
                }
                break;
            }
          }
          
          // Atualizar apenas se a nova quantidade for diferente e válida
          if (novaQuantidade && novaQuantidade !== material.quantidade) {
            form.setValue(`itens_produto.${itemIndex}.materiais.${materialIndex}.quantidade`, novaQuantidade);
          }
        }
      }
    });
  }, [quantidadeProduto, areaProduto, larguraProduto, alturaProduto, unidadeMedidaProduto, form, itemIndex, insumos]);

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
        // Calcular custo considerando se a quantidade já inclui a multiplicação pelo produto
        // Se o material foi calculado automaticamente, a quantidade já considera a quantidade do produto
        // Se foi digitado manualmente, precisamos verificar se deve multiplicar
        const quantidadeProduto = Number(form.watch(`itens_produto.${itemIndex}.quantidade_produto`)) || 1;
        const custoCalculado = custoPorUnidade * quantidade;
        
        // Obter dimensões do produto para materiais calculados por m²
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
          
          // Obter quantidade do produto para cálculo total
          const quantidadeProduto = Number(form.watch(`itens_produto.${itemIndex}.quantidade_produto`)) || 1;
                          
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
                    sugestao = (parametros.quantidade_fixa * quantidadeProduto).toString();
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
                  // Multiplicar pela quantidade do produto
                  sugestao = (area * quantidadeProduto).toFixed(2);
                }
                break;
              case 'M':
                if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
                  const larguraEmMetros = converterParaMetros(Number(larguraProduto), unidadeMedidaProduto);
                  const alturaEmMetros = converterParaMetros(Number(alturaProduto), unidadeMedidaProduto);
                  const perimetro = 2 * (larguraEmMetros + alturaEmMetros);
                  // Multiplicar pela quantidade do produto
                  sugestao = (perimetro * quantidadeProduto).toFixed(2);
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
          const quantidadeProduto = Number(form.watch(`itens_produto.${itemIndex}.quantidade_produto`)) || 1;
          
          // Verificar se tem lógica personalizada
          if (insumoSelecionado.logica_consumo === 'custom' && insumoSelecionado.tipoMaterial) {
            const parametros = insumoSelecionado.tipoMaterial.parametros_padrao;
            
            if (parametros && parametros.tipo_calculo) {
              switch (parametros.tipo_calculo) {
                case 'espacamento':
                  if (parametros.espacamento && larguraProduto && alturaProduto) {
                    const perimetro = 2 * (larguraProduto + alturaProduto);
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
                    const quantidadeTotal = parametros.multiplicador * quantidadeProduto;
                    return `Multiplicador: ${parametros.multiplicador}x × ${quantidadeProduto} unidades • Total: ${quantidadeTotal} unidades`;
                  }
                  break;
                
                case 'quantidade_fixa':
                  if (parametros.quantidade_fixa) {
                    const quantidadeTotal = parametros.quantidade_fixa * quantidadeProduto;
                    return `Quantidade fixa: ${parametros.quantidade_fixa} × ${quantidadeProduto} unidades • Total: ${quantidadeTotal} unidades`;
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
                  const areaTotal = area * quantidadeProduto;
                  return `Área calculada: ${area.toFixed(2)}m² × ${quantidadeProduto} unidades = ${areaTotal.toFixed(2)}m²`;
                }
                break;
              case 'M':
                if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
                  const larguraEmMetros = converterParaMetros(Number(larguraProduto), unidadeMedidaProduto);
                  const alturaEmMetros = converterParaMetros(Number(alturaProduto), unidadeMedidaProduto);
                  const perimetro = 2 * (larguraEmMetros + alturaEmMetros);
                  const perimetroTotal = perimetro * quantidadeProduto;
                  return `Perímetro calculado: ${perimetro.toFixed(2)}m × ${quantidadeProduto} unidades = ${perimetroTotal.toFixed(2)}m`;
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
                          
                          // Obter quantidade do produto para cálculo total
                          const quantidadeProduto = Number(form.watch(`itens_produto.${itemIndex}.quantidade_produto`)) || 1;
                          
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
                                    sugestao = (parametros.quantidade_fixa * quantidadeProduto).toString();
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
                                  // Multiplicar pela quantidade do produto
                                  sugestao = (area * quantidadeProduto).toFixed(2);
                                }
                                break;
                              case 'M':
                                if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
                                  const larguraEmMetros = converterParaMetros(Number(larguraProduto), unidadeMedidaProduto);
                                  const alturaEmMetros = converterParaMetros(Number(alturaProduto), unidadeMedidaProduto);
                                  const perimetro = 2 * (larguraEmMetros + alturaEmMetros);
                                  // Multiplicar pela quantidade do produto
                                  sugestao = (perimetro * quantidadeProduto).toFixed(2);
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
                render={({ field }) => {
                  // Verificar se o material é calculado por área (M2) ou tem lógica personalizada baseada em área
                  const isAreaCalculated = insumoSelecionado && (
                    insumoSelecionado.unidade_uso === 'M2' ||
                    (insumoSelecionado.logica_consumo === 'custom' && 
                     insumoSelecionado.tipoMaterial?.parametros_padrao?.tipo_calculo === 'quantidade_por_m2')
                  );
                  
                  return (
                    <FormItem>
                      <FormLabel>{campoQuantidade.label}</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder={campoQuantidade.placeholder}
                          {...field}
                          readOnly={isAreaCalculated}
                          className={isAreaCalculated ? "bg-muted" : ""}
                          onChange={(e) => {
                            if (!isAreaCalculated) {
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