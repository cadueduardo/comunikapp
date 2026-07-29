'use client';

import {
  Copy,
  Loader2,
  MailPlus,
  Megaphone,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/gestao/admin-api';
import { GRUPO_WHATSAPP_DIVULGACAO } from '@/lib/platform/convite-templates';
import { cn } from '@/lib/utils';

type SignupInvitation = {
  id: string;
  email: string;
  nome?: string | null;
  nome_loja?: string | null;
  telefone?: string | null;
  origem?: string | null;
  status: string;
  criado_por_email?: string | null;
  expira_em: string;
  usado_em?: string | null;
  revogado_em?: string | null;
  criado_em: string;
  invite_url?: string;
  mensagem_whatsapp?: string;
  email_enviado?: boolean;
  email_erro?: string | null;
};

const GRUPO_TEMPLATE_STORAGE_KEY = 'comunikapp.grupo-whatsapp-divulgacao';

function getInitialInviteForm() {
  return {
    nome: '',
    email: '',
    validade_dias: '7',
  };
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatOrigem(origem?: string | null) {
  if (origem === 'landing_interesse') return 'Landing';
  if (origem === 'admin_manual') return 'Gestão';
  return origem || '—';
}

function statusClass(status: string) {
  if (status === 'PENDENTE') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300';
  }
  if (status === 'USADO') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300';
  }
  if (status === 'REVOGADO') {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300';
  }
  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300';
}

