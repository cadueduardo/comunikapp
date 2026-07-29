'use client';

import { Loader2, MailPlus, Users } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createAdminInvitationColumns } from '@/components/gestao/admin-invitation-columns';
import {
  AdminCrudViewMode,
  AdminCrudViewToggle,
} from '@/components/gestao/AdminCrudViewToggle';
import { AdminInvitationCard } from '@/components/gestao/AdminInvitationCard';
import { DataTable } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-media-query';
import { adminApi } from '@/lib/gestao/admin-api';
import { ADMIN_ROLE_LABELS } from '@/lib/gestao/admin-labels';
import {
  AdminInvitation,
  AdminRole,
} from '@/lib/gestao/admin-types';

const ROLES = Object.keys(ADMIN_ROLE_LABELS) as AdminRole[];

export function AdminInvitationsManager() {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<AdminCrudViewMode>('table');
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelInvitation, setCancelInvitation] =
    useState<AdminInvitation | null>(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    role: 'SUPORTE' as AdminRole,
    mensagem: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setInvitations(
        await adminApi.listInvitations<AdminInvitation[]>(),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar os convites.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await adminApi.createInvitation<{
        emailSent: boolean;
      }>({
        ...form,
        mensagem: form.mensagem.trim() || undefined,
      });
      if (result.emailSent) {
        toast.success('Convite criado e enviado por e-mail.');
      } else {
        toast.warning(
          'Convite criado, mas o e-mail não pôde ser enviado. Use reenviar.',
        );
      }
      setCreateOpen(false);
      setForm({
        nome: '',
        email: '',
        role: 'SUPORTE',
        mensagem: '',
      });
      await load();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível criar o convite.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resend = useCallback(async (invitation: AdminInvitation) => {
    try {
      const result = await adminApi.resendInvitation<{
        emailSent: boolean;
      }>(invitation.id);
      if (result.emailSent) {
        toast.success('Convite reenviado com sucesso.');
      } else {
        toast.warning('O convite foi renovado, mas o envio falhou.');
      }
      await load();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível reenviar o convite.',
      );
    }
  }, [load]);

  const openCancel = useCallback((invitation: AdminInvitation) => {
    setCancelInvitation(invitation);
  }, []);

  const columns = useMemo(
    () =>
      createAdminInvitationColumns({
        onResend: (invitation) => {
          void resend(invitation);
        },
        onCancel: openCancel,
      }),
    [openCancel, resend],
  );

  const cancel = async () => {
    if (!cancelInvitation) return;
    setSubmitting(true);
    try {
      await adminApi.cancelInvitation(cancelInvitation.id);
      toast.success('Convite cancelado.');
      setCancelInvitation(null);
      await load();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível cancelar o convite.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const showCards = isMobile || viewMode === 'cards';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administradores"
        subtitle="Convide pessoas para a equipe interna com menor privilégio."
        icon={<Users className="h-7 w-7" />}
        actions={
          <>
            {!isMobile && (
              <AdminCrudViewToggle value={viewMode} onChange={setViewMode} />
            )}
            <Button onClick={() => setCreateOpen(true)}>
              <MailPlus className="mr-2 h-4 w-4" />
              Novo convite
            </Button>
          </>
        }
      />

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
      ) : invitations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <MailPlus className="mb-3 h-9 w-9 text-muted-foreground" />
            <h2 className="font-semibold">Nenhum convite administrativo</h2>
            <p className="mb-5 mt-1 max-w-md text-sm text-muted-foreground">
              Convide a primeira pessoa da equipe interna.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <MailPlus className="mr-2 h-4 w-4" />
              Novo convite
            </Button>
          </CardContent>
        </Card>
      ) : showCards ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {invitations.map((invitation) => (
            <AdminInvitationCard
              key={invitation.id}
              invitation={invitation}
              onResend={(item) => {
                void resend(item);
              }}
              onCancel={openCancel}
            />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={invitations} />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={create}>
            <DialogHeader>
              <DialogTitle>Convidar administrador</DialogTitle>
              <DialogDescription>
                A pessoa definirá a própria senha pelo link de uso único.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="admin-invite-name">Nome completo</Label>
                <Input
                  id="admin-invite-name"
                  value={form.nome}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      nome: event.target.value,
                    }))
                  }
                  minLength={3}
                  maxLength={160}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-invite-email">E-mail</Label>
                <Input
                  id="admin-invite-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  maxLength={320}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-invite-role">Perfil</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      role: value as AdminRole,
                    }))
                  }
                >
                  <SelectTrigger id="admin-invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ADMIN_ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-invite-message">
                  Mensagem opcional
                </Label>
                <Textarea
                  id="admin-invite-message"
                  value={form.mensagem}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      mensagem: event.target.value,
                    }))
                  }
                  maxLength={1000}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar e enviar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(cancelInvitation)}
        title="Cancelar convite"
        description={`O link enviado para ${cancelInvitation?.email || ''} será invalidado imediatamente.`}
        confirmText="Cancelar convite"
        cancelText="Voltar"
        loading={submitting}
        onConfirm={cancel}
        onCancel={() => setCancelInvitation(null)}
      />
    </div>
  );
}
