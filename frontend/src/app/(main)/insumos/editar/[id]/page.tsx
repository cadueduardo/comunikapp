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
      
      // Converter valores monetários para número e arredondar para 2 casas decimais
      const custoUnitario = typeof data.custo_unitario === 'string' 
        ? Math.round(parseFloat(data.custo_unitario) * 100) / 100
        : Math.round((data.custo_unitario || 0) * 100) / 100;
      
      const custoLote = typeof data.custo_lote === 'string' 
        ? data.custo_lote ? Math.round(parseFloat(data.custo_lote) * 100) / 100 : null
        : data.custo_lote ? Math.round(data.custo_lote * 100) / 100 : null;

      const requestData = {
        nome: data.nome,
        categoriaId: data.categoriaId,
        fornecedorId: data.fornecedorId,
        unidade_medida: data.unidade_medida,
        custo_unitario: custoUnitario,
        custo_lote: custoLote,
        quantidade_lote: data.quantidade_lote ? Number(data.quantidade_lote) : null,
        codigo_interno: data.codigo_interno || null,
        estoque_minimo: data.estoque_minimo ? Number(data.estoque_minimo) : null,
        descricao_tecnica: data.descricao_tecnica || null,
        observacoes: data.observacoes || null,
      };

      console.log('Dados sendo enviados:', requestData);

      const response = await fetch(`http://localhost:3001/insumos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast.success('Insumo atualizado com sucesso!');
        router.push('/insumos');
      } else {
        const errorData = await response.json();
        console.error('Erro da API:', errorData);
        console.error('Detalhes do erro:', errorData.message);
        toast.error(`Falha ao atualizar insumo: ${Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message}`);
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
      custo_unitario: insumo.custo_unitario?.toString() || '', // Converte para string
      custo_lote: insumo.custo_lote?.toString() || '', // Converte para string
      quantidade_lote: insumo.quantidade_lote || undefined,
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