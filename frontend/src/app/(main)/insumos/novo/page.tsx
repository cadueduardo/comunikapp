'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { InsumoForm, InsumoFormValues } from '../insumo-form';

export default function NovoInsumoPage() {
  const router = useRouter();

  const handleSave = async (data: InsumoFormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const custo = typeof data.custo_unitario === 'string' 
        ? parseFloat(data.custo_unitario) 
        : data.custo_unitario;
        
      const response = await fetch('http://localhost:3001/insumos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          custo_unitario: custo,
          estoque_minimo: data.estoque_minimo ? Number(data.estoque_minimo) : undefined,
        }),
      });

      if (response.ok) {
        toast.success('Insumo criado com sucesso!');
        router.push('/insumos');
      } else {
        const errorData = await response.json();
        toast.error(`Falha ao criar insumo: ${errorData.message}`);
      }
    } catch (error) {
      toast.error('Ocorreu um erro ao conectar com o servidor.');
      console.error(error);
    }
  };

  return (
    <div className="p-6">
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