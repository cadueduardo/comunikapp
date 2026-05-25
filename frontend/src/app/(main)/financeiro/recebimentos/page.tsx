'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Banknote,
  CalendarRange,
  CheckCircle2,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/contexts/UserContext';
import {
  exportarCobrancasCsv,
  fetchCobrancas,
  type CobrancaResumo,
  type FiltrosCobranca,
} from '@/lib/financeiro-api';
import { RegistrarRecebimentoDialog } from '@/components/financeiro/RegistrarRecebimentoDialog';
import { CancelarCobrancaDialog } from '@/components/financeiro/CancelarCobrancaDialog';

// ============================================================================
// Helpers
// ============================================================================

const FUNCOES_COM_VISAO_FINANCEIRA = new Set([
  'ADMIN',
  'MASTER',
  'GESTOR',
  'FINANCEIRO',
  'DONO',
]);

const STATUS_OPCOES: { value: string; label: string }[] = [
  { value: 'PREVISTA', label: 'Em prospeccao' },
  { value: 'PARCIAL_PAGO', label: 'Parcial pago' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'LIQUIDADO', label: 'Liquidado' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const STATUS_VARIANTE: Record<
  string,
  { label: string; classe: string }
> = {
  PREVISTA: { label: 'Em prospeccao', classe: 'bg-blue-100 text-blue-700 border-blue-200' },
  PARCIAL_PAGO: { label: 'Parcial pago', classe: 'bg-amber-100 text-amber-800 border-amber-200' },
  VENCIDO: { label: 'Vencido', classe: 'bg-red-100 text-red-700 border-red-200' },
  LIQUIDADO: { label: 'Liquidado', classe: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  CANCELADA: { label: 'Cancelada', classe: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
};

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarData(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
}

// ============================================================================
// Tela
// ============================================================================

export default function RecebimentosPage() {
  const { user, loading: userLoading } = useUser();

  const [cobrancas, setCobrancas] = useState<CobrancaResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meta, setMeta] = useState({ total: 0, pagina: 1, por_pagina: 25 });

  // filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('ALL');
  const [filtroInicio, setFiltroInicio] = useState<string>('');
  const [filtroFim, setFiltroFim] = useState<string>('');
  const [busca, setBusca] = useState<string>(''); // busca local por orcamento/cliente
  const [exportando, setExportando] = useState(false);

  // modais
  const [recebimentoTarget, setRecebimentoTarget] = useState<CobrancaResumo | null>(null);
  const [modoForcado, setModoForcado] = useState(false);
  const [cancelarTarget, setCancelarTarget] = useState<CobrancaResumo | null>(null);

  // Le query string inicial (?status=VENCIDO etc) — usado por links da Home.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status) setFiltroStatus(status);
  }, []);

  const filtrosBackend: FiltrosCobranca = useMemo(
    () => ({
      status: filtroStatus !== 'ALL' ? filtroStatus : undefined,
      data_inicio: filtroInicio ? new Date(filtroInicio).toISOString() : undefined,
      data_fim: filtroFim
        ? new Date(`${filtroFim}T23:59:59`).toISOString()
        : undefined,
      pagina: 1,
      por_pagina: 100,
    }),
    [filtroStatus, filtroInicio, filtroFim],
  );

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCobrancas(filtrosBackend);
      setCobrancas(res.data);
      setMeta(res.meta);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar cobrancas';
      toast.error(msg);
      setCobrancas([]);
    } finally {
      setLoading(false);
    }
  }, [filtrosBackend]);

  useEffect(() => {
    if (!userLoading && user) {
      carregar();
    }
  }, [userLoading, user, carregar]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  };

  const handleExportar = async () => {
    setExportando(true);
    try {
      await exportarCobrancasCsv(filtrosBackend);
      toast.success('CSV exportado');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao exportar CSV';
      toast.error(msg);
    } finally {
      setExportando(false);
    }
  };

  // Busca client-side por numero do orcamento ou cliente.
  const cobrancasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return cobrancas;
    return cobrancas.filter(
      (c) =>
        c.orcamento_numero.toLowerCase().includes(q) ||
        (c.cliente_nome ?? '').toLowerCase().includes(q) ||
        (c.orcamento_titulo ?? '').toLowerCase().includes(q),
    );
  }, [busca, cobrancas]);

  // Totais agregados das linhas filtradas (visualizadas).
  const totais = useMemo(() => {
    return cobrancasFiltradas.reduce(
      (acc, c) => {
        acc.total += Number(c.valor_total ?? 0);
        acc.recebido += Number(c.valor_recebido ?? 0);
        acc.saldo += Number(c.valor_saldo ?? 0);
        return acc;
      },
      { total: 0, recebido: 0, saldo: 0 },
    );
  }, [cobrancasFiltradas]);

  // Permissao basica de visualizacao da tela.
  const funcaoUpper = String(user?.funcao ?? '').toUpperCase();
  const temPermissaoVisualizar =
    !!user && FUNCOES_COM_VISAO_FINANCEIRA.has(funcaoUpper);
  // TODO Fase 6 follow-up: ler perfil_permissao real para granular
  // (registrar_recebimento, forcar_recebimento_total, cancelar_cobranca).
  const podeOperar = temPermissaoVisualizar;

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!temPermissaoVisualizar) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Auditoria de recebimentos"
          backHref="/dashboard"
          icon={<Banknote className="h-8 w-8" />}
          subtitle="Acompanhe cobrancas e recebimentos por cliente"
        />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Voce nao tem permissao para acessar a auditoria financeira.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria de recebimentos"
        backHref="/dashboard"
        icon={<Banknote className="h-8 w-8" />}
        subtitle="Acompanhe cobrancas e recebimentos por cliente"
        actions={
          <div className="flex gap-2">
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={handleExportar} disabled={exportando} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {exportando ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          </div>
        }
      />

      {/* Resumo de totais visiveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-700 uppercase font-medium">Valor total</p>
              <p className="text-xl font-bold text-blue-900 tabular-nums">
                {formatarMoeda(totais.total)}
              </p>
            </div>
            <Wallet className="h-6 w-6 text-blue-600" />
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-700 uppercase font-medium">Recebido</p>
              <p className="text-xl font-bold text-emerald-900 tabular-nums">
                {formatarMoeda(totais.recebido)}
              </p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 uppercase font-medium">Saldo aberto</p>
              <p className="text-xl font-bold text-amber-900 tabular-nums">
                {formatarMoeda(totais.saldo)}
              </p>
            </div>
            <Banknote className="h-6 w-6 text-amber-700" />
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filtros
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="status-filter" className="text-xs">
                Status
              </Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {STATUS_OPCOES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="data-inicio" className="text-xs">
                Aprovado de
              </Label>
              <Input
                id="data-inicio"
                type="date"
                value={filtroInicio}
                onChange={(e) => setFiltroInicio(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="data-fim" className="text-xs">
                Aprovado ate
              </Label>
              <Input
                id="data-fim"
                type="date"
                value={filtroFim}
                onChange={(e) => setFiltroFim(e.target.value)}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="busca" className="text-xs">
                Busca rapida
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca"
                  className="pl-8"
                  placeholder="Cliente, orcamento ou titulo..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>
              <CalendarRange className="h-3 w-3 inline mr-1" />
              {meta.total} cobranca(s) carregada(s){' '}
              {cobrancasFiltradas.length !== cobrancas.length
                ? `(${cobrancasFiltradas.length} apos busca local)`
                : ''}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltroStatus('ALL');
                setFiltroInicio('');
                setFiltroFim('');
                setBusca('');
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Carregando cobrancas...
            </div>
          ) : cobrancasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
              <Banknote className="h-10 w-10 mb-2 opacity-40" />
              Nenhuma cobranca encontrada com os filtros atuais.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente / Orcamento</TableHead>
                    <TableHead>Condicao</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Recebido</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Proxima parcela</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cobrancasFiltradas.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="align-top">
                        <div className="font-medium">
                          {c.cliente_nome ?? <span className="text-muted-foreground italic">sem cliente</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.orcamento_numero}
                          {c.orcamento_titulo ? ` · ${c.orcamento_titulo}` : ''}
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-sm max-w-[220px]">
                        <div>{c.descricao}</div>
                        <div className="text-xs text-muted-foreground">
                          Aprovado em {formatarData(c.data_aprovacao)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums align-top">
                        {formatarMoeda(Number(c.valor_total))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums align-top text-emerald-700">
                        {formatarMoeda(Number(c.valor_recebido))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums align-top">
                        <span
                          className={
                            Number(c.valor_saldo) > 0 ? 'text-amber-700 font-medium' : 'text-muted-foreground'
                          }
                        >
                          {formatarMoeda(Number(c.valor_saldo))}
                        </span>
                      </TableCell>
                      <TableCell className="align-top text-sm">
                        {c.proxima_parcela ? (
                          <div>
                            <div>{formatarData(c.proxima_parcela.data_vencimento)}</div>
                            <div className="text-xs text-muted-foreground tabular-nums">
                              {formatarMoeda(
                                Number(c.proxima_parcela.valor_previsto) -
                                  Number(c.proxima_parcela.valor_recebido),
                              )}{' '}
                              em aberto
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge
                          variant="outline"
                          className={STATUS_VARIANTE[c.status]?.classe ?? ''}
                        >
                          {STATUS_VARIANTE[c.status]?.label ?? c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <AcoesCobranca
                          cobranca={c}
                          podeOperar={podeOperar}
                          onRegistrar={() => {
                            setRecebimentoTarget(c);
                            setModoForcado(false);
                          }}
                          onForcar={() => {
                            setRecebimentoTarget(c);
                            setModoForcado(true);
                          }}
                          onCancelar={() => setCancelarTarget(c)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RegistrarRecebimentoDialog
        key={recebimentoTarget ? `${recebimentoTarget.id}-${modoForcado}` : 'none'}
        cobranca={recebimentoTarget}
        open={!!recebimentoTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRecebimentoTarget(null);
            setModoForcado(false);
          }
        }}
        onSuccess={carregar}
        modoForcado={modoForcado}
      />

      <CancelarCobrancaDialog
        key={cancelarTarget ? `cancel-${cancelarTarget.id}` : 'none'}
        cobranca={cancelarTarget}
        open={!!cancelarTarget}
        onOpenChange={(open) => {
          if (!open) setCancelarTarget(null);
        }}
        onSuccess={carregar}
      />
    </div>
  );
}

// ============================================================================
// Acoes inline (dropdown)
// ============================================================================

interface AcoesProps {
  cobranca: CobrancaResumo;
  podeOperar: boolean;
  onRegistrar: () => void;
  onForcar: () => void;
  onCancelar: () => void;
}

function AcoesCobranca({
  cobranca,
  podeOperar,
  onRegistrar,
  onForcar,
  onCancelar,
}: AcoesProps) {
  const status = cobranca.status;
  const podeReceber =
    podeOperar && ['PREVISTA', 'PARCIAL_PAGO', 'VENCIDO'].includes(status);
  const podeCancelar =
    podeOperar && ['PREVISTA', 'PARCIAL_PAGO', 'VENCIDO'].includes(status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          Acoes
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs">Cobranca</DropdownMenuLabel>
        <DropdownMenuItem onClick={onRegistrar} disabled={!podeReceber}>
          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
          Registrar pagamento
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onForcar} disabled={!podeReceber}>
          <Zap className="h-4 w-4 mr-2 text-amber-600" />
          Forcar recebimento total
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCancelar} disabled={!podeCancelar}>
          <XCircle className="h-4 w-4 mr-2 text-red-600" />
          Cancelar cobranca
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
