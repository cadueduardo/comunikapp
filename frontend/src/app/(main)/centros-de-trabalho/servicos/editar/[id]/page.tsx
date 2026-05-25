'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React from 'react';
import ServicoManualForm, { ServicoManualFormValues } from '../../novo/servico-manual-form';
import { servicosManuaisApi } from '@/lib/api-client';
import { parseTimeValue } from '@/components/ui/time-input';

interface ServicoManual {
  id: string;
  nome: string;
  tipo_calculo?: 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'POR_PECA_COM_CATEGORIA' | 'MANUAL';
  horas_por_m2?: number | string;
  horas_por_unidade?: number | string;
  eficiencia_percent?: number | string;
  custo_hora?: number | string;
  descricao?: string;
  setor_id?: string | null;
  setup_min?: number | string;
  categorias?: Array<{nome: string; ate_m2: number; tempo_min: number}>;
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
      
      // Transformar dados para o backend (mesmo código da criação)
      const transformedData: any = {
        nome: data.nome,
        descricao: data.descricao,
        custo_hora: Number(String(data.custo_hora).replace(/[^0-9,-]/g, '').replace(',', '.')),
        tipo_calculo: data.tipo_calculo,
        eficiencia_percent: data.eficiencia_percent ? Number(String(data.eficiencia_percent).replace(',', '.')) : undefined,
        setor_id: data.setor_id && data.setor_id !== 'none' ? data.setor_id : undefined,
      };

      // Campos específicos por tipo
      if (data.horas_por_m2) {
        transformedData.horas_por_m2 = Number(String(data.horas_por_m2).replace(',', '.'));
      }
      
      if (data.horas_por_unidade) {
        transformedData.horas_por_unidade = Number(String(data.horas_por_unidade).replace(',', '.'));
      }

      // Campos específicos para POR_PECA_COM_CATEGORIA
      if (data.tipo_calculo === 'POR_PECA_COM_CATEGORIA') {
        if (data.setup_min) {
          transformedData.setup_min = parseTimeValue(data.setup_min) * 60; // converter para minutos
        }
        
        if (data.categorias && data.categorias.length > 0) {
          // Converter tempos das categorias para minutos
          const categoriasConvertidas = data.categorias.map(cat => ({
            nome: cat.nome,
            ate_m2: cat.ate_m2,
            tempo_min: parseTimeValue(cat.tempo_min) * 60 // converter para minutos
          }));
          transformedData.categorias = categoriasConvertidas;
        }
      }

      await servicosManuaisApi.update(id, transformedData, token);
      toast.success('Serviço manual atualizado!');
      router.push('/centros-de-trabalho/servicos');
    } catch (e) {
      console.error('Erro completo:', e);
      toast.error('Erro ao atualizar serviço manual');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!registro) return <div>Registro não encontrado.</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editar Serviço Manual</h1>
        <p className="text-gray-600 mt-1">Atualize os parâmetros do serviço.</p>
      </div>
      <ServicoManualForm 
        onSave={handleSave} 
        initialData={{
          ...registro,
          setor_id: registro.setor_id || '',
          // Converter setup_min de minutos para HH:MM
          setup_min: (() => {
            if (!registro.setup_min) return '';
            const setupNum = typeof registro.setup_min === 'string' ? parseFloat(registro.setup_min) : registro.setup_min;
            if (setupNum <= 0) return '';
            
            // Se for menor que 24, provavelmente são horas decimais
            if (setupNum < 24) {
              const totalMinutos = Math.round(setupNum * 60);
              const horas = Math.floor(totalMinutos / 60);
              const minutos = totalMinutos % 60;
              return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
            } else {
              // Já são minutos
              const horas = Math.floor(setupNum / 60);
              const minutos = Math.round(setupNum % 60);
              return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
            }
          })(),
          categorias: registro.categorias?.map(cat => ({
            ...cat,
            tempo_min: (() => {
              if (typeof cat.tempo_min !== 'number') return cat.tempo_min;
              
              const tempoNum = cat.tempo_min;
              if (tempoNum <= 0) return '';
              
              // Se for menor que 24, provavelmente são horas decimais
              if (tempoNum < 24) {
                const totalMinutos = Math.round(tempoNum * 60);
                const horas = Math.floor(totalMinutos / 60);
                const minutos = totalMinutos % 60;
                return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
              } else {
                // Já são minutos
                const horas = Math.floor(tempoNum / 60);
                const minutos = Math.round(tempoNum % 60);
                return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
              }
            })()
          })) || []
        }} 
        loading={submitting}
      />
    </div>
  );
}