export function AdminSignupInvitationsManager() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [lastLeadWhatsapp, setLastLeadWhatsapp] = useState<string | null>(null);
  const [grupoTemplate, setGrupoTemplate] = useState(GRUPO_WHATSAPP_DIVULGACAO);
  const [invites, setInvites] = useState<SignupInvitation[]>([]);
  const [form, setForm] = useState(getInitialInviteForm);
  const [revokeTarget, setRevokeTarget] = useState<SignupInvitation | null>(
    null,
  );

  useEffect(() => {
    const saved = localStorage.getItem(GRUPO_TEMPLATE_STORAGE_KEY);
    if (saved) setGrupoTemplate(saved);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setInvites(await adminApi.listSignupInvitations<SignupInvitation[]>());
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

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado.`);
  };

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setLastInviteUrl(null);
    setLastLeadWhatsapp(null);
    try {
      const created = await adminApi.createSignupInvitation<SignupInvitation>({
        nome: form.nome.trim(),
        email: form.email.trim(),
        validade_dias: Number(form.validade_dias || 7),
      });
      setLastInviteUrl(created.invite_url || null);
      setLastLeadWhatsapp(created.mensagem_whatsapp || null);
      setForm(getInitialInviteForm());
      setDialogOpen(false);
      await load();
      if (created.email_enviado === false) {
        toast.warning(
          'Convite criado, mas o e-mail não foi enviado. Copie o link manualmente.',
        );
      } else {
        toast.success('Convite criado e e-mail enviado ao lead.');
      }
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível criar o convite.',
      );
    } finally {
      setCreating(false);
    }
  };

  const resend = async (invite: SignupInvitation) => {
    try {
      const result = await adminApi.resendSignupInvitation<SignupInvitation>(
        invite.id,
      );
      setLastInviteUrl(result.invite_url || null);
      setLastLeadWhatsapp(result.mensagem_whatsapp || null);
      if (result.email_enviado === false) {
        toast.warning(
          'Convite renovado, mas o e-mail não foi enviado. Copie o link.',
        );
      } else {
        toast.success('Convite reenviado por e-mail.');
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

  const revoke = async () => {
    if (!revokeTarget) return;
    try {
      await adminApi.revokeSignupInvitation(revokeTarget.id);
      toast.success('Convite revogado.');
      setRevokeTarget(null);
      await load();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível revogar o convite.',
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Convites beta"
        subtitle="Divulgue o programa beta e envie convites individuais para quem quiser conhecer o ComunikApp e cadastrar uma loja nova."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <MailPlus className="mr-2 h-4 w-4" />
              Novo convite
            </Button>
          </div>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5" />
              Divulgação para grupos WhatsApp
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              Use este texto em grupos. Quem se interessar entra em contato; depois
              você cria o convite individual com nome e e-mail do lead.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void copyText(grupoTemplate, 'Mensagem do grupo')}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.setItem(GRUPO_TEMPLATE_STORAGE_KEY, grupoTemplate);
                toast.success('Template de grupo salvo neste navegador.');
              }}
            >
              Salvar edição
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setGrupoTemplate(GRUPO_WHATSAPP_DIVULGACAO);
                localStorage.removeItem(GRUPO_TEMPLATE_STORAGE_KEY);
                toast.success('Template de grupo restaurado.');
              }}
            >
              Restaurar padrão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={grupoTemplate}
            onChange={(event) => setGrupoTemplate(event.target.value)}
            rows={16}
            className="font-mono text-xs"
            aria-label="Template de divulgação para grupos"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Troque <strong>[SEU_CONTATO]</strong> pelo seu WhatsApp ou e-mail antes
            de publicar no grupo.
          </p>
        </CardContent>
      </Card>

      {(lastInviteUrl || lastLeadWhatsapp) && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Último convite</CardTitle>
            <CardDescription>
              E-mail enviado ao lead. Se preferir, envie também a mensagem curta no
              WhatsApp privado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastInviteUrl ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Link exclusivo</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {lastInviteUrl}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void copyText(lastInviteUrl, 'Link')}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar link
                </Button>
              </div>
            ) : null}
            {lastLeadWhatsapp ? (
              <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium">WhatsApp 1:1 (opcional)</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void copyText(lastLeadWhatsapp, 'Mensagem 1:1')
                    }
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar mensagem
                  </Button>
                </div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-xs">
                  {lastLeadWhatsapp}
                </pre>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold">Convites individuais</h2>
        <p className="text-sm text-muted-foreground">
          Para quem já demonstrou interesse. O sistema envia e-mail com link
          exclusivo para criar a loja em{' '}
          <code className="text-xs">/cadastro?convite=</code>.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Usado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-24 text-center text-muted-foreground"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : invites.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum convite individual criado.
                </TableCell>
              </TableRow>
            ) : (
              invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">
                    {invite.nome || '—'}
                  </TableCell>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell>{invite.nome_loja || '—'}</TableCell>
                  <TableCell>{invite.telefone || '—'}</TableCell>
                  <TableCell>{formatOrigem(invite.origem)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('whitespace-nowrap', statusClass(invite.status))}
                    >
                      {invite.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(invite.criado_em)}</TableCell>
                  <TableCell>{formatDate(invite.expira_em)}</TableCell>
                  <TableCell>{formatDate(invite.usado_em)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={invite.status !== 'PENDENTE'}
                        onClick={() => void resend(invite)}
                      >
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
                        Reenviar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={invite.status !== 'PENDENTE'}
                        onClick={() => setRevokeTarget(invite)}
                      >
                        Revogar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={create}>
            <DialogHeader>
              <DialogTitle>Novo convite individual</DialogTitle>
              <DialogDescription>
                Lead que já entrou em contato. O sistema envia e-mail com link
                exclusivo para criar a loja.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="signup-invite-nome">Nome do lead</Label>
                <Input
                  id="signup-invite-nome"
                  value={form.nome}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, nome: event.target.value }))
                  }
                  placeholder="Ex.: João"
                  disabled={creating}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-invite-email">E-mail do lead</Label>
                <Input
                  id="signup-invite-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  disabled={creating}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-invite-validade">Validade em dias</Label>
                <Input
                  id="signup-invite-validade"
                  type="number"
                  min={1}
                  max={30}
                  value={form.validade_dias}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      validade_dias: event.target.value,
                    }))
                  }
                  disabled={creating}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Enviar convite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!revokeTarget}
        title="Revogar convite?"
        description={
          revokeTarget
            ? `O convite de ${revokeTarget.email} deixará de funcionar. Quem já tiver o link não poderá mais cadastrar a loja com ele.`
            : 'Tem certeza que deseja revogar este convite?'
        }
        confirmText="Revogar"
        onConfirm={() => void revoke()}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}
