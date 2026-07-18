'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';
import { InsumoForm, InsumoFormValues } from '../../insumo-form';
import { insumosApi } from '@/lib/api-client';
import {
  MatrizFornecedoresCard,
  type MatrizFornecedorApi,
} from './matriz-fornecedores-card';

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
        if (!token) {
          toast.error('Sessão expirada. Faça login novamente.');
          router.push('/login');
          return;
        }
        const data = await insumosApi.getById(id, token) as InsumoData;
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
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      const toNonNegativeNumber = (value: unknown): number | undefined => {
        if (value === '' || value === null || value === undefined) return undefined;
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return undefined;
        return parsed < 0 ? 0 : parsed;
      };

      const editableData: Record<string, unknown> = { ...data };
      delete editableData.fornecedorId;
      delete editableData.custo_unitario;

      await insumosApi.update(id, {
          ...editableData,
          estoque_minimo: toNonNegativeNumber(data.estoque_minimo),
          estoque_quantidade_inicial: toNonNegativeNumber(data.estoque_quantidade_inicial),
          estoque_maximo: toNonNegativeNumber(data.estoque_maximo),
      }, token);

      toast.success('Insumo atualizado com sucesso!');
      router.push('/insumos');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao conectar com o servidor.',
      );
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
      largura:
        insumo.largura?.toString() ??
        (insumo as any).largura_comercial?.toString() ??
        '',
      altura:
        insumo.altura?.toString() ??
        (insumo as any).comprimento_comercial?.toString() ??
        (insumo as any).altura_comercial?.toString() ??
        '',
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
      controlar_estoque: Boolean((insumo as any).controlar_estoque),
      estoque_localizacao_id: (insumo as any).estoque_localizacao_id ?? '',
      estoque_quantidade_inicial: (insumo as any).estoque_quantidade_inicial?.toString() ?? '',
      estoque_maximo: (insumo as any).estoque_maximo?.toString() ?? '',
      estoque_lote: (insumo as any).estoque_lote ?? '',
      estoque_data_validade: (insumo as any).estoque_data_validade ?? '',
      estoque_observacoes: (insumo as any).estoque_observacoes ?? '',
      codigo_interno: insumo.codigo_interno ?? '',
      descricao_tecnica: insumo.descricao_tecnica ?? '',
      observacoes: insumo.observacoes ?? '',
      ativo: Boolean(insumo.ativo),
      formato_material: (insumo as any).formato_material ?? '',
      largura_comercial: (insumo as any).largura_comercial?.toString() ?? '',
      altura_comercial: (insumo as any).altura_comercial?.toString() ?? '',
      comprimento_comercial: (insumo as any).comprimento_comercial?.toString() ?? '',
      perda_padrao_percent: (insumo as any).perda_padrao_percent?.toString() ?? '',
      permite_simulacao_chapa: Boolean((insumo as any).permite_simulacao_chapa),
      permite_registrar_sobra: Boolean((insumo as any).permite_registrar_sobra),
      metodo_cobranca_padrao: (insumo as any).metodo_cobranca_padrao ?? 'AREA_LIQUIDA',
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
      <div className="space-y-6">
        <InsumoForm
          onSave={handleSave}
          initialData={formInitialData}
          lockFornecedorCusto
        />
        <MatrizFornecedoresCard
          insumoId={id}
          initialRows={
            (insumo.fornecedores_associados ?? []) as MatrizFornecedorApi[]
          }
          onSaved={(result) => {
            const padrao = result.fornecedores.find((item) => item.padrao);
            setInsumo((current) =>
              current
                ? {
                    ...current,
                    fornecedor: padrao?.fornecedor ?? current.fornecedor,
                    custo_unitario: result.custo_unitario,
                    fornecedores_associados: result.fornecedores,
                  }
                : current,
            );
          }}
        />
      </div>
    </div>
  );
} 
