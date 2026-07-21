'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { comprasApi } from '@/lib/api-client';
import { PedidoForm, PedidoFormValues } from '../pedido-form';

export default function NovoPedidoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const salvar = async (values: PedidoFormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }
      const criado = await comprasApi.createPedido(values, token);
      toast.success(`Pedido ${criado.numero} cadastrado com sucesso.`);
      router.push(`/compras/pedidos/editar/${criado.id}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao cadastrar pedido.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Novo pedido</h1>
        <p className="mt-1 text-muted-foreground">
          Formalize fornecedor, itens e preços do pedido de compra.
        </p>
      </div>
      <PedidoForm onSave={salvar} loading={loading} />
    </div>
  );
}
