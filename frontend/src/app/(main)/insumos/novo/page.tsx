'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { InsumoForm, InsumoFormValues } from '../insumo-form';
import { insumosApi } from '@/lib/api-client';

export default function NovoInsumoPage() {
  const router = useRouter();

  const handleSave = async (data: InsumoFormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      const custo = typeof data.custo_unitario === 'string' 
        ? parseFloat(data.custo_unitario) 
        : data.custo_unitario;
        
      const toNonNegativeNumber = (value: unknown): number | undefined => {
        if (value === '' || value === null || value === undefined) return undefined;
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return undefined;
        return parsed < 0 ? 0 : parsed;
      };

      await insumosApi.create({
        ...data,
        custo_unitario: custo,
        estoque_minimo: toNonNegativeNumber(data.estoque_minimo),
        estoque_quantidade_inicial: toNonNegativeNumber(data.estoque_quantidade_inicial),
        estoque_maximo: toNonNegativeNumber(data.estoque_maximo),
      }, token);
      
      toast.success('Insumo criado com sucesso!');
      router.push('/insumos');
    } catch (error) {
      toast.error('Ocorreu um erro ao conectar com o servidor.');
      console.error(error);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Adicionar Novo Insumo</h1>
        <p className="text-gray-600 mt-1">
          Preencha os detalhes do novo insumo abaixo.
        </p>
      </div>
      <InsumoForm onSave={handleSave} />
    </div>
  );
} 
