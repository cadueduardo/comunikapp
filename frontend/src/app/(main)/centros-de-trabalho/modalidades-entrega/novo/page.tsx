'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ModalidadeEntregaForm,
  type ModalidadeEntregaFormValues,
} from '@/components/forms/ct/ModalidadeEntregaForm';
import { modalidadesEntregaApi } from '@/lib/api-client';

const normalizarNumero = (valor?: string) => {
  if (!valor) return undefined;
  const parsed = Number(valor.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function NovaModalidadeEntregaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSave = async (data: ModalidadeEntregaFormValues) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      await modalidadesEntregaApi.create({
        ...data,
        valor_padrao: normalizarNumero(data.valor_padrao),
        custo_padrao: normalizarNumero(data.custo_padrao),
        prazo_padrao_dias: data.prazo_padrao_dias ? Number(data.prazo_padrao_dias) : undefined,
      }, token);

      toast.success('Modalidade de entrega criada com sucesso.');
      router.push('/centros-de-trabalho/modalidades-entrega');
    } catch {
      toast.error('Erro ao criar modalidade de entrega.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Adicionar Modalidade de Entrega</h1>
        <p className="text-gray-600 mt-1">Cadastre uma nova opção de entrega para os orçamentos.</p>
      </div>
      <ModalidadeEntregaForm onSave={handleSave} loading={loading} />
    </div>
  );
}
