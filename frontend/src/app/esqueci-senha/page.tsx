'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '@/lib/api';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError('Informe seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.solicitarRedefinicaoSenha(email.trim());
      setMessage(
        response?.message ||
          'Se o e-mail existir, enviaremos instrucoes para redefinir a senha.',
      );
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel solicitar a redefinicao.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 space-y-5 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Esqueci minha senha</h1>
          <p className="text-sm text-muted-foreground">
            Informe o e-mail da conta para receber um link de redefinicao.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link de redefinicao'}
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
