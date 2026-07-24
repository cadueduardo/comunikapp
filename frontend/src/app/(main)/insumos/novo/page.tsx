'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { InsumoForm, InsumoFormValues } from '../insumo-form';
import { insumosApi } from '@/lib/api-client';
import {
  MatrizFornecedoresDraft,
  type MatrizFornecedorDraft,
} from '../matriz-fornecedores-draft';
import { useState } from 'react';

export default function NovoInsumoPage() {
  const router = useRouter();
  const [fornecedoresAlternativos, setFornecedoresAlternativos] =
    useState<MatrizFornecedorDraft[]>([]);

  const handleSave = async (data: InsumoFormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      const custo = typeof data.custo_unitario === 'string' 
        ? parseFloat(data.custo_unitario) 
        : data.custo_unitario;
        
      const toNonNegativeNumber = (value: unknown): number | undefined => {
        if (value === '' || value === null || value === undefined) return undefined;
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return undefined;
        return parsed < 0 ? 0 : parsed;
      };

      const matrizAlternativa = fornecedoresAlternativos.map((item) => ({
        fornecedor_id: item.fornecedor_id,
        preco_custo: Number(item.preco_custo),
        ...(item.codigo_ref.trim() ? { codigo_ref: item.codigo_ref.trim() } : {}),
        padrao: false,
      }));
      if (
        matrizAlternativa.some(
          (item) => !item.fornecedor_id || !Number.isFinite(item.preco_custo) || item.preco_custo <= 0,
        )
      ) {
        toast.error('Complete fornecedor e preço em todas as alternativas.');
        return;
      }
      if (matrizAlternativa.some((item) => item.fornecedor_id === data.fornecedorId)) {
        toast.error('O fornecedor padrão não pode ser repetido nas alternativas.');
        return;
      }

      const created = await insumosApi.create({
        ...data,
        custo_unitario: custo,
        fornecedores: [
          {
            fornecedor_id: data.fornecedorId,
            preco_custo: custo,
            padrao: true,
          },
          ...matrizAlternativa,
        ],
        estoque_minimo: toNonNegativeNumber(data.estoque_minimo),
        estoque_quantidade_inicial: toNonNegativeNumber(data.estoque_quantidade_inicial),
        estoque_maximo: toNonNegativeNumber(data.estoque_maximo),
      }, token) as { id?: string };
      
      toast.success('Insumo criado com sucesso!');
      router.push(`/insumos?criado=${encodeURIComponent(created.id ?? '')}`);
    } catch (error) {
      toast.error('Ocorreu um erro ao conectar com o servidor.');
      console.error(error);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Adicionar Novo Insumo</h1>
        <p className="text-gray-600 mt-1">
          Preencha os detalhes do novo insumo abaixo.
        </p>
      </div>
      <InsumoForm
        onSave={handleSave}
        sugerirNomesCadastrados
        afterFields={
          <MatrizFornecedoresDraft
            rows={fornecedoresAlternativos}
            onChange={setFornecedoresAlternativos}
          />
        }
      />
    </div>
  );
} 
