'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React from 'react';
import { MaquinaForm, MaquinaFormValues } from '../../../../configuracoes/maquinas/maquina-form';
import { maquinasApi } from '@/lib/api-client';

interface Maquina {
  id: string;
  nome: string;
  tipo: string;
  custo_hora: number | string;
  status: string;
  capacidade?: string;
  observacoes?: string;
  modo_producao?: 'M2_H' | 'ML_H' | 'MANUAL';
  velocidade_m2_h?: number | string;
  eficiencia_percent?: number | string;
  setup_min?: number | string;
}

export default function EditarMaquinaCTPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [maquina, setMaquina] = useState<Maquina | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { id } = React.use(params);

  useEffect(() => {
    fetchMaquina();
  }, [id]);

  const fetchMaquina = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const data = await maquinasApi.getById(id, token);
      setMaquina(data);
    } catch (error) {
      console.error('Erro ao buscar máquina:', error);
      toast.error('Erro ao carregar dados da máquina');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: MaquinaFormValues) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      let custo: number;
      if (typeof data.custo_hora === 'string') {
        const cleanValue = data.custo_hora.replace(/[^\d.,]/g, '');
        custo = parseFloat(cleanValue.replace(',', '.'));
      } else {
        custo = data.custo_hora;
      }

      if (isNaN(custo) || custo <= 0) {
        toast.error('O custo por hora deve ser um valor válido maior que zero.');
        return;
      }

      await maquinasApi.update(id, { ...data, custo_hora: custo }, token);
      toast.success('Máquina atualizada com sucesso!');
      router.push('/centros-de-trabalho/maquinas');
    } catch (error) {
      console.error('Erro ao atualizar máquina:', error);
      toast.error('Erro ao atualizar máquina');
    } finally {
      setSubmitting(false);
    }
  };

  const formInitialData = maquina ? {
    nome: maquina.nome,
    tipo: maquina.tipo,
    custo_hora: typeof maquina.custo_hora === 'string' ? parseFloat(maquina.custo_hora) : maquina.custo_hora,
    status: maquina.status,
    capacidade: maquina.capacidade || '',
    observacoes: maquina.observacoes || '',
    modo_producao: maquina.modo_producao,
    velocidade_m2_h: maquina.velocidade_m2_h || '',
    eficiencia_percent: maquina.eficiencia_percent || '',
    setup_min: maquina.setup_min || '',
  } : undefined;

  if (loading) {
    return <div className="p-6">Carregando dados da máquina...</div>;
  }
  
  if (!maquina) {
    return <div className="p-6">Máquina não encontrada.</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editar Máquina</h1>
        <p className="text-gray-600 mt-1">Atualize os dados da máquina.</p>
      </div>
      <MaquinaForm onSave={handleSubmit} initialData={formInitialData} />
    </div>
  );
}


