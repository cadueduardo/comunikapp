'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CustoIndiretoForm } from '../custo-indireto-form';

export default function NovoCustoIndiretoPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values: { nome: string; valor_mensal: string; categoria: string; regra_rateio: string; observacoes?: string }) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token não encontrado');
        return;
      }

      const payload = {
        nome: values.nome,
        valor_mensal: parseFloat(values.valor_mensal),
        categoria: values.categoria,
        regra_rateio: values.regra_rateio,
        observacoes: values.observacoes,
      };

      const response = await fetch('http://localhost:3001/custos-indiretos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar custo indireto');
      }

      toast.success('Custo indireto criado com sucesso!');
      router.push('/configuracoes/custos-indiretos');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar custo indireto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Novo Custo Indireto</h1>
        <p className="text-gray-600 mt-1">
          Adicione um novo custo indireto e configure suas regras de rateio.
        </p>
      </div>

      <CustoIndiretoForm
        onSubmit={handleSubmit}
        isSubmitting={loading}
        defaultValues={{
          ativo: true,
          regra_rateio: 'PROPORCIONAL_TEMPO',
        }}
      />
    </div>
  );
} 