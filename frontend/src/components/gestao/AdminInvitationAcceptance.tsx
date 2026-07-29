'use client';

import Image from 'next/image';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useAdmin } from '@/contexts/AdminContext';
import { adminApi } from '@/lib/gestao/admin-api';
import { ADMIN_ROLE_LABELS } from '@/lib/gestao/admin-labels';
import { AdminRole } from '@/lib/gestao/admin-types';

interface InvitationData {
  nome: string;
  email: string;
  role: AdminRole;
  expiresAt: string;
}

interface TwoFactorSetup {
  requiresTwoFactorSetup: true;
  setupToken: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  manualKey: string;
}

export function AdminInvitationAcceptance() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();
  const { refresh } = useAdmin();
  const [invitation, setInvitation] =
    useState<InvitationData | null>(null);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setError('O link de convite está incompleto.');
        setLoading(false);
        return;
      }
      try {
        setInvitation(
          await adminApi.validateInvitation<InvitationData>(token),
        );
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Não foi possível validar o convite.',
        );
      } finally {
        setLoading(false);
      }
    };
    void validate();
  }, [token]);

  const accept = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== passwordConfirmation) {
      setError('As senhas informadas não coincidem.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await adminApi.acceptInvitation<
        TwoFactorSetup | { requiresTwoFactorSetup: false }
      >({ token, password });
      if (result.requiresTwoFactorSetup) {
        setSetup(result);
        return;
      }
      await refresh();
      toast.success('Conta administrativa ativada.');
      router.replace('/gestao');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível aceitar o convite.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmTwoFactor = async (event: FormEvent) => {
    event.preventDefault();
    if (!setup) return;
    setSubmitting(true);
    setError('');
    try {
      await adminApi.confirmTwoFactor({
        setupToken: setup.setupToken,
        code,
      });
      await refresh();
      toast.success('2FA configurado e conta administrativa ativada.');
      router.replace('/gestao');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível confirmar o código.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-lg">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!invitation) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Convite indisponível</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          {setup ? (
            <ShieldCheck className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </div>
        <CardTitle>
          {setup ? 'Proteja sua conta com 2FA' : 'Aceitar convite'}
        </CardTitle>
        <CardDescription>
          {setup
            ? 'Escaneie o QR Code no seu aplicativo autenticador e confirme o código.'
            : `${invitation.nome}, você foi convidado como ${ADMIN_ROLE_LABELS[invitation.role]}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {setup ? (
          <form className="space-y-5" onSubmit={confirmTwoFactor}>
            <div className="flex justify-center rounded-lg border bg-white p-4">
              <Image
                src={setup.qrCodeDataUrl}
                alt="QR Code para configurar autenticação em dois fatores"
                width={220}
                height={220}
                unoptimized
              />
            </div>
            <div className="space-y-2">
              <Label>Chave manual</Label>
              <div className="break-all rounded-md border bg-muted p-3 font-mono text-sm">
                {setup.manualKey}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-code">Código de 6 dígitos</Label>
              <Input
                id="setup-code"
                value={code}
                onChange={(event) =>
                  setCode(
                    event.target.value.replace(/\D/g, '').slice(0, 6),
                  )
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={submitting || code.length !== 6}
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar e entrar
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={accept}>
            <div className="space-y-2">
              <Label htmlFor="invitation-email">E-mail</Label>
              <Input
                id="invitation-email"
                value={invitation.email}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-admin-password">Nova senha</Label>
              <Input
                id="new-admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use pelo menos 12 caracteres e uma senha exclusiva.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-admin-password">
                Confirmar senha
              </Label>
              <Input
                id="confirm-admin-password"
                type="password"
                value={passwordConfirmation}
                onChange={(event) =>
                  setPasswordConfirmation(event.target.value)
                }
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={submitting}
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar conta administrativa
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

