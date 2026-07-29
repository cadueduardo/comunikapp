'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STORE_USER_FUNCAO_LABELS } from '@/lib/gestao/admin-labels';
import { StoreUserFuncao } from '@/lib/gestao/admin-types';

interface InvitationData {
  nome: string;
  email: string;
  funcao: StoreUserFuncao;
  expiresAt: string;
  loja: {
    nome: string;
    slug: string;
    status: string;
  };
}

export function StoreUserInvitationAcceptance() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState<{
    userStatus: string;
    loja: { nome: string; slug: string };
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Link de convite inválido.');
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const response = await fetch(
          `/api/public/store-user-invitations?token=${encodeURIComponent(token)}`,
          { cache: 'no-store' },
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            body.message || 'Não foi possível validar o convite.',
          );
        }
        setInvitation(body as InvitationData);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Não foi possível validar o convite.',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(
        '/api/public/store-user-invitations/accept',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || 'Não foi possível aceitar o convite.');
      }
      setAccepted({
        userStatus: body.userStatus,
        loja: body.loja,
      });
      toast.success('Convite aceito com sucesso.');
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível aceitar o convite.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || !invitation) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Convite inválido</CardTitle>
          <CardDescription>
            Este link pode ter expirado ou já ter sido utilizado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Convite não encontrado.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (accepted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <CardTitle>Conta criada</CardTitle>
          <CardDescription>
            Você agora faz parte da loja {accepted.loja.nome}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Status da conta:{' '}
            <span className="font-medium text-foreground">
              {accepted.userStatus === 'ATIVO' ? 'Ativa' : 'Pendente'}
            </span>
            .
          </p>
          <p>
            Acesse o ambiente da loja em{' '}
            <span className="font-medium text-foreground">
              {accepted.loja.slug}.comunikapp.com.br
            </span>{' '}
            com o e-mail do convite e a senha definida.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Aceitar convite</CardTitle>
        <CardDescription>
          {invitation.nome}, defina sua senha para entrar em{' '}
          {invitation.loja.nome} como{' '}
          {STORE_USER_FUNCAO_LABELS[invitation.funcao]}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={invitation.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-invite-password">Senha</Label>
            <Input
              id="store-invite-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={12}
              maxLength={128}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-invite-password-confirm">
              Confirmar senha
            </Label>
            <Input
              id="store-invite-password-confirm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(event) =>
                setPasswordConfirmation(event.target.value)
              }
              minLength={12}
              maxLength={128}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Criar senha e aceitar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
