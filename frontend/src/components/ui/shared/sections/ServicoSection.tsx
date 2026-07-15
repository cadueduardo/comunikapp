'use client';

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
import { ServicoManual } from '../types/common.types';
import { useState } from 'react';
import { formatTimeDisplay } from '@/components/ui/time-input';
import { formatarTempoHumano, parseTempoHumano } from '@/lib/tempo-formatador';

interface ServicoSectionProps {
  variant?: 'orcamento' | 'produto';
  itemIndex: number;
  servicos: ServicoManual[];
  onAddServico?: (itemIndex: number) => void;
  onRemoveServico?: (itemIndex: number, servicoIndex: number) => void;
  customFields?: React.ReactNode;
  customActions?: React.ReactNode;
}

export function ServicoSection({ 
  itemIndex,
  servicos,
  onAddServico,
  onRemoveServico,
  customFields,
  customActions
}: ServicoSectionProps) {
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
  const servicosData =
    (useWatch({
      control: form.control,
      name: `itens_produto.${itemIndex}.servicos`,
    }) as Array<{ origem?: string }> | undefined) || [];

  const servicosEditaveis = servicosData
    .map((servico, servicoIndex) => ({ servico, servicoIndex }))
    .filter(
      ({ servico }) => servico?.origem !== 'ARTE_AUTOMATICA',
    );
  
  // Usar watch para obter todos os valores de uma vez
  const allFormValues = useWatch({ control: form.control });

  const handleAddServico = () => {
    if (onAddServico) {
      onAddServico(itemIndex);
    } else {
      const currentServicos = form.getValues(`itens_produto.${itemIndex}.servicos`) || [];
      const editaveis = currentServicos.filter(
        (s: { origem?: string }) => s?.origem !== 'ARTE_AUTOMATICA',
      );
      const hasEmpty = editaveis.some(
        (s: { servico_id?: string; horas_trabalhadas?: string }) =>
          !s.servico_id || !s.horas_trabalhadas,
      );
      if (!hasEmpty) {
        const newServicos = [
          ...currentServicos,
          { servico_id: '', horas_trabalhadas: '1', origem: 'MANUAL' },
        ];
        form.setValue(`itens_produto.${itemIndex}.servicos`, newServicos, {
          shouldDirty: true,
        });
      }
    }
  };

  const handleRemoveServico = (servicoIndex: number) => {
    if (onRemoveServico) {
      onRemoveServico(itemIndex, servicoIndex);
    } else {
      const currentServicos = form.getValues(`itens_produto.${itemIndex}.servicos`) || [];
      if (currentServicos.length > 1) {
        const newServicos = currentServicos.filter((_: unknown, index: number) => index !== servicoIndex);
        form.setValue(`itens_produto.${itemIndex}.servicos`, newServicos);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium">Serviços Manuais</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddServico}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Serviço
        </Button>
      </div>
      
      {servicosEditaveis.map(({ servico, servicoIndex }) => {
        const servicoSelecionado = servicos.find(s => s.id === servico.servico_id);
        const horasTrabalhadas = Number(String(servico.horas_trabalhadas).replace(',', '.')) || 0;

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
        const calcularHorasServico = () => {
          if (!servicoSelecionado) return { horasCalculadas: 0, disclaimer: '', isManual: true };

          const areaM2 = toNumber(allFormValues?.itens_produto?.[itemIndex]?.area_produto) || 0;
          const qtd = toNumber(allFormValues?.itens_produto?.[itemIndex]?.quantidade_produto) || 1;
          const areaTotal = areaM2 * qtd;
          
          const effPercent = toNumber(servicoSelecionado.eficiencia_percent) || 100;
          const effDecimal = effPercent / 100; // Converter % para decimal (70% = 0.70)
          const fatorEficiencia = 1 / Math.max(effDecimal, 0.05); // 70% = 0.70 → 1/0.70 = 1.43
          
          let horasAuto = 0;
          let disclaimerTexto = '';
          let manual = true;

          switch (servicoSelecionado.tipo_calculo) {
            case 'POR_M2':
              if (servicoSelecionado.horas_por_m2 && areaTotal > 0) {
                const horasM2 = toNumber(servicoSelecionado.horas_por_m2);
                const horasBase = areaTotal * horasM2;
                horasAuto = horasBase * fatorEficiencia;
                disclaimerTexto = `${areaTotal.toFixed(2)}m² × ${horasM2.toFixed(3)}h com ${effPercent}% eficiência = ${formatarTempoHumano(horasAuto)}`;
                manual = false;
              }
              break;
              
            case 'POR_UNIDADE':
              if (servicoSelecionado.horas_por_unidade && qtd > 0) {
                const horasUn = toNumber(servicoSelecionado.horas_por_unidade);
                const horasBase = qtd * horasUn;
                horasAuto = horasBase * fatorEficiencia;
                disclaimerTexto = `${qtd} un × ${horasUn.toFixed(3)}h com ${effPercent}% eficiência = ${formatarTempoHumano(horasAuto)}`;
                manual = false;
              }
              break;
              
            case 'POR_PECA_COM_CATEGORIA':
              if (servicoSelecionado.categorias && servicoSelecionado.categorias.length > 0) {
                // Encontrar categoria baseada na área individual
                const categoria = servicoSelecionado.categorias.find(cat => areaM2 <= cat.ate_m2) || 
                                 servicoSelecionado.categorias[servicoSelecionado.categorias.length - 1];
                
                // Debug removido - correção aplicada
                
                if (categoria) {
                  let tempoMin = 0;
                  
                  // Converter tempo_min para minutos se necessário
                  if (typeof categoria.tempo_min === 'number') {
                    // CORREÇÃO: Se o valor for muito alto (> 500), provavelmente está em formato incorreto
                    if (categoria.tempo_min > 500) {
                      tempoMin = categoria.tempo_min / 60; // Converter de formato incorreto para minutos
                    } else {
                      tempoMin = categoria.tempo_min; // Já são minutos
                    }
                  } else if (typeof categoria.tempo_min === 'string' && categoria.tempo_min.includes(':')) {
                    // Converter HH:MM para minutos
                    const [horas, minutos] = categoria.tempo_min.split(':').map(Number);
                    tempoMin = (horas * 60) + minutos;
                  } else {
                    tempoMin = toNumber(categoria.tempo_min);
                  }
                  
                  // Cálculo: quantidade × tempo_min + setup_min, aplicando eficiência
                  const horasBase = (qtd * tempoMin) / 60; // Converter minutos para horas
                  const setupMin = toNumber(servicoSelecionado.setup_min) || 0;
                  const horasSetup = setupMin / 60;
                  horasAuto = (horasBase + horasSetup) * fatorEficiencia;
                  
                  // Validação final para garantir valores razoáveis
                  if (horasAuto > 1000) {
                    console.warn('⚠️ Valor muito alto detectado, limitando a 100 horas.');
                    horasAuto = 100;
                  }
                  
                  disclaimerTexto = `Categoria "${categoria.nome}": ${qtd} × ${tempoMin}min + ${setupMin}min setup com ${effPercent}% eficiência = ${formatarTempoHumano(horasAuto)}`;
                  manual = false;
                }
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
        };

        const { horasCalculadas, disclaimer, isManual } = calcularHorasServico();

        // Usar horas calculadas automaticamente ou horas manuais
        const horasFinais = isManual ? horasTrabalhadas : horasCalculadas;
        const custoCalculado = servicoSelecionado ? converterValor(servicoSelecionado.custo_hora) * horasFinais : 0;
        
        return (
          <div key={servicoIndex} className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <FormField
                control={form.control}
                name={`itens_produto.${itemIndex}.servicos.${servicoIndex}.servico_id`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço Manual</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o serviço" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {servicos.map((servico) => (
                          <SelectItem key={servico.id} value={servico.id}>
                            {servico.nome}
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
                name={`itens_produto.${itemIndex}.servicos.${servicoIndex}.horas_trabalhadas`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Trabalhadas</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="0h00m"
                        value={
                          focusedIndex === servicoIndex
                            ? (digitosLocais[servicoIndex] ?? formatarTempoHumano(Number(field.value) || 0))
                            : formatarTempoHumano(Number(field.value) || 0)
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setDigitosLocais((prev) => ({ ...prev, [servicoIndex]: val }));
                          field.onChange(parseTempoHumano(val));
                        }}
                        onFocus={() => {
                          setFocusedIndex(servicoIndex);
                          setDigitosLocais((prev) => ({
                            ...prev,
                            [servicoIndex]: formatarTempoHumano(Number(field.value) || 0),
                          }));
                        }}
                        onBlur={() => {
                          setFocusedIndex(null);
                          setDigitosLocais((prev) => {
                            const n = { ...prev };
                            delete n[servicoIndex];
                            return n;
                          });
                        }}
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
                  onClick={() => handleRemoveServico(servicoIndex)}
                  className="text-red-500 hover:text-red-700"
                  disabled={servicosEditaveis.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Custo calculado */}
            {servicoSelecionado && horasFinais > 0 && custoCalculado > 0 && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div>Custo: {formatCurrency(custoCalculado)} ({formatCurrency(converterValor(servicoSelecionado.custo_hora))} por hora)</div>
                    <div className="text-green-700 mt-1 font-medium">
                      {servicoSelecionado.nome} • {formatarTempoHumano(horasFinais)}
                      {servicoSelecionado.tipo_calculo && (
                        <span className="ml-2 text-xs">
                          ({servicoSelecionado.tipo_calculo.replace('_', ' ').toLowerCase()})
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
