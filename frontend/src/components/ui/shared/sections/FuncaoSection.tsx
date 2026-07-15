'use client';

import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
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
import { Funcao } from '../types/common.types';
import { useState } from 'react';
import { formatTimeDisplay } from '@/components/ui/time-input';
import { formatarTempoHumano, parseTempoHumano } from '@/lib/tempo-formatador';

interface FuncaoSectionProps {
  variant?: 'orcamento' | 'produto';
  itemIndex: number;
  funcoes: Funcao[];
  onAddFuncao?: (itemIndex: number) => void;
  onRemoveFuncao?: (itemIndex: number, funcaoIndex: number) => void;
  customFields?: React.ReactNode;
  customActions?: React.ReactNode;
}

export function FuncaoSection({ 
  itemIndex,
  funcoes,
  onAddFuncao,
  onRemoveFuncao,
  customFields,
  customActions
}: FuncaoSectionProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [digitosLocais, setDigitosLocais] = useState<Record<number, string>>({});

  // Função auxiliar para converter valores de forma robusta
  const converterValor = (valor: any): number => {
    if (valor === null || valor === undefined) return 0;
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') return parseFloat(valor.replace(',', '.')) || 0;
    // Se for um objeto Decimal do Prisma (tem propriedade toString)
    if (valor && typeof valor.toString === 'function') {
      try {
        return parseFloat(valor.toString().replace(',', '.')) || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  const form = useFormContext();
  
  // Hooks devem ser chamados sempre na mesma ordem - movidos para fora do map
  const funcoesData = useWatch({ control: form.control, name: `itens_produto.${itemIndex}.funcoes` }) || [];
  
  // Usar watch para obter todos os valores de uma vez
  const allFormValues = useWatch({ control: form.control });

  // useEffect para atualizar valores automaticamente sem causar re-render durante o render
  useEffect(() => {
    if (!funcoesData || funcoesData.length === 0) return;

    funcoesData.forEach((funcao: { funcao_id: string; horas_trabalhadas: string }, funcaoIndex: number) => {
      const funcaoSelecionada = funcoes.find(f => f.id === funcao.funcao_id);
      
      if (!funcaoSelecionada) return;

      const maquinasProduto = form.getValues(`itens_produto.${itemIndex}.maquinas`) || [];
      const horasMaquinas = maquinasProduto.reduce((total: number, maquina: any) => {
        const horas = Number(String(maquina.horas_utilizadas).replace(',', '.')) || 0;
        return total + horas;
      }, 0);

      const toNumber = (v: any): number => {
        if (v == null || v === '') return 0;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') return parseFloat(v.replace(',', '.')) || 0;
        if (v && typeof v.toString === 'function') {
          return parseFloat(v.toString().replace(',', '.')) || 0;
        }
        return 0;
      };

      let horasCalculadas = 0;
      let isManual = true;

      if (funcaoSelecionada.tipo_calculo === 'ACOMPANHA_MAQUINA') {
        horasCalculadas = horasMaquinas;
        isManual = false;
      } else if (funcaoSelecionada.tipo_calculo === 'POR_M2') {
        const areaM2 = toNumber(form.getValues(`itens_produto.${itemIndex}.area_produto`)) || 0;
        const quantidade = toNumber(form.getValues(`itens_produto.${itemIndex}.quantidade_produto`)) || 1;
        const areaTotal = areaM2 * quantidade;
        const horasPorM2 = toNumber(funcaoSelecionada.horas_por_m2) || 0;
        horasCalculadas = areaTotal * horasPorM2;
        isManual = false;
      } else if (funcaoSelecionada.tipo_calculo === 'POR_UNIDADE') {
        const quantidade = toNumber(form.getValues(`itens_produto.${itemIndex}.quantidade_produto`)) || 1;
        const horasPorUnidade = toNumber(funcaoSelecionada.horas_por_unidade) || 0;
        horasCalculadas = quantidade * horasPorUnidade;
        isManual = false;
      }

      if (!isManual) {
        const fieldPath = `itens_produto.${itemIndex}.funcoes.${funcaoIndex}.horas_trabalhadas`;
        const horasFieldValue = allFormValues?.itens_produto?.[itemIndex]?.funcoes?.[funcaoIndex]?.horas_trabalhadas || '';
        const displayValue = horasCalculadas.toFixed(2);
        
        if (funcaoSelecionada.tipo_calculo === 'ACOMPANHA_MAQUINA' && horasMaquinas === 0) {
          if (horasFieldValue !== '') {
            form.setValue(fieldPath, '', { shouldDirty: true, shouldValidate: false });
          }
        } else if (horasFieldValue !== displayValue) {
          form.setValue(fieldPath, displayValue, { shouldDirty: true, shouldValidate: false });
        }
      }
    });
  }, [funcoesData, funcoes, itemIndex, allFormValues, form]);

  const handleAddFuncao = () => {
    if (onAddFuncao) {
      onAddFuncao(itemIndex);
    } else {
      const currentFuncoes = form.getValues(`itens_produto.${itemIndex}.funcoes`);
      const hasEmpty = currentFuncoes.some((f: { funcao_id: string; horas_trabalhadas: string }) => !f.funcao_id || !f.horas_trabalhadas);
      if (!hasEmpty) {
        const newFuncoes = [...currentFuncoes, { funcao_id: '', horas_trabalhadas: '1' }];
        form.setValue(`itens_produto.${itemIndex}.funcoes`, newFuncoes);
      }
    }
  };

  const handleRemoveFuncao = (funcaoIndex: number) => {
    if (onRemoveFuncao) {
      onRemoveFuncao(itemIndex, funcaoIndex);
    } else {
      const currentFuncoes = form.getValues(`itens_produto.${itemIndex}.funcoes`);
      if (currentFuncoes.length > 1) {
        const newFuncoes = currentFuncoes.filter((_: unknown, index: number) => index !== funcaoIndex);
        form.setValue(`itens_produto.${itemIndex}.funcoes`, newFuncoes);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium">Funções Utilizadas</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddFuncao}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Função
        </Button>
      </div>
      
      {funcoesData.map((funcao: { funcao_id: string; horas_trabalhadas: string }, funcaoIndex: number) => {
        const funcaoSelecionada = funcoes.find(f => f.id === funcao.funcao_id);
        const horasTrabalhadas = Number(String(funcao.horas_trabalhadas).replace(',', '.')) || 0;

        // Função auxiliar para converter valores
        const toNumber = (v: any): number => {
          if (v == null || v === '') return 0;
          if (typeof v === 'number') return v;
          if (typeof v === 'string') return parseFloat(v.replace(',', '.')) || 0;
          if (v && typeof v.toString === 'function') {
            return parseFloat(v.toString().replace(',', '.')) || 0;
          }
          return 0;
        };

        const maquinasProduto = form.getValues(`itens_produto.${itemIndex}.maquinas`) || [];
        const horasMaquinas = maquinasProduto.reduce((total: number, maquinaItem: any) => {
          const horas = toNumber(maquinaItem?.horas_utilizadas);
          return total + horas;
        }, 0);
        const setupMaquinasHoras = maquinasProduto.reduce((total: number, maquinaItem: any) => {
          const maquinaInfo = funcoes.find((m) => m.id === maquinaItem?.maquina_id);
          if (!maquinaInfo) return total;
          const setup = toNumber(maquinaInfo.setup_min) || 0;
          return total + setup / 60;
        }, 0);

        let horasCalculadas = 0;
        let disclaimer = '';
        let isManual = true;

        if (funcaoSelecionada) {
          const areaM2 = toNumber(form.getValues(`itens_produto.${itemIndex}.area_produto`)) || 0;
          const quantidade = toNumber(form.getValues(`itens_produto.${itemIndex}.quantidade_produto`)) || 1;
          const areaTotal = areaM2 * quantidade;
          const eficienciaPercent = Math.max(toNumber(funcaoSelecionada.eficiencia_percent) || 100, 5);
          const fatorEficiencia = 100 / eficienciaPercent;
          const setupMin = toNumber(funcaoSelecionada.setup_min) || 0;
          const horasSetupFuncao = setupMin / 60;

          switch (funcaoSelecionada.tipo_calculo) {
            case 'POR_M2':
              if (funcaoSelecionada.horas_por_m2 && areaTotal > 0) {
                const horasM2 = toNumber(funcaoSelecionada.horas_por_m2);
                const horasBase = areaTotal * horasM2;
                horasCalculadas = horasBase * fatorEficiencia + horasSetupFuncao;
                disclaimer = `${areaTotal.toFixed(2)}m² × ${formatTimeDisplay(horasM2)} × (100 ÷ ${eficienciaPercent}%) + ${setupMin}min setup = ${formatarTempoHumano(horasCalculadas)}`;
                isManual = false;
              }
              break;

            case 'POR_UNIDADE':
              if (funcaoSelecionada.horas_por_unidade && quantidade > 0) {
                const horasUnidade = toNumber(funcaoSelecionada.horas_por_unidade);
                const horasBase = quantidade * horasUnidade;
                horasCalculadas = horasBase * fatorEficiencia + horasSetupFuncao;
                disclaimer = `${quantidade} un × ${formatTimeDisplay(horasUnidade)} × (100 ÷ ${eficienciaPercent}%) + ${setupMin}min setup = ${formatarTempoHumano(horasCalculadas)}`;
                isManual = false;
              }
              break;

            case 'ACOMPANHA_MAQUINA':
              if (horasMaquinas > 0) {
                const acompanhamentoRaw = toNumber(funcaoSelecionada.fator_acompanhamento);
                const acompanhamentoDecimal = acompanhamentoRaw > 1 ? acompanhamentoRaw / 100 : (acompanhamentoRaw || 1);
                const horasBase = horasMaquinas * acompanhamentoDecimal;
                horasCalculadas = horasBase * fatorEficiencia + horasSetupFuncao + setupMaquinasHoras;
                const acompanhamentoTexto = acompanhamentoRaw > 1 ? `${acompanhamentoRaw}%` : `${(acompanhamentoDecimal * 100).toFixed(0)}%`;
                disclaimer = `${formatarTempoHumano(horasMaquinas)} (máquinas) × ${acompanhamentoTexto} × (100 ÷ ${eficienciaPercent}%) + setup máquinas (${formatarTempoHumano(setupMaquinasHoras)}) + setup função (${formatarTempoHumano(horasSetupFuncao)}) = ${formatarTempoHumano(horasCalculadas)}`;
                isManual = false;
              } else {
                disclaimer = 'Nenhuma máquina encontrada para acompanhar; selecione uma máquina antes desta função.';
              }
              break;

            default:
              disclaimer = 'Horas inseridas manualmente';
              isManual = true;
              break;
          }
        }

        // Usar horas calculadas automaticamente ou horas manuais
        const horasFinais = isManual ? horasTrabalhadas : horasCalculadas;
        const custoCalculado = funcaoSelecionada ? converterValor(funcaoSelecionada.custo_hora) * horasFinais : 0;
        
        const fieldPath = `itens_produto.${itemIndex}.funcoes.${funcaoIndex}.horas_trabalhadas`;
        const horasFieldValue = allFormValues?.itens_produto?.[itemIndex]?.funcoes?.[funcaoIndex]?.horas_trabalhadas || '';
        const displayValue = isManual ? (horasFieldValue ?? '') : horasCalculadas.toFixed(2);

        if (!funcaoSelecionada && funcaoSelecionada?.tipo_calculo === 'ACOMPANHA_MAQUINA') {
          disclaimer = 'Nenhuma máquina encontrada para acompanhar; selecione uma máquina antes desta função.';
          horasCalculadas = 0;
        }

        return (
          <div key={funcaoIndex} className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
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
                            {funcao.nome} {funcao.maquina && `(${funcao.maquina.nome})`}
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
                        type="text"
                        placeholder="0h00m"
                        value={
                          focusedIndex === funcaoIndex
                            ? (digitosLocais[funcaoIndex] ?? formatarTempoHumano(Number(field.value) || 0))
                            : formatarTempoHumano(Number(field.value) || 0)
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setDigitosLocais((prev) => ({ ...prev, [funcaoIndex]: val }));
                          field.onChange(parseTempoHumano(val));
                        }}
                        onFocus={() => {
                          setFocusedIndex(funcaoIndex);
                          setDigitosLocais((prev) => ({
                            ...prev,
                            [funcaoIndex]: formatarTempoHumano(Number(field.value) || 0),
                          }));
                        }}
                        onBlur={() => {
                          setFocusedIndex(null);
                          setDigitosLocais((prev) => {
                            const n = { ...prev };
                            delete n[funcaoIndex];
                            return n;
                          });
                        }}
                        className={!isManual ? 'bg-muted' : ''}
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
                  onClick={() => handleRemoveFuncao(funcaoIndex)}
                  className="text-red-500 hover:text-red-700"
                  disabled={form.watch(`itens_produto.${itemIndex}.funcoes`)?.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Custo calculado */}
            {funcaoSelecionada && horasFinais > 0 && custoCalculado > 0 && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div>Custo: {formatCurrency(custoCalculado)} ({formatCurrency(converterValor(funcaoSelecionada.custo_hora))} por hora)</div>
                    <div className="text-green-700 mt-1 font-medium">
                      {funcaoSelecionada.nome} • {formatarTempoHumano(horasFinais)}
                      {funcaoSelecionada.maquina && ` • ${funcaoSelecionada.maquina.nome}`}
                    </div>
                    {disclaimer && (
                      <div className="text-blue-700 mt-1 text-xs">
                        💡 {disclaimer}
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