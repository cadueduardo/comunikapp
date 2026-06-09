'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  TipoInstalacaoForm,
  type TipoInstalacaoFormValues,
} from '@/components/forms/ct/TipoInstalacaoForm';
import { Card, CardContent } from '@/components/ui/card';
import { tiposInstalacaoApi } from '@/lib/api-client';

const normalizarNumero = (valor?: string) => {
  if (!valor) return undefined;
  const parsed = Number(valor.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function EditarTipoInstalacaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [initialData, setInitialData] = useState<Partial<TipoInstalacaoFormValues> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast.error('Token de autenticação não encontrado.');
          router.push('/centros-de-trabalho/tipos-instalacao');
          return;
        }
        const data = await tiposInstalacaoApi.getById(id, token) as Record<string, unknown>;
        setInitialData({
          nome: String(data.nome ?? ''),
          descricao: String(data.descricao ?? ''),
          ativo: data.ativo !== false,
          exige_endereco: data.exige_endereco !== false,
          exige_agendamento: Boolean(data.exige_agendamento),
          regra_cobranca:
            typeof data.regra_cobranca === 'string'
              ? data.regra_cobranca as TipoInstalacaoFormValues['regra_cobranca']
              : 'FIXO',
          preco_padrao: data.preco_padrao != null ? String(data.preco_padrao) : '',
          custo_mao_obra_padrao:
            data.custo_mao_obra_padrao != null ? String(data.custo_mao_obra_padrao) : '',
          custo_deslocamento_padrao:
            data.custo_deslocamento_padrao != null ? String(data.custo_deslocamento_padrao) : '',
          tempo_estimado_min: data.tempo_estimado_min != null ? String(data.tempo_estimado_min) : '',
          quantidade_pessoas_padrao:
            data.quantidade_pessoas_padrao != null ? String(data.quantidade_pessoas_padrao) : '',
          observacoes_padrao: String(data.observacoes_padrao ?? ''),
        });
      } catch {
        toast.error('Erro ao carregar tipo de instalação.');
        router.push('/centros-de-trabalho/tipos-instalacao');
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id, router]);

  const handleSave = async (data: TipoInstalacaoFormValues) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      await tiposInstalacaoApi.update(id, {
        ...data,
        preco_padrao: normalizarNumero(data.preco_padrao),
        custo_mao_obra_padrao: normalizarNumero(data.custo_mao_obra_padrao),
        custo_deslocamento_padrao: normalizarNumero(data.custo_deslocamento_padrao),
        tempo_estimado_min: data.tempo_estimado_min ? Number(data.tempo_estimado_min) : undefined,
        quantidade_pessoas_padrao: data.quantidade_pessoas_padrao
          ? Number(data.quantidade_pessoas_padrao)
          : undefined,
      }, token);

      toast.success('Tipo de instalação atualizado com sucesso.');
      router.push('/centros-de-trabalho/tipos-instalacao');
    } catch {
      toast.error('Erro ao atualizar tipo de instalação.');
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
        <h1 className="text-3xl font-bold">Editar Tipo de Instalação</h1>
        <p className="text-gray-600 mt-1">Atualize a configuração de instalação selecionada.</p>
      </div>
      <TipoInstalacaoForm onSave={handleSave} initialData={initialData} loading={loading} />
    </div>
  );
}
