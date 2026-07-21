'use client';

import { ArrowLeft, Calculator, Search } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { posCalculoApi, PosCalculoResponse } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function classeDesvio(valor: number): string | undefined {
  if (valor > 0) return 'text-destructive';
  if (valor < 0) return 'text-emerald-600 dark:text-emerald-400';
  return undefined;
}

function badgeSeveridade(
  severidade?: PosCalculoResponse['pendencias'][number]['severidade'],
) {
  if (severidade === 'critico') {
    return <Badge variant="destructive">Crítico</Badge>;
  }
  if (severidade === 'alerta') {
    return (
      <Badge variant="secondary" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
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

export default function PosCalculoPage() {
  const [osId, setOsId] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<PosCalculoResponse | null>(null);

  async function buscar(event: FormEvent) {
    event.preventDefault();
    const id = osId.trim();
    if (!id) {
      toast.error('Informe o ID da ordem de serviço.');
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const data = await posCalculoApi.obterPorOs(id, token);
      setResultado(data);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao carregar pós-cálculo da OS.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Pós-cálculo (OS)
          </h1>
          <p className="mt-1 text-muted-foreground">
            Previsto × real por ordem de serviço — receitas, custos e margens.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/financeiro">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Consultar OS
          </CardTitle>
          <CardDescription>
            Informe o ID (cuid) da ordem de serviço para carregar o pós-cálculo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => void buscar(e)}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="os-id">ID da OS</Label>
              <Input
                id="os-id"
                value={osId}
                onChange={(e) => setOsId(e.target.value)}
                placeholder="Ex.: clxxxxxxxx..."
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={loading}>
              <Calculator className="mr-2 h-4 w-4" />
              {loading ? 'Carregando...' : 'Calcular'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {resultado ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receita</CardTitle>
                <CardDescription>
                  OS {resultado.os_numero ?? resultado.os_id.slice(0, 8)} ·{' '}
                  {resultado.meta.moeda}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ResumoValor
                  label="Prevista"
                  valor={resultado.receita.prevista}
                />
                <ResumoValor
                  label="Faturada"
                  valor={resultado.receita.faturada}
                />
                <ResumoValor
                  label="Recebida"
                  valor={resultado.receita.recebida}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Custos</CardTitle>
                <CardDescription>
                  Estágios previsto → comprometido → incorrido → pago
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <ResumoValor
                  label="Previsto"
                  valor={resultado.custos.previsto}
                />
                <ResumoValor
                  label="Comprometido"
                  valor={resultado.custos.comprometido}
                />
                <ResumoValor
                  label="Incorrido"
                  valor={resultado.custos.incorrido}
                />
                <ResumoValor
                  label="Faturado"
                  valor={resultado.custos.faturado}
                />
                <ResumoValor label="Pago" valor={resultado.custos.pago} />
                <ResumoValor
                  label="A pagar"
                  valor={resultado.custos.a_pagar}
                />
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
              <ResumoValor
                label="Margem caixa"
                valor={resultado.margem_caixa}
              />
            </CardContent>
          </Card>

          {resultado.categorias.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por categoria</CardTitle>
                <CardDescription>
                  Material, serviço e despesa — previsto × real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Previsto</TableHead>
                        <TableHead className="text-right">Comprometido</TableHead>
                        <TableHead className="text-right">Incorrido</TableHead>
                        <TableHead className="text-right">Faturado</TableHead>
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
                            {formatarMoeda(cat.comprometido)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatarMoeda(cat.incorrido)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatarMoeda(cat.faturado)}
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
                      className="rounded-lg border bg-card p-3 space-y-2"
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
                        <div>
                          <p className="text-xs text-muted-foreground">Comprometido</p>
                          <p>{formatarMoeda(cat.comprometido)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Desvio pago</p>
                          <p className={classeDesvio(cat.desvio_pago)}>
                            {formatarMoeda(cat.desvio_pago)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

          {resultado.meta.limitacoes?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Limitações da agregação</CardTitle>
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
        </>
      ) : null}
    </div>
  );
}
