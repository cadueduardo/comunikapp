'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  EstampaForm,
  serializarEstampa,
  type EstampaFormValues,
} from '@/components/forms/catalogo/EstampaForm';
import { catalogoEstampasApi } from '@/lib/api-client';

export default function NovaEstampaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSave = async (data: EstampaFormValues) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      const criada = (await catalogoEstampasApi.create(
        serializarEstampa(data),
        token,
      )) as { id?: string };

      toast.success('Estampa criada com sucesso.');
      if (criada.id) {
        router.push(`/catalogo/estampas/editar/${criada.id}`);
      } else {
        router.push('/catalogo/estampas');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao criar estampa.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 md:p-6">
      <EstampaForm onSave={handleSave} loading={loading} />
    </div>
  );
}
