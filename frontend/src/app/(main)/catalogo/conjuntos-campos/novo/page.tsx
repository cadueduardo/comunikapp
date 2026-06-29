'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  ConjuntoCamposForm,
  serializarConjuntoCampos,
  type ConjuntoCamposFormValues,
} from '@/components/forms/catalogo/ConjuntoCamposForm';
import { catalogoConjuntosCamposApi } from '@/lib/api-client';

export default function NovoConjuntoCamposPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSave = async (data: ConjuntoCamposFormValues) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      await catalogoConjuntosCamposApi.create(serializarConjuntoCampos(data), token);
      toast.success('Conjunto criado com sucesso.');
      router.push('/catalogo/conjuntos-campos');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao criar conjunto.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 md:p-6">
      <ConjuntoCamposForm onSave={handleSave} loading={loading} />
    </div>
  );
}
