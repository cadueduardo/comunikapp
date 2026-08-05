'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Plus,
  Search,
  ShieldOff,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClienteCard } from '@/components/ui/cliente-card';
import { TransferirCarteiraDialog } from '@/components/clientes/TransferirCarteiraDialog';
import { useIsMobile } from '@/hooks/use-media-query';
import { useVendasAcesso } from '@/hooks/use-vendas-acesso';
import { useVendasNavFiltrado } from '@/hooks/use-vendas-nav-filtrado';
import { getClientSessionToken } from '@/lib/session-auth';
import {
  clientesApi,
  type ClienteApi,
  type EscopoCarteiraClienteApi,
} from '@/lib/api-client';
import { createColumns } from '@/app/(main)/clientes/columns';

const PAGE_SIZE = 20;

type Props = {
  /** Título do ModuleHeader. */
  titulo: string;
  /** Subtítulo curto. */
  subtitulo: string;
  /** Escopo inicial (default: propria). */
  escopoInicial?: EscopoCarteiraClienteApi;
};

function escoposDisponiveis(permissoes: {
  carteira_ver_propria: boolean;
  carteira_ver_equipe: boolean;
  carteira_ver_todos: boolean;
  carteira_ver_sem_responsavel: boolean;
}): Array<{ value: EscopoCarteiraClienteApi; label: string }> {
  const opcoes: Array<{ value: EscopoCarteiraClienteApi; label: string }> = [];
  if (permissoes.carteira_ver_propria) {
    opcoes.push({ value: 'propria', label: 'Minha carteira' });
  }
  if (permissoes.carteira_ver_equipe) {
    opcoes.push({ value: 'equipe', label: 'Minha equipe' });
  }
  if (permissoes.carteira_ver_todos) {
    opcoes.push({ value: 'todos', label: 'Todos' });
  }
  if (permissoes.carteira_ver_sem_responsavel) {
    opcoes.push({ value: 'sem_responsavel', label: 'Sem responsável' });
  }
  return opcoes;
}

/**
 * Listagem canônica de clientes/carteira (template Fornecedores).
 * Desktop inicia em Tabela; mobile força Cards; paginação só no servidor.
 * Autorização real fica no backend — as flags de UI só escondem ações.
 */
