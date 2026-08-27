'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Shield, Plus, RefreshCw, List, Grid3X3 } from 'lucide-react';
import Link from 'next/link';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from '@/lib/api';
import { usuariosModuleNav } from '@/lib/module-nav';
import { createPerfilColumns, PerfilRow } from './columns';
import { useIsMobile } from '@/hooks/use-media-query';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PerfilCard } from '@/components/usuarios/PerfilCard';
import { extrairListaPaginada } from '@/lib/lista-paginada';
import { toast } from 'sonner';

type PerfilApi = {
  id: string;
  nome: string;
  descricao?: string | null;
  sistema: boolean;
  ativo: boolean;
  _count?: { usuarios?: number };
};

export default function PerfisPage() {
  const [data, setData] = useState<PerfilRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [perfilParaExcluir, setPerfilParaExcluir] = useState<PerfilRow | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setViewMode(isMobile ? 'cards' : 'table');
  }, [isMobile]);

  const mapear = (item: PerfilApi): PerfilRow => ({
    id: item.id,
    nome: item.nome,
    descricao: item.descricao,
    sistema: item.sistema,
    ativo: item.ativo,
    usuariosCount: item._count?.usuarios ?? 0,
  });

  const fetchPerfis = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (buscaAplicada) params.set('busca', buscaAplicada);
      const res = await apiRequest(`/usuarios/perfis?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Não foi possível carregar os perfis');
      }
      const json = await res.json();
      const lista = extrairListaPaginada<PerfilApi>(json);
      setData(lista.items.map(mapear));
      setTotal(lista.total);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar perfis');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, buscaAplicada]);

  useEffect(() => {
    void fetchPerfis();
  }, [fetchPerfis]);

  const handleConfirmExclusao = async () => {
    if (!perfilParaExcluir) return;
    setRemovingId(perfilParaExcluir.id);
    try {
      const res = await apiRequest(`/usuarios/perfis/${perfilParaExcluir.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Erro ao excluir perfil');
      }
      toast.success('Perfil excluído');
      setPerfilParaExcluir(null);
      await fetchPerfis();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir');
    } finally {
      setRemovingId(null);
    }
  };

  const columns = useMemo(
    () =>
      createPerfilColumns({
        onExcluir: setPerfilParaExcluir,
        removingId,
      }),
    [removingId],
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const mostrarCards = isMobile || viewMode === 'cards';

  return (
    <>
      <CrudPage
        header={
          <ModuleHeader
            nav={usuariosModuleNav}
            title="Perfis de Acesso"
            backHref="/usuarios"
            icon={<Shield className="h-8 w-8" />}
            subtitle="Gerencie perfis e permissões dos usuários"
            actions={
              <>
                <Button variant="outline" onClick={() => void fetchPerfis()} disabled={loading}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
                </Button>
                <Button asChild>
                  <Link href="/usuarios/perfis/novo">
                    <Plus className="mr-2 h-4 w-4" /> Novo Perfil
                  </Link>
                </Button>
              </>
            }
          />
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar perfil"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  setBuscaAplicada(search.trim());
                }
              }}
              className="max-w-sm"
              aria-label="Buscar perfis"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setPage(1);
                setBuscaAplicada(search.trim());
              }}
            >
              Buscar
            </Button>
            {!isMobile && (
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="mr-2 h-4 w-4" />
                  Tabela
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                >
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  Cards
                </Button>
              </div>
            )}
          </div>
        }
        table={
          loading ? (
            <p className="text-sm text-muted-foreground">Carregando perfis…</p>
          ) : erro ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-destructive">
                {erro}
              </CardContent>
            </Card>
          ) : data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="mb-4 h-10 w-10 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Nenhum perfil encontrado</h2>
                <p className="mb-5 mt-1 max-w-md text-sm text-muted-foreground">
                  Crie um perfil customizado a partir do catálogo de permissões.
                </p>
                <Button asChild>
                  <Link href="/usuarios/perfis/novo">
                    <Plus className="mr-2 h-4 w-4" /> Novo perfil
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {mostrarCards ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.map((perfil) => (
                    <PerfilCard
                      key={perfil.id}
                      perfil={perfil}
                      onExcluir={setPerfilParaExcluir}
                      removingId={removingId}
                    />
                  ))}
                </div>
              ) : (
                <DataTable<PerfilRow, unknown>
                  columns={columns}
                  data={data}
                  enablePagination={false}
                />
              )}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Página {page} de {totalPages} · {total} registro(s)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((atual) => Math.max(1, atual - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((atual) => atual + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          )
        }
      />
      <ConfirmDialog
        open={!!perfilParaExcluir}
        title="Excluir perfil"
        description={
          perfilParaExcluir
            ? `O perfil "${perfilParaExcluir.nome}" será excluído. Perfis de sistema e perfis com usuários associados não podem ser removidos.`
            : 'Deseja continuar?'
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        loading={!!removingId}
        onCancel={() => {
          if (!removingId) setPerfilParaExcluir(null);
        }}
        onConfirm={handleConfirmExclusao}
      />
    </>
  );
}
