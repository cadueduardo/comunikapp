'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { comprasApi, type PedidoCompraApi } from '@/lib/api-client';

export default function PedidoDetalhePage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<PedidoCompraApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const data = await comprasApi.getPedido(params.id, token);
      setItem(data);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao carregar pedido.',
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const aprovar = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || !item) return;
    setBusy(true);
    try {
      const atualizado = await comprasApi.aprovarPedido(item.id, token);
      setItem(atualizado);
      toast.success('Pedido aprovado.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Falha ao aprovar.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Carregando…</p>;
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <p>Pedido não encontrado.</p>
        <Button asChild variant="outline">
          <Link href="/compras/pedidos">Voltar</Link>
        </Button>
      </div>
    );
  }

  const podeAprovar =
    item.status === 'RASCUNHO' || item.status === 'EM_APROVACAO';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{item.numero}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge>{item.status}</Badge>
            <span className="text-sm text-muted-foreground">
              {item.fornecedor?.nome ?? item.fornecedor_id} ·{' '}
              {Number(item.total).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {podeAprovar && (
            <Button disabled={busy} onClick={() => void aprovar()}>
              Aprovar
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/compras/pedidos">Voltar</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(item.itens ?? []).map((linha) => (
                <TableRow key={linha.id}>
                  <TableCell>{linha.tipo}</TableCell>
                  <TableCell>{linha.descricao_snapshot}</TableCell>
                  <TableCell>
                    {linha.quantidade} {linha.unidade_snapshot}
                  </TableCell>
                  <TableCell>
                    {Number(linha.preco_unitario).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </TableCell>
                  <TableCell>
                    {Number(linha.total).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
