'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  ProcessoDecoracaoForm,
  serializarProcessoDecoracao,
  type ProcessoDecoracaoFormValues,
} from '@/components/forms/catalogo/ProcessoDecoracaoForm';
import { catalogoPersonalizacaoApi } from '@/lib/api-client';

export default function NovoProcessoDecoracaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSave = async (data: ProcessoDecoracaoFormValues) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      await catalogoPersonalizacaoApi.create(serializarProcessoDecoracao(data), token);
      toast.success('Processo criado com sucesso.');
      router.push('/catalogo/personalizacao');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao criar processo.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 md:p-6">
      <ProcessoDecoracaoForm onSave={handleSave} loading={loading} />
    </div>
  );
}
