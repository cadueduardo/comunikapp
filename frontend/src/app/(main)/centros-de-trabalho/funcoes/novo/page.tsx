'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FuncaoForm, FuncaoFormValues } from '../../../configuracoes/funcoes/funcao-form';
import { funcoesApi } from '@/lib/api-client';

export default function NovaFuncaoCTPage() {
  const router = useRouter();

  const handleSave = async (data: FuncaoFormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      // custo_hora já é tratado pelo form como currency string/number
      await funcoesApi.create({ ...data }, token);
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


