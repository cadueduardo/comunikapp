'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FuncaoForm, FuncaoFormValues } from '../funcao-form';

export default function NovaFuncaoPage() {
  const router = useRouter();

  const handleSave = async (data: FuncaoFormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      
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
      };

      console.log('Dados sendo enviados:', requestData);
        
      const response = await fetch('http://localhost:3001/funcoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      console.log('Status da resposta:', response.status);

      if (response.ok) {
        toast.success('Função criada com sucesso!');
        router.push('/configuracoes/funcoes');
      } else {
        const errorData = await response.json();
        console.error('Erro detalhado:', errorData);
        toast.error(`Falha ao criar função: ${errorData.message || 'Erro desconhecido'}`);
      }
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