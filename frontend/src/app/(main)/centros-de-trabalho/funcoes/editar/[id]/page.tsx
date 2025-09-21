'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React from 'react';
import { FuncaoForm, FuncaoFormValues } from '../../../../configuracoes/funcoes/funcao-form';
import { funcoesApi } from '@/lib/api-client';
import { parseTimeValue, formatTimeDisplay } from '@/components/ui/time-input';

interface Funcao {
  id: string;
  nome: string;
  custo_hora: number | string;
  descricao?: string;
  maquina_id?: string;
  tipo_calculo?: 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'MANUAL';
  fator_acompanhamento?: number | string;
  horas_por_m2?: number | string;
  horas_por_unidade?: number | string;
  eficiencia_percent?: number | string;
  setup_min?: number | string;
}

export default function EditarFuncaoCTPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [registro, setRegistro] = useState<Funcao | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { id } = React.use(params);

  useEffect(() => {
    fetchRegistro();
  }, [id]);

  const fetchRegistro = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const data = await funcoesApi.getById(id, token);
      setRegistro(data);
    } catch (error) {
      console.error('Erro ao buscar função:', error);
      toast.error('Erro ao carregar dados da função');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: FuncaoFormValues) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }
      // Transformar dados para o formato esperado pelo backend
      const transformedData = {
        ...data,
        // Converter valores de tempo mascarados para horas decimais
        horas_por_m2: data.horas_por_m2 ? parseTimeValue(data.horas_por_m2) : undefined,
        horas_por_unidade: data.horas_por_unidade ? parseTimeValue(data.horas_por_unidade) : undefined,
        setup_min: data.setup_min ? parseTimeValue(data.setup_min) * 60 : undefined, // Converter para minutos
        // Converter porcentagens para decimais se necessário
        fator_acompanhamento: data.fator_acompanhamento ? Number(String(data.fator_acompanhamento).replace(',', '.')) : undefined,
        eficiencia_percent: data.eficiencia_percent ? Number(String(data.eficiencia_percent).replace(',', '.')) : undefined,
        // Garantir que custo_hora seja número
        custo_hora: Number(String(data.custo_hora).replace(/[^0-9,-]/g, '').replace(',', '.'))
      };

      console.log('Dados transformados para backend (edição):', transformedData); // DEBUG

      await funcoesApi.update(id, transformedData, token);
      toast.success('Função atualizada com sucesso!');
      router.push('/centros-de-trabalho/funcoes');
    } catch (error) {
      console.error('Erro ao atualizar função:', error);
      toast.error('Erro ao atualizar função');
    } finally {
      setSubmitting(false);
    }
  };

  const formInitialData = registro ? {
    nome: registro.nome,
    custo_hora: typeof registro.custo_hora === 'string' ? parseFloat(registro.custo_hora) : registro.custo_hora,
    descricao: registro.descricao || '',
    maquina_id: registro.maquina_id || 'null',
    tipo_calculo: registro.tipo_calculo || 'MANUAL',
    fator_acompanhamento: registro.fator_acompanhamento || '',
    // Converter horas decimais para HH:MM para exibição
    horas_por_m2: registro.horas_por_m2 ? formatTimeDisplay(registro.horas_por_m2) : '',
    horas_por_unidade: registro.horas_por_unidade ? formatTimeDisplay(registro.horas_por_unidade) : '',
    setup_min: registro.setup_min ? formatTimeDisplay(registro.setup_min / 60) : '', // Converter minutos para horas
    eficiencia_percent: registro.eficiencia_percent || '',
  } : undefined;

  if (loading) {
    return <div className="p-6">Carregando dados...</div>;
  }
  
  if (!registro) {
    return <div className="p-6">Registro não encontrado.</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editar Função</h1>
        <p className="text-gray-600 mt-1">Atualize os dados da função.</p>
      </div>
      <FuncaoForm onSave={handleSubmit} initialData={formInitialData} />
    </div>
  );
}


