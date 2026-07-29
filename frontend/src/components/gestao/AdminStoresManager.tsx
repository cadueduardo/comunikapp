'use client';

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createAdminStoreColumns } from '@/components/gestao/admin-store-columns';
import {
  AdminCrudViewMode,
  AdminCrudViewToggle,
} from '@/components/gestao/AdminCrudViewToggle';
import { AdminStoreCard } from '@/components/gestao/AdminStoreCard';
import { AdminStoreStatusDialog } from '@/components/gestao/AdminStoreStatusDialog';
import { DataTable } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdmin } from '@/contexts/AdminContext';
import { useIsMobile } from '@/hooks/use-media-query';
import { adminApi } from '@/lib/gestao/admin-api';
import { STORE_STATUS_LABELS } from '@/lib/gestao/admin-labels';
import { AdminStore, StoreStatus } from '@/lib/gestao/admin-types';

interface StoreListResponse {
  data: AdminStore[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AdminStoresManager() {
  const { admin } = useAdmin();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<AdminCrudViewMode>('table');
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StoreStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStore, setSelectedStore] =
    useState<AdminStore | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (search) query.set('search', search);
      if (status !== 'ALL') query.set('status', status);
      const response = await adminApi.listStores<StoreListResponse>(
        query,
      );
      setStores(response.data);
      setTotal(response.pagination.total);
      setTotalPages(Math.max(1, response.pagination.totalPages));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar as lojas.',
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const canChangeStatus =
    admin?.role === 'SUPER_ADMIN' || admin?.role === 'OPERACAO';

  const openStatusDialog = useCallback((store: AdminStore) => {
    setSelectedStore(store);
    setStatusDialogOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      createAdminStoreColumns({
        canChangeStatus,
        onChangeStatus: openStatusDialog,
      }),
    [canChangeStatus, openStatusDialog],
  );

  const updateStatus = async (data: {
    status: StoreStatus;
    category: string;
    reason: string;
  }) => {
    if (!selectedStore) return;
    try {
      await adminApi.updateStoreStatus(selectedStore.id, data);
      toast.success('Status da loja alterado com sucesso.');
      await load();
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Não foi possível alterar o status.';
      toast.error(message);
      throw cause;
    }
  };

  const showCards = isMobile || viewMode === 'cards';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lojas"
        subtitle={`${total} loja${total === 1 ? '' : 's'} encontrada${total === 1 ? '' : 's'}.`}
        icon={<Building2 className="h-7 w-7" />}
        actions={
          !isMobile ? (
            <AdminCrudViewToggle value={viewMode} onChange={setViewMode} />
          ) : undefined
        }
      />

      <Card>
        <CardContent className="pt-6">
          <form
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]"
            onSubmit={submitSearch}
          >
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Nome, e-mail, documento, slug ou ID"
                className="pl-9"
                maxLength={160}
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as StoreStatus | 'ALL');
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                {Object.entries(STORE_STATUS_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
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
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : stores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Building2 className="mb-3 h-9 w-9 text-muted-foreground" />
            <h2 className="font-semibold">Nenhuma loja encontrada</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste os filtros ou o termo pesquisado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {showCards ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => (
                <AdminStoreCard
                  key={store.id}
                  store={store}
                  canChangeStatus={canChangeStatus}
                  onChangeStatus={openStatusDialog}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={stores}
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

      {admin && (
        <AdminStoreStatusDialog
          store={selectedStore}
          adminRole={admin.role}
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          onConfirm={updateStatus}
        />
      )}
    </div>
  );
}
