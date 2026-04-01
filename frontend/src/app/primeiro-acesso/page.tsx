'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/api';

function PrimeiroAcessoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = useMemo(
    () => decodeURIComponent(searchParams.get('email') || '').trim(),
    [searchParams],
  );

  const [email, setEmail] = useState(initialEmail);
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !codigo || !senha || !confirmarSenha) {
      setError('Preencha e-mail, código e senha.');
      return;
    }

    if (senha.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('A confirmação de senha não confere.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/usuarios/definir-senha', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          codigo: codigo.trim(),
          senha,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || 'Não foi possível concluir o primeiro acesso.');
      }

      router.push('/login?verified=true');
    } catch (err: any) {
      setError(err?.message || 'Erro ao definir senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleReenviarCodigo = async () => {
    setError(null);
    setMessage(null);
    if (!email) {
      setError('Informe seu e-mail para reenviar o código.');
      return;
    }

    setReenviando(true);
    try {
      const response = await apiRequest('/usuarios/reenviar-codigo', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || 'Não foi possível reenviar o código.');
      }

      setMessage('Código reenviado. Verifique sua caixa de e-mail.');
    } catch (err: any) {
      setError(err?.message || 'Erro ao reenviar código.');
    } finally {
      setReenviando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 space-y-5 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Primeiro acesso</h1>
          <p className="text-sm text-muted-foreground">
            Defina sua senha para ativar sua conta no Comunikapp.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo">Código de verificação</Label>
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Digite o código recebido por e-mail"
              maxLength={6}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Nova senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar senha</Label>
            <Input
              id="confirmarSenha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ativando...' : 'Ativar conta e definir senha'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleReenviarCodigo}
              disabled={reenviando || loading}
            >
              {reenviando ? 'Reenviando...' : 'Reenviar código'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PrimeiroAcessoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PrimeiroAcessoContent />
    </Suspense>
  );
}
