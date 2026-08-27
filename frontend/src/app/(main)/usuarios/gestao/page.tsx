'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Plus, RefreshCw, List, Grid3X3 } from 'lucide-react';
import Link from 'next/link';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from '@/lib/api';
import { usuariosModuleNav } from '@/lib/module-nav';
import { createUsuarioColumns, UsuarioRow } from '../columns';
import { useIsMobile } from '@/hooks/use-media-query';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UsuarioCard } from '@/components/usuarios/UsuarioCard';
import { extrairListaPaginada } from '@/lib/lista-paginada';
import { toast } from 'sonner';

export default function UsuariosGestaoPage() {
  const [data, setData] = useState<UsuarioRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [usuarioParaDesativar, setUsuarioParaDesativar] = useState<UsuarioRow | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setViewMode(isMobile ? 'cards' : 'table');
  }, [isMobile]);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (buscaAplicada) params.set('busca', buscaAplicada);
      if (!mostrarInativos) params.set('status', 'ATIVO');
      const res = await apiRequest(`/usuarios?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Não foi possível carregar os usuários');
      }
      const json = await res.json();
      const lista = extrairListaPaginada<UsuarioRow>(json);
      setData(lista.items);
      setTotal(lista.total);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar usuários');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, buscaAplicada, mostrarInativos]);

  useEffect(() => {
    void fetchUsuarios();
  }, [fetchUsuarios]);

  const handleOpenDesativacao = (usuario: UsuarioRow) => {
    setUsuarioParaDesativar(usuario);
  };

  const handleConfirmDesativacao = async () => {
    if (!usuarioParaDesativar) return;
    setRemovingId(usuarioParaDesativar.id);
    try {
      const res = await apiRequest(`/usuarios/${usuarioParaDesativar.id}/desativar`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Erro ao desativar usuário');
      }
      toast.success('Usuário desativado');
      setUsuarioParaDesativar(null);
      await fetchUsuarios();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao desativar');
    } finally {
      setRemovingId(null);
    }
  };

  const handleReativar = async (usuario: UsuarioRow) => {
    setRemovingId(usuario.id);
    try {
      const res = await apiRequest(`/usuarios/${usuario.id}/reativar`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Erro ao reativar usuário');
      }
      toast.success('Usuário reativado');
      await fetchUsuarios();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao reativar');
    } finally {
      setRemovingId(null);
    }
  };

  const columns = useMemo(
    () =>
      createUsuarioColumns({
        onDesativar: handleOpenDesativacao,
        onReativar: handleReativar,
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
            title="Gestão de Usuários"
            backHref="/usuarios"
            icon={<Users className="h-8 w-8" />}
            subtitle="Cadastre e gerencie usuários da sua loja"
            actions={
              <>
                <Button variant="outline" onClick={() => void fetchUsuarios()} disabled={loading}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
                </Button>
                <Button asChild>
                  <Link href="/usuarios/gestao/novo">
                    <Plus className="mr-2 h-4 w-4" /> Novo Usuário
                  </Link>
                </Button>
              </>
            }
          />
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar por nome ou e-mail"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  setBuscaAplicada(search.trim());
                }
              }}
              className="max-w-sm"
              aria-label="Buscar usuários"
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
            <Button
              type="button"
              size="sm"
              variant={mostrarInativos ? 'default' : 'outline'}
              onClick={() => {
                setPage(1);
                setMostrarInativos((prev) => !prev);
              }}
            >
              {mostrarInativos ? 'Ocultar inativos' : 'Mostrar inativos'}
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
            <p className="text-sm text-muted-foreground">Carregando usuários…</p>
          ) : erro ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-destructive">
                {erro}
              </CardContent>
            </Card>
          ) : data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-4 h-10 w-10 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Nenhum usuário encontrado</h2>
                <p className="mb-5 mt-1 max-w-md text-sm text-muted-foreground">
                  Cadastre o primeiro usuário da loja ou ajuste a busca.
                </p>
                <Button asChild>
                  <Link href="/usuarios/gestao/novo">
                    <Plus className="mr-2 h-4 w-4" /> Novo usuário
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {mostrarCards ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.map((usuario) => (
                    <UsuarioCard
                      key={usuario.id}
                      usuario={usuario}
                      onDesativar={handleOpenDesativacao}
                      onReativar={handleReativar}
                      removingId={removingId}
                    />
                  ))}
                </div>
              ) : (
                <DataTable<UsuarioRow, unknown>
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
        open={!!usuarioParaDesativar}
        title="Desativar usuário"
        description={
          usuarioParaDesativar
            ? `O usuário ${usuarioParaDesativar.nome_completo} será desativado e não poderá mais acessar o sistema.`
            : 'Deseja continuar?'
        }
        confirmText="Desativar"
        cancelText="Cancelar"
        loading={!!removingId}
        onCancel={() => {
          if (!removingId) setUsuarioParaDesativar(null);
        }}
        onConfirm={handleConfirmDesativacao}
      />
    </>
  );
}
