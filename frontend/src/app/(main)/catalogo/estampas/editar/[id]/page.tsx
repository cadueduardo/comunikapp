'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  EstampaForm,
  serializarEstampa,
  type EstampaFormValues,
} from '@/components/forms/catalogo/EstampaForm';
import { Card, CardContent } from '@/components/ui/card';
import { catalogoEstampasApi } from '@/lib/api-client';

export default function EditarEstampaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [initialData, setInitialData] = useState<
    Partial<EstampaFormValues> & { arte_mestra_url?: string | null } | null
  >(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast.error('Token de autenticação não encontrado.');
          router.push('/catalogo/estampas');
          return;
        }

        const data = (await catalogoEstampasApi.getById(id, token)) as Record<
          string,
          unknown
        >;

        setInitialData({
          nome: String(data.nome ?? ''),
          codigo: data.codigo != null ? String(data.codigo) : '',
          processo_id: String(
            (data.processo as { id?: string } | undefined)?.id ?? data.processo_id ?? '',
          ),
          conjunto_campos_id: String(
            (data.conjunto_campos as { id?: string } | undefined)?.id ??
              data.conjunto_campos_id ??
              '',
          ),
          preco_adicional:
            data.preco_adicional != null ? String(data.preco_adicional) : '',
          ativo: data.ativo !== false,
          arte_mestra_url:
            data.arte_mestra_url != null ? String(data.arte_mestra_url) : null,
        });
      } catch {
        toast.error('Erro ao carregar estampa.');
        router.push('/catalogo/estampas');
      } finally {
        setCarregando(false);
      }
    })();
  }, [id, router]);

  const handleSave = async (formData: EstampaFormValues) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      await catalogoEstampasApi.update(id, serializarEstampa(formData), token);
      toast.success('Estampa atualizada com sucesso.');
      router.push('/catalogo/estampas');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar estampa.',
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
      <EstampaForm
        estampaId={id}
        initialData={initialData}
        onSave={handleSave}
        loading={loading}
      />
    </div>
  );
}
