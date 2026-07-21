'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calculator, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  posCalculoApi,
  type HistoricoFechamentoEventoApi,
  type PosCalculoResponse,
  type PosCalculoTrocaFornecedorApi,
  type StatusFechamentoFinanceiroOsApi,
} from '@/lib/api-client';

function classeDesvio(valor: number): string | undefined {
  if (valor > 0) return 'text-destructive';
  if (valor < 0) return 'text-emerald-600 dark:text-emerald-400';
  return undefined;
}

function formatarDataHora(valor?: string | null): string {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR');
}

function labelTipoTroca(tipo: PosCalculoTrocaFornecedorApi['tipo']): string {
  if (tipo === 'SUBSTITUICAO_PEDIDO') return 'Substituição de pedido';
  if (tipo === 'DESVIO_PREVISTO') return 'Desvio previsto × efetivo';
  return tipo;
}

function labelAcaoHistorico(acao: string): string {
  if (acao === 'FECHAR') return 'Fechamento';
  if (acao === 'REABRIR') return 'Reabertura';
  return acao;
}

function extrairTextoDados(
  dados: HistoricoFechamentoEventoApi['dados'],
  chave: 'motivo' | 'observacao',
): string | null {
  if (!dados || typeof dados !== 'object') return null;
  const valor = dados[chave];
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
}

