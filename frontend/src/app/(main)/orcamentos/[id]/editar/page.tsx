'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { OrcamentoForm } from '@/components/ui/orcamento';
import { ChatFlutuante } from '@/components/ui/chat-flutuante';
import { orcamentosApi } from '@/lib/api-client';

export default function EditarOrcamentoPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orcamentoData, setOrcamentoData] = useState<Record<string, unknown> | null>(null);
  const [orcamentoStatus, setOrcamentoStatus] = useState<string>('');

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

      const data = await orcamentosApi.getById(orcamentoId, token);
      console.log('🔍 Debug - Dados do orçamento carregados:', data);
      console.log('🔍 Debug - Status do orçamento:', data.status);
      setOrcamentoData(data);
      setOrcamentoStatus(data.status || '');
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error);
      toast.error('Erro ao carregar dados do orçamento');
      router.push('/orcamentos');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !orcamentoData) {
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
    <>
      <OrcamentoForm
        mode="editar"
        initialData={orcamentoData}
        orcamentoId={orcamentoId}
        orcamentoStatus={orcamentoStatus}
      />
      {/* Exibir chat de negociação se o status for 'enviado' ou 'negociando' */}
      {(orcamentoStatus === 'enviado' || orcamentoStatus === 'negociando') && orcamentoId && (
        <ChatFlutuante orcamentoId={orcamentoId} />
      )}
    </>
  );
} 