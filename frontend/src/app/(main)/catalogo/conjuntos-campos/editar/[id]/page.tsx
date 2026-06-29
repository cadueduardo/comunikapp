'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ConjuntoCamposForm,
  serializarConjuntoCampos,
  type ConjuntoCamposFormValues,
} from '@/components/forms/catalogo/ConjuntoCamposForm';
import { Card, CardContent } from '@/components/ui/card';
import { catalogoConjuntosCamposApi } from '@/lib/api-client';

type CampoApi = {
  chave: string;
  label: string;
  tipo: 'TEXTO' | 'NUMERO' | 'DATA';
  obrigatorio?: boolean;
  max_caracteres?: number | null;
  placeholder?: string | null;
  ordem?: number;
};

export default function EditarConjuntoCamposPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [initialData, setInitialData] = useState<Partial<ConjuntoCamposFormValues> | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast.error('Token de autenticação não encontrado.');
          router.push('/catalogo/conjuntos-campos');
          return;
        }

        const data = (await catalogoConjuntosCamposApi.getById(id, token)) as Record<
          string,
          unknown
        >;
        const campos = Array.isArray(data.campos)
          ? (data.campos as CampoApi[]).map((c) => ({
              chave: c.chave,
              label: c.label,
              tipo: c.tipo,
              obrigatorio: c.obrigatorio !== false,
              max_caracteres:
                c.max_caracteres != null ? String(c.max_caracteres) : '',
              placeholder: c.placeholder ?? '',
              ordem: c.ordem != null ? String(c.ordem) : '0',
            }))
          : [];

        setInitialData({
          nome: String(data.nome ?? ''),
          descricao: data.descricao != null ? String(data.descricao) : '',
          ativo: data.ativo !== false,
          campos,
        });
      } catch {
        toast.error('Erro ao carregar conjunto.');
        router.push('/catalogo/conjuntos-campos');
      } finally {
        setCarregando(false);
      }
    })();
  }, [id, router]);

  const handleSave = async (formData: ConjuntoCamposFormValues) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      await catalogoConjuntosCamposApi.update(
        id,
        serializarConjuntoCampos(formData),
        token,
      );
      toast.success('Conjunto atualizado com sucesso.');
      router.push('/catalogo/conjuntos-campos');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar conjunto.',
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
      <ConjuntoCamposForm
        initialData={initialData}
        onSave={handleSave}
        loading={loading}
      />
    </div>
  );
}