function badgeSeveridade(
  severidade?: PosCalculoResponse['pendencias'][number]['severidade'],
) {
  if (severidade === 'critico') {
    return <Badge variant="destructive">Crítico</Badge>;
  }
  if (severidade === 'alerta') {
    return (
      <Badge
        variant="secondary"
        className="border-amber-500/50 text-amber-700 dark:text-amber-400"
      >
        Alerta
      </Badge>
    );
  }
  if (severidade === 'info') {
    return <Badge variant="outline">Info</Badge>;
  }
  return null;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function labelStatusFechamento(status: StatusFechamentoFinanceiroOsApi): string {
  const map: Record<StatusFechamentoFinanceiroOsApi, string> = {
    PENDENTE: 'Pendente',
    EM_CONCILIACAO: 'Em conciliação',
    FECHADO: 'Fechado',
    REABERTO: 'Reaberto',
  };
  return map[status] ?? status;
}

function ResumoValor({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: number;
  destaque?: 'positivo' | 'negativo';
}) {
  const classeValor =
    destaque === 'negativo'
      ? 'text-destructive'
      : destaque === 'positivo'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-foreground';

  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${classeValor}`}>
        {formatarMoeda(valor)}
      </p>
    </div>
  );
}

export function OsPosCalculoPanel({
  osId,
  showJson = false,
}: {
  osId: string;
  showJson?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resultado, setResultado] = useState<PosCalculoResponse | null>(null);
  const [historico, setHistorico] = useState<HistoricoFechamentoEventoApi[]>(
    [],
  );
  const [reabrirOpen, setReabrirOpen] = useState(false);
  const [motivoReabertura, setMotivoReabertura] = useState('');

  const carregar = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Sessão expirada.');
      setLoading(false);
      return;
    }
    try {
      const [data, hist] = await Promise.all([
        posCalculoApi.obterPorOs(osId, token),
        posCalculoApi.historico(osId, token).catch(() => null),
      ]);
      setResultado(data);
      setHistorico(hist?.historico ?? []);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao carregar pós-cálculo da OS.',
      );
      setResultado(null);
      setHistorico([]);
    } finally {
      setLoading(false);
    }
  }, [osId]);

  useEffect(() => {
    setLoading(true);
    void carregar();
  }, [carregar]);

  const tokenOrThrow = () => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Sessão expirada.');
    return token;
  };

  const fechar = async () => {
    setBusy(true);
    try {
      const res = await posCalculoApi.fechar(osId, tokenOrThrow());
      if (res.avisos?.length) {
        toast.warning(res.avisos.join(' · '));
      } else {
        toast.success(
          res.ja_estava_fechado
            ? 'Financeiro já estava fechado.'
            : 'Financeiro da OS fechado.',
        );
      }
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao fechar financeiro.',
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmarReabrir = async () => {
    const motivo = motivoReabertura.trim();
    if (!motivo) {
      toast.error('Informe o motivo da reabertura.');
      return;
    }
    setBusy(true);
    try {
      await posCalculoApi.reabrir(osId, { motivo }, tokenOrThrow());
      toast.success('Financeiro reaberto.');
      setReabrirOpen(false);
      setMotivoReabertura('');
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao reabrir financeiro.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Carregando pós-cálculo...</p>
    );
  }

  if (!resultado) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Não foi possível carregar o pós-cálculo desta OS.
          <div className="mt-4">
            <Button variant="outline" onClick={() => void carregar()}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = resultado.status_fechamento;
  const fechado = status === 'FECHADO';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            Pós-cálculo · OS {resultado.os_numero ?? osId.slice(0, 8)}
          </h2>
          <Badge variant={fechado ? 'default' : 'secondary'}>
            {labelStatusFechamento(status)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void carregar()}
          >
            Atualizar
          </Button>
          {!fechado ? (
            <Button size="sm" disabled={busy} onClick={() => void fechar()}>
              <Lock className="mr-2 h-4 w-4" />
              Fechar financeiro
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setReabrirOpen(true)}
            >
              <Unlock className="mr-2 h-4 w-4" />
              Reabrir
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita</CardTitle>
            <CardDescription>{resultado.meta.moeda}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResumoValor label="Prevista" valor={resultado.receita.prevista} />
            <ResumoValor label="Faturada" valor={resultado.receita.faturada} />
            <ResumoValor label="Recebida" valor={resultado.receita.recebida} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custos</CardTitle>
            <CardDescription>
              Previsto → comprometido → incorrido → pago
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ResumoValor label="Previsto" valor={resultado.custos.previsto} />
            <ResumoValor
              label="Comprometido"
              valor={resultado.custos.comprometido}
            />
            <ResumoValor label="Incorrido" valor={resultado.custos.incorrido} />
            <ResumoValor label="Faturado" valor={resultado.custos.faturado} />
            <ResumoValor label="Pago" valor={resultado.custos.pago} />
            <ResumoValor label="A pagar" valor={resultado.custos.a_pagar} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Indicadores</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ResumoValor
            label="Desvio (pago)"
            valor={resultado.desvio_pago}
            destaque={
              resultado.desvio_pago > 0
                ? 'negativo'
                : resultado.desvio_pago < 0
                  ? 'positivo'
                  : undefined
            }
          />
          <ResumoValor
            label="Desvio (comprometido)"
            valor={resultado.desvio_comprometido}
            destaque={
              resultado.desvio_comprometido > 0 ? 'negativo' : undefined
            }
          />
          <ResumoValor
            label="Margem prevista"
            valor={resultado.margem_prevista}
          />
          <ResumoValor label="Margem caixa" valor={resultado.margem_caixa} />
        </CardContent>
      </Card>

      {resultado.categorias.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Previsto</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead className="text-right">Desvio pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.categorias.map((cat) => (
                    <TableRow key={cat.categoria}>
                      <TableCell className="font-medium">{cat.label}</TableCell>
                      <TableCell className="text-right">
                        {formatarMoeda(cat.previsto)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatarMoeda(cat.pago)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${classeDesvio(cat.desvio_pago) ?? ''}`}
                      >
                        {formatarMoeda(cat.desvio_pago)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-3 md:hidden">
              {resultado.categorias.map((cat) => (
                <div
                  key={cat.categoria}
                  className="space-y-2 rounded-lg border bg-card p-3"
                >
                  <p className="font-medium">{cat.label}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Previsto</p>
                      <p>{formatarMoeda(cat.previsto)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pago</p>
                      <p>{formatarMoeda(cat.pago)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {resultado.trocas_fornecedor.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trocas de fornecedor</CardTitle>
            <CardDescription>
              Substituições auditadas e desvios entre previsto e efetivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {resultado.trocas_fornecedor.map((troca, i) => (
                <li
                  key={`${troca.tipo}-${troca.pedido_id ?? i}-${troca.em ?? i}`}
                  className="rounded-md border bg-muted/40 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{labelTipoTroca(troca.tipo)}</Badge>
                    {troca.pedido_numero ? (
                      <span className="text-muted-foreground">
                        Pedido {troca.pedido_numero}
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {formatarDataHora(troca.em)}
                    </span>
                  </div>
                  <p className="mt-1">
                    <span className="text-muted-foreground">Previsto: </span>
                    {troca.fornecedor_previsto_nome ?? '—'}
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="text-muted-foreground">Efetivo: </span>
                    {troca.fornecedor_efetivo_nome ?? '—'}
                  </p>
                  {troca.motivo ? (
                    <p className="mt-1 text-muted-foreground">
                      Motivo: {troca.motivo}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {resultado.pendencias.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pendências</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {resultado.pendencias.map((p, i) => (
                <li
                  key={`${p.tipo}-${i}`}
                  className="flex flex-col gap-2 rounded-md border bg-muted/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium">{p.tipo}: </span>
                    {p.descricao}
                  </div>
                  {badgeSeveridade(p.severidade)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Histórico de fechamento
          </CardTitle>
          <CardDescription>
            Fechamentos, reaberturas e justificativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum evento de fechamento registrado ainda.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {historico.map((evento) => {
                const motivo = extrairTextoDados(evento.dados, 'motivo');
                const observacao = extrairTextoDados(
                  evento.dados,
                  'observacao',
                );
                return (
                  <li
                    key={evento.id}
                    className="rounded-md border bg-muted/40 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          evento.acao === 'REABRIR' ? 'secondary' : 'default'
                        }
                      >
                        {labelAcaoHistorico(evento.acao)}
                      </Badge>
                      {evento.status_anterior || evento.status_novo ? (
                        <span className="text-xs text-muted-foreground">
                          {evento.status_anterior
                            ? labelStatusFechamento(
                                evento.status_anterior as StatusFechamentoFinanceiroOsApi,
                              )
                            : '—'}
                          {' → '}
                          {evento.status_novo
                            ? labelStatusFechamento(
                                evento.status_novo as StatusFechamentoFinanceiroOsApi,
                              )
                            : '—'}
                        </span>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {formatarDataHora(evento.criado_em)}
                      </span>
                    </div>
                    {evento.usuario?.nome_completo ? (
                      <p className="mt-1 text-muted-foreground">
                        Por {evento.usuario.nome_completo}
                      </p>
                    ) : null}
                    {motivo ? (
                      <p className="mt-1">
                        <span className="font-medium">Motivo: </span>
                        {motivo}
                      </p>
                    ) : null}
                    {observacao ? (
                      <p className="mt-1 text-muted-foreground">
                        Observação: {observacao}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {resultado.meta.limitacoes?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Limitações</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {resultado.meta.limitacoes.map((nota) => (
                <li key={nota}>{nota}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {showJson ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resposta JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={reabrirOpen} onOpenChange={setReabrirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir financeiro da OS</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-reabertura">Motivo (obrigatório)</Label>
            <Textarea
              id="motivo-reabertura"
              value={motivoReabertura}
              onChange={(e) => setMotivoReabertura(e.target.value)}
              rows={3}
              placeholder="Ex.: ajuste de apropriação pendente"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReabrirOpen(false)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button disabled={busy} onClick={() => void confirmarReabrir()}>
              Confirmar reabertura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
