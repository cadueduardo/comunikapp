'use client';

import { getClientSessionToken } from '@/lib/session-auth';
import { CheckSquare, Grid3X3, List, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AtividadeCard } from '@/components/vendas/AtividadeCard';
import {
  createAtividadesColumns,
  type Atividade,
} from '@/components/vendas/atividades-columns';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { useIsMobile } from '@/hooks/use-media-query';
import { useVendasAcesso } from '@/hooks/use-vendas-acesso';
import { useVendasNavFiltrado } from '@/hooks/use-vendas-nav-filtrado';

type ListaResposta = {
  items: Atividade[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function VendasAtividadesPage() {
  const { acesso } = useVendasAcesso(true);
  const { nav } = useVendasNavFiltrado();
  const [lista, setLista] = useState<ListaResposta>({
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();
  const [concluirDialog, setConcluirDialog] = useState<{
    open: boolean;
    atividade?: Atividade;
  }>({ open: false });
  const [concluindo, setConcluindo] = useState(false);

  const carregarAtividades = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const token = getClientSessionToken();
      if (!token) return;

      const resp = await fetch(
        `/api/vendas/atividades?page=${page}&pageSize=20&status=abertas`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        },
      );

      if (!resp.ok) {
        throw new Error('Erro ao carregar atividades');
      }

      const data = (await resp.json()) as ListaResposta;
      setLista({
        items: Array.isArray(data.items) ? data.items : [],
        page: data.page ?? page,
        pageSize: data.pageSize ?? 20,
        total: data.total ?? 0,
        totalPages: data.totalPages ?? 1,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao carregar atividades.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (acesso.pode_acessar_modulo) {
      void carregarAtividades(1);
    }
  }, [carregarAtividades, acesso.pode_acessar_modulo]);

  const abrirConclusao = useCallback((atividade: Atividade) => {
    setConcluirDialog({ open: true, atividade });
  }, []);

  const columns = useMemo(
    () => createAtividadesColumns(abrirConclusao),
    [abrirConclusao],
  );

  const concluirAtividade = async () => {
    const atividade = concluirDialog.atividade;
    if (!atividade || concluindo) return;
    setConcluindo(true);
    try {
      const token = getClientSessionToken();
      if (!token) return;

      const resp = await fetch(
        `/api/vendas/atividades/${atividade.id}/concluir`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      if (!resp.ok) {
        throw new Error('Erro ao concluir atividade');
      }

      toast.success('Atividade concluída com sucesso.');
      setConcluirDialog({ open: false });
      await carregarAtividades(lista.page);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao concluir atividade.',
      );
    } finally {
      setConcluindo(false);
    }
  };

  const mostrarCards = isMobile || viewMode === 'cards';

  if (!acesso.pode_acessar_modulo) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">
          Você não tem acesso a atividades comerciais.
        </p>
        <Button variant="outline" asChild>
          <Link href="/vendas">Voltar para Vendas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={nav}
        title="Atividades"
        subtitle="Tarefas comerciais organizadas por prioridade e responsável."
        backHref="/vendas"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Atividades comerciais
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie tarefas, compromissos e follow-ups.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!isMobile ? (
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                <List className="mr-1 h-4 w-4" />
                Tabela
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 px-3"
              >
                <Grid3X3 className="mr-1 h-4 w-4" />
                Cards
              </Button>
            </div>
          ) : null}
          {acesso.permissoes.atividade_ver_propria ? (
            <Button asChild>
              <Link href="/vendas/atendimento">
                <Plus className="mr-2 h-4 w-4" />
                Novo atendimento
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-muted-foreground">
            Carregando atividades…
          </CardContent>
        </Card>
      ) : lista.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckSquare className="mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Nenhuma atividade aberta</h2>
            <p className="mb-5 mt-1 max-w-md text-sm text-muted-foreground">
              Registre um atendimento para criar a próxima ação comercial.
            </p>
            <Button asChild>
              <Link href="/vendas/atendimento">
                <Plus className="mr-2 h-4 w-4" />
                Novo atendimento
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : mostrarCards ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lista.items.map((atividade) => (
            <AtividadeCard
              key={atividade.id}
              atividade={atividade}
              onConcluir={abrirConclusao}
            />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={lista.items}
          enablePagination={false}
        />
      )}

      {lista.totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={lista.page <= 1 || loading}
            onClick={() => void carregarAtividades(lista.page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {lista.page} de {lista.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={lista.page >= lista.totalPages || loading}
            onClick={() => void carregarAtividades(lista.page + 1)}
          >
            Próxima
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={concluirDialog.open}
        title="Concluir atividade"
        description={`Marcar "${concluirDialog.atividade?.titulo ?? ''}" como concluída?`}
        confirmText={concluindo ? 'Concluindo…' : 'Concluir'}
        cancelText="Cancelar"
        onConfirm={() => void concluirAtividade()}
        onCancel={() => setConcluirDialog({ open: false })}
      />
    </div>
  );
}
