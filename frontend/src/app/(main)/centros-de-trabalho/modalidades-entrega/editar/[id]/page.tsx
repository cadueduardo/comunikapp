'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ModalidadeEntregaForm,
  type ModalidadeEntregaFormValues,
} from '@/components/forms/ct/ModalidadeEntregaForm';
import { Card, CardContent } from '@/components/ui/card';
import { modalidadesEntregaApi } from '@/lib/api-client';

const normalizarNumero = (valor?: string) => {
  if (!valor) return undefined;
  const parsed = Number(valor.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function EditarModalidadeEntregaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [initialData, setInitialData] = useState<Partial<ModalidadeEntregaFormValues> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast.error('Token de autenticação não encontrado.');
          router.push('/centros-de-trabalho/modalidades-entrega');
          return;
        }
        const data = await modalidadesEntregaApi.getById(id, token) as Record<string, unknown>;
        setInitialData({
          nome: String(data.nome ?? ''),
          descricao: String(data.descricao ?? ''),
          ativo: data.ativo !== false,
          exige_endereco: data.exige_endereco !== false,
          exige_valor: Boolean(data.exige_valor),
          permite_retirada: Boolean(data.permite_retirada),
          valor_padrao: data.valor_padrao != null ? String(data.valor_padrao) : '',
          custo_padrao: data.custo_padrao != null ? String(data.custo_padrao) : '',
          prazo_padrao_dias: data.prazo_padrao_dias != null ? String(data.prazo_padrao_dias) : '',
          observacoes_padrao: String(data.observacoes_padrao ?? ''),
        });
      } catch {
        toast.error('Erro ao carregar modalidade de entrega.');
        router.push('/centros-de-trabalho/modalidades-entrega');
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id, router]);

  const handleSave = async (data: ModalidadeEntregaFormValues) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      await modalidadesEntregaApi.update(id, {
        ...data,
        valor_padrao: normalizarNumero(data.valor_padrao),
        custo_padrao: normalizarNumero(data.custo_padrao),
        prazo_padrao_dias: data.prazo_padrao_dias ? Number(data.prazo_padrao_dias) : undefined,
      }, token);

      toast.success('Modalidade de entrega atualizada com sucesso.');
      router.push('/centros-de-trabalho/modalidades-entrega');
    } catch {
      toast.error('Erro ao atualizar modalidade de entrega.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData || !initialData) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">Carregando...</CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editar Modalidade de Entrega</h1>
        <p className="text-gray-600 mt-1">Atualize a configuração de entrega selecionada.</p>
      </div>
      <ModalidadeEntregaForm onSave={handleSave} initialData={initialData} loading={loading} />
    </div>
  );
}
