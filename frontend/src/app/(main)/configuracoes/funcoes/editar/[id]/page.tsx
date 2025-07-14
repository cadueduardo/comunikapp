'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React from 'react';
import { FuncaoForm, FuncaoFormValues } from '../../funcao-form';

interface Funcao {
  id: string;
  nome: string;
  custo_hora: number | string;
  descricao?: string;
  maquina_id?: string;
}

export default function EditarFuncaoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [funcao, setFuncao] = useState<Funcao | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = React.use(params);

  useEffect(() => {
    fetchFuncao();
  }, [id]);

  const fetchFuncao = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/funcoes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFuncao(data);
      } else {
        toast.error('Função não encontrada.');
        router.push('/configuracoes/funcoes');
      }
    } catch (error) {
      console.error('Erro ao buscar função:', error);
      toast.error('Erro ao carregar dados da função.');
      router.push('/configuracoes/funcoes');
    } finally {
      setLoading(false);
    }
  };

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

      const response = await fetch(`http://localhost:3001/funcoes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          custo_hora: custo,
          maquina_id: data.maquina_id === 'null' ? null : data.maquina_id,
        }),
      });

      if (response.ok) {
        toast.success('Função atualizada com sucesso!');
        router.push('/configuracoes/funcoes');
      } else {
        const errorData = await response.json();
        toast.error(`Falha ao atualizar função: ${errorData.message}`);
      }
    } catch (error) {
      toast.error('Ocorreu um erro ao conectar com o servidor.');
      console.error(error);
    }
  };

  // Prepara os dados para o formulário
  const formInitialData = funcao ? {
    nome: funcao.nome,
    custo_hora: typeof funcao.custo_hora === 'string' ? parseFloat(funcao.custo_hora) : funcao.custo_hora,
    descricao: funcao.descricao || '',
    maquina_id: funcao.maquina_id || 'null',
  } : undefined;

  if (loading) {
    return <div className="p-6">Carregando dados da função...</div>;
  }
  
  if (!funcao) {
    return <div className="p-6">Função não encontrada.</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editar Função</h1>
        <p className="text-gray-600 mt-1">
          Atualize os dados da função.
        </p>
      </div>
      <FuncaoForm onSave={handleSave} initialData={formInitialData} />
    </div>
  );
} 