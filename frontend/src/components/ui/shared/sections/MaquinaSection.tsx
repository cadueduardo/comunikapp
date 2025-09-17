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
      
      {form.watch(`itens_produto.${itemIndex}.maquinas`)?.map((maquina: { maquina_id: string; horas_utilizadas: string }, maquinaIndex: number) => {
        const maquinaSelecionada = maquinas.find(m => m.id === maquina.maquina_id);
        const horasUtilizadas = Number(String(maquina.horas_utilizadas).replace(',', '.')) || 0;

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

        // Calcular horas e custo baseado no modo de produção
        const { horasCalculadas, disclaimer, isManual } = useMemo(() => {
          if (!maquinaSelecionada || !maquinaSelecionada.modo_producao) {
            return { horasCalculadas: 0, disclaimer: 'Modo de produção não definido', isManual: true };
          }

          const areaM2 = toNumber(form.watch(`itens_produto.${itemIndex}.area_produto`)) || 0;
          const qtd = toNumber(form.watch(`itens_produto.${itemIndex}.quantidade_produto`)) || 1;
          const areaTotal = areaM2 * qtd;
          
          const velocidadeM2H = toNumber(maquinaSelecionada.velocidade_m2_h) || 0;
          const eficienciaPercent = toNumber(maquinaSelecionada.eficiencia_percent) || 100;
          const setupMin = toNumber(maquinaSelecionada.setup_min) || 0;
          
          const eficienciaDecimal = eficienciaPercent / 100;
          const fatorEficiencia = 1 / Math.max(eficienciaDecimal, 0.05);
          
          let horasAuto = 0;
          let disclaimerTexto = '';
          let manual = true;

          switch (maquinaSelecionada.modo_producao) {
            case 'M2_H':
              if (velocidadeM2H > 0 && areaTotal > 0) {
                let velocidadeCorrigida = velocidadeM2H;
                
                // CORREÇÃO: Se velocidade for muito baixa (< 0.5), pode estar invertida
                if (velocidadeM2H < 0.5) {
                  velocidadeCorrigida = 1 / velocidadeM2H; // Inverter se necessário
                  console.warn('⚠️ Velocidade muito baixa detectada, invertendo:', velocidadeM2H, '→', velocidadeCorrigida);
                }
                
                const horasBase = areaTotal / velocidadeCorrigida; // área ÷ velocidade
                const horasSetup = setupMin / 60;
                horasAuto = (horasBase + horasSetup) * fatorEficiencia;
                
                // Validação final
                if (horasAuto > 500) {
                  console.warn('⚠️ Resultado muito alto para máquina, limitando a 100h');
                  horasAuto = 100;
                }
                
                // Debug detalhado do cálculo
                console.log('🔍 Debug Máquina M2_H:', {
                  maquinaNome: maquinaSelecionada.nome,
                  areaM2,
                  qtd,
                  areaTotal,
                  velocidadeM2H,
                  setupMin,
                  eficienciaPercent,
                  fatorEficiencia,
                  calculoDetalhado: {
                    horasBase: `${areaTotal} ÷ ${velocidadeM2H} = ${horasBase}`,
                    horasSetup: `${setupMin} ÷ 60 = ${horasSetup}`,
                    calculoFinal: `(${horasBase} + ${horasSetup}) × ${fatorEficiencia} = ${horasAuto}`
                  }
                });
                
                disclaimerTexto = `${areaTotal.toFixed(2)}m² ÷ ${velocidadeCorrigida.toFixed(2)}m²/h + ${setupMin}min setup com ${eficienciaPercent}% eficiência = ${horasAuto.toFixed(2)}h`;
                manual = false;
              }
              break;
              
            case 'ML_H':
              // TODO: Implementar cálculo para modo linear
              disclaimerTexto = 'Modo linear (ML/H) - implementação pendente';
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
          maquinaSelecionada?.id, 
          maquinaSelecionada?.modo_producao, 
          maquinaSelecionada?.velocidade_m2_h, 
          maquinaSelecionada?.eficiencia_percent,
          maquinaSelecionada?.setup_min,
          form.watch(`itens_produto.${itemIndex}.area_produto`), 
          form.watch(`itens_produto.${itemIndex}.quantidade_produto`)
        ]);

        // Usar horas calculadas automaticamente ou horas manuais
        const horasFinais = isManual ? horasUtilizadas : horasCalculadas;
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
                name={`itens_produto.${itemIndex}.maquinas.${maquinaIndex}.horas_utilizadas`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Utilizadas</FormLabel>
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