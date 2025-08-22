'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { MaquinaForm, MaquinaFormValues } from '../../../configuracoes/maquinas/maquina-form';
import { maquinasApi } from '@/lib/api-client';

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

      await maquinasApi.create({ ...data, custo_hora: custo }, token);
      toast.success('Máquina criada com sucesso!');
      router.push('/centros-de-trabalho/maquinas');
    } catch (error) {
      console.error('Erro completo:', error);
      toast.error('Ocorreu um erro ao conectar com o servidor.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Adicionar Nova Máquina</h1>
        <p className="text-gray-600 mt-1">Cadastre uma nova máquina para calcular custos operacionais.</p>
      </div>
      <MaquinaForm onSave={handleSave} />
    </div>
  );
}


