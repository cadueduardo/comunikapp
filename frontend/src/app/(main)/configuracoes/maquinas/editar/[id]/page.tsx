'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React from 'react';
import { MaquinaForm, MaquinaFormValues } from '../../maquina-form';

interface Maquina {
  id: string;
  nome: string;
  tipo: string;
  custo_hora: number | string;
  status: string;
  capacidade?: string;
  observacoes?: string;
}

export default function EditarMaquinaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [maquina, setMaquina] = useState<Maquina | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = React.use(params);

  useEffect(() => {
    fetchMaquina();
  }, [id]);

  const fetchMaquina = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/maquinas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMaquina(data);
      } else {
        toast.error('Máquina não encontrada.');
        router.push('/configuracoes/maquinas');
      }
    } catch (error) {
      console.error('Erro ao buscar máquina:', error);
      toast.error('Erro ao carregar dados da máquina.');
      router.push('/configuracoes/maquinas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: MaquinaFormValues) => {
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

      const response = await fetch(`http://localhost:3001/maquinas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          custo_hora: custo,
        }),
      });

      if (response.ok) {
        toast.success('Máquina atualizada com sucesso!');
        router.push('/configuracoes/maquinas');
      } else {
        const errorData = await response.json();
        toast.error(`Falha ao atualizar máquina: ${errorData.message}`);
      }
    } catch (error) {
      toast.error('Ocorreu um erro ao conectar com o servidor.');
      console.error(error);
    }
  };

  // Prepara os dados para o formulário
  const formInitialData = maquina ? {
    nome: maquina.nome,
    tipo: maquina.tipo,
    custo_hora: typeof maquina.custo_hora === 'string' ? parseFloat(maquina.custo_hora) : maquina.custo_hora,
    status: maquina.status,
    capacidade: maquina.capacidade || '',
    observacoes: maquina.observacoes || '',
  } : undefined;

  if (loading) {
    return <div className="p-6">Carregando dados da máquina...</div>;
  }
  
  if (!maquina) {
    return <div className="p-6">Máquina não encontrada.</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editar Máquina</h1>
        <p className="text-gray-600 mt-1">
          Atualize os dados da máquina.
        </p>
      </div>
      <MaquinaForm onSave={handleSave} initialData={formInitialData} />
    </div>
  );
} 