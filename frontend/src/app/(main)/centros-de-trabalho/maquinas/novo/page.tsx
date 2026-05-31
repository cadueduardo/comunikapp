'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { MaquinaForm, MaquinaFormValues } from '../../../configuracoes/maquinas/maquina-form';
import { maquinasApi } from '@/lib/api-client';
import { parseTimeValue } from '@/components/ui/time-input';

export default function NovaMaquinaCTPage() {
  const router = useRouter();

  const handleSave = async (data: MaquinaFormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
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

      // Transformar dados para o backend
      const transformedData = {
        ...data,
        custo_hora: custo,
        // Converter setup de HH:MM para minutos
        setup_min: data.setup_min ? parseTimeValue(data.setup_min) * 60 : undefined,
        // Converter outros campos numéricos
        velocidade_m2_h: data.velocidade_m2_h ? Number(String(data.velocidade_m2_h).replace(',', '.')) : undefined,
        eficiencia_percent: data.eficiencia_percent ? Number(String(data.eficiencia_percent).replace(',', '.')) : undefined,
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

      await maquinasApi.create(transformedData, token);
      toast.success('Máquina criada com sucesso!');
      router.push('/centros-de-trabalho/maquinas');
    } catch (error) {
      console.error('Erro completo:', error);
      toast.error('Ocorreu um erro ao conectar com o servidor.');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Adicionar Nova Máquina</h1>
        <p className="text-gray-600 mt-1">Cadastre uma nova máquina para calcular custos operacionais.</p>
      </div>
      <MaquinaForm onSave={handleSave} />
    </div>
  );
}


