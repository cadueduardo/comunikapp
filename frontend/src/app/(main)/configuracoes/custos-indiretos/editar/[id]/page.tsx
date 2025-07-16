'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CustoIndiretoForm } from '../../custo-indireto-form';
import { use } from 'react';

interface CustoIndireto {
  id: string;
  nome: string;
  valor_mensal: number;
  categoria: 'LOCACAO' | 'SERVICOS' | 'MANUTENCAO' | 'OUTROS';
  ativo: boolean;
  regra_rateio: 'PROPORCIONAL_TEMPO' | 'PROPORCIONAL_VALOR' | 'FIXO';
  observacoes?: string;
}

export default function EditarCustoIndiretoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [custoIndireto, setCustoIndireto] = useState<CustoIndireto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCustoIndireto = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast.error('Sessão expirada. Faça login novamente.');
          return;
        }

        const response = await fetch(`http://localhost:3001/custos-indiretos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setCustoIndireto(data);
        } else {
          toast.error('Erro ao carregar custo indireto');
          router.push('/configuracoes/custos-indiretos');
        }
      } catch (error) {
        console.error('Erro ao buscar custo indireto:', error);
        toast.error('Erro ao carregar custo indireto');
        router.push('/configuracoes/custos-indiretos');
      } finally {
        setLoading(false);
      }
    };

    fetchCustoIndireto();
  }, [id, router]);

  const handleSubmit = async (data: Omit<CustoIndireto, 'id'>) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await fetch(`http://localhost:3001/custos-indiretos/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Custo indireto atualizado com sucesso!');
        router.push('/configuracoes/custos-indiretos');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao atualizar custo indireto');
      }
    } catch (error) {
      console.error('Erro ao atualizar custo indireto:', error);
      toast.error('Erro ao atualizar custo indireto');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!custoIndireto) {
    return (
      <div className="p-6">
        <p>Custo indireto não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editar Custo Indireto</h1>
        <p className="text-gray-600 mt-1">
          Edite as informações do custo indireto e suas regras de rateio.
        </p>
      </div>

      <CustoIndiretoForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        defaultValues={custoIndireto}
      />
    </div>
  );
} 