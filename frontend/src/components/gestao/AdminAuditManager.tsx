'use client';

import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Search,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createAdminAuditColumns } from '@/components/gestao/admin-audit-columns';
import { AdminAuditCard } from '@/components/gestao/AdminAuditCard';
import {
  AdminCrudViewMode,
  AdminCrudViewToggle,
} from '@/components/gestao/AdminCrudViewToggle';
import { DataTable } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-media-query';
import { adminApi } from '@/lib/gestao/admin-api';
import {
  ADMIN_ROLE_LABELS,
  AUDIT_ACTION_LABELS,
  formatAdminAuditAction,
  formatAdminDate,
} from '@/lib/gestao/admin-labels';
import { AdminAuditEntry } from '@/lib/gestao/admin-types';

interface AuditListResponse {
  data: AdminAuditEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function formatJson(value: unknown) {
  if (value === null || value === undefined) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AdminAuditManager() {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<AdminCrudViewMode>('table');
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AdminAuditEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (search) query.set('search', search);
      if (action !== 'ALL') query.set('action', action);
      const response = await adminApi.listAudit<AuditListResponse>(query);
      setEntries(response.data);
      setTotal(response.pagination.total);
      setTotalPages(Math.max(1, response.pagination.totalPages));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar a auditoria.',
      );
    } finally {
      setLoading(false);
    }
  }, [action, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const openDetail = useCallback((entry: AdminAuditEntry) => {
    setSelected(entry);
  }, []);

  const columns = useMemo(
    () => createAdminAuditColumns({ onOpenDetail: openDetail }),
    [openDetail],
  );

  const showCards = isMobile || viewMode === 'cards';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        subtitle={`${total} registro${total === 1 ? '' : 's'} append-only.`}
        icon={<ClipboardList className="h-7 w-7" />}
        actions={
          !isMobile ? (
            <AdminCrudViewToggle value={viewMode} onChange={setViewMode} />
          ) : undefined
        }
      />

      <Card>
        <CardContent className="pt-6">
          <form
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px_auto]"
            onSubmit={submitSearch}
          >
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Ação, loja, administrador, motivo ou correlação"
                className="pl-9"
                maxLength={160}
              />
            </div>
            <Select
              value={action}
              onValueChange={(value) => {
                setAction(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as ações</SelectItem>
                {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ClipboardList className="mb-3 h-9 w-9 text-muted-foreground" />
            <h2 className="font-semibold">Nenhum evento encontrado</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste os filtros ou execute uma ação administrativa para gerar
              auditoria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {showCards ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <AdminAuditCard
                  key={entry.id}
                  entry={entry}
                  onOpenDetail={openDetail}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={entries}
              enablePagination={false}
            />
          )}

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => current - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= totalPages}
              >
                Próxima
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selected
                ? formatAdminAuditAction(selected.action)
                : 'Detalhe da auditoria'}
            </DialogTitle>
            <DialogDescription>
              Registro imutável. Não é possível editar ou excluir pela interface.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Quando</p>
                  <p className="font-medium">
                    {formatAdminDate(selected.occurred_at)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Administrador</p>
                  <p className="font-medium">
                    {selected.admin_user?.nome || 'Sistema / anônimo'}
                  </p>
                  {selected.admin_user?.role && (
                    <p className="text-xs text-muted-foreground">
                      {ADMIN_ROLE_LABELS[selected.admin_user.role]}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Recurso</p>
                  <p className="font-medium">
                    {selected.resource_type}
                    {selected.resource_id ? ` · ${selected.resource_id}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Loja</p>
                  <p className="font-medium">
                    {selected.loja?.nome || selected.loja_id || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Categoria</p>
                  <p className="font-medium">{selected.category || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Correlação</p>
                  <p className="break-all font-medium">
                    {selected.correlation_id || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">IP</p>
                  <p className="font-medium">{selected.ip_address || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">User-Agent</p>
                  <p className="break-all font-medium">
                    {selected.user_agent || '—'}
                  </p>
                </div>
              </div>
              {selected.reason && (
                <div>
                  <p className="text-muted-foreground">Motivo</p>
                  <p className="font-medium">{selected.reason}</p>
                </div>
              )}
              <div>
                <p className="mb-1 text-muted-foreground">Estado anterior</p>
                <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs">
                  {formatJson(selected.previous_state)}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-muted-foreground">Estado novo</p>
                <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs">
                  {formatJson(selected.new_state)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
