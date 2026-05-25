'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';
import { InsumoForm, InsumoFormValues } from '../../insumo-form';
import { insumosApi } from '@/lib/api-client';

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
        const data = await insumosApi.getById(id, token);
        setInsumo(data);
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

      await insumosApi.update(id, {
          ...data,
          custo_unitario: custo,
          estoque_minimo: data.estoque_minimo ? Number(data.estoque_minimo) : null,
      }, token);

      toast.success('Insumo atualizado com sucesso!');
      router.push('/insumos');
    } catch (err) {
      toast.error('Ocorreu um erro ao conectar com o servidor.');
      console.error(err);
    }
  };

  // Prepara os dados para o formulário, garantindo que nenhum valor seja null/undefined
  console.log('🔍 EditarInsumoPage - Dados do insumo recebidos:', {
    logica_consumo: insumo?.logica_consumo,
    tipoMaterialId: insumo?.tipoMaterialId,
    tipo_material_id: insumo?.tipo_material_id,
    parametros_consumo: insumo?.parametros_consumo
  });

  const formInitialData = insumo ? {
      nome: insumo.nome,
      custo_unitario: insumo.custo_unitario?.toString() ?? '',
      categoriaId: insumo.categoria.id,
      fornecedorId: insumo.fornecedor.id,
      
      // Campos de compra
      unidade_compra: insumo.unidade_compra,
      quantidade_compra: insumo.quantidade_compra?.toString() ?? '',
      
      // Campos de dimensões
      largura: insumo.largura?.toString() ?? '',
      altura: insumo.altura?.toString() ?? '',
      unidade_dimensao: insumo.unidade_dimensao ?? '',
      tipo_calculo: insumo.tipo_calculo ?? '',
      gramatura: insumo.gramatura?.toString() ?? '',
      
      // Campos de uso
      unidade_uso: insumo.unidade_uso,
      fator_conversao: insumo.fator_conversao?.toString() ?? '',
      
      // Campos de lógica de consumo personalizada
      logica_consumo: insumo.logica_consumo ?? 'area',
      tipo_material_id: insumo.tipoMaterialId ?? insumo.tipo_material_id ?? '',
      parametros_consumo: insumo.parametros_consumo ?? null,
      
      // Outros campos
      estoque_minimo: insumo.estoque_minimo?.toString() ?? '',
      codigo_interno: insumo.codigo_interno ?? '',
      descricao_tecnica: insumo.descricao_tecnica ?? '',
      observacoes: insumo.observacoes ?? '',
      ativo: Boolean(insumo.ativo),
  } : undefined;

  if (loading) {
    return <div>Carregando dados do insumo...</div>;
  }
  
  if (!insumo) {
    return <div>Insumo não encontrado.</div>;
  }

  return (
    <div>
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