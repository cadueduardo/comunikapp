'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import ServicoManualForm, { ServicoManualFormValues } from './servico-manual-form';
import { servicosManuaisApi } from '@/lib/api-client';
import { parseTimeValue } from '@/components/ui/time-input';

export default function NovoServicoManualCTPage() {
  const router = useRouter();

  const handleSave = async (data: ServicoManualFormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { toast.error('Token não encontrado'); return; }
      
      // Transformar dados para o backend
      const transformedData: any = {
        nome: data.nome,
        descricao: data.descricao,
        custo_hora: Number(String(data.custo_hora).replace(/[^0-9,-]/g, '').replace(',', '.')),
        tipo_calculo: data.tipo_calculo,
        eficiencia_percent: data.eficiencia_percent ? Number(String(data.eficiencia_percent).replace(',', '.')) : undefined,
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

      console.log('Dados transformados para backend:', JSON.stringify(transformedData, null, 2));

      await servicosManuaisApi.create(transformedData, token);
      toast.success('Serviço manual criado com sucesso!');
      router.push('/centros-de-trabalho/servicos');
    } catch (e) {
      console.error('Erro completo:', e);
      toast.error('Erro ao salvar serviço manual');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Adicionar Serviço Manual</h1>
        <p className="text-gray-600 mt-1">Cadastre um serviço manual com parâmetros de cálculo.</p>
      </div>
      <ServicoManualForm onSave={handleSave} />
    </div>
  );
}


