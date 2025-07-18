'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CustoIndiretoForm from '../../custo-indireto-form';
import { toast } from 'sonner';

interface CustoIndireto {
  id: string;
  nome: string;
  categoria: string;
  valor_mensal: number;
  observacoes?: string;
}

export default function EditarCustoIndiretoPage() {
  const [custoIndireto, setCustoIndireto] = useState<CustoIndireto | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const fetchCustoIndireto = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast.error('Token de autenticação não encontrado');
          return;
        }

        const response = await fetch(`http://localhost:3001/custos-indiretos/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao carregar custo indireto');
        }

        const data = await response.json();
        setCustoIndireto(data);
      } catch (error) {
        console.error('Erro:', error);
        toast.error('Erro ao carregar custo indireto');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCustoIndireto();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!custoIndireto) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-red-500">Custo indireto não encontrado</p>
        </div>
      </div>
    );
  }

  return <CustoIndiretoForm custoIndireto={custoIndireto} />;
} 