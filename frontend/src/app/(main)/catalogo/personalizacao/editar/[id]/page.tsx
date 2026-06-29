'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ProcessoDecoracaoForm,
  serializarProcessoDecoracao,
  type ProcessoDecoracaoFormValues,
} from '@/components/forms/catalogo/ProcessoDecoracaoForm';
import { Card, CardContent } from '@/components/ui/card';
import { catalogoPersonalizacaoApi } from '@/lib/api-client';

type FaixaPrecoApi = { min: number; max?: number | null; preco: number };

export default function EditarProcessoDecoracaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [initialData, setInitialData] = useState<Partial<ProcessoDecoracaoFormValues> | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast.error('Token de autenticação não encontrado.');
          router.push('/catalogo/personalizacao');
          return;
        }

        const data = (await catalogoPersonalizacaoApi.getById(id, token)) as Record<
          string,
          unknown
        >;
        const faixas = Array.isArray(data.faixas_preco)
          ? (data.faixas_preco as FaixaPrecoApi[]).map((f) => ({
              min: String(f.min),
              max: f.max != null ? String(f.max) : '',
              preco: String(f.preco),
            }))
          : [];

        setInitialData({
          nome: String(data.nome ?? ''),
          codigo: data.codigo != null ? String(data.codigo) : '',
          descricao: data.descricao != null ? String(data.descricao) : '',
          exige_arte_aprovada: Boolean(data.exige_arte_aprovada),
          insumos_aceitos: Array.isArray(data.insumos_aceitos)
            ? (data.insumos_aceitos as ProcessoDecoracaoFormValues['insumos_aceitos'])
            : ['TEXTO'],
          preco_base: data.preco_base != null ? String(data.preco_base) : '',
          custo_setup: data.custo_setup != null ? String(data.custo_setup) : '',
          setor_pcp_sugerido:
            data.setor_pcp_sugerido != null ? String(data.setor_pcp_sugerido) : '',
          ativo: data.ativo !== false,
          faixas_preco: faixas,
        });
      } catch {
        toast.error('Erro ao carregar processo.');
        router.push('/catalogo/personalizacao');
      } finally {
        setCarregando(false);
      }
    })();
  }, [id, router]);

  const handleSave = async (formData: ProcessoDecoracaoFormValues) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      await catalogoPersonalizacaoApi.update(
        id,
        serializarProcessoDecoracao(formData),
        token,
      );
      toast.success('Processo atualizado com sucesso.');
      router.push('/catalogo/personalizacao');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar processo.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (carregando || !initialData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Carregando...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6">
      <ProcessoDecoracaoForm
        initialData={initialData}
        onSave={handleSave}
        loading={loading}
      />
    </div>
  );
}
