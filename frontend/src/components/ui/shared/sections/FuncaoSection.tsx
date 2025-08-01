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
import { Funcao } from '../types/common.types';

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
        const custoCalculado = funcaoSelecionada ? funcaoSelecionada.custo_hora * horasTrabalhadas : 0;
        
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
                        placeholder="0.00"
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
                  onClick={() => handleRemoveFuncao(funcaoIndex)}
                  className="text-red-500 hover:text-red-700"
                  disabled={form.watch(`itens_produto.${itemIndex}.funcoes`)?.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Custo calculado */}
            {funcaoSelecionada && horasTrabalhadas > 0 && custoCalculado > 0 && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div>Custo: {formatCurrency(custoCalculado)} ({formatCurrency(funcaoSelecionada.custo_hora)} por hora)</div>
                    <div className="text-green-700 mt-1 font-medium">
                      {funcaoSelecionada.nome} • {horasTrabalhadas}h
                      {funcaoSelecionada.maquina && ` • ${funcaoSelecionada.maquina.nome}`}
                    </div>
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