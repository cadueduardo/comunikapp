'use client';

import { useFormContext } from 'react-hook-form';
import { useMemo } from 'react';
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
import { formatTimeDisplay } from '@/components/ui/time-input';

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
      
      {form.watch(`itens_produto.${itemIndex}.funcoes`)?.map((funcao: { funcao_id: string; horas_trabalhadas: string }, funcaoIndex: number) => {
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

        // Calcular horas e custo baseado no tipo de cálculo
        const { horasCalculadas, disclaimer, isManual } = useMemo(() => {
          if (!funcaoSelecionada) return { horasCalculadas: 0, disclaimer: '', isManual: true };

          const areaM2 = toNumber(form.watch(`itens_produto.${itemIndex}.area_produto`)) || 0;
          const qtd = toNumber(form.watch(`itens_produto.${itemIndex}.quantidade_produto`)) || 1;
          const areaTotal = areaM2 * qtd;
          
          const eff = toNumber(funcaoSelecionada.eficiencia_percent) || 100;
          const fatorEficiencia = 100 / Math.max(eff, 5); // Mínimo 5% para evitar valores irreais
          const setupMin = toNumber(funcaoSelecionada.setup_min) || 0;
          const horasSetup = setupMin / 60;
          
          let horasAuto = 0;
          let disclaimerTexto = '';
          let manual = true;

          switch (funcaoSelecionada.tipo_calculo) {
            case 'POR_M2':
              if (funcaoSelecionada.horas_por_m2 && areaTotal > 0) {
                const horasM2 = toNumber(funcaoSelecionada.horas_por_m2);
                const horasBase = areaTotal * horasM2;
                horasAuto = (horasBase * fatorEficiencia) + horasSetup;
                disclaimerTexto = `(${areaTotal.toFixed(2)}m² × ${formatTimeDisplay(horasM2)} × ${fatorEficiencia.toFixed(2)} eficiência) + ${setupMin}min setup = ${horasAuto.toFixed(2)}h`;
                manual = false;
              }
              break;
              
            case 'POR_UNIDADE':
              if (funcaoSelecionada.horas_por_unidade && qtd > 0) {
                const horasUn = toNumber(funcaoSelecionada.horas_por_unidade);
                const horasBase = qtd * horasUn;
                horasAuto = (horasBase * fatorEficiencia) + horasSetup;
                disclaimerTexto = `(${qtd} un × ${formatTimeDisplay(horasUn)} × ${fatorEficiencia.toFixed(2)} eficiência) + ${setupMin}min setup = ${horasAuto.toFixed(2)}h`;
                manual = false;
              }
              break;
              
            case 'ACOMPANHA_MAQUINA':
              // TODO: Implementar lógica de acompanhamento de máquina
              disclaimerTexto = 'Acompanha tempo da máquina vinculada';
              manual = false;
              break;
              
            default: // MANUAL
              disclaimerTexto = 'Horas inseridas manualmente';
              manual = true;
              break;
          }

          return { 
            horasCalculadas: horasAuto, 
            disclaimer: disclaimerTexto, 
            isManual: manual 
          };
        }, [
          funcaoSelecionada?.id, 
          funcaoSelecionada?.tipo_calculo, 
          funcaoSelecionada?.horas_por_m2, 
          funcaoSelecionada?.horas_por_unidade, 
          funcaoSelecionada?.eficiencia_percent,
          form.watch(`itens_produto.${itemIndex}.area_produto`), 
          form.watch(`itens_produto.${itemIndex}.quantidade_produto`)
        ]);

        // Usar horas calculadas automaticamente ou horas manuais
        const horasFinais = isManual ? horasTrabalhadas : horasCalculadas;
        const custoCalculado = funcaoSelecionada ? converterValor(funcaoSelecionada.custo_hora) * horasFinais : 0;
        
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
                        placeholder={isManual ? "0.00" : horasCalculadas.toFixed(2)}
                        value={isManual ? field.value : horasCalculadas.toFixed(2)}
                        onChange={(e) => {
                          if (isManual) {
                            // Permitir vírgula e ponto como separador decimal
                            const value = e.target.value.replace(/[^0-9,.-]/g, '');
                            field.onChange(value);
                          }
                        }}
                        readOnly={!isManual}
                        className={!isManual ? "bg-muted" : ""}
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
                      {funcaoSelecionada.nome} • {horasFinais.toFixed(2)}h
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