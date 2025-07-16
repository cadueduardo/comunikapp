'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  valor_mensal: z.number().min(0.01, 'Valor deve ser maior que zero'),
  categoria: z.enum(['LOCACAO', 'SERVICOS', 'MANUTENCAO', 'OUTROS']),
  ativo: z.boolean(),
  regra_rateio: z.enum(['PROPORCIONAL_TEMPO', 'PROPORCIONAL_VALOR', 'FIXO']),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CustoIndiretoFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
  defaultValues?: Partial<FormData>;
}

const categoriaOptions = [
  { value: 'LOCACAO', label: 'Locação' },
  { value: 'SERVICOS', label: 'Serviços' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'OUTROS', label: 'Outros' },
];

const regraRateioOptions = [
  { value: 'PROPORCIONAL_TEMPO', label: 'Proporcional ao Tempo' },
  { value: 'PROPORCIONAL_VALOR', label: 'Proporcional ao Valor' },
  { value: 'FIXO', label: 'Valor Fixo' },
];

export function CustoIndiretoForm({ onSubmit, isSubmitting, defaultValues }: CustoIndiretoFormProps) {
  const [valorInput, setValorInput] = useState(defaultValues?.valor_mensal?.toString() || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ativo: true,
      regra_rateio: 'PROPORCIONAL_TEMPO',
      ...defaultValues,
    },
  });

  const ativo = watch('ativo');

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Erro ao salvar custo indireto:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Custo Indireto *</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Ex: Aluguel, Luz, Internet..."
            />
            {errors.nome && (
              <p className="text-sm text-red-500">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_mensal">Valor Mensal (R$) *</Label>
            <CustomCurrencyInput
              id="valor_mensal"
              value={valorInput}
              onValueChange={(value) => {
                setValorInput(value);
                const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
                if (!isNaN(numericValue)) {
                  setValue('valor_mensal', numericValue);
                }
              }}
              placeholder="0,00"
            />
            {errors.valor_mensal && (
              <p className="text-sm text-red-500">{errors.valor_mensal.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select
              value={watch('categoria')}
              onValueChange={(value) => setValue('categoria', value as 'LOCACAO' | 'SERVICOS' | 'MANUTENCAO' | 'OUTROS')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriaOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoria && (
              <p className="text-sm text-red-500">{errors.categoria.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Rateio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="regra_rateio">Regra de Rateio *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  <div className="p-2 text-xs max-w-xs">
                    <b>Proporcional ao Tempo:</b> Rateia o custo conforme as horas de produção do orçamento.<br/>
                    <b>Proporcional ao Valor:</b> Rateia conforme o valor total do orçamento.<br/>
                    <b>Valor Fixo:</b> Aplica um valor fixo por orçamento, independente do tempo ou valor.
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={watch('regra_rateio')}
              onValueChange={(value) => setValue('regra_rateio', value as 'PROPORCIONAL_TEMPO' | 'PROPORCIONAL_VALOR' | 'FIXO')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma regra de rateio" />
              </SelectTrigger>
              <SelectContent>
                {regraRateioOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.regra_rateio && (
              <p className="text-sm text-red-500">{errors.regra_rateio.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ativo">Custo Ativo</Label>
            <Select
              value={ativo ? 'true' : 'false'}
              onValueChange={(value) => setValue('ativo', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Informações adicionais sobre este custo indireto..."
              rows={3}
            />
            {errors.observacoes && (
              <p className="text-sm text-red-500">{errors.observacoes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Custo Indireto'}
        </Button>
      </div>
    </form>
  );
} 