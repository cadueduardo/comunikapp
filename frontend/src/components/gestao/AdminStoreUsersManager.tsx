'use client';

import { Loader2, MailPlus, MoreHorizontal, Users } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useAdmin } from '@/contexts/AdminContext';
import { adminApi } from '@/lib/gestao/admin-api';
import {
  formatAdminDate,
  INVITATION_STATUS_LABELS,
  STORE_USER_FUNCAO_LABELS,
  STORE_USER_STATUS_LABELS,
} from '@/lib/gestao/admin-labels';
import {
  StoreStatus,
  StoreUser,
  StoreUserFuncao,
  StoreUserInvitation,
} from '@/lib/gestao/admin-types';

const FUNCOES = Object.keys(STORE_USER_FUNCAO_LABELS) as StoreUserFuncao[];

interface AdminStoreUsersManagerProps {
  storeId: string;
  storeStatus: StoreStatus;
  storeName: string;
}

export function AdminStoreUsersManager({
  storeId,
  storeStatus,
  storeName,
}: AdminStoreUsersManagerProps) {
  const { admin } = useAdmin();
  const canInvite =
    admin?.role === 'SUPER_ADMIN' ||
    admin?.role === 'OPERACAO' ||
    admin?.role === 'SUPORTE';

  const [users, setUsers] = useState<StoreUser[]>([]);
  const [invitations, setInvitations] = useState<StoreUserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelInvitation, setCancelInvitation] =
    useState<StoreUserInvitation | null>(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    funcao: 'VENDAS' as StoreUserFuncao,
    telefone: '',
    mensagem: '',
    exceptionReason: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, invitationsResponse] = await Promise.all([
        adminApi.listStoreUsers<StoreUser[]>(storeId),
        adminApi.listStoreUserInvitations<StoreUserInvitation[]>(storeId),
      ]);
      setUsers(usersResponse);
      setInvitations(invitationsResponse);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar usuários e convites.',
      );
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const needsExceptionReason =
    storeStatus !== 'ATIVO' && admin?.role === 'SUPER_ADMIN';

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await adminApi.createStoreUserInvitation<{
        emailSent: boolean;
      }>(storeId, {
        nome: form.nome,
        email: form.email,
        funcao: form.funcao,
        telefone: form.telefone.trim() || undefined,
        mensagem: form.mensagem.trim() || undefined,
        exceptionReason: needsExceptionReason
          ? form.exceptionReason.trim()
          : undefined,
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
        funcao: 'VENDAS',
        telefone: '',
        mensagem: '',
        exceptionReason: '',
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

  const resend = async (invitation: StoreUserInvitation) => {
    try {
      const result = await adminApi.resendStoreUserInvitation<{
        emailSent: boolean;
      }>(storeId, invitation.id);
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
  };

  const cancel = async () => {
    if (!cancelInvitation) return;
    setSubmitting(true);
    try {
      await adminApi.cancelStoreUserInvitation(storeId, cancelInvitation.id);
      toast.success('Convite cancelado e usuário pendente inativado.');
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

  const pendingInvitations = invitations.filter(
    (item) => item.status === 'PENDING' || item.status === 'EXPIRED',
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Usuários da loja</h2>
          <p className="text-sm text-muted-foreground">
            Contas vinculadas a {storeName}.
          </p>
        </div>
        {canInvite && (
          <Button onClick={() => setCreateOpen(true)}>
            <MailPlus className="mr-2 h-4 w-4" />
            Convidar usuário
          </Button>
        )}
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Users className="mb-3 h-9 w-9 text-muted-foreground" />
            <h3 className="font-semibold">Nenhum usuário nesta loja</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Convide a primeira pessoa para participar desta loja.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="space-y-3 rounded-lg border border-border bg-card p-4"
            >
              <div>
                <p className="font-medium">{user.nome}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {STORE_USER_FUNCAO_LABELS[user.funcao]}
                </Badge>
                <Badge variant="outline">
                  {STORE_USER_STATUS_LABELS[user.status]}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  E-mail verificado:{' '}
                  {user.emailVerificado ? 'Sim' : 'Não'}
                </p>
                <p>2FA: {user.twoFactorEnabled ? 'Ativo' : 'Não'}</p>
                <p>Cadastro: {formatAdminDate(user.criadoEm)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Convites</h2>
        {pendingInvitations.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nenhum convite pendente ou expirado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="space-y-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{invitation.nome}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {invitation.email}
                    </p>
                  </div>
                  {canInvite && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            void resend(invitation);
                          }}
                        >
                          Reenviar
                        </DropdownMenuItem>
                        {invitation.status === 'PENDING' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setCancelInvitation(invitation)
                              }
                            >
                              Cancelar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {STORE_USER_FUNCAO_LABELS[invitation.funcao]}
                  </Badge>
                  <Badge variant="outline">
                    {INVITATION_STATUS_LABELS[invitation.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Expira em {formatAdminDate(invitation.expiresAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={create}>
            <DialogHeader>
              <DialogTitle>Convidar usuário para a loja</DialogTitle>
              <DialogDescription>
                A pessoa define a própria senha pelo link de uso único (72h).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="store-invite-name">Nome completo</Label>
                <Input
                  id="store-invite-name"
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
                <Label htmlFor="store-invite-email">E-mail</Label>
                <Input
                  id="store-invite-email"
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
                <Label htmlFor="store-invite-funcao">Função</Label>
                <Select
                  value={form.funcao}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      funcao: value as StoreUserFuncao,
                    }))
                  }
                >
                  <SelectTrigger id="store-invite-funcao">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNCOES.map((funcao) => (
                      <SelectItem key={funcao} value={funcao}>
                        {STORE_USER_FUNCAO_LABELS[funcao]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-invite-phone">Telefone (opcional)</Label>
                <Input
                  id="store-invite-phone"
                  value={form.telefone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      telefone: event.target.value,
                    }))
                  }
                  maxLength={32}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-invite-message">
                  Mensagem opcional
                </Label>
                <Textarea
                  id="store-invite-message"
                  value={form.mensagem}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      mensagem: event.target.value,
                    }))
                  }
                  maxLength={1000}
                  rows={3}
                />
              </div>
              {needsExceptionReason && (
                <div className="space-y-2">
                  <Label htmlFor="store-invite-exception">
                    Justificativa (loja não ativa)
                  </Label>
                  <Textarea
                    id="store-invite-exception"
                    value={form.exceptionReason}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        exceptionReason: event.target.value,
                      }))
                    }
                    minLength={8}
                    maxLength={1000}
                    rows={3}
                    required
                  />
                </div>
              )}
              {storeStatus !== 'ATIVO' && admin?.role !== 'SUPER_ADMIN' && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Esta loja não está ativa. Somente SUPER_ADMIN pode
                    convidar com justificativa.
                  </AlertDescription>
                </Alert>
              )}
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
              <Button
                type="submit"
                disabled={
                  submitting ||
                  (storeStatus !== 'ATIVO' && admin?.role !== 'SUPER_ADMIN')
                }
              >
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
        description={`O link enviado para ${cancelInvitation?.email || ''} será invalidado e o usuário pendente será inativado.`}
        confirmText="Cancelar convite"
        cancelText="Voltar"
        loading={submitting}
        onConfirm={cancel}
        onCancel={() => setCancelInvitation(null)}
      />
    </div>
  );
}
