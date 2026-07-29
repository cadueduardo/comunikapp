'use client';

import {
  Building2,
  CalendarDays,
  Globe2,
  Loader2,
  Mail,
  Phone,
  Settings2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminStatusBadge } from '@/components/gestao/AdminStatusBadge';
import { AdminStoreStatusDialog } from '@/components/gestao/AdminStoreStatusDialog';
import { AdminStoreTimeline } from '@/components/gestao/AdminStoreTimeline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAdmin } from '@/contexts/AdminContext';
import { adminApi } from '@/lib/gestao/admin-api';
import { formatAdminDate } from '@/lib/gestao/admin-labels';
import { AdminStore, StoreStatus } from '@/lib/gestao/admin-types';

interface StoreDetailResponse
  extends Omit<AdminStore, 'activeUsers'> {
  counts: {
    users: number;
    clients: number;
    budgets: number;
    serviceOrders: number;
  };
}

export function AdminStoreDetail({ storeId }: { storeId: string }) {
  const { admin } = useAdmin();
  const [store, setStore] = useState<StoreDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStore(await adminApi.getStore<StoreDetailResponse>(storeId));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar a loja.',
      );
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!store) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const canChangeStatus =
    admin?.role === 'SUPER_ADMIN' || admin?.role === 'OPERACAO';
  const statusStore: AdminStore = {
    ...store,
    activeUsers: store.counts.users,
  };

  const updateStatus = async (data: {
    status: StoreStatus;
    category: string;
    reason: string;
  }) => {
    try {
      await adminApi.updateStoreStatus(store.id, data);
      toast.success('Status da loja alterado com sucesso.');
      await load();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível alterar o status.',
      );
      throw cause;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={store.nome}
        subtitle={`ID ${store.id}`}
        backHref="/gestao/lojas"
        icon={<Building2 className="h-7 w-7" />}
        actions={
          canChangeStatus ? (
            <Button onClick={() => setStatusDialogOpen(true)}>
              <Settings2 className="mr-2 h-4 w-4" />
              Alterar status
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Situação atual
            </p>
            <div className="mt-2">
              <AdminStatusBadge status={store.status} />
            </div>
          </div>
          <div className="text-sm sm:text-right">
            <p className="text-muted-foreground">Assinatura</p>
            <p className="font-medium">
              {store.assinatura_ativa ? 'Ativa' : 'Inativa'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Usuários ativos', store.counts.users],
          ['Clientes', store.counts.clients],
          ['Orçamentos', store.counts.budgets],
          ['Ordens de serviço', store.counts.serviceOrders],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cadastro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">E-mail</p>
                <p className="break-all font-medium">{store.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="font-medium">{store.telefone}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Cadastro</p>
                <p className="font-medium">
                  {formatAdminDate(store.criado_em)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Endereços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3">
              <Globe2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-muted-foreground">URL ComunikApp</p>
                <p className="break-all font-medium">
                  {store.slug}.comunikapp.com.br
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-muted-foreground">Domínio próprio</p>
                <p className="break-all font-medium">
                  {store.dominio_custom || 'Não configurado'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Usuários ativos</p>
                <p className="font-medium">{store.counts.users}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminStoreTimeline storeId={store.id} />

      {admin && (
        <AdminStoreStatusDialog
          store={statusStore}
          adminRole={admin.role}
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          onConfirm={updateStatus}
        />
      )}
    </div>
  );
}

