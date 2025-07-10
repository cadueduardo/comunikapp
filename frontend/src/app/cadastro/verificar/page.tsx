'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MailCheck, XCircle } from 'lucide-react';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email) {
        setError('O e-mail não foi encontrado. Por favor, volte e tente novamente.');
        setLoading(false);
        return;
    }

    try {
      const response = await fetch('http://localhost:3001/lojas/verificar-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, codigo: code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao verificar o código.');
      }

      // Se a verificação for bem-sucedida, redireciona para o dashboard
      router.push('/dashboard/bem-vindo');

    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Ocorreu um erro desconhecido.');
        }
    } finally {
        setLoading(false);
    }
  };

  if (!email) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center p-8">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Ocorreu um erro</h1>
            <p className="text-muted-foreground">
                Não foi possível identificar o seu e-mail para verificação.
            </p>
            <Button variant="outline" onClick={() => router.push('/cadastro')} className="mt-4">
                Voltar ao Cadastro
            </Button>
        </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
            <MailCheck className="mx-auto h-12 w-12 text-blue-500" />
            <h1 className="text-3xl font-bold mt-4">Verifique seu e-mail</h1>
            <p className="text-muted-foreground mt-2">
                Enviamos um código de 6 dígitos para <strong>{email}</strong>. Por favor, insira-o abaixo.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center">
                    <XCircle className="w-5 h-5 mr-3"/>
                    <span>{error}</span>
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="verification-code">Código de Verificação</Label>
                <Input
                id="verification-code"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="------"
                required
                disabled={loading}
                className="text-center text-2xl tracking-[0.5em]"
                />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar e Acessar'}
            </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
            <p>Não recebeu o código? <button className="underline hover:text-blue-600">Reenviar código</button></p>
        </div>
      </div>
    </div>
  );
} 