'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React from 'react';
import { FuncaoForm, FuncaoFormValues } from '../../funcao-form';
import { funcoesApi } from '@/lib/api-client';

interface Funcao {
  id: string;
  nome: string;
  custo_hora: number | string;
  descricao?: string;
  maquina_id?: string;
  setor_id?: string | null;
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

      const data = await funcoesApi.getById(id, token);
      setFuncao(data);
    } catch (error) {
      console.error('Erro ao buscar função:', error);
      toast.error('Função não encontrada.');
      router.push('/configuracoes/funcoes');
    } finally {
      setLoading(false);
    }
  };

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

      await funcoesApi.update(id, {
        ...data,
        custo_hora: custo,
        maquina_id: data.maquina_id === 'null' ? null : data.maquina_id,
        setor_id: data.setor_id && data.setor_id !== 'none' ? data.setor_id : null,
      }, token);

      toast.success('Função atualizada com sucesso!');
      router.push('/configuracoes/funcoes');
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
    setor_id: funcao.setor_id || '',
  } : undefined;

  if (loading) {
    return <div>Carregando dados da função...</div>;
  }
  
  if (!funcao) {
    return <div>Função não encontrada.</div>;
  }

  return (
    <div>
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