'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MailCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision';
import { platformApi } from '@/lib/api-client';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

export default function BetaInterestPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    nome_loja: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaWidgetId, setCaptchaWidgetId] = useState<string | null>(null);
  const [captchaScriptLoaded, setCaptchaScriptLoaded] = useState(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const captchaRequired = !!turnstileSiteKey;

  useEffect(() => {
    if (!turnstileSiteKey) {
      return;
    }

    if (window.turnstile) {
      setCaptchaScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => setCaptchaScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [turnstileSiteKey]);

  useEffect(() => {
    if (!turnstileSiteKey || !captchaScriptLoaded || !window.turnstile || captchaWidgetId) {
      return;
    }

    const widgetId = window.turnstile.render('#beta-turnstile-widget', {
      sitekey: turnstileSiteKey,
      callback: (token: string) => setCaptchaToken(token),
      'expired-callback': () => setCaptchaToken(null),
      'error-callback': () => setCaptchaToken(null),
    });
    setCaptchaWidgetId(widgetId);
  }, [turnstileSiteKey, captchaScriptLoaded, captchaWidgetId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (captchaRequired && !captchaToken) {
      setError('Confirme que você não é um robô.');
      setLoading(false);
      return;
    }

    try {
      const response = await platformApi.registerBetaInterest({
        ...formData,
        captchaToken: captchaToken || undefined,
      });
      setSuccessMessage(
        response.message ||
          'Recebemos seu interesse. Enviamos um e-mail com o link para continuar seu cadastro.',
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Não foi possível enviar seu interesse. Tente novamente.');
      }
      if (captchaWidgetId && window.turnstile) {
        window.turnstile.reset(captchaWidgetId);
      }
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen w-full bg-white">
        <main className="w-full lg:grid lg:grid-cols-2 min-h-screen">
          <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto grid w-[420px] gap-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <MailCheck className="h-7 w-7 text-green-700" />
              </div>
              <div className="grid gap-2">
                <h1 className="text-3xl font-bold">Verifique seu e-mail</h1>
                <p className="text-balance text-muted-foreground">{successMessage}</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>
          </div>
          <div className="hidden bg-muted lg:flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0">
              <BackgroundBeamsWithCollision />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <main className="w-full lg:grid lg:grid-cols-2 min-h-screen">
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-[420px] gap-6">
            <div className="grid gap-2 text-center">
              <h1 className="text-3xl font-bold">Quero conhecer o Comunikapp</h1>
              <p className="text-balance text-muted-foreground">
                Estamos em beta fechado. Deixe seus dados e enviaremos um convite por e-mail para continuar o cadastro.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
                  <XCircle className="w-5 h-5 mr-2" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="nome">Seu nome completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Nome Sobrenome"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(99) 99999-9999"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nome_loja">Nome da empresa / loja</Label>
                <Input
                  id="nome_loja"
                  value={formData.nome_loja}
                  onChange={handleChange}
                  placeholder="Minha Empresa de Placas"
                  required
                  disabled={loading}
                />
              </div>

              {turnstileSiteKey ? (
                <div id="beta-turnstile-widget" className="min-h-[65px]" />
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || (captchaRequired && !captchaToken)}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? 'Enviando...' : 'Quero conhecer'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Já recebeu convite?{' '}
                <Link href="/cadastro" className="underline">
                  Continuar cadastro
                </Link>
              </p>
            </form>
          </div>
        </div>

        <div className="hidden bg-muted lg:flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0">
            <BackgroundBeamsWithCollision />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center p-8">
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl max-w-md">
              <p className="text-xl font-medium text-gray-800">
                Você receberá um link exclusivo no e-mail informado. Assim garantimos acesso seguro e sabemos quem está testando a plataforma.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
