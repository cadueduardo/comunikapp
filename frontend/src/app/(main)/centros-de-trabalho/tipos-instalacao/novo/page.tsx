'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  TipoInstalacaoForm,
  type TipoInstalacaoFormValues,
} from '@/components/forms/ct/TipoInstalacaoForm';
import { tiposInstalacaoApi } from '@/lib/api-client';

const normalizarNumero = (valor?: string) => {
  if (!valor) return undefined;
  const parsed = Number(valor.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function NovoTipoInstalacaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSave = async (data: TipoInstalacaoFormValues) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      await tiposInstalacaoApi.create({
        ...data,
        preco_padrao: normalizarNumero(data.preco_padrao),
        custo_mao_obra_padrao: normalizarNumero(data.custo_mao_obra_padrao),
        custo_deslocamento_padrao: normalizarNumero(data.custo_deslocamento_padrao),
        tempo_estimado_min: data.tempo_estimado_min ? Number(data.tempo_estimado_min) : undefined,
        quantidade_pessoas_padrao: data.quantidade_pessoas_padrao
          ? Number(data.quantidade_pessoas_padrao)
          : undefined,
      }, token);

      toast.success('Tipo de instalação criado com sucesso.');
      router.push('/centros-de-trabalho/tipos-instalacao');
    } catch {
      toast.error('Erro ao criar tipo de instalação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Adicionar Tipo de Instalação</h1>
        <p className="text-gray-600 mt-1">Cadastre uma nova opção de instalação para os produtos.</p>
      </div>
      <TipoInstalacaoForm onSave={handleSave} loading={loading} />
    </div>
  );
}
