'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Loader2, MailPlus, Megaphone, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { GRUPO_WHATSAPP_DIVULGACAO } from '@/lib/platform/convite-templates';

type ConviteCadastro = {
  id: string;
  email: string;
  nome?: string | null;
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
  const [lastLeadWhatsapp, setLastLeadWhatsapp] = useState<string | null>(null);
  const [grupoTemplate, setGrupoTemplate] = useState(GRUPO_WHATSAPP_DIVULGACAO);
  const [invites, setInvites] = useState<ConviteCadastro[]>([]);
  const [form, setForm] = useState(getInitialInviteForm);

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    const saved = localStorage.getItem(GRUPO_TEMPLATE_STORAGE_KEY);
    if (saved) {
      setGrupoTemplate(saved);
    }
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openCreateDialog = () => {
    setForm(getInitialInviteForm());
    setDialogOpen(true);
  };

  const createInvite = async () => {
    if (!token) return;
    setCreating(true);
    setError(null);
    setLastInviteUrl(null);
    setLastLeadWhatsapp(null);
    try {
      const created = await platformApi.createInvite(
        {
          nome: form.nome,
          email: form.email,
          validade_dias: Number(form.validade_dias || 7),
        },
        token,
      ) as ConviteCadastro;

      setLastInviteUrl(created.invite_url || null);
      setLastLeadWhatsapp(created.mensagem_whatsapp || null);
      setForm(getInitialInviteForm());
      setDialogOpen(false);
      await loadInvites();
      if (created.email_enviado === false) {
        toast.warning('Convite criado, mas o e-mail nao foi enviado. Copie o link manualmente.');
      } else {
        toast.success('Convite criado e e-mail enviado ao lead.');
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

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado.`);
  };

  const saveGrupoTemplate = () => {
    localStorage.setItem(GRUPO_TEMPLATE_STORAGE_KEY, grupoTemplate);
    toast.success('Template de grupo salvo neste navegador.');
  };

  const resetGrupoTemplate = () => {
    setGrupoTemplate(GRUPO_WHATSAPP_DIVULGACAO);
    localStorage.removeItem(GRUPO_TEMPLATE_STORAGE_KEY);
    toast.success('Template de grupo restaurado.');
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Convites da plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Divulgue o programa beta em grupos e envie convites individuais para quem demonstrar interesse.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5" />
              Divulgacao para grupos WhatsApp
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              Use este texto em grupos de empresarios e profissionais da area. Quem se interessar
              entra em contato; depois voce cria o convite individual abaixo com nome e e-mail do lead.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => copyText(grupoTemplate, 'Mensagem do grupo')}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
            <Button variant="outline" size="sm" onClick={saveGrupoTemplate}>
              Salvar edicao
            </Button>
            <Button variant="ghost" size="sm" onClick={resetGrupoTemplate}>
              Restaurar padrao
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={grupoTemplate}
            onChange={(event) => setGrupoTemplate(event.target.value)}
            rows={18}
            className="font-mono text-xs"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Troque <strong>[SEU_CONTATO]</strong> pelo seu WhatsApp ou e-mail antes de publicar no grupo.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Convites individuais (leads)</h2>
          <p className="text-sm text-muted-foreground">
            Para quem ja demonstrou interesse. O sistema envia e-mail com link exclusivo para criar a loja.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadInvites} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={openCreateDialog}>
            <MailPlus className="mr-2 h-4 w-4" />
            Novo convite
          </Button>
        </div>
      </div>

      {(lastInviteUrl || lastLeadWhatsapp) && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Ultimo convite criado</CardTitle>
            <CardDescription>
              E-mail enviado ao lead. Se preferir, envie tambem a mensagem curta no WhatsApp privado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastInviteUrl && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Link exclusivo</p>
                  <p className="truncate text-sm text-muted-foreground">{lastInviteUrl}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyText(lastInviteUrl, 'Link')}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar link
                </Button>
              </div>
            )}
            {lastLeadWhatsapp && (
              <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium">WhatsApp 1:1 (opcional)</p>
                  <Button variant="outline" size="sm" onClick={() => copyText(lastLeadWhatsapp, 'Mensagem 1:1')}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar mensagem
                  </Button>
                </div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-xs">
                  {lastLeadWhatsapp}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
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
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Carregando convites...
                </TableCell>
              </TableRow>
            ) : invites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhum convite individual criado.
                </TableCell>
              </TableRow>
            ) : (
              invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">{invite.nome || '-'}</TableCell>
                  <TableCell>{invite.email}</TableCell>
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
            <DialogTitle>Novo convite individual</DialogTitle>
            <DialogDescription>
              Lead que ja entrou em contato. O sistema envia e-mail com link exclusivo para criar a loja.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do lead</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
                placeholder="Ex.: Joao"
                disabled={creating}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail do lead</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={createInvite} disabled={creating || !form.email || !form.nome.trim()}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