export function ClientesCarteiraListagem({
  titulo,
  subtitulo,
  escopoInicial = 'propria',
}: Props) {
  const isMobile = useIsMobile();
  const { nav } = useVendasNavFiltrado();
  const { acesso, loading: loadingAcesso, erro: erroAcesso } =
    useVendasAcesso(true);

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [escopo, setEscopo] =
    useState<EscopoCarteiraClienteApi>(escopoInicial);
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [page, setPage] = useState(1);
  const [clientes, setClientes] = useState<ClienteApi[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingLista, setLoadingLista] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [semPermissaoLista, setSemPermissaoLista] = useState(false);

  const [inativarDialog, setInativarDialog] = useState<{
    open: boolean;
    cliente?: ClienteApi;
    loading?: boolean;
  }>({ open: false });
  const [transferirDialog, setTransferirDialog] = useState<{
    open: boolean;
    cliente?: ClienteApi;
  }>({ open: false });

  const permissoes = acesso.permissoes;
  const opcoesEscopo = useMemo(
    () => escoposDisponiveis(permissoes),
    [permissoes],
  );

  const podeVerCarteira =
    permissoes.carteira_ver_propria ||
    permissoes.carteira_ver_equipe ||
    permissoes.carteira_ver_todos ||
    permissoes.carteira_ver_sem_responsavel;

  useEffect(() => {
    if (opcoesEscopo.length === 0) return;
    if (!opcoesEscopo.some((o) => o.value === escopo)) {
      setEscopo(opcoesEscopo[0].value);
      setPage(1);
    }
  }, [opcoesEscopo, escopo]);

  const carregar = useCallback(async () => {
    if (loadingAcesso) return;
    if (!podeVerCarteira) {
      setClientes([]);
      setLoadingLista(false);
      setSemPermissaoLista(true);
      return;
    }

    const token = getClientSessionToken();
    if (!token) {
      setErroLista('Sessão inválida');
      setLoadingLista(false);
      return;
    }

    setLoadingLista(true);
    setErroLista(null);
    setSemPermissaoLista(false);
    try {
      const resp = await clientesApi.listar(
        {
          page,
          pageSize: PAGE_SIZE,
          escopo,
          q: buscaAplicada || undefined,
        },
        token,
      );
      setClientes(resp.data ?? []);
      setTotal(resp.meta?.total ?? 0);
      setTotalPages(Math.max(1, resp.meta?.totalPages ?? 1));
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar a carteira.';
      if (/403|permiss/i.test(msg)) {
        setSemPermissaoLista(true);
        setClientes([]);
      } else {
        setErroLista(msg);
        toast.error(msg);
      }
    } finally {
      setLoadingLista(false);
    }
  }, [
    loadingAcesso,
    podeVerCarteira,
    page,
    escopo,
    buscaAplicada,
  ]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const abrirInativar = useCallback((cliente: ClienteApi) => {
    setInativarDialog({ open: true, cliente, loading: false });
  }, []);

  const abrirTransferir = useCallback((cliente: ClienteApi) => {
    setTransferirDialog({ open: true, cliente });
  }, []);

  const columns = useMemo(
    () =>
      createColumns({
        onInativar: permissoes.cliente_inativar ? abrirInativar : undefined,
        onTransferir: permissoes.carteira_transferir
          ? abrirTransferir
          : undefined,
        podeEditar: permissoes.cliente_editar,
      }),
    [
      abrirInativar,
      abrirTransferir,
      permissoes.cliente_inativar,
      permissoes.carteira_transferir,
      permissoes.cliente_editar,
    ],
  );

  const confirmarInativar = async () => {
    const cliente = inativarDialog.cliente;
    if (!cliente) return;
    setInativarDialog((prev) => ({ ...prev, loading: true }));
    try {
      const token = getClientSessionToken();
      if (!token) throw new Error('Sessão inválida');
      await clientesApi.inativar(cliente.id, token);
      toast.success('Cliente inativado.');
      setInativarDialog({ open: false });
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível inativar o cliente.',
      );
      setInativarDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const aplicarBusca = () => {
    setPage(1);
    setBuscaAplicada(busca.trim());
  };

  const estado:
    | 'loading'
    | 'sem_permissao'
    | 'erro'
    | 'vazio'
    | 'pronto' = (() => {
    if (loadingAcesso || loadingLista) return 'loading';
    if (erroAcesso) return 'erro';
    if (!acesso.pode_acessar_modulo || semPermissaoLista || !podeVerCarteira) {
      return 'sem_permissao';
    }
    if (erroLista) return 'erro';
    if (clientes.length === 0) return 'vazio';
    return 'pronto';
  })();

  const mostrarCards = isMobile || viewMode === 'cards';

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={nav}
        title={titulo}
        subtitle={subtitulo}
        icon={<Users className="h-7 w-7 sm:h-8 sm:w-8" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isMobile ? (
              <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
                <Button
                  type="button"
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 px-3"
                  aria-pressed={viewMode === 'table'}
                >
                  <List className="mr-1 h-4 w-4" />
                  Tabela
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="h-8 px-3"
                  aria-pressed={viewMode === 'cards'}
                >
                  <Grid3X3 className="mr-1 h-4 w-4" />
                  Cards
                </Button>
              </div>
            ) : null}
            {permissoes.cliente_criar ? (
              <Button asChild>
                <Link href="/clientes/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo cliente
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {estado !== 'sem_permissao' && estado !== 'loading' ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar clientes"
                placeholder="Buscar por nome, documento, e-mail…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') aplicarBusca();
                }}
                className="pl-10"
              />
            </div>
            <Button type="button" variant="secondary" onClick={aplicarBusca}>
              Buscar
            </Button>
          </div>
          {opcoesEscopo.length > 1 ? (
            <div className="w-full sm:w-56">
              <label className="mb-1 block text-sm text-muted-foreground">
                Escopo
              </label>
              <Select
                value={escopo}
                onValueChange={(v) => {
                  setEscopo(v as EscopoCarteiraClienteApi);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label="Escopo da carteira">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {opcoesEscopo.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      ) : null}

      {estado === 'loading' ? (
        <Card>
          <CardHeader>
            <CardTitle>Carregando carteira…</CardTitle>
            <CardDescription>
              Verificando permissões e buscando clientes no servidor.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {estado === 'sem_permissao' ? (
        <Card role="alert">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldOff className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle>Sem permissão</CardTitle>
                <CardDescription>
                  Você não tem acesso a esta carteira. Fale com o administrador
                  da loja se precisar de liberação.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      {estado === 'erro' ? (
        <Card role="alert">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <CardTitle>Não foi possível carregar</CardTitle>
                <CardDescription>
                  {erroLista ?? erroAcesso ?? 'Tente novamente.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onClick={() => void carregar()}>
              Tentar de novo
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {estado === 'vazio' ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="mb-2 text-lg font-semibold">
              {escopo === 'sem_responsavel'
                ? 'Nenhum cliente sem responsável'
                : 'Carteira vazia neste escopo'}
            </h3>
            <p className="mb-4 text-center text-muted-foreground">
              {permissoes.cliente_criar
                ? 'Cadastre um cliente ou peça redistribuição ao gestor.'
                : 'Não há clientes para exibir com o filtro atual.'}
            </p>
            {permissoes.cliente_criar ? (
              <Button asChild>
                <Link href="/clientes/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo cliente
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {estado === 'pronto' ? (
        <>
          <p className="text-sm text-muted-foreground">
            {total} cliente{total === 1 ? '' : 's'} · página {page} de{' '}
            {totalPages}
          </p>
          {mostrarCards ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clientes.map((cliente) => (
                <ClienteCard
                  key={cliente.id}
                  cliente={cliente}
                  onInativar={
                    permissoes.cliente_inativar ? abrirInativar : undefined
                  }
                  onTransferir={
                    permissoes.carteira_transferir
                      ? abrirTransferir
                      : undefined
                  }
                  podeEditar={permissoes.cliente_editar}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={clientes}
              enablePagination={false}
            />
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </>
      ) : null}

      <ConfirmDialog
        open={inativarDialog.open}
        title="Inativar cliente?"
        description="O cadastro e o histórico são preservados. O cliente deixa de aparecer nas listagens ativas."
        confirmText="Inativar"
        cancelText="Cancelar"
        loading={inativarDialog.loading}
        onConfirm={() => void confirmarInativar()}
        onCancel={() => setInativarDialog({ open: false })}
      />

      <TransferirCarteiraDialog
        open={transferirDialog.open}
        cliente={transferirDialog.cliente}
        onClose={() => setTransferirDialog({ open: false })}
        onSuccess={() => {
          setTransferirDialog({ open: false });
          void carregar();
        }}
      />
    </div>
  );
}
