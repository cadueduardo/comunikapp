'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  comprasApi,
  fornecedoresApi,
  type FornecedorApi,
  type PedidoCompraApi,
} from '@/lib/api-client';
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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [substOpen, setSubstOpen] = useState(false);
  const [substMotivo, setSubstMotivo] = useState('');
  const [substFornecedorId, setSubstFornecedorId] = useState('');
  const [fornecedores, setFornecedores] = useState<FornecedorApi[]>([]);

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

  useEffect(() => {
    void carregar();
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    void fornecedoresApi
      .getAll(token)
      .then((data) => setFornecedores(data.filter((f) => f.ativo !== false)))
      .catch(() => undefined);
  }, []);

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

  const run = async (
    fn: () => Promise<PedidoCompraApi>,
    okMsg: string,
    redirectId?: string,
  ) => {
    setBusy(true);
    try {
      const atualizado = await fn();
      if (redirectId) {
        toast.success(okMsg);
        router.push(`/compras/pedidos/editar/${redirectId}`);
        return;
      }
      setPedido(atualizado);
      toast.success(okMsg);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Falha na ação.');
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

  const tokenOrThrow = () => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Sessão expirada.');
    return token;
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
          <Button asChild variant="outline">
            <Link href={`/compras/pedidos/${pedido.id}/visualizar`}>
              Visualizar / imprimir
            </Link>
          </Button>
          {(pedido.status === 'ENVIADO' ||
            pedido.status === 'PARCIAL' ||
            pedido.status === 'APROVADO' ||
            pedido.status === 'ATENDIDO') && (
            <>
              <Button asChild variant="outline">
                <Link href={`/compras/pedidos/${pedido.id}/recebimentos/novo`}>
                  Receber material
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/compras/pedidos/${pedido.id}/aceites/novo`}>
                  Aceitar serviço
                </Link>
              </Button>
            </>
          )}
          {pedido.status === 'RASCUNHO' && (
            <Button
              disabled={busy}
              variant="outline"
              onClick={() =>
                void run(
                  () =>
                    comprasApi.enviarAprovacaoPedido(id, tokenOrThrow()),
                  'Pedido enviado para aprovação.',
                )
              }
            >
              Enviar aprovação
            </Button>
          )}
          {(pedido.status === 'RASCUNHO' ||
            pedido.status === 'EM_APROVACAO') && (
            <Button
              disabled={busy}
              onClick={() =>
                void run(
                  () => comprasApi.aprovarPedido(id, tokenOrThrow()),
                  'Pedido aprovado.',
                )
              }
            >
              Aprovar
            </Button>
          )}
          {pedido.status === 'EM_APROVACAO' && (
            <Button
              disabled={busy}
              variant="destructive"
              onClick={() =>
                void run(
                  () =>
                    comprasApi.rejeitarPedido(id, { motivo: 'Rejeitado' }, tokenOrThrow()),
                  'Pedido rejeitado.',
                )
              }
            >
              Rejeitar
            </Button>
          )}
          {pedido.status === 'APROVADO' && (
            <Button
              disabled={busy}
              onClick={() =>
                void run(
                  () => comprasApi.enviarPedido(id, tokenOrThrow()),
                  'Pedido enviado ao fornecedor.',
                )
              }
            >
              Enviar ao fornecedor
            </Button>
          )}
          {(pedido.status === 'APROVADO' ||
            pedido.status === 'ENVIADO' ||
            pedido.status === 'PARCIAL') && (
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => setSubstOpen(true)}
            >
              Substituir fornecedor
            </Button>
          )}
          {pedido.status !== 'CANCELADO' &&
            pedido.status !== 'CONCLUIDO' &&
            pedido.status !== 'ATENDIDO' &&
            pedido.status !== 'REJEITADO' && (
              <Button
                disabled={busy}
                variant="destructive"
                onClick={() => setCancelOpen(true)}
              >
                Cancelar
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

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-cancel">Motivo</Label>
            <Textarea
              id="motivo-cancel"
              value={cancelMotivo}
              onChange={(e) => setCancelMotivo(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Fechar
            </Button>
            <Button
              variant="destructive"
              disabled={busy || !cancelMotivo.trim()}
              onClick={() =>
                void run(
                  () =>
                    comprasApi.cancelarPedido(
                      id,
                      { motivo: cancelMotivo.trim() },
                      tokenOrThrow(),
                    ),
                  'Pedido cancelado.',
                ).then(() => {
                  setCancelOpen(false);
                  setCancelMotivo('');
                })
              }
            >
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={substOpen} onOpenChange={setSubstOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Substituir fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O pedido atual será cancelado e um novo rascunho será criado com
              o fornecedor substituto (histórico preservado).
            </p>
            <div className="space-y-2">
              <Label>Novo fornecedor</Label>
              <Select
                value={substFornecedorId}
                onValueChange={setSubstFornecedorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores
                    .filter((f) => f.id !== pedido.fornecedor_id)
                    .map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo-subst">Motivo</Label>
              <Input
                id="motivo-subst"
                value={substMotivo}
                onChange={(e) => setSubstMotivo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubstOpen(false)}>
              Fechar
            </Button>
            <Button
              disabled={
                busy || !substFornecedorId || !substMotivo.trim()
              }
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const novo = await comprasApi.substituirFornecedorPedido(
                      id,
                      {
                        fornecedor_id: substFornecedorId,
                        motivo: substMotivo.trim(),
                      },
                      tokenOrThrow(),
                    );
                    toast.success(
                      `Pedido substituto ${novo.numero} criado.`,
                    );
                    setSubstOpen(false);
                    router.push(`/compras/pedidos/editar/${novo.id}`);
                  } catch (error) {
                    console.error(error);
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : 'Falha na substituição.',
                    );
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              Confirmar substituição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
