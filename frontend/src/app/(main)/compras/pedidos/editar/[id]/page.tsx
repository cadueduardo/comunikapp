'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FornecedorForm,
  type FornecedorFormValues,
} from '@/app/(main)/fornecedores/fornecedor-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  comprasApi,
  contasPagarApi,
  fornecedoresApi,
  type FornecedorApi,
  type PedidoCompraApi,
  type TipoFornecedorApi,
} from '@/lib/api-client';
import { statusPedidoLabel } from '../../columns';
import {
  PedidoForm,
  PedidoFormData,
  PedidoFormValues,
} from '../../pedido-form';

/** Espelha `assertTipoFornecedorCompativel` do backend. */
function tiposFornecedorPermitidos(
  itens: Array<{ tipo?: string }> | undefined,
): TipoFornecedorApi[] {
  const tipos = new Set((itens ?? []).map((i) => String(i.tipo ?? '')));
  const hasMaterial = tipos.has('MATERIAL');
  const hasServico = tipos.has('SERVICO');

  if (hasMaterial && hasServico) return ['AMBOS'];
  if (hasMaterial) return ['INSUMO', 'AMBOS'];
  if (hasServico) return ['TERCEIRIZADO', 'AMBOS'];
  return ['INSUMO', 'TERCEIRIZADO', 'AMBOS'];
}

function tipoPadraoNovoFornecedor(
  permitidos: TipoFornecedorApi[],
): TipoFornecedorApi {
  if (permitidos.includes('AMBOS') && permitidos.length === 1) return 'AMBOS';
  if (permitidos.includes('TERCEIRIZADO')) return 'TERCEIRIZADO';
  if (permitidos.includes('INSUMO')) return 'INSUMO';
  return 'AMBOS';
}

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
  const [fornecedorFormOpen, setFornecedorFormOpen] = useState(false);
  const [nomeNovoFornecedor, setNomeNovoFornecedor] = useState('');
  const [salvandoFornecedor, setSalvandoFornecedor] = useState(false);

  const carregarFornecedores = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const data = await fornecedoresApi.getAll(token);
      setFornecedores(data.filter((f) => f.ativo !== false));
    } catch {
      /* lista opcional no modal */
    }
  };

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
    void carregarFornecedores();
  }, []);

  const tiposPermitidos = useMemo(
    () => tiposFornecedorPermitidos(pedido?.itens),
    [pedido?.itens],
  );

  const fornecedoresSubstituicao = useMemo(
    () =>
      fornecedores.filter(
        (f) =>
          f.id !== pedido?.fornecedor_id && tiposPermitidos.includes(f.tipo),
      ),
    [fornecedores, pedido?.fornecedor_id, tiposPermitidos],
  );

  const tipoNovoFornecedor = tipoPadraoNovoFornecedor(tiposPermitidos);

  const abrirCadastroFornecedor = (nome: string) => {
    setNomeNovoFornecedor(nome.trim());
    setFornecedorFormOpen(true);
  };

  const salvarFornecedorCompleto = async (values: FornecedorFormValues) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Sessão expirada.');
      return;
    }
    if (!tiposPermitidos.includes(values.tipo)) {
      toast.error(
        `Para este pedido, o fornecedor precisa ser do tipo: ${tiposPermitidos.join(' ou ')}.`,
      );
      return;
    }

    setSalvandoFornecedor(true);
    try {
      const criado = (await fornecedoresApi.create(
        values,
        token,
      )) as FornecedorApi;
      await carregarFornecedores();
      setSubstFornecedorId(criado.id);
      setFornecedorFormOpen(false);
      setNomeNovoFornecedor('');
      toast.success(`Fornecedor "${criado.nome}" cadastrado e selecionado.`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Falha ao cadastrar o fornecedor.',
      );
    } finally {
      setSalvandoFornecedor(false);
    }
  };

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
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => {
                  void (async () => {
                    setBusy(true);
                    try {
                      const conta = await contasPagarApi.createFromPedido(
                        id,
                        tokenOrThrow(),
                      );
                      toast.success('Conta a pagar gerada.');
                      router.push(`/financeiro/contas-pagar/${conta.id}`);
                    } catch (error) {
                      console.error(error);
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : 'Falha ao gerar conta a pagar.',
                      );
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              >
                Gerar conta a pagar
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

      <Dialog
        open={substOpen}
        onOpenChange={(open) => {
          setSubstOpen(open);
          if (!open) {
            setSubstFornecedorId('');
            setSubstMotivo('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Substituir fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O pedido atual será cancelado e um novo rascunho será criado com
              o fornecedor substituto (histórico preservado).
            </p>
            <p className="text-xs text-muted-foreground">
              Lista filtrada pelos tipos compatíveis com os itens deste pedido:{' '}
              <span className="font-medium text-foreground">
                {tiposPermitidos.join(', ')}
              </span>
              .
            </p>
            <div className="space-y-2">
              <Label>Novo fornecedor</Label>
              <Combobox
                options={fornecedoresSubstituicao.map((f) => ({
                  value: f.id,
                  label: `${f.nome}${f.tipo ? ` (${f.tipo})` : ''}`,
                }))}
                value={substFornecedorId}
                onChange={setSubstFornecedorId}
                placeholder="Selecione ou busque…"
                searchPlaceholder="Buscar fornecedor…"
                emptyPlaceholder="Nenhum fornecedor compatível."
                onCreateDetailed={abrirCadastroFornecedor}
                detailedCreatePlaceholder="Cadastrar fornecedor completo"
                createPlaceholder="Criar fornecedor"
              />
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

      <Dialog
        open={fornecedorFormOpen}
        onOpenChange={(open) => {
          if (!salvandoFornecedor) setFornecedorFormOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Cadastrar fornecedor</DialogTitle>
            <DialogDescription>
              Mesmo formulário do cadastro de fornecedores. Ao salvar, ele será
              selecionado nesta substituição.
            </DialogDescription>
          </DialogHeader>
          <FornecedorForm
            key={`${nomeNovoFornecedor}-${tipoNovoFornecedor}`}
            initialData={{
              nome: nomeNovoFornecedor,
              tipo: tipoNovoFornecedor,
            }}
            onSave={salvarFornecedorCompleto}
            onCancel={() => setFornecedorFormOpen(false)}
            loading={salvandoFornecedor}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
