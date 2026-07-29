'use client';

import { Loader2, Search, Users } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createAdminUserColumns } from '@/components/gestao/admin-user-columns';
import {
  AdminCrudViewMode,
  AdminCrudViewToggle,
} from '@/components/gestao/AdminCrudViewToggle';
import {
  AdminUserActionDialog,
  AdminUserDialogMode,
} from '@/components/gestao/AdminUserActionDialog';
import { AdminUserCard } from '@/components/gestao/AdminUserCard';
import { DataTable } from '@/components/data-table/data-table';
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
import {
  ADMIN_ROLE_LABELS,
  ADMIN_USER_STATUS_LABELS,
} from '@/lib/gestao/admin-labels';
import {
  AdminRole,
  AdminUser,
  AdminUserStatus,
} from '@/lib/gestao/admin-types';

const ROLES = Object.keys(ADMIN_ROLE_LABELS) as AdminRole[];
const STATUSES = Object.keys(ADMIN_USER_STATUS_LABELS) as AdminUserStatus[];

interface AdminUsersListResponse {
  data: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AdminUsersManagerProps {
  showViewToggle?: boolean;
}

export function AdminUsersManager({
  showViewToggle = true,
}: AdminUsersManagerProps) {
  const { admin } = useAdmin();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<AdminCrudViewMode>('table');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [dialogUser, setDialogUser] = useState<AdminUser | null>(null);
  const [dialogMode, setDialogMode] = useState<AdminUserDialogMode | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set('search', search.trim());
      if (statusFilter !== 'ALL') query.set('status', statusFilter);
      if (roleFilter !== 'ALL') query.set('role', roleFilter);
      query.set('limit', '100');
      const response =
        await adminApi.listAdministrators<AdminUsersListResponse>(query);
      setUsers(response.data);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar os administradores.',
      );
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const openRoleDialog = useCallback((user: AdminUser) => {
    setDialogUser(user);
    setDialogMode('role');
  }, []);

  const openStatusDialog = useCallback((user: AdminUser) => {
    setDialogUser(user);
    setDialogMode('status');
  }, []);

  const columns = useMemo(
    () =>
      createAdminUserColumns({
        currentAdminId: admin?.id,
        onChangeRole: openRoleDialog,
        onToggleStatus: openStatusDialog,
      }),
    [admin?.id, openRoleDialog, openStatusDialog],
  );

  const confirmUpdate = async (data: {
    role?: AdminRole;
    status?: Extract<AdminUserStatus, 'ACTIVE' | 'INACTIVE'>;
    currentPassword?: string;
    reason: string;
  }) => {
    if (!dialogUser) return;
    try {
      await adminApi.updateAdministrator(dialogUser.id, data);
      toast.success(
        data.status === 'INACTIVE'
          ? 'Administrador inativado e sessões revogadas.'
          : data.status === 'ACTIVE'
            ? 'Administrador reativado.'
            : 'Perfil atualizado. Sessões ativas foram revogadas.',
      );
      setDialogUser(null);
      setDialogMode(null);
      await load();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível atualizar o administrador.',
      );
      throw cause;
    }
  };

  const showCards = isMobile || viewMode === 'cards';
  const hasFilters =
    Boolean(search) || statusFilter !== 'ALL' || roleFilter !== 'ALL';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <form
          onSubmit={submitSearch}
          className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar nome ou e-mail"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filtrar por status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {ADMIN_USER_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger aria-label="Filtrar por perfil">
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os perfis</SelectItem>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ADMIN_ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
        {showViewToggle && !isMobile && (
          <AdminCrudViewToggle value={viewMode} onChange={setViewMode} />
        )}
      </div>

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
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Users className="mb-3 h-9 w-9 text-muted-foreground" />
            <h2 className="font-semibold">Nenhum administrador encontrado</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Ajuste os filtros ou convide um novo membro na aba Convites.
            </p>
            {hasFilters && (
              <Button
                className="mt-5"
                variant="outline"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setStatusFilter('ALL');
                  setRoleFilter('ALL');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : showCards ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <AdminUserCard
              key={user.id}
              user={user}
              currentAdminId={admin?.id}
              onChangeRole={openRoleDialog}
              onToggleStatus={openStatusDialog}
            />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={users} />
      )}

      <AdminUserActionDialog
        user={dialogUser}
        mode={dialogMode}
        open={Boolean(dialogUser && dialogMode)}
        onOpenChange={(open) => {
          if (!open) {
            setDialogUser(null);
            setDialogMode(null);
          }
        }}
        onConfirm={confirmUpdate}
      />
    </div>
  );
}
