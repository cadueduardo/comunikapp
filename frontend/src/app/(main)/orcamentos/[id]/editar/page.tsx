'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { OrcamentoForm } from '@/components/ui/orcamento';

export default function EditarOrcamentoPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orcamentoData, setOrcamentoData] = useState<Record<string, unknown> | null>(null);

  const orcamentoId = params?.id as string;

  // Buscar dados do orçamento
  useEffect(() => {
    if (orcamentoId) {
      fetchOrcamentoData();
    }
  }, [orcamentoId]);

  const fetchOrcamentoData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de acesso não encontrado');
        return;
      }

      const response = await fetch(`http://localhost:3001/orcamentos/${orcamentoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrcamentoData(data);
      } else {
        toast.error('Erro ao carregar dados do orçamento');
        router.push('/orcamentos');
      }
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error);
      toast.error('Erro ao carregar dados do orçamento');
      router.push('/orcamentos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  return (
    <OrcamentoForm
      mode="editar"
      initialData={orcamentoData}
      orcamentoId={orcamentoId}
    />
  );
} 