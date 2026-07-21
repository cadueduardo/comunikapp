'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
import { comprasApi, type SolicitacaoCompraApi } from '@/lib/api-client';

export default function SolicitacaoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<SolicitacaoCompraApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const data = await comprasApi.getSolicitacao(params.id, token);
      setItem(data);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao carregar solicitação.',
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const acao = async (
    fn: (id: string, token: string) => Promise<SolicitacaoCompraApi>,
    okMsg: string,
  ) => {
    const token = localStorage.getItem('access_token');
    if (!token || !item) return;
    setBusy(true);
    try {
      const atualizada = await fn(item.id, token);
      setItem(atualizada);
      toast.success(okMsg);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Falha na ação.');
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
        <p>Solicitação não encontrada.</p>
        <Button asChild variant="outline">
          <Link href="/compras/solicitacoes">Voltar</Link>
        </Button>
      </div>
    );
  }

  const podeEnviar =
    item.status === 'RASCUNHO' || item.status === 'DEVOLVIDA';
  const podeAprovar = item.status === 'SOLICITADA';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{item.numero}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge>{item.status}</Badge>
            <span className="text-sm text-muted-foreground">
              Prioridade {item.prioridade} · Origem {item.origem_tipo}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {podeEnviar && (
            <Button
              disabled={busy}
              onClick={() =>
                void acao(comprasApi.enviarSolicitacao, 'Solicitação enviada.')
              }
            >
              Enviar
            </Button>
          )}
          {podeAprovar && (
            <>
              <Button
                disabled={busy}
                onClick={() =>
                  void acao(
                    comprasApi.aprovarSolicitacao,
                    'Solicitação aprovada.',
                  )
                }
              >
                Aprovar
              </Button>
              <Button
                disabled={busy}
                variant="destructive"
                onClick={() =>
                  void acao(
                    (id, token) =>
                      comprasApi.rejeitarSolicitacao(id, {}, token),
                    'Solicitação rejeitada.',
                  )
                }
              >
                Rejeitar
              </Button>
            </>
          )}
          <Button asChild variant="outline">
            <Link href="/compras/solicitacoes">Voltar</Link>
          </Button>
        </div>
      </div>

      {item.justificativa && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Justificativa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{item.justificativa}</p>
          </CardContent>
        </Card>
      )}

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
                <TableHead>Unidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(item.itens ?? []).map((linha) => (
                <TableRow key={linha.id}>
                  <TableCell>{linha.tipo}</TableCell>
                  <TableCell>{linha.descricao}</TableCell>
                  <TableCell>{linha.quantidade}</TableCell>
                  <TableCell>{linha.unidade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        onClick={() => router.push('/compras/pedidos/novo')}
      >
        Ir para novo pedido
      </Button>
    </div>
  );
}
