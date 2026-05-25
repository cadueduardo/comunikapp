'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FuncaoForm, FuncaoFormValues } from '../funcao-form';
import { funcoesApi } from '@/lib/api-client';

export default function NovaFuncaoPage() {
  const router = useRouter();

  const handleSave = async (data: FuncaoFormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
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
        
      const requestData = {
        ...data,
        custo_hora: custo,
        maquina_id: data.maquina_id === 'null' ? null : data.maquina_id,
        setor_id: data.setor_id && data.setor_id !== 'none' ? data.setor_id : null,
      };

      console.log('Dados sendo enviados:', requestData);
        
      await funcoesApi.create(requestData, token);

      toast.success('Função criada com sucesso!');
      router.push('/configuracoes/funcoes');
    } catch (error) {
      console.error('Erro completo:', error);
      toast.error('Ocorreu um erro ao conectar com o servidor.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Adicionar Nova Função</h1>
        <p className="text-gray-600 mt-1">
          Cadastre uma nova função para calcular custos de mão de obra.
        </p>
      </div>
      <FuncaoForm onSave={handleSave} />
    </div>
  );
} 