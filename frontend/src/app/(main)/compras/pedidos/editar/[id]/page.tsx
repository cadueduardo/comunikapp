'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { comprasApi, type PedidoCompraApi } from '@/lib/api-client';
import { statusPedidoLabel } from '../columns';
import {
  PedidoForm,
  PedidoFormData,
  PedidoFormValues,
} from '../pedido-form';

export default function EditarPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [pedido, setPedido] = useState<PedidoCompraApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const data = await comprasApi.getPedido(id, token);
        setPedido(data);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar pedido.');
      } finally {
        setLoading(false);
      }
    };
    void carregar();
  }, [id]);

  const editavel = pedido?.status === 'RASCUNHO';

  const salvar = async (values: PedidoFormValues) => {
    setSalvando(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }
      const atualizado = await comprasApi.updatePedido(id, values, token);
      setPedido(atualizado);
      toast.success('Pedido atualizado com sucesso.');
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar pedido.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const aprovar = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setBusy(true);
    try {
      const atualizado = await comprasApi.aprovarPedido(id, token);
      setPedido(atualizado);
      toast.success('Pedido aprovado.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Falha ao aprovar.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Carregando pedido...</p>;
  }
  if (!pedido) {
    return <p>Pedido não encontrado.</p>;
  }

  const initialData: PedidoFormData = {
    fornecedor_id: pedido.fornecedor_id,
    itens: (pedido.itens ?? []).map((item) => ({
      tipo: item.tipo as 'DESPESA' | 'SERVICO' | 'MATERIAL',
      descricao_snapshot: item.descricao_snapshot,
      quantidade: Number(item.quantidade),
      unidade_snapshot: item.unidade_snapshot,
      preco_unitario: Number(item.preco_unitario),
    })),
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {editavel ? 'Editar pedido' : 'Pedido'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">{pedido.numero}</span>
            <Badge variant="secondary">
              {statusPedidoLabel[pedido.status] ?? pedido.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {Number(pedido.total).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(pedido.status === 'RASCUNHO' ||
            pedido.status === 'EM_APROVACAO') && (
            <Button disabled={busy} onClick={() => void aprovar()}>
              Aprovar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push('/compras/pedidos')}
          >
            Voltar
          </Button>
        </div>
      </div>

      <PedidoForm
        key={pedido.id + pedido.status}
        initialData={initialData}
        onSave={salvar}
        loading={salvando}
        readOnly={!editavel}
      />
    </div>
  );
}
