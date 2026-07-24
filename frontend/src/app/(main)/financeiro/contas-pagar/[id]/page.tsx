'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  contasPagarApi,
  type ContaPagarApi,
  type MetodoPagamentoFornecedorApi,
} from '@/lib/api-client';
import { financeiroModuleNav } from '@/lib/module-nav';
import {
  metodoPagamentoLabel,
  statusContaPagarLabel,
  statusParcelaContaPagarLabel,
} from '../columns';

function formatMoeda(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatData(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function ContaPagarDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [conta, setConta] = useState<ContaPagarApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pagamentoOpen, setPagamentoOpen] = useState(false);
  const [estornoOpen, setEstornoOpen] = useState(false);
  const [pagamentoIdEstorno, setPagamentoIdEstorno] = useState<string | null>(
    null,
  );
  const [valorPagamento, setValorPagamento] = useState('');
  const [dataPagamento, setDataPagamento] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [metodoPagamento, setMetodoPagamento] =
    useState<MetodoPagamentoFornecedorApi>('PIX');
  const [observacaoPagamento, setObservacaoPagamento] = useState('');
  const [motivoEstorno, setMotivoEstorno] = useState('');

  const carregar = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const data = await contasPagarApi.get(id, token);
      setConta(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar conta a pagar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, [id]);

  const tokenOrThrow = () => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Sessão expirada.');
    return token;
  };

  const abrirPagamento = () => {
    if (!conta) return;
    const saldo =
      Number(conta.valor_total) - Number(conta.valor_pago);
    setValorPagamento(saldo > 0 ? String(saldo) : '');
    setDataPagamento(new Date().toISOString().slice(0, 10));
    setMetodoPagamento('PIX');
    setObservacaoPagamento('');
    setPagamentoOpen(true);
  };

  const registrarPagamento = async () => {
    const valor = Number(valorPagamento);
    if (!valor || valor <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }
    setBusy(true);
    try {
      await contasPagarApi.registrarPagamento(
        id,
        {
          valor,
          data_pagamento: dataPagamento,
          metodo: metodoPagamento,
          referencia: observacaoPagamento.trim() || undefined,
        },
        tokenOrThrow(),
      );
      toast.success('Pagamento registrado.');
      setPagamentoOpen(false);
      await carregar();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Falha ao registrar pagamento.',
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmarEstorno = async () => {
    if (!pagamentoIdEstorno || !motivoEstorno.trim()) return;
    setBusy(true);
    try {
      await contasPagarApi.estornarPagamento(
        pagamentoIdEstorno,
        { motivo: motivoEstorno.trim() },
        tokenOrThrow(),
      );
      toast.success('Pagamento estornado.');
      setEstornoOpen(false);
      setPagamentoIdEstorno(null);
      setMotivoEstorno('');
      await carregar();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Falha ao estornar pagamento.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Carregando conta a pagar...</p>;
  }
  if (!conta) {
    return <p>Conta a pagar não encontrada.</p>;
  }

  const podeRegistrar =
    conta.status !== 'CANCELADA' && conta.status !== 'PAGA';
  const saldoAberto = Number(conta.valor_total) - Number(conta.valor_pago);

  return (
    <div>
      <div className="mb-8">
        <ModuleHeader
          nav={financeiroModuleNav}
          title="Conta a pagar"
          icon={<Banknote className="h-7 w-7 sm:h-8 sm:w-8" />}
          backHref="/financeiro/contas-pagar"
          subtitle={`${conta.numero_documento} · ${formatMoeda(conta.valor_total)}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {statusContaPagarLabel[conta.status] ?? conta.status}
              </Badge>
              {podeRegistrar ? (
                <Button disabled={busy} onClick={abrirPagamento}>
                  Registrar pagamento
                </Button>
              ) : null}
            </div>
          }
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Dados da conta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Fornecedor</p>
            <p className="font-medium">
              {conta.fornecedor?.nome ?? conta.fornecedor_id}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo documento</p>
            <p className="font-medium">{conta.tipo_documento}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Emissão</p>
            <p className="font-medium">{formatData(conta.data_emissao)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor total</p>
            <p className="font-medium">{formatMoeda(conta.valor_total)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor pago</p>
            <p className="font-medium">{formatMoeda(conta.valor_pago)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saldo em aberto</p>
            <p className="font-medium">{formatMoeda(saldoAberto)}</p>
          </div>
          {conta.pedido && (
            <div>
              <p className="text-sm text-muted-foreground">Pedido</p>
              <Button asChild variant="link" className="h-auto p-0 font-medium">
                <Link href={`/compras/pedidos/editar/${conta.pedido.id}`}>
                  {conta.pedido.numero}
                </Link>
              </Button>
            </div>
          )}
          {conta.observacao && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-sm text-muted-foreground">Observação</p>
              <p className="font-medium">{conta.observacao}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Parcelas</CardTitle>
        </CardHeader>
        <CardContent>
          {(conta.parcelas ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma parcela.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Previsto</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(conta.parcelas ?? []).map((parcela) => (
                  <TableRow key={parcela.id}>
                    <TableCell>{parcela.numero_parcela}</TableCell>
                    <TableCell>{formatData(parcela.data_vencimento)}</TableCell>
                    <TableCell>{formatMoeda(parcela.valor_previsto)}</TableCell>
                    <TableCell>{formatMoeda(parcela.valor_pago)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {statusParcelaContaPagarLabel[parcela.status] ??
                          parcela.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {(conta.pagamentos ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum pagamento registrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(conta.pagamentos ?? []).map((pagamento) => (
                  <TableRow key={pagamento.id}>
                    <TableCell>{formatData(pagamento.data_pagamento)}</TableCell>
                    <TableCell>{formatMoeda(pagamento.valor)}</TableCell>
                    <TableCell>
                      {metodoPagamentoLabel[pagamento.metodo] ??
                        pagamento.metodo}
                    </TableCell>
                    <TableCell>{pagamento.referencia ?? '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={pagamento.estornado ? 'outline' : 'secondary'}
                      >
                        {pagamento.estornado ? 'Estornado' : 'Confirmado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!pagamento.estornado && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => {
                            setPagamentoIdEstorno(pagamento.id);
                            setMotivoEstorno('');
                            setEstornoOpen(true);
                          }}
                        >
                          Estornar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={pagamentoOpen} onOpenChange={setPagamentoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor-pag">Valor</Label>
              <Input
                id="valor-pag"
                type="number"
                min="0.01"
                step="0.01"
                value={valorPagamento}
                onChange={(e) => setValorPagamento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-pag">Data do pagamento</Label>
              <Input
                id="data-pag"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select
                value={metodoPagamento}
                onValueChange={(v) =>
                  setMetodoPagamento(v as MetodoPagamentoFornecedorApi)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      'PIX',
                      'TED',
                      'BOLETO',
                      'DINHEIRO',
                      'CARTAO',
                      'OUTRO',
                    ] as MetodoPagamentoFornecedorApi[]
                  ).map((m) => (
                    <SelectItem key={m} value={m}>
                      {metodoPagamentoLabel[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs-pag">Observação</Label>
              <Textarea
                id="obs-pag"
                value={observacaoPagamento}
                onChange={(e) => setObservacaoPagamento(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagamentoOpen(false)}>
              Fechar
            </Button>
            <Button disabled={busy} onClick={() => void registrarPagamento()}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={estornoOpen} onOpenChange={setEstornoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estornar pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-estorno">Motivo</Label>
            <Textarea
              id="motivo-estorno"
              value={motivoEstorno}
              onChange={(e) => setMotivoEstorno(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEstornoOpen(false)}>
              Fechar
            </Button>
            <Button
              variant="destructive"
              disabled={busy || !motivoEstorno.trim()}
              onClick={() => void confirmarEstorno()}
            >
              Confirmar estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
