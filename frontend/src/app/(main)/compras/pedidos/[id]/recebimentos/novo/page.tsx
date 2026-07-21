'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  estoqueApi,
  type PedidoCompraApi,
} from '@/lib/api-client';

type Localizacao = { id: string; codigo?: string; nome?: string };

type Linha = {
  pedido_item_id: string;
  descricao: string;
  pendente: number;
  quantidade_recebida: string;
  quantidade_aceita: string;
  quantidade_recusada: string;
  localizacao_id: string;
};

export default function NovoRecebimentoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pedidoId = params.id;
  const [pedido, setPedido] = useState<PedidoCompraApi | null>(null);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const [p, locs] = await Promise.all([
          comprasApi.getPedido(pedidoId, token),
          estoqueApi.getLocalizacoes(token).catch(() => []),
        ]);
        setPedido(p);
        const locsArr = Array.isArray(locs)
          ? locs
          : ((locs as { data?: Localizacao[] })?.data ?? []);
        setLocalizacoes(locsArr);
        const materiais = (p.itens ?? []).filter((i) => i.tipo === 'MATERIAL');
        setLinhas(
          materiais.map((i) => {
            const qtd = Number(i.quantidade);
            const rec = Number(
              (i as { quantidade_recebida?: number | string })
                .quantidade_recebida ?? 0,
            );
            const pendente = Math.max(0, qtd - rec);
            return {
              pedido_item_id: i.id,
              descricao: i.descricao_snapshot,
              pendente,
              quantidade_recebida: String(pendente || 0),
              quantidade_aceita: String(pendente || 0),
              quantidade_recusada: '0',
              localizacao_id: locsArr[0]?.id ?? '',
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

  const podeReceber = useMemo(
    () =>
      !!pedido &&
      ['ENVIADO', 'PARCIAL', 'APROVADO', 'ATENDIDO'].includes(pedido.status),
    [pedido],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token || !pedido) return;

    const itens = linhas
      .filter((l) => Number(l.quantidade_aceita) > 0 || Number(l.quantidade_recebida) > 0)
      .map((l) => ({
        pedido_item_id: l.pedido_item_id,
        quantidade_recebida: Number(l.quantidade_recebida),
        quantidade_aceita: Number(l.quantidade_aceita),
        quantidade_recusada: Number(l.quantidade_recusada || 0),
        localizacao_id: l.localizacao_id || undefined,
      }));

    if (!itens.length) {
      toast.error('Informe quantidade em ao menos um item.');
      return;
    }

    setSaving(true);
    try {
      const criado = await comprasApi.createRecebimento(
        pedidoId,
        {
          observacao: observacao || undefined,
          confirmar: true,
          itens,
        },
        token,
      );
      toast.success(`Recebimento ${criado.numero} confirmado.`);
      router.push(`/compras/pedidos/editar/${pedidoId}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao registrar recebimento.',
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
        <h1 className="text-3xl font-bold">Novo recebimento</h1>
        <p className="mt-1 text-muted-foreground">
          Pedido {pedido.numero} — entrada de material no estoque (custo médio).
        </p>
      </div>

      {!podeReceber && (
        <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">
          Pedido precisa estar aprovado/enviado/parcial para receber.
        </p>
      )}

      {linhas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Este pedido não possui itens MATERIAL.
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          {linhas.map((linha, index) => (
            <Card key={linha.pedido_item_id}>
              <CardHeader>
                <CardTitle className="text-base">{linha.descricao}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pendente: {linha.pendente}
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Recebida</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={linha.quantidade_recebida}
                    onChange={(e) => {
                      const next = [...linhas];
                      next[index] = {
                        ...linha,
                        quantidade_recebida: e.target.value,
                      };
                      setLinhas(next);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aceita (estoque)</Label>
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
                <div className="space-y-2">
                  <Label>Recusada</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={linha.quantidade_recusada}
                    onChange={(e) => {
                      const next = [...linhas];
                      next[index] = {
                        ...linha,
                        quantidade_recusada: e.target.value,
                      };
                      setLinhas(next);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Localização</Label>
                  <Select
                    value={linha.localizacao_id}
                    onValueChange={(v) => {
                      const next = [...linhas];
                      next[index] = { ...linha, localizacao_id: v };
                      setLinhas(next);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      {localizacoes.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.codigo || l.nome || l.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}

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
            <Button type="submit" disabled={saving || !podeReceber}>
              {saving ? 'Salvando…' : 'Confirmar recebimento'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
