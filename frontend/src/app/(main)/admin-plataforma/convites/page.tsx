'use client';

import Link from 'next/link';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Painel legado desativado. Convites beta (cadastro de loja nova) ficam em
 * `/gestao/convites-beta`, autenticados com a sessão administrativa.
 */
export default function ConvitesPlataformaLegacyRedirectPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldAlert className="h-10 w-10 text-amber-600" />
      <h1 className="text-xl font-semibold">Recurso movido para a Gestão</h1>
      <p className="text-sm text-muted-foreground">
        Os convites para conhecer o ComunikApp e cadastrar lojas novas agora
        ficam concentrados na área administrativa da plataforma.
      </p>
      <Button asChild>
        <Link href="/gestao/convites-beta">
          Abrir Convites beta
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
      <p className="text-xs text-muted-foreground">
        Em produção use{' '}
        <a
          className="underline underline-offset-2"
          href="https://gestao.comunikapp.com.br/gestao/convites-beta"
        >
          gestao.comunikapp.com.br
        </a>
        .
      </p>
    </div>
  );
}
