'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React from 'react';
import { MaquinaForm, MaquinaFormValues } from '../../maquina-form';
import { maquinasApi } from '@/lib/api-client';
import { parseTimeValue, formatTimeDisplay } from '@/components/ui/time-input';

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
  setor_id?: string | null;
  usar_no_pcp?: boolean;
  horas_disponiveis_dia?: number | string | null;
  permite_agendamento_simultaneo?: boolean;
  tempo_minimo_entre_servicos_min?: number | string | null;
  considerar_eficiencia_na_capacidade?: boolean;
}

export default function EditarMaquinaPage({ params }: { params: Promise<{ id: string }> }) {
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

      // Converter o custo_hora corretamente
      let custo: number;
      if (typeof data.custo_hora === 'string') {
        // Remove todos os caracteres não numéricos exceto ponto e vírgula
        const cleanValue = data.custo_hora.replace(/[^\d.,]/g, '');
        // Substitui vírgula por ponto e converte para número
        custo = parseFloat(cleanValue.replace(',', '.'));
      } else {
        custo = data.custo_hora;
      }

      // Validar se o custo é um número válido
      if (isNaN(custo) || custo <= 0) {
        toast.error('O custo por hora deve ser um valor válido maior que zero.');
        return;
      }

      const transformedData = {
        ...data,
        custo_hora: custo,
        setup_min: data.setup_min ? parseTimeValue(data.setup_min) * 60 : undefined,
        velocidade_m2_h: data.velocidade_m2_h
          ? Number(String(data.velocidade_m2_h).replace(',', '.'))
          : undefined,
        eficiencia_percent: data.eficiencia_percent
          ? Number(String(data.eficiencia_percent).replace(',', '.'))
          : undefined,
        setor_id: data.setor_id || undefined,
        usar_no_pcp: data.usar_no_pcp ?? true,
        horas_disponiveis_dia: data.horas_disponiveis_dia
          ? Number(String(data.horas_disponiveis_dia).replace(',', '.'))
          : undefined,
        permite_agendamento_simultaneo: Boolean(data.permite_agendamento_simultaneo),
        tempo_minimo_entre_servicos_min: data.tempo_minimo_entre_servicos_min
          ? Number(String(data.tempo_minimo_entre_servicos_min).replace(',', '.'))
          : undefined,
        considerar_eficiencia_na_capacidade: Boolean(
          data.considerar_eficiencia_na_capacidade,
        ),
      };

      await maquinasApi.update(id, transformedData, token);
      toast.success('Máquina atualizada com sucesso!');
      router.push('/centros-de-trabalho/maquinas');
    } catch (error) {
      console.error('Erro ao atualizar máquina:', error);
      toast.error('Erro ao atualizar máquina');
    } finally {
      setSubmitting(false);
    }
  };

  // Prepara os dados para o formulário
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
    setup_min: maquina.setup_min ? formatTimeDisplay(Number(maquina.setup_min) / 60) : '',
    setor_id: maquina.setor_id || null,
    usar_no_pcp: maquina.usar_no_pcp ?? true,
    horas_disponiveis_dia:
      maquina.horas_disponiveis_dia != null
        ? String(maquina.horas_disponiveis_dia)
        : '8',
    permite_agendamento_simultaneo: maquina.permite_agendamento_simultaneo ?? false,
    tempo_minimo_entre_servicos_min:
      maquina.tempo_minimo_entre_servicos_min != null
        ? String(maquina.tempo_minimo_entre_servicos_min)
        : '',
    considerar_eficiencia_na_capacidade:
      maquina.considerar_eficiencia_na_capacidade ?? true,
  } : undefined;

  if (loading) {
    return <div>Carregando dados da máquina...</div>;
  }
  
  if (!maquina) {
    return <div>Máquina não encontrada.</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editar Máquina</h1>
        <p className="text-gray-600 mt-1">
          Atualize os dados da máquina.
        </p>
      </div>
      <MaquinaForm onSave={handleSubmit} initialData={formInitialData} />
    </div>
  );
} 