'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
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
import { comprasApi } from '@/lib/api-client';

type Visualizacao = {
  pedido?: {
    numero?: string;
    status?: string;
    total?: number | string;
    subtotal?: number | string;
    desconto?: number | string;
    frete?: number | string;
    condicao_pagamento?: string | null;
    observacoes?: string | null;
    data_prevista?: string | null;
    itens?: Array<{
      id: string;
      tipo: string;
      descricao_snapshot: string;
      quantidade: number | string;
      unidade_snapshot: string;
      preco_unitario: number | string;
      total: number | string;
    }>;
  };
  fornecedor?: {
    nome?: string;
    cnpj_cpf?: string | null;
    email?: string | null;
    telefone?: string | null;
    cidade?: string | null;
    estado?: string | null;
  };
  loja?: { nome?: string };
};

const money = (v: number | string | undefined) =>
  Number(v ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

export default function VisualizarPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<Visualizacao | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const res = await comprasApi.getPedidoVisualizacao(id, token);
        setData(res as Visualizacao);
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar visualização.',
        );
      } finally {
        setLoading(false);
      }
    };
    void carregar();
  }, [id]);

  if (loading) {
    return <p className="text-muted-foreground">Carregando visualização...</p>;
  }

  if (!data?.pedido) {
    return <p>Pedido não encontrado.</p>;
  }

  const pedido = data.pedido;

  return (
    <div className="mx-auto max-w-4xl space-y-6 print:max-w-none">
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visualização do pedido</h1>
          <p className="text-muted-foreground">{pedido.numero}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={() => window.print()}>
            Imprimir / PDF
          </Button>
          <Button asChild variant="outline">
            <Link href={`/compras/pedidos/editar/${id}`}>Voltar</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {data.loja?.nome ?? 'Comunikapp'} — Pedido {pedido.numero}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Fornecedor</p>
            <p className="font-medium">{data.fornecedor?.nome}</p>
            <p className="text-sm">{data.fornecedor?.cnpj_cpf}</p>
            <p className="text-sm">
              {[data.fornecedor?.cidade, data.fornecedor?.estado]
                .filter(Boolean)
                .join(' / ')}
            </p>
            <p className="text-sm">{data.fornecedor?.email}</p>
            <p className="text-sm">{data.fornecedor?.telefone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{pedido.status}</p>
            {pedido.data_prevista && (
              <p className="mt-2 text-sm">
                Previsão:{' '}
                {new Date(pedido.data_prevista).toLocaleDateString('pt-BR')}
              </p>
            )}
            {pedido.condicao_pagamento && (
              <p className="text-sm">
                Condição: {pedido.condicao_pagamento}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Itens</CardTitle>
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
              {(pedido.itens ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.tipo}</TableCell>
                  <TableCell>{item.descricao_snapshot}</TableCell>
                  <TableCell>
                    {item.quantidade} {item.unidade_snapshot}
                  </TableCell>
                  <TableCell>{money(item.preco_unitario)}</TableCell>
                  <TableCell>{money(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 space-y-1 text-right text-sm">
            <p>Subtotal: {money(pedido.subtotal)}</p>
            <p>Desconto: {money(pedido.desconto)}</p>
            <p>Frete: {money(pedido.frete)}</p>
            <p className="text-base font-semibold">
              Total: {money(pedido.total)}
            </p>
          </div>
          {pedido.observacoes && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
              {pedido.observacoes}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
