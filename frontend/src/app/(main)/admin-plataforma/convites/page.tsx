'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Loader2, MailPlus, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { platformApi } from '@/lib/api-client';

type ConviteCadastro = {
  id: string;
  email: string;
  status: string;
  mensagem?: string | null;
  criado_por_email?: string | null;
  expira_em: string;
  usado_em?: string | null;
  revogado_em?: string | null;
  criado_em: string;
  invite_url?: string;
  email_enviado?: boolean;
  email_erro?: string | null;
};

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusVariant(status: string) {
  if (status === 'PENDENTE') return 'default';
  if (status === 'USADO') return 'secondary';
  if (status === 'REVOGADO') return 'destructive';
  return 'outline';
}

export default function ConvitesPlataformaPage() {
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [invites, setInvites] = useState<ConviteCadastro[]>([]);
  const [form, setForm] = useState({
    email: '',
    validade_dias: '7',
    mensagem: '',
  });

  const token = useMemo(() => getToken(), []);

  const loadInvites = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await platformApi.listInvites(token) as ConviteCadastro[];
      setInvites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar os convites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      if (!token) {
        setCheckingAccess(false);
        return;
      }

      try {
        const response = await platformApi.me(token) as { isPlatformAdmin?: boolean };
        const allowed = response.isPlatformAdmin === true;
        setIsPlatformAdmin(allowed);
        if (allowed) {
          await loadInvites();
        }
      } catch {
        setIsPlatformAdmin(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
    // loadInvites depends on token and only runs from this guarded flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const createInvite = async () => {
    if (!token) return;
    setCreating(true);
    setError(null);
    setLastInviteUrl(null);
    try {
      const created = await platformApi.createInvite(
        {
          email: form.email,
          validade_dias: Number(form.validade_dias || 7),
          mensagem: form.mensagem || undefined,
        },
        token,
      ) as ConviteCadastro;

      setLastInviteUrl(created.invite_url || null);
      setForm({ email: '', validade_dias: '7', mensagem: '' });
      await loadInvites();
      if (created.email_enviado === false) {
        toast.warning('Convite criado, mas o e-mail nao foi enviado. Copie o link manualmente.');
      } else {
        toast.success('Convite criado e enviado.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel criar o convite.');
    } finally {
      setCreating(false);
    }
  };

  const revokeInvite = async (id: string) => {
    if (!token) return;
    setError(null);
    try {
      await platformApi.revokeInvite(id, token);
      await loadInvites();
      toast.success('Convite revogado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel revogar o convite.');
    }
  };

  const copyLastInvite = async () => {
    if (!lastInviteUrl) return;
    await navigator.clipboard.writeText(lastInviteUrl);
    toast.success('Link copiado.');
  };

  if (checkingAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-3 text-center">
        <ShieldAlert className="h-10 w-10 text-amber-600" />
        <h1 className="text-xl font-semibold">Area restrita</h1>
        <p className="text-sm text-muted-foreground">
          Esta pagina e exclusiva para administradores da plataforma.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Convites da plataforma</h1>
          <p className="text-sm text-muted-foreground">
            Convites para criar novas lojas durante o periodo de desenvolvimento.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadInvites} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <MailPlus className="mr-2 h-4 w-4" />
            Novo convite
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {lastInviteUrl && (
        <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Ultimo link criado</p>
            <p className="truncate text-sm text-muted-foreground">{lastInviteUrl}</p>
          </div>
          <Button variant="outline" onClick={copyLastInvite}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Usado em</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Carregando convites...
                </TableCell>
              </TableRow>
            ) : invites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum convite criado.
                </TableCell>
              </TableRow>
            ) : (
              invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">{invite.email}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(invite.status) as any}>{invite.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(invite.criado_em)}</TableCell>
                  <TableCell>{formatDate(invite.expira_em)}</TableCell>
                  <TableCell>{formatDate(invite.usado_em)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeInvite(invite.id)}
                      disabled={invite.status !== 'PENDENTE'}
                    >
                      Revogar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo convite</DialogTitle>
            <DialogDescription>
              O sistema envia um link unico para o e-mail informado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                disabled={creating}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="validade_dias">Validade em dias</Label>
              <Input
                id="validade_dias"
                type="number"
                min={1}
                max={30}
                value={form.validade_dias}
                onChange={(event) => setForm((prev) => ({ ...prev, validade_dias: event.target.value }))}
                disabled={creating}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mensagem">Mensagem opcional</Label>
              <Textarea
                id="mensagem"
                value={form.mensagem}
                onChange={(event) => setForm((prev) => ({ ...prev, mensagem: event.target.value }))}
                disabled={creating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={createInvite} disabled={creating || !form.email}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
