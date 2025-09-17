'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FuncaoForm, FuncaoFormValues } from '../../../configuracoes/funcoes/funcao-form';
import { funcoesApi } from '@/lib/api-client';
import { parseTimeValue } from '@/components/ui/time-input';

export default function NovaFuncaoCTPage() {
  const router = useRouter();

  const handleSave = async (data: FuncaoFormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      // Transformar dados para o formato esperado pelo backend
      const transformedData: any = {
        nome: data.nome,
        custo_hora: Number(String(data.custo_hora).replace(/[^0-9,-]/g, '').replace(',', '.')),
        descricao: data.descricao || undefined,
        maquina_id: data.maquina_id && data.maquina_id !== 'null' ? data.maquina_id : undefined,
        tipo_calculo: data.tipo_calculo || 'MANUAL',
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (data.fator_acompanhamento) {
        transformedData.fator_acompanhamento = Number(String(data.fator_acompanhamento).replace(',', '.')) / 100;
      }
      
      if (data.horas_por_m2) {
        transformedData.horas_por_m2 = parseTimeValue(data.horas_por_m2);
      }
      
      if (data.horas_por_unidade) {
        transformedData.horas_por_unidade = parseTimeValue(data.horas_por_unidade);
      }
      
      if (data.eficiencia_percent) {
        transformedData.eficiencia_percent = Number(String(data.eficiencia_percent).replace(',', '.'));
      }

      console.log('Dados transformados para backend:', JSON.stringify(transformedData, null, 2)); // DEBUG

      await funcoesApi.create(transformedData, token);
      toast.success('Função criada com sucesso!');
      router.push('/centros-de-trabalho/funcoes');
    } catch (error) {
      console.error('Erro completo:', error);
      toast.error('Ocorreu um erro ao conectar com o servidor.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Adicionar Nova Função</h1>
        <p className="text-gray-600 mt-1">Cadastre uma nova função com parâmetros de cálculo.</p>
      </div>
      <FuncaoForm onSave={handleSave} />
    </div>
  );
}


