'use client';

import { Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

export function AdminLoginForm() {
  const { admin, loading, refresh } = useAdmin();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && admin) router.replace('/gestao');
  }, [admin, loading, router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await adminApi.login({
        email,
        password,
        twoFactorCode: twoFactorCode || undefined,
      });
      await refresh();
      toast.success('Login administrativo realizado com sucesso.');
      router.replace('/gestao');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível realizar o login.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-2xl">Gestão ComunikApp</CardTitle>
          <CardDescription className="mt-2">
            Área restrita à equipe interna da plataforma.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          {error && (
            <Alert variant="destructive">
              <LockKeyhole className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-email">E-mail</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              maxLength={320}
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Senha</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              maxLength={128}
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-2fa">Código de segurança</Label>
            <Input
              id="admin-2fa"
              value={twoFactorCode}
              onChange={(event) =>
                setTwoFactorCode(
                  event.target.value.replace(/\D/g, '').slice(0, 6),
                )
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Obrigatório para perfis com autenticação em dois fatores.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Entrar na Gestão
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

