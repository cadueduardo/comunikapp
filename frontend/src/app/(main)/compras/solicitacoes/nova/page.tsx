'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { comprasApi } from '@/lib/api-client';
import {
  SolicitacaoForm,
  SolicitacaoFormValues,
} from '../solicitacao-form';

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const salvar = async (values: SolicitacaoFormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }
      const criada = await comprasApi.createSolicitacao(values, token);
      toast.success(`Solicitação ${criada.numero} cadastrada com sucesso.`);
      router.push(`/compras/solicitacoes/editar/${criada.id}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao cadastrar solicitação.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nova solicitação</h1>
        <p className="mt-1 text-muted-foreground">
          Registre a necessidade de compra com pelo menos um item.
        </p>
      </div>
      <SolicitacaoForm onSave={salvar} loading={loading} />
    </div>
  );
}
