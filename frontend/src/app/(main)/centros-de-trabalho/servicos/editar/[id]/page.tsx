'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React from 'react';
import ServicoManualForm, { ServicoManualFormValues } from '../../novo/servico-manual-form';
import { servicosManuaisApi } from '@/lib/api-client';

interface ServicoManual {
  id: string;
  nome: string;
  tipo_calculo?: 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'MANUAL';
  horas_por_m2?: number | string;
  horas_por_unidade?: number | string;
  eficiencia_percent?: number | string;
  custo_hora?: number | string;
  descricao?: string;
}

export default function EditarServicoManualCTPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [registro, setRegistro] = useState<ServicoManual | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { id } = React.use(params);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const data = await servicosManuaisApi.getById(id, token);
        setRegistro(data);
      } catch (e) {
        toast.error('Erro ao carregar serviço manual');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async (data: ServicoManualFormValues) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      if (!token) { toast.error('Token não encontrado'); return; }
      await servicosManuaisApi.update(id, data as any, token);
      toast.success('Serviço manual atualizado!');
      router.push('/centros-de-trabalho/servicos');
    } catch (e) {
      toast.error('Erro ao atualizar serviço manual');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!registro) return <div className="p-6">Registro não encontrado.</div>;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editar Serviço Manual</h1>
        <p className="text-gray-600 mt-1">Atualize os parâmetros do serviço.</p>
      </div>
      <ServicoManualForm onSave={handleSave} initialData={registro} />
    </div>
  );
}


