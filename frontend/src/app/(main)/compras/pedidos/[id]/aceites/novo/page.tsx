'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { comprasApi, type PedidoCompraApi } from '@/lib/api-client';

type Linha = {
  pedido_item_id: string;
  descricao: string;
  quantidade_pedido: number;
  quantidade_aceita: string;
};

export default function NovoAceiteServicoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pedidoId = params.id;
  const [pedido, setPedido] = useState<PedidoCompraApi | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [observacao, setObservacao] = useState('');
  const [aceiteFinal, setAceiteFinal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const p = await comprasApi.getPedido(pedidoId, token);
        setPedido(p);
        const servicos = (p.itens ?? []).filter((i) => i.tipo === 'SERVICO');
        setLinhas(
          servicos.map((i) => {
            const qtd = Number(i.quantidade);
            const aceita = Number(
              (i as { quantidade_aceita?: number | string }).quantidade_aceita ??
                0,
            );
            const pendente = Math.max(0, qtd - aceita);
            return {
              pedido_item_id: i.id,
              descricao: i.descricao_snapshot,
              quantidade_pedido: qtd,
              quantidade_aceita: String(pendente || 0),
            };
          }),
        );
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : 'Erro ao carregar pedido.',
        );
      } finally {
        setLoading(false);
      }
    };
    void carregar();
  }, [pedidoId]);

  const podeAceitar = useMemo(
    () =>
      !!pedido &&
      ['ENVIADO', 'PARCIAL', 'APROVADO', 'ATENDIDO'].includes(pedido.status),
    [pedido],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const itens = linhas
      .filter((l) => Number(l.quantidade_aceita) > 0)
      .map((l) => ({
        pedido_item_id: l.pedido_item_id,
        quantidade_aceita: Number(l.quantidade_aceita),
      }));

    if (!itens.length) {
      toast.error('Informe quantidade aceita em ao menos um serviço.');
      return;
    }

    setSaving(true);
    try {
      const criado = await comprasApi.createAceite(
        pedidoId,
        {
          observacao: observacao || undefined,
          aceite_final: aceiteFinal,
          confirmar: true,
          itens,
        },
        token,
      );
      toast.success(`Aceite ${criado.numero} confirmado.`);
      router.push(`/compras/pedidos/editar/${pedidoId}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao registrar aceite.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  if (!pedido) {
    return <p>Pedido não encontrado.</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Novo aceite de serviço</h1>
        <p className="mt-1 text-muted-foreground">
          Pedido {pedido.numero} — confirmação parcial ou final da execução.
        </p>
      </div>

      {linhas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Este pedido não possui itens SERVICO.
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          {linhas.map((linha, index) => (
            <Card key={linha.pedido_item_id}>
              <CardHeader>
                <CardTitle className="text-base">{linha.descricao}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Contratado: {linha.quantidade_pedido}
                </p>
              </CardHeader>
              <CardContent>
                <div className="max-w-xs space-y-2">
                  <Label>Quantidade aceita</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={linha.quantidade_aceita}
                    onChange={(e) => {
                      const next = [...linhas];
                      next[index] = {
                        ...linha,
                        quantidade_aceita: e.target.value,
                      };
                      setLinhas(next);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center gap-3">
            <Checkbox
              id="aceite-final"
              checked={aceiteFinal}
              onCheckedChange={(v) => setAceiteFinal(v === true)}
            />
            <Label htmlFor="aceite-final">Aceite final</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs">Observação</Label>
            <Textarea
              id="obs"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild type="button" variant="outline">
              <Link href={`/compras/pedidos/editar/${pedidoId}`}>Voltar</Link>
            </Button>
            <Button type="submit" disabled={saving || !podeAceitar}>
              {saving ? 'Salvando…' : 'Confirmar aceite'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
