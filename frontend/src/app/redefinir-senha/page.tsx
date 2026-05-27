'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '@/lib/api';

function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError('Link de redefinicao invalido.');
      return;
    }

    if (senha.length < 8) {
      setError('A senha deve ter no minimo 8 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('A confirmacao de senha nao confere.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.redefinirSenha(token, senha);
      setMessage('Senha redefinida com sucesso. Redirecionando para o login...');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 space-y-5 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground">
            Crie uma nova senha para acessar sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senha">Nova senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Minimo 8 caracteres"
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
              onChange={(event) => setConfirmarSenha(event.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          <Button type="submit" className="w-full" disabled={loading || !token}>
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <RedefinirSenhaContent />
    </Suspense>
  );
}
