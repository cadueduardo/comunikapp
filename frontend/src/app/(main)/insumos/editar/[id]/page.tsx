'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';
import { InsumoForm, InsumoFormValues } from '../../insumo-form';

// A interface Insumo é importada de columns, mas representa a resposta da API
import { Insumo as InsumoData } from '../../columns'; 

export default function EditarInsumoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);

  const [insumo, setInsumo] = useState<InsumoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchInsumo = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:3001/insumos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setInsumo(data);
        } else {
          toast.error('Falha ao buscar dados do insumo.');
          router.push('/insumos');
        }
      } catch (err) {
        toast.error('Ocorreu um erro ao buscar o insumo.');
        console.error(err);
        router.push('/insumos');
      } finally {
        setLoading(false);
      }
    };
    fetchInsumo();
  }, [id, router]);

  const handleSave = async (data: InsumoFormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Lógica de conversão corrigida
      const custo = typeof data.custo_unitario === 'string' 
        ? parseFloat(data.custo_unitario) 
        : data.custo_unitario;

      const response = await fetch(`http://localhost:3001/insumos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            ...data,
            custo_unitario: custo,
            estoque_minimo: data.estoque_minimo ? Number(data.estoque_minimo) : null,
        }),
      });

      if (response.ok) {
        toast.success('Insumo atualizado com sucesso!');
        router.push('/insumos');
      } else {
        const errorData = await response.json();
        toast.error(`Falha ao atualizar insumo: ${errorData.message}`);
      }
    } catch (err) {
      toast.error('Ocorreu um erro ao conectar com o servidor.');
      console.error(err);
    }
  };

  // Prepara os dados para o formulário, garantindo que nenhum valor seja null/undefined
  const formInitialData = insumo ? {
      nome: insumo.nome,
      unidade_medida: insumo.unidade_medida,
      custo_unitario: insumo.custo_unitario, // Passa o número, o form trata
      categoriaId: insumo.categoria.id,
      fornecedorId: insumo.fornecedor.id,
      // Coerce null/undefined para string vazia
      estoque_minimo: insumo.estoque_minimo?.toString() ?? '',
      codigo_interno: insumo.codigo_interno ?? '',
      descricao_tecnica: insumo.descricao_tecnica ?? '',
      observacoes: insumo.observacoes ?? '',
  } : undefined;

  if (loading) {
    return <div className="p-6">Carregando dados do insumo...</div>;
  }
  
  if (!insumo) {
    return <div className="p-6">Insumo não encontrado.</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editar Insumo</h1>
        <p className="text-gray-600 mt-1">
          Altere os detalhes do insumo abaixo.
        </p>
      </div>
      <InsumoForm onSave={handleSave} initialData={formInitialData} />
    </div>
  );
} 