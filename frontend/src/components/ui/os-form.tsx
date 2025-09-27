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
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';

const osSchema = z.object({
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  nome_servico: z.string().min(1, 'Nome do serviço é obrigatório'),
  descricao: z.string().optional(),
  quantidade: z.number().min(0.001, 'Quantidade deve ser maior que zero'),
  data_prazo: z.string().optional(),
  responsavel_id: z.string().optional(),
  observacoes: z.string().optional(),
});

type OSFormData = z.infer<typeof osSchema>;

interface OSFormProps {
  mode: 'novo' | 'editar';
  osId?: string;
  initialData?: Partial<OSFormData>;
}

export function OSForm({ mode, osId, initialData }: OSFormProps) {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OSFormData>({
    resolver: zodResolver(osSchema),
    defaultValues: initialData || {
      quantidade: 1,
    },
  });

  const onSubmit = async (data: OSFormData) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'novo') {
        await apiRequest('/os', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        toast.success('Ordem de serviço criada com sucesso!');
        router.push('/os');
      } else {
        await apiRequest(`/os/${osId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        toast.success('Ordem de serviço atualizada com sucesso!');
        router.push('/os');
      }
    } catch (error) {
      console.error('Erro ao salvar OS:', error);
      toast.error('Erro ao salvar ordem de serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente *</Label>
              <Input
                id="cliente_id"
                {...register('cliente_id')}
                placeholder="ID do cliente"
                className={errors.cliente_id ? 'border-red-500' : ''}
              />
              {errors.cliente_id && (
                <p className="text-sm text-red-500">{errors.cliente_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_servico">Nome do Serviço *</Label>
              <Input
                id="nome_servico"
                {...register('nome_servico')}
                placeholder="Ex: Banner 3x2m"
                className={errors.nome_servico ? 'border-red-500' : ''}
              />
              {errors.nome_servico && (
                <p className="text-sm text-red-500">{errors.nome_servico.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Descrição detalhada do serviço"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.001"
                {...register('quantidade', { valueAsNumber: true })}
                placeholder="1"
                className={errors.quantidade ? 'border-red-500' : ''}
              />
              {errors.quantidade && (
                <p className="text-sm text-red-500">{errors.quantidade.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_prazo">Data Prazo</Label>
              <Input
                id="data_prazo"
                type="datetime-local"
                {...register('data_prazo')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel_id">Responsável</Label>
            <Input
              id="responsavel_id"
              {...register('responsavel_id')}
              placeholder="ID do responsável"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Observações adicionais"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : mode === 'novo' ? 'Criar OS' : 'Atualizar OS'}
        </Button>
      </div>
    </form>
  );
}
