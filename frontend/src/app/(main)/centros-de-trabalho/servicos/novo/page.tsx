'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import ServicoManualForm, { ServicoManualFormValues } from './servico-manual-form';
import { servicosManuaisApi } from '@/lib/api-client';

export default function NovoServicoManualCTPage() {
  const router = useRouter();

  const handleSave = async (data: ServicoManualFormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { toast.error('Token não encontrado'); return; }
      await servicosManuaisApi.create(data as any, token);
      toast.success('Serviço manual criado com sucesso!');
      router.push('/centros-de-trabalho/servicos');
    } catch (e) {
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


