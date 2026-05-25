'use client';

import { useState } from 'react';
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
import { AlertTriangle, Clock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { postEstimarTempoMaquina } from '@/lib/estimativa-tempo-api';
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
  const [estimandoKey, setEstimandoKey] = useState<string | null>(null);
  const [ultimaEstimativa, setUltimaEstimativa] = useState<Record<string, string>>({});
  
  // Hooks devem ser chamados sempre na mesma ordem - movidos para fora do map
  const maquinasData = useWatch({ control: form.control, name: `itens_produto.${itemIndex}.maquinas` }) || [];
  const areaM2 = useWatch({ control: form.control, name: `itens_produto.${itemIndex}.area_produto` });
  const perimetroProduto = useWatch({ control: form.control, name: `itens_produto.${itemIndex}.perimetro_produto` });
  const quantidade = useWatch({ control: form.control, name: `itens_produto.${itemIndex}.quantidade_produto` });
  
  // Usar watch para obter todos os valores de uma vez
  const allFormValues = useWatch({ control: form.control });

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

  const handleEstimarTempo = async (maquinaIndex: number) => {
    const maquina = form.getValues(`itens_produto.${itemIndex}.maquinas.${maquinaIndex}`);
    if (!maquina?.maquina_id) {
      toast.info('Selecione uma máquina antes de estimar o tempo.');
      return;
    }

    const area = converterValor(areaM2);
    const perimetro = converterValor(perimetroProduto);
    const quantidadeProduto = converterValor(quantidade) || 1;
    const key = `${itemIndex}-${maquinaIndex}`;
    const assinatura = [
      maquina.maquina_id,
      area.toFixed(4),
      perimetro.toFixed(2),
      quantidadeProduto.toFixed(4),
    ].join('|');

    setEstimandoKey(key);
    try {
      const resultado = await postEstimarTempoMaquina({
        maquina_id: maquina.maquina_id,
        quantidade: quantidadeProduto,
        area_m2: area > 0 ? area : undefined,
        perimetro_mm: perimetro > 0 ? perimetro : undefined,
      });

      if (resultado.estimativa_possivel) {
        form.setValue(
          `itens_produto.${itemIndex}.maquinas.${maquinaIndex}.horas_utilizadas`,
          String(resultado.tempo_horas),
          { shouldDirty: true, shouldValidate: true },
        );
        setUltimaEstimativa((prev) => ({
          ...prev,
          [key]: assinatura,
        }));
        toast.success(`Tempo estimado: ${resultado.tempo_horas}h`);
        return;
      }

      toast.info(
        resultado.detalhamento?.mensagens?.[0] ||
          'Não foi possível estimar automaticamente. Informe o tempo manualmente.',
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao estimar tempo de máquina.',
      );
    } finally {
      setEstimandoKey(null);
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
        const isManual = true;

        if (maquinaSelecionada && maquinaSelecionada.modo_producao === 'M2_H' && velocidadeM2H > 0 && areaTotal > 0) {
          const horasBase = areaTotal / velocidadeM2H;
          const fatorEficiencia = 100 / eficienciaPercent;
          horasCalculadas = horasBase * fatorEficiencia + horasSetup;
          disclaimer = `${areaTotal.toFixed(2)}m² ÷ ${velocidadeM2H.toFixed(2)}m²/h × (100 ÷ ${eficienciaPercent}%) + ${setupMin}min setup = ${horasCalculadas.toFixed(2)}h`;
        } else if (maquinaSelecionada && maquinaSelecionada.modo_producao === 'ML_H') {
          disclaimer = 'Modo linear (ML/H): use Estimar para calcular pelo perímetro.';
        } else {
          disclaimer = 'Horas inseridas manualmente';
        }

        const fieldPath = `itens_produto.${itemIndex}.maquinas.${maquinaIndex}.horas_utilizadas`;
        const horasFieldValue = allFormValues?.itens_produto?.[itemIndex]?.maquinas?.[maquinaIndex]?.horas_utilizadas || '';
        const displayValue = isManual ? (horasFieldValue ?? '') : horasCalculadas.toFixed(2);

        const horasFinais = Number(displayValue) || 0;
        const custoCalculado = maquinaSelecionada ? converterValor(maquinaSelecionada.custo_hora) * horasFinais : 0;
        const assinaturaAtual = [
          maquina.maquina_id,
          converterValor(areaM2).toFixed(4),
          converterValor(perimetroProduto).toFixed(2),
          quantidadeValue.toFixed(4),
        ].join('|');
        const estimativaDesatualizada =
          Boolean(maquina.maquina_id) &&
          horasFinais > 0 &&
          Boolean(ultimaEstimativa[`${itemIndex}-${maquinaIndex}`]) &&
          ultimaEstimativa[`${itemIndex}-${maquinaIndex}`] !== assinaturaAtual;

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
              
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleEstimarTempo(maquinaIndex)}
                  disabled={
                    !maquina.maquina_id ||
                    (maquinaSelecionada?.modo_producao === 'ML_H'
                      ? converterValor(perimetroProduto) <= 0
                      : converterValor(areaM2) <= 0) ||
                    estimandoKey === `${itemIndex}-${maquinaIndex}`
                  }
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Estimar
                </Button>
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

            {estimativaDesatualizada && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  A geometria ou quantidade mudou. Clique em Estimar para atualizar
                  o tempo desta máquina.
                </span>
              </div>
            )}
            
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
