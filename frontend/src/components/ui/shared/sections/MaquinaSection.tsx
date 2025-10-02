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
import { Maquina } from '../types/common.types';

interface MaquinaSectionProps {
  variant?: 'orcamento' | 'produto';
  itemIndex: number;
  maquinas: Maquina[];
  onAddMaquina?: (itemIndex: number) => void;
  onRemoveMaquina?: (itemIndex: number, maquinaIndex: number) => void;
  customFields?: React.ReactNode;
  customActions?: React.ReactNode;
}

export function MaquinaSection({ 
  itemIndex,
  maquinas,
  onAddMaquina,
  onRemoveMaquina,
  customFields,
  customActions
}: MaquinaSectionProps) {
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
  const maquinasData = useWatch({ control: form.control, name: `itens_produto.${itemIndex}.maquinas` }) || [];
  const areaM2 = useWatch({ control: form.control, name: `itens_produto.${itemIndex}.area_produto` });
  const quantidade = useWatch({ control: form.control, name: `itens_produto.${itemIndex}.quantidade_produto` });
  
  // Usar watch para obter todos os valores de uma vez
  const allFormValues = useWatch({ control: form.control });

  // useEffect para atualizar valores automaticamente sem causar re-render durante o render
  useEffect(() => {
    if (!maquinasData || maquinasData.length === 0) return;

    maquinasData.forEach((maquina: { maquina_id: string; horas_utilizadas: string }, maquinaIndex: number) => {
      const maquinaSelecionada = maquinas.find((m) => m.id === maquina.maquina_id);
      
      if (!maquinaSelecionada) return;

      const toNumber = (v: any): number => {
        if (v == null || v === '') return 0;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') return parseFloat(v.replace(',', '.')) || 0;
        if (v && typeof v.toString === 'function') {
          return parseFloat(v.toString().replace(',', '.')) || 0;
        }
        return 0;
      };

      const areaM2Value = toNumber(areaM2) || 0;
      const quantidadeValue = toNumber(quantidade) || 1;
      const areaTotal = areaM2Value * quantidadeValue;

      const velocidadeM2H = toNumber(maquinaSelecionada?.velocidade_m2_h) || 0;
      const eficienciaPercent = Math.max(toNumber(maquinaSelecionada?.eficiencia_percent) || 100, 5);
      const setupMin = toNumber(maquinaSelecionada?.setup_min) || 0;
      const horasSetup = setupMin / 60;

      let horasCalculadas = 0;
      let isManual = true;

      if (maquinaSelecionada && maquinaSelecionada.modo_producao === 'M2_H' && velocidadeM2H > 0 && areaTotal > 0) {
        const horasBase = areaTotal / velocidadeM2H;
        const fatorEficiencia = 100 / eficienciaPercent;
        horasCalculadas = horasBase * fatorEficiencia + horasSetup;
        isManual = false;
      }

      if (!isManual) {
        const fieldPath = `itens_produto.${itemIndex}.maquinas.${maquinaIndex}.horas_utilizadas`;
        const horasFieldValue = allFormValues?.itens_produto?.[itemIndex]?.maquinas?.[maquinaIndex]?.horas_utilizadas || '';
        const displayValue = horasCalculadas.toFixed(2);
        
        if (horasFieldValue !== displayValue) {
          form.setValue(fieldPath, displayValue, { shouldDirty: true, shouldValidate: false });
        }
      }
    });
  }, [maquinasData, areaM2, quantidade, maquinas, itemIndex, allFormValues, form]);

  const handleAddMaquina = () => {
    if (onAddMaquina) {
      onAddMaquina(itemIndex);
    } else {
      const currentMaquinas = form.getValues(`itens_produto.${itemIndex}.maquinas`);
      const hasEmpty = currentMaquinas.some((m: { maquina_id: string; horas_utilizadas: string }) => !m.maquina_id || !m.horas_utilizadas);
      if (!hasEmpty) {
        const newMaquinas = [...currentMaquinas, { maquina_id: '', horas_utilizadas: '1' }];
        form.setValue(`itens_produto.${itemIndex}.maquinas`, newMaquinas);
      }
    }
  };

  const handleRemoveMaquina = (maquinaIndex: number) => {
    if (onRemoveMaquina) {
      onRemoveMaquina(itemIndex, maquinaIndex);
    } else {
      const currentMaquinas = form.getValues(`itens_produto.${itemIndex}.maquinas`);
      if (currentMaquinas.length > 1) {
        const newMaquinas = currentMaquinas.filter((_: unknown, index: number) => index !== maquinaIndex);
        form.setValue(`itens_produto.${itemIndex}.maquinas`, newMaquinas);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium">Máquinas Utilizadas</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddMaquina}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Máquina
        </Button>
      </div>
      
      {maquinasData.map((maquina: { maquina_id: string; horas_utilizadas: string }, maquinaIndex: number) => {
        const maquinaSelecionada = maquinas.find((m) => m.id === maquina.maquina_id);

        const toNumber = (v: any): number => {
          if (v == null || v === '') return 0;
          if (typeof v === 'number') return v;
          if (typeof v === 'string') return parseFloat(v.replace(',', '.')) || 0;
          if (v && typeof v.toString === 'function') {
            return parseFloat(v.toString().replace(',', '.')) || 0;
          }
          return 0;
        };

        const areaM2Value = toNumber(areaM2) || 0;
        const quantidadeValue = toNumber(quantidade) || 1;
        const areaTotal = areaM2Value * quantidadeValue;

        const velocidadeM2H = toNumber(maquinaSelecionada?.velocidade_m2_h) || 0;
        const eficienciaPercent = Math.max(toNumber(maquinaSelecionada?.eficiencia_percent) || 100, 5);
        const setupMin = toNumber(maquinaSelecionada?.setup_min) || 0;
        const horasSetup = setupMin / 60;

        let horasCalculadas = 0;
        let disclaimer = '';
        let isManual = true;

        if (maquinaSelecionada && maquinaSelecionada.modo_producao === 'M2_H' && velocidadeM2H > 0 && areaTotal > 0) {
          const horasBase = areaTotal / velocidadeM2H;
          const fatorEficiencia = 100 / eficienciaPercent;
          horasCalculadas = horasBase * fatorEficiencia + horasSetup;
          disclaimer = `${areaTotal.toFixed(2)}m² ÷ ${velocidadeM2H.toFixed(2)}m²/h × (100 ÷ ${eficienciaPercent}%) + ${setupMin}min setup = ${horasCalculadas.toFixed(2)}h`;
          isManual = false;
        } else if (maquinaSelecionada && maquinaSelecionada.modo_producao === 'ML_H') {
          disclaimer = 'Modo linear (ML/H) - implementação pendente';
          isManual = false;
        } else {
          disclaimer = 'Horas inseridas manualmente';
          isManual = true;
        }

        const fieldPath = `itens_produto.${itemIndex}.maquinas.${maquinaIndex}.horas_utilizadas`;
        const horasFieldValue = allFormValues?.itens_produto?.[itemIndex]?.maquinas?.[maquinaIndex]?.horas_utilizadas || '';
        const displayValue = isManual ? (horasFieldValue ?? '') : horasCalculadas.toFixed(2);

        const horasFinais = Number(displayValue) || 0;
        const custoCalculado = maquinaSelecionada ? converterValor(maquinaSelecionada.custo_hora) * horasFinais : 0;

        return (
          <div key={maquinaIndex} className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
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
                name={fieldPath}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Utilizadas</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={isManual ? '0.00' : displayValue}
                        value={isManual ? field.value ?? '' : displayValue}
                        onChange={(e) => {
                          if (isManual) {
                            const value = e.target.value.replace(/[^0-9,.-]/g, '');
                            field.onChange(value);
                          }
                        }}
                        readOnly={!isManual}
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
                  onClick={() => handleRemoveMaquina(maquinaIndex)}
                  className="text-red-500 hover:text-red-700"
                  disabled={form.watch(`itens_produto.${itemIndex}.maquinas`)?.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Custo calculado */}
            {maquinaSelecionada && horasFinais > 0 && custoCalculado > 0 && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div>Custo: {formatCurrency(custoCalculado)} ({formatCurrency(converterValor(maquinaSelecionada.custo_hora))} por hora)</div>
                    <div className="text-green-700 mt-1 font-medium">
                      {maquinaSelecionada.nome} • {maquinaSelecionada.tipo} • {horasFinais.toFixed(2)}h
                      {maquinaSelecionada.modo_producao && (
                        <span className="ml-2 text-xs">
                          ({maquinaSelecionada.modo_producao})
                        </span>
                      )}
                    </div>
                    {disclaimer && (
                      <div className="text-green-700 mt-1 text-xs">
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